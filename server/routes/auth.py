from flask import Blueprint, request, jsonify
import jwt
import os
from datetime import datetime, timedelta

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    admin_username = os.getenv("ADMIN_USERNAME")
    admin_password = os.getenv("ADMIN_PASSWORD")

    if username != admin_username or password != admin_password:
        return jsonify({"error": "Invalid credentials"}), 401

    token = jwt.encode(
        {
            "username": username,
            "exp": datetime.utcnow() + timedelta(days=7)
        },
        os.getenv("JWT_SECRET"),
        algorithm="HS256"
    )

    return jsonify({"token": token})
