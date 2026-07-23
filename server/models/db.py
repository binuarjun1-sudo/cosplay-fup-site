from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client = MongoClient(MONGO_URI)
db = client.get_database()

characters_collection = db["characters"]
votes_collection = db["votes"]
vote_events_collection = db["vote_events"]
settings_collection = db["settings"]
