from flask import Blueprint, request, jsonify
from models.db import comments_collection
from bson.objectid import ObjectId
from datetime import datetime
from middleware import admin_required

comments_bp = Blueprint("comments", __name__)

MAX_COMMENT_LENGTH = 300

@comments_bp.route("/api/characters/<character_id>/comments", methods=["GET"])
def get_comments(character_id):
    comments = list(
        comments_collection.find({"characterId": character_id}).sort("createdAt", -1)
    )
    for c in comments:
        c["_id"] = str(c["_id"])
    return jsonify(comments)

@comments_bp.route("/api/characters/<character_id>/comments", methods=["POST"])
def add_comment(character_id):
    data = request.json
    text = data.get("text", "").strip()

    if not text:
        return jsonify({"error": "Comment cannot be empty"}), 400
    if len(text) > MAX_COMMENT_LENGTH:
        return jsonify({"error": f"Comment too long (max {MAX_COMMENT_LENGTH} characters)"}), 400

    comment = {
        "characterId": character_id,
        "text": text,
        "createdAt": datetime.utcnow()
    }
    result = comments_collection.insert_one(comment)
    return jsonify({"message": "Comment added", "id": str(result.inserted_id)}), 201

@comments_bp.route("/api/comments/<comment_id>", methods=["DELETE"])
@admin_required
def delete_comment(comment_id):
    comments_collection.delete_one({"_id": ObjectId(comment_id)})
    return jsonify({"message": "Comment deleted"})
