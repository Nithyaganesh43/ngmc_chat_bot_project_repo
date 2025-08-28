# NGMC Chatbot Backend

A Django REST API backend for the Nallamuthu Gounder Mahalingam College (NGMC) chatbot system that provides AI-powered assistance for college-related queries.

## 🚀 How to Start

### Prerequisites
- Python 3.8+
- MongoDB database
- OpenAI API key

### Setup Steps

1. **Clone and navigate to the project directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   Create a `.env` file with:
   ```env
   MONOGDB_CONNECTION_STRING=your_mongodb_connection_string
   CHAT_GPT_API=your_openai_api_key
   ```

4. **Start the server**
   ```bash
   python manage.py runserver
   ```

The server will automatically:
- Initialize MongoDB collections
- Scrape college data from official websites
- Start on `http://localhost:8000`

## 📁 Folder Structure

```
backend/
├── chatbot/                    # Main application
│   ├── __init__.py
│   ├── apps.py                # App configuration
│   ├── database.py            # MongoDB connection & setup
│   ├── models.py              # Data models (User, Chat, Conversation)
│   ├── utils.py               # Utilities (ChatGPT integration, web scraping)
│   ├── views.py               # API endpoints
│   ├── urls.py                # URL routing
│   ├── staff.txt              # College staff data
│   └── links.txt              # Scraped college links
├── config/                     # Django configuration
│   ├── settings.py            # Project settings
│   └── urls.py                # Main URL configuration
├── .env                       # Environment variables
├── manage.py                  # Django management script
├── requirements.txt           # Python dependencies
├── wsgi.py                    # WSGI configuration
├── links.txt                  # Generated college links
└── ngmc_college_links.json    # Raw scraped data
```

## ⚙️ How It Works

### 1. **Data Collection**
- Automatically scrapes NGMC official websites for:
  - Exam schedules
  - Fee structures  
  - Seating arrangements
  - Syllabus documents
  - Staff information

### 2. **AI Processing**
- Uses OpenAI GPT-4 for intelligent responses
- Context-aware conversations using chat history
- Structured JSON responses with title and reply

### 3. **Database Management**
- MongoDB for storing users, chats, and conversations
- User authentication and session management
- Chat history preservation

### 4. **API Architecture**
- RESTful endpoints with CORS support
- JSON request/response format
- Middleware for authentication and validation

## 🔧 What It Can Do

### **User Management**
- User registration and authentication
- Secure login with email/password
- Personal chat history tracking

### **Chat Functionality**
- **Start New Conversations**: Create new chat sessions
- **Continue Existing Chats**: Maintain conversation context
- **Chat History**: Access all previous conversations
- **User-Specific Chats**: Filter chats by user

### **College Information Services**
- **General Queries**: Course information, admissions, facilities
- **Specific Data**: Exam schedules, fee structures, seating arrangements
- **Document Access**: Direct links to PDFs and official documents
- **Staff Information**: Faculty and administrative contacts

### **AI Features**
- **Conversational AI**: Natural language understanding
- **Context Awareness**: Remembers conversation history
- **Smart Responses**: Relevant answers with proper formatting
- **Cost Tracking**: Monitors API usage and costs

### **Technical Capabilities**
- **Real-time Data**: Automatic web scraping for updated information
- **Cross-Origin Support**: Frontend integration ready
- **Error Handling**: Robust validation and error responses
- **Performance Optimization**: Efficient database queries and caching

### **API Endpoints**
- `POST /checkAuth/` - User authentication
- `POST /postchat/` - Start new chat
- `POST /postchat/<chat_id>/` - Continue existing chat
- `POST /getchat/` - Get all chats
- `POST /getuserchats/` - Get user-specific chats

The system provides a complete backend solution for an educational institution's chatbot needs, combining AI intelligence with real-time data scraping and robust user management.