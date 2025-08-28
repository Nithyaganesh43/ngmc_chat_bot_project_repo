import os
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

try:
    mongo_client = MongoClient(os.environ.get("MONOGDB_CONNECTION_STRING"))
    mongo_client.admin.command('ping')
    db = mongo_client.ngmc_chatbot
    users_collection = db.users
    chats_collection = db.chats
    conversations_collection = db.conversations
    print("✅ MongoDB connection successful!")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    print("Please ensure MongoDB is running or check your MONGODB_CONNECTION_STRING")
    exit(1)

def ensure_tables():
    try:
        users_collection.create_index("email", unique=True)
        users_collection.create_index("created_at")
        chats_collection.create_index("user_id")
        chats_collection.create_index("created_at")
        conversations_collection.create_index([("chat_id", 1), ("created_at", 1)])
        print("MongoDB indexes created successfully!")
    except Exception as e:
        print(f"Index creation info: {e}")
