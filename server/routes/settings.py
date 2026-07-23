from flask import Blueprint, request, jsonify
from models.db import settings_collection
from middleware import admin_required

settings_bp = Blueprint("settings", __name__)

@settings_bp.route("/api/settings", methods=["GET"])
def get_settings():
    doc = settings_collection.find_one({"key": "welcome_message"})
    message = doc["value"] if doc else "Browse the cosplays and give your favorite a FUP point. One vote per cosplay every 6 hours — make it count."
    return jsonify({"welcomeMessage": message})

@settings_bp.route("/api/settings", methods=["PUT"])
@admin_required
def update_settings():
    data = request.json
    message = data.get("welcomeMessage", "").strip()
    if not message:
        return jsonify({"error": "Message cannot be empty"}), 400

    settings_collection.update_one(
        {"key": "welcome_message"},
        {"$set": {"value": message}},
        upsert=True
    )
    return jsonify({"message": "Settings updated"})
