import os
import json
import re
from typing import Dict, List, Optional
from openai import OpenAI
import requests
from bs4 import BeautifulSoup
from .models import Conversation

client = OpenAI(api_key=os.environ.get("CHAT_GPT_API"))

ALLOWED_ORIGINS = [
    "https://ngmchatbot.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

def add_cors_headers(request, response):
    origin = request.META.get("HTTP_ORIGIN")
    if origin in ALLOWED_ORIGINS:
        response["Access-Control-Allow-Origin"] = origin
    response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-API-Key"
    response["Access-Control-Allow-Credentials"] = "true"
    return response

def webScrabedData():
    current_dir=os.path.dirname(os.path.abspath(__file__))
    files=["staff.txt","links.txt"]
    contents=""
    for filename in files:
        filepath=os.path.join(current_dir,filename)
        if os.path.isfile(filepath):
            with open(filepath,"r",errors="ignore") as f:
                contents+=f.read()+"\n"
        else:
            contents+=f"[{filename} not found]\n"
    return contents.strip()

def get_last_5_conversations_as_string():
    conversations = Conversation.all()[:5]
    conversations = reversed(conversations)

    result=[]
    for conv in conversations:
        result.append(f"[{conv.role}] {conv.message}")
    return "\n".join(result)

ENHANCED_SYSTEM_PROMPT = """
You are an intelligent AI assistant for Nallamuthu Gounder Mahalingam College (NGMC), Pollachi.
Provide accurate, helpful, and engaging information about the college.
Official site: https://www.ngmc.org
 
Always be helpful, accurate, and maintain a professional yet friendly tone.

Dont repeat the same answer if asked multiple times.
 
Use the following web-scraped data for reference:
""" + webScrabedData() + """ 
and the last 5 conversations for context:
""" + get_last_5_conversations_as_string() + """
You may get 2 types of queries:
1. General queries about NGMC college, courses, admissions, facilities, etc.
for this you need to answer in a conversational manner.
2. Specific queries about exam schedules, fee structures, seating arrangements, syllabus, etc.
for this you need to  answer with simple and direct answers with relevant links from the provided data.

for new line user \n use it.
for bold text use **text**.

ALWAYS output in JSON format with two keys: "reply" and "title". 

LIMITS:
- "reply" should be concise, ideally under 500 words.
- "title" should be a brief summary of the reply, ideally under 4 words.
""" 

def call_chatgpt(messages: List[Dict]) -> str:
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            max_tokens=1200,
            temperature=0.7
        )
        reply = response.choices[0].message.content.strip()

        usage = response.usage
        usd_prompt = (usage.prompt_tokens / 1000) * 0.03
        usd_completion = (usage.completion_tokens / 1000) * 0.06
        total_usd = usd_prompt + usd_completion
        rupees = round(total_usd * 84, 2)

        print(
            f"[LOG] Tokens used → prompt={usage.prompt_tokens}, "
            f"completion={usage.completion_tokens}, total={usage.total_tokens}, "
            f"cost≈₹{rupees}"
        )

        return reply
    except Exception as e:
        print(f"OpenAI API Error: {e}")
        return "I'm sorry, I'm having trouble processing your request right now. Please try again later."

def extract_json_from_response(resp: str) -> Dict:
    try:
        parsed = json.loads(resp)
        if parsed.get('reply') and parsed.get('title'):
            return parsed
    except json.JSONDecodeError:
        pass
    
    match = re.search(r'\{[\s\S]*"reply"[\s\S]*"title"[\s\S]*\}', resp)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    
    return {"reply": resp, "title": "NGMC Query Response"}

def validate_message(msg: str) -> Optional[str]:
    if not msg: 
        return "Valid message is required"
    if len(msg) > 1000: 
        return "Message too long (max 1000 chars)"
    return None

def validate_user_data(userName: str, email: str, password: str = None) -> Optional[str]:
    if not userName or not userName.strip():
        return "Valid userName is required"
    if not email or not email.strip():
        return "Valid email is required"
    if len(userName.strip()) > 100:
        return "Username too long (max 100 chars)"
    if len(email.strip()) > 200:
        return "Email too long (max 200 chars)"
    if "@" not in email or "." not in email.split("@")[-1]:
        return "Invalid email format"
    return None

def user_auth_middleware(request):
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error":"Invalid JSON"}, status=400), None
    
    email = body.get('email','').strip()
    password = body.get('password','').strip()
    
    if not email or not password:
        return JsonResponse({"error":"Email and password are required"}, status=401), None
    
    from .models import User
    user = User.get_by_email_password(email, password)
    if not user:
        return JsonResponse({"error":"Invalid credentials"}, status=401), None
    
    return None, user

def scrape_links():
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }

    all_links = {}

    url = "https://coe.ngmc.ac.in/exam-schedule/"
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, "html.parser")
    exam_links = {}
    for a_tag in soup.find_all("a"):
        href = a_tag.get("href")
        if href and href.lower().endswith(".pdf"):
            if href.startswith("/"):
                href = f"https://coe.ngmc.ac.in{href}"
            file_name = os.path.basename(href)
            key_name = os.path.splitext(file_name)[0]
            exam_links[key_name] = href
    all_links["exam_schedule"] = exam_links

    url = "https://www.ngmc.org/admissions/fee-structure/"
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, "html.parser")
    fee_links = {}
    for a_tag in soup.find_all("a"):
        href = a_tag.get("href")
        if href and href.lower().endswith(".pdf"):
            if href.startswith("/"):
                href = f"https://www.ngmc.org{href}"
            file_name = os.path.basename(href)
            key_name = os.path.splitext(file_name)[0]
            fee_links[key_name] = href
    all_links["fee_structure"] = fee_links

    url = "https://coe.ngmc.ac.in/seating-arrangements/"
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, "html.parser")
    seating_links = {}
    for a_tag in soup.find_all("a"):
        if "open" in a_tag.text.lower():
            link = a_tag.get("href")
            if link:
                if link.startswith("/"):
                    link = f"https://coe.ngmc.ac.in{link}"
                file_name = os.path.basename(link)
                key_name = os.path.splitext(file_name)[0]
                seating_links[key_name] = link
    all_links["seating_arrangements"] = seating_links

    url = "https://www.ngmc.org/syllabus-list-2/"
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, "html.parser")
    syllabus_links = {}
    for a_tag in soup.find_all("a"):
        if "open" in a_tag.text.lower():
            link = a_tag.get("href")
            if link:
                name_tag = a_tag.find_previous(lambda tag: tag.name in ["h3", "h4", "span", "strong"] and tag.text.strip())
                name = name_tag.text.strip() if name_tag else f"link_{len(syllabus_links)+1}"
                if link.startswith("/"):
                    link = f"https://www.ngmc.org{link}"
                syllabus_links[name] = link
    all_links["syllabus"] = syllabus_links

    with open("ngmc_college_links.json", "w", encoding="utf-8") as f:
        json.dump(all_links, f, indent=4, ensure_ascii=False)

    print(f"Saved data: Exam({len(exam_links)}), Fees({len(fee_links)}), Seating({len(seating_links)}), Syllabus({len(syllabus_links)}) → ngmc_college_links.json")

    return all_links

def clean_json_to_txt(json_file:str, txt_file:str):
    with open(json_file,"r",encoding="utf-8") as f:
        content=f.read()
    for ch in ['[',']','"','{','}',',']:
        content=content.replace(ch,'')
    with open(txt_file,"w",encoding="utf-8") as f:
        f.write(content.strip())
    print(f"Cleaned content saved to {txt_file}")
