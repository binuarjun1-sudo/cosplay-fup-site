from flask import Blueprint, jsonify, request
from models.db import characters_collection, votes_collection
from bson.objectid import ObjectId
from datetime import datetime, timedelta

leaderboard_bp = Blueprint("leaderboard", __name__)


@leaderboard_bp.route("/api/leaderboard", methods=["GET"])
def get_leaderboard():
    period = request.args.get("period", "all")
    now = datetime.utcnow()

    match_stage = {}
    if period == "day":
        start = now - timedelta(days=1)
        match_stage = {"votedAt": {"$gte": start}}
    elif period == "week":
        start = now - timedelta(days=7)
        match_stage = {"votedAt": {"$gte": start}}
    elif period == "month":
        start = now - timedelta(days=30)
        match_stage = {"votedAt": {"$gte": start}}

    pipeline = []
    if match_stage:
        pipeline.append({"$match": match_stage})

    pipeline += [
        {"$group": {"_id": "$characterId", "points": {"$sum": 1}}},
        {"$sort": {"points": -1}},
    ]

    results = list(votes_collection.aggregate(pipeline))

    leaderboard = []
    for r in results:
        character = characters_collection.find_one({"_id": ObjectId(r["_id"])})
        if character:
            leaderboard.append({
                "id": str(character["_id"]),
                "name": character["name"],
                "imageUrl": character["imageUrl"],
                "points": r["points"],
            })

    return jsonify(leaderboard)
