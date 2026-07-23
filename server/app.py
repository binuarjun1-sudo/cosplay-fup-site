from flask import Flask, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import os

from routes.characters import characters_bp
from routes.auth import auth_bp
from routes.settings import settings_bp

load_dotenv()

CLIENT_DIR = os.path.join(os.path.dirname(__file__), "..", "client")

app = Flask(__name__, static_folder=CLIENT_DIR, static_url_path="")
CORS(app)

app.register_blueprint(characters_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(settings_bp)

@app.route("/")
def home():
    return send_from_directory(CLIENT_DIR, "index.html")

@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory(CLIENT_DIR, filename)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
