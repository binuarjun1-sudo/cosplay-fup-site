from flask import Blueprint, request, jsonify
import cloudinary
import cloudinary.uploader
import os

upload_bp = Blueprint("upload", __name__)

cloudinary.config(cloudinary_url=os.getenv("CLOUDINARY_URL"))

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route("/api/upload", methods=["POST"])
def upload_image():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    file = request.files["image"]

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Use JPG, PNG, WEBP, or GIF"}), 400

    try:
        result = cloudinary.uploader.upload(file, folder="cosplay_fup")
        return jsonify({"imageUrl": result["secure_url"]}), 201
    except Exception as e:
        return jsonify({"error": "Upload failed", "details": str(e)}), 500
