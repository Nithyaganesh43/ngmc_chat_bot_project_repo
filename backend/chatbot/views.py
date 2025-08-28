import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from .models import User, Chat, Conversation
from .utils import (
    add_cors_headers, validate_message, validate_user_data, 
    user_auth_middleware, call_chatgpt, extract_json_from_response,
    ENHANCED_SYSTEM_PROMPT
)

@csrf_exempt
def checkAuth(request):
    if request.method == "OPTIONS":
        resp = HttpResponse(status=204)
        return add_cors_headers(request, resp)
    
    if request.method != 'POST': 
        return JsonResponse({"error":"POST required"}, status=405)
    
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error":"Invalid JSON"}, status=400)
    
    apikey = body.get('apikey','').strip()
    userName = body.get('userName','').strip()
    password = body.get('password','').strip()
    email = body.get('email','').strip()
    
    if apikey != "Abkr212@ngmc":
        return JsonResponse({"error":"Invalid access key"}, status=401)
    
    user_err = validate_user_data(userName, email, password)
    if user_err:
        return JsonResponse({"error": user_err}, status=400)
    
    try:
        existing_user = User.get_by_email(email)
        if existing_user:
            resp = JsonResponse({"status": "success", "message": "User already exists"})
        else:
            User.create(userName, email, password)
            resp = JsonResponse({"status": "success", "message": "User created successfully"})
        return add_cors_headers(request, resp)
    except Exception as e:
        print(f"User creation error: {e}")
        return JsonResponse({"error": "Failed to create/get user"}, status=500)

@csrf_exempt
def post_chat(request):
    if request.method == "OPTIONS":
        resp = HttpResponse(status=204)
        return add_cors_headers(request, resp)
    
    if request.method != 'POST': 
        return JsonResponse({"error":"POST required"}, status=405)
    
    auth_error, user = user_auth_middleware(request)
    if auth_error:
        return add_cors_headers(request, auth_error)
    
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error":"Invalid JSON"}, status=400)
    
    user_message = body.get('message','').strip()
    
    err = validate_message(user_message)
    if err: 
        return JsonResponse({"error": err}, status=400)
    
    prompt = f"{ENHANCED_SYSTEM_PROMPT}\nUser Query: {user_message}\nOutput JSON with reply and title only"
    messages = [{"role":"system","content":prompt},{"role":"user","content":user_message}]
    gpt_resp = call_chatgpt(messages)
    parsed = extract_json_from_response(gpt_resp)
    
    chat = Chat.create(title=parsed['title'], user_id=user.id)
    Conversation.bulk_create([
        Conversation(chat.id, 'user', user_message),
        Conversation(chat.id, 'AI', parsed['reply'])
    ])
    
    resp = JsonResponse({
        "chatId": str(chat.id),
        "reply": parsed['reply'],
        "title": parsed['title'],
        "userId": str(user.id)
    })
    return add_cors_headers(request, resp)

@csrf_exempt
def continue_chat(request, chat_id):
    if request.method == "OPTIONS":
        resp = HttpResponse(status=204)
        return add_cors_headers(request, resp)
    
    if request.method != 'POST': 
        return JsonResponse({"error":"POST required"}, status=405)
    
    auth_error, user = user_auth_middleware(request)
    if auth_error:
        return add_cors_headers(request, auth_error)
    
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error":"Invalid JSON"}, status=400)
    
    user_message = body.get('message','').strip()
    
    err = validate_message(user_message)
    if err: 
        return JsonResponse({"error": err}, status=400)
    
    try: 
        chat = Chat.get(chat_id)
        if not chat:
            return JsonResponse({"error":"Chat not found"}, status=404)
    except Exception: 
        return JsonResponse({"error":"Chat not found"}, status=404)
    
    if chat.user_id and str(chat.user_id) != str(user.id):
        return JsonResponse({"error": "Unauthorized to access this chat"}, status=403)
    
    if not chat.user_id:
        chat.user_id = user.id
        chat.save()
    
    last_msgs = Conversation.filter_by_chat_last_n(chat, 10)
    conv_history = [{"role":"assistant" if c.role=="AI" else "user","content":c.message} for c in last_msgs][::-1]
    conv_history.append({"role":"user","content":user_message})
    
    prompt = f"{ENHANCED_SYSTEM_PROMPT}\nUser Query: {user_message}\nOutput JSON with reply only"
    messages = [{"role":"system","content":prompt}] + conv_history
    gpt_resp = call_chatgpt(messages)
    parsed = extract_json_from_response(gpt_resp)
     
    chat.save()
    Conversation.bulk_create([
        Conversation(chat.id, 'user', user_message),
        Conversation(chat.id, 'AI', parsed['reply'])
    ])
    
    resp = JsonResponse({
        "chatId": str(chat.id),
        "reply": parsed['reply'],
        "userId": str(user.id)
    })
    return add_cors_headers(request, resp)


@csrf_exempt
def get_chats(request):
    if request.method == "OPTIONS":
        resp = HttpResponse(status=204)
        return add_cors_headers(request, resp)
    
    if request.method != 'GET': 
        return JsonResponse({"error":"GET required"}, status=405)
    
    try:
        all_chats = Chat.get_all()
        chats_data = []
        
        for chat in all_chats:
            conversations = Conversation.filter_by_chat(chat)
            chat_data = {
                'id': str(chat.id),
                'title': chat.title,
                'user_id': str(chat.user_id) if chat.user_id else None,
                'created_at': chat.created_at.isoformat(),
                'conversations': [
                    {
                        'id': str(conv.id),
                        'role': conv.role,
                        'message': conv.message,
                        'created_at': conv.created_at.isoformat()
                    }
                    for conv in conversations
                ]
            }
            chats_data.append(chat_data)
        
        resp = JsonResponse(chats_data, safe=False)
        return add_cors_headers(request, resp)
    except Exception as e:
        print(f"Error fetching chats: {e}")
        return JsonResponse({"error": "Failed to fetch chats"}, status=500)
    
@csrf_exempt
def get_user_chats(request):
    if request.method == "OPTIONS":
        resp = HttpResponse(status=204)
        return add_cors_headers(request, resp)
    
    if request.method != 'POST': 
        return JsonResponse({"error":"POST required"}, status=405)
    
    auth_error, user = user_auth_middleware(request)
    if auth_error:
        return add_cors_headers(request, auth_error)
    
    user_chats = Chat.filter_by_user(user.id)
    chats_data = []
    
    for chat in user_chats:
        conversations = Conversation.filter_by_chat(chat)
        
        chat_data = {
            'id': str(chat.id),
            'title': chat.title,
            'user_id': str(chat.user_id),
            'created_at': chat.created_at.isoformat(),
            'conversations': [
                {
                    'id': str(conv.id),
                    'role': conv.role,
                    'message': conv.message,
                    'created_at': conv.created_at.isoformat()
                }
                for conv in conversations
            ]
        }
        chats_data.append(chat_data)
    
    resp = JsonResponse({
        "user": {
            "id": str(user.id),
            "userName": user.userName,
            "email": user.email
        },
        "chats": chats_data
    }, safe=False)
    return add_cors_headers(request, resp)
