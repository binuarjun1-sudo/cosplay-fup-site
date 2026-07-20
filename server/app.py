from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

from routes.characters import characters_bp
from routes.auth import auth_bp

load_dotenv()

app = Flask(__name__)
CORS(app)

app.register_blueprint(characters_bp)
app.register_blueprint(auth_bp)

@app.route("/")
def home():
    return {"message": "Cosplay FUP Points API is running!"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
