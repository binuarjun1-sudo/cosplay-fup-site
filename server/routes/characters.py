from flask import Blueprint, request, jsonify
from models.db import characters_collection, votes_collection, vote_events_collection
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from middleware import admin_required

characters_bp = Blueprint("characters", __name__)

@characters_bp.route("/api/characters", methods=["GET"])
def get_characters():
    characters = list(characters_collection.find())
    for c in characters:
        c["_id"] = str(c["_id"])
    return jsonify(characters)

@characters_bp.route("/api/characters", methods=["POST"])
@admin_required
def add_character():
    data = request.json
    name = data.get("name")
    image_url = data.get("imageUrl")
    if not name or not image_url:
        return jsonify({"error": "Name and image URL are required"}), 400
    new_character = {
        "name": name,
        "imageUrl": image_url,
        "fupCount": 0,
        "createdAt": datetime.utcnow()
    }
    result = characters_collection.insert_one(new_character)
    return jsonify({"message": "Character added", "id": str(result.inserted_id)}), 201

@characters_bp.route("/api/characters/<character_id>", methods=["PUT"])
@admin_required
def update_character(character_id):
    data = request.json
    update_fields = {}
    if "name" in data:
        update_fields["name"] = data["name"]
    if "imageUrl" in data:
        update_fields["imageUrl"] = data["imageUrl"]
    characters_collection.update_one({"_id": ObjectId(character_id)}, {"$set": update_fields})
    return jsonify({"message": "Character updated"})

@characters_bp.route("/api/characters/<character_id>", methods=["DELETE"])
@admin_required
def delete_character(character_id):
    characters_collection.delete_one({"_id": ObjectId(character_id)})
    votes_collection.delete_many({"characterId": character_id})
    vote_events_collection.delete_many({"characterId": character_id})
    return jsonify({"message": "Character deleted"})

@characters_bp.route("/api/characters/<character_id>/vote", methods=["POST"])
def vote_character(character_id):
    data = request.json
    user_id = data.get("userId")
    if not user_id:
        return jsonify({"error": "Missing user ID"}), 400

    existing_vote = votes_collection.find_one({"characterId": character_id, "userId": user_id})
    now = datetime.utcnow()
    cooldown = timedelta(hours=6)

    if existing_vote:
        time_since_vote = now - existing_vote["votedAt"]
        if time_since_vote < cooldown:
            remaining = cooldown - time_since_vote
            return jsonify({"error": "Cooldown active", "remainingSeconds": int(remaining.total_seconds())}), 429
        votes_collection.update_one({"_id": existing_vote["_id"]}, {"$set": {"votedAt": now}})
    else:
        votes_collection.insert_one({"characterId": character_id, "userId": user_id, "votedAt": now})

    characters_collection.update_one({"_id": ObjectId(character_id)}, {"$inc": {"fupCount": 1}})
    vote_events_collection.insert_one({"characterId": character_id, "votedAt": now})

    return jsonify({"message": "Vote counted!"})

@characters_bp.route("/api/characters/<character_id>/vote-status", methods=["GET"])
def vote_status(character_id):
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"error": "Missing user ID"}), 400

    existing_vote = votes_collection.find_one({"characterId": character_id, "userId": user_id})
    if not existing_vote:
        return jsonify({"canVote": True})

    now = datetime.utcnow()
    cooldown = timedelta(hours=6)
    time_since_vote = now - existing_vote["votedAt"]

    if time_since_vote >= cooldown:
        return jsonify({"canVote": True})

    remaining = cooldown - time_since_vote
    return jsonify({"canVote": False, "remainingSeconds": int(remaining.total_seconds())})

@characters_bp.route("/api/leaderboard", methods=["GET"])
def leaderboard():
    range_param = request.args.get("range", "all")
    now = datetime.utcnow()

    if range_param == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif range_param == "week":
        start = now - timedelta(days=7)
    elif range_param == "month":
        start = now - timedelta(days=30)
    else:
        start = None

    characters = list(characters_collection.find())

    if start is None:
        for c in characters:
            c["_id"] = str(c["_id"])
            c["rangeCount"] = c["fupCount"]
        characters.sort(key=lambda c: c["rangeCount"], reverse=True)
        return jsonify(characters)

    pipeline = [
        {"$match": {"votedAt": {"$gte": start}}},
        {"$group": {"_id": "$characterId", "count": {"$sum": 1}}}
    ]
    counts = {doc["_id"]: doc["count"] for doc in vote_events_collection.aggregate(pipeline)}

    result = []
    for c in characters:
        cid = str(c["_id"])
        c["_id"] = cid
        c["rangeCount"] = counts.get(cid, 0)
        result.append(c)

    result.sort(key=lambda c: c["rangeCount"], reverse=True)
    return jsonify(result)
