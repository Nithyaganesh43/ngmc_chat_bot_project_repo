from .database import users_collection, chats_collection, conversations_collection
from bson import ObjectId
from datetime import datetime

class User:
    def __init__(self, userName, email, password, _id=None, created_at=None):
        self.id = _id
        self.userName = userName
        self.email = email
        self.password = password
        self.created_at = created_at or datetime.now()
    
    @classmethod
    def create(cls, userName, email, password):
        user_data = {
            'userName': userName,
            'email': email,
            'password': password,
            'created_at': datetime.now()
        }
        result = users_collection.insert_one(user_data)
        return cls(userName, email, password, result.inserted_id, user_data['created_at'])
    
    @classmethod
    def get_by_email(cls, email):
        user_data = users_collection.find_one({'email': email})
        if user_data:
            return cls(user_data['userName'], user_data['email'], user_data.get('password', ''), user_data['_id'], user_data['created_at'])
        return None
    
    @classmethod
    def get_by_email_password(cls, email, password):
        user_data = users_collection.find_one({'email': email, 'password': password})
        if user_data:
            return cls(user_data['userName'], user_data['email'], user_data.get('password', ''), user_data['_id'], user_data['created_at'])
        return None
    
    @classmethod
    def get(cls, user_id):
        user_data = users_collection.find_one({'_id': ObjectId(user_id)})
        if user_data:
            return cls(user_data['userName'], user_data['email'], user_data.get('password', ''), user_data['_id'], user_data['created_at'])
        return None

class Chat:
    def __init__(self, title, user_id, _id=None, created_at=None):
        self.id = _id
        self.title = title
        self.user_id = user_id
        self.created_at = created_at or datetime.now()
    
    @classmethod
    def create(cls, title, user_id=None):
        chat_data = {
            'title': title,
            'user_id': user_id,
            'created_at': datetime.now()
        }
        result = chats_collection.insert_one(chat_data)
        return cls(title, user_id, result.inserted_id, chat_data['created_at'])
    
    @classmethod
    def get(cls, chat_id):
        chat_data = chats_collection.find_one({'_id': ObjectId(chat_id)})
        if chat_data:
            return cls(chat_data['title'], chat_data.get('user_id'), chat_data['_id'], chat_data['created_at'])
        return None
    
    @classmethod
    def all(cls):
        chats = []
        for chat_data in chats_collection.find().sort('_id', -1):
            chats.append(cls(chat_data['title'], chat_data.get('user_id'), chat_data['_id'], chat_data['created_at']))
        return chats
    
    @classmethod
    def filter_by_user(cls, user_id):
        chats = []
        for chat_data in chats_collection.find({'user_id': user_id}).sort('_id', -1):
            chats.append(cls(chat_data['title'], chat_data['user_id'], chat_data['_id'], chat_data['created_at']))
        return chats
    
    def save(self):
        chats_collection.update_one(
            {'_id': self.id},
            {'$set': {'title': self.title, 'user_id': self.user_id, 'created_at': self.created_at}}
        )

class Conversation:
    def __init__(self, chat_id, role, message, _id=None, created_at=None):
        self.id = _id
        self.chat_id = chat_id
        self.role = role
        self.message = message
        self.created_at = created_at or datetime.now()
    
    @classmethod
    def bulk_create(cls, conversations):
        docs = []
        for conv in conversations:
            docs.append({
                'chat_id': conv.chat_id,
                'role': conv.role,
                'message': conv.message,
                'created_at': conv.created_at
            })
        conversations_collection.insert_many(docs)
    
    @classmethod
    def filter_by_chat(cls, chat):
        conversations = []
        for conv_data in conversations_collection.find({'chat_id': chat.id}).sort('created_at', 1):
            conversations.append(cls(
                conv_data['chat_id'],
                conv_data['role'],
                conv_data['message'],
                conv_data['_id'],
                conv_data['created_at']
            ))
        return conversations
    
    @classmethod
    def filter_by_chat_last_n(cls, chat, n):
        conversations = []
        for conv_data in conversations_collection.find({'chat_id': chat.id}).sort('_id', -1).limit(n):
            conversations.append(cls(
                conv_data['chat_id'],
                conv_data['role'],
                conv_data['message'],
                conv_data['_id'],
                conv_data['created_at']
            ))
        return conversations
    
    @classmethod
    def all(cls):
        conversations = []
        for conv_data in conversations_collection.find().sort('created_at', -1):
            conversations.append(cls(
                conv_data['chat_id'],
                conv_data['role'],
                conv_data['message'],
                conv_data['_id'],
                conv_data['created_at']
            ))
        return conversations
