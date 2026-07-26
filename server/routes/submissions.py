from flask import Blueprint, request, jsonify
from models.db import submissions_collection, characters_collection
from bson.objectid import ObjectId
from datetime import datetime
from middleware import admin_required

submissions_bp = Blueprint("submissions", __name__)

@submissions_bp.route("/api/submissions", methods=["POST"])
def submit_cosplay():
    data = request.json
    name = data.get("name", "").strip()
    image_url = data.get("imageUrl", "").strip()

    if not name or not image_url:
        return jsonify({"error": "Name and image URL are required"}), 400

    submission = {
        "name": name,
        "imageUrl": image_url,
        "status": "pending",
        "submittedAt": datetime.utcnow()
    }
    result = submissions_collection.insert_one(submission)
    return jsonify({"message": "Submitted for review!", "id": str(result.inserted_id)}), 201

@submissions_bp.route("/api/submissions", methods=["GET"])
@admin_required
def get_submissions():
    submissions = list(submissions_collection.find({"status": "pending"}))
    for s in submissions:
        s["_id"] = str(s["_id"])
    return jsonify(submissions)

@submissions_bp.route("/api/submissions/<submission_id>/approve", methods=["POST"])
@admin_required
def approve_submission(submission_id):
    submission = submissions_collection.find_one({"_id": ObjectId(submission_id)})
    if not submission:
        return jsonify({"error": "Submission not found"}), 404

    characters_collection.insert_one({
        "name": submission["name"],
        "imageUrl": submission["imageUrl"],
        "fupCount": 0,
        "createdAt": datetime.utcnow()
    })

    submissions_collection.update_one(
        {"_id": ObjectId(submission_id)},
        {"$set": {"status": "approved"}}
    )
    return jsonify({"message": "Approved and published!"})

@submissions_bp.route("/api/submissions/<submission_id>/reject", methods=["POST"])
@admin_required
def reject_submission(submission_id):
    submissions_collection.update_one(
        {"_id": ObjectId(submission_id)},
        {"$set": {"status": "rejected"}}
    )
    return jsonify({"message": "Rejected"})
