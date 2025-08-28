# NGMC Chatbot System - Complete Project Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [System Architecture](#system-architecture)
3. [Database Design](#database-design)
4. [Entity-Relationship Diagram](#entity-relationship-diagram)
5. [Authentication System](#authentication-system)
6. [API Specifications](#api-specifications)
7. [User Query Types](#user-query-types)
8. [System Flow Diagrams](#system-flow-diagrams)
9. [Technology Stack](#technology-stack)
10. [Deployment Architecture](#deployment-architecture)
11. [Security Considerations](#security-considerations)

## System Overview

The NGMC Chatbot System is a comprehensive web-based AI assistant designed specifically for Nallamuthu Gounder Mahalingam College (NGMC). The system provides intelligent responses to student and faculty queries about college information, exam schedules, fee structures, and academic resources.

### Key Features
- AI-powered conversational interface using OpenAI GPT-4
- Real-time web scraping for updated college data
- User authentication and session management
- Persistent chat history
- Mobile-responsive design
- RESTful API architecture

### Target Users
- Students (current and prospective)
- Faculty members
- Administrative staff
- Parents and guardians

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  Web Browser (React/Next.js Frontend)                      │
│  - Authentication UI                                       │
│  - Chat Interface                                          │
│  - Responsive Design                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS/REST API
┌─────────────────────▼───────────────────────────────────────┐
│                 APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  Django Backend Server                                      │
│  - API Endpoints                                           │
│  - Authentication Middleware                               │
│  - Business Logic                                          │
│  - CORS Handling                                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 INTEGRATION LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  AI Service (OpenAI GPT-4)     │  Web Scraping Service     │
│  - Natural Language Processing  │  - Real-time Data Fetch   │
│  - Context-aware Responses     │  - PDF Link Extraction    │
└─────────────────────┬───────────┴─────────┬───────────────────┘
                      │                     │
┌─────────────────────▼─────────────────────▼─────────────────┐
│                    DATA LAYER                               │
├─────────────────────────────────────────────────────────────┤
│  MongoDB Database              │  External College Websites │
│  - Users Collection           │  - Official NGMC Site      │
│  - Chats Collection           │  - Exam Portal             │
│  - Conversations Collection   │  - Fee Structure Pages     │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Components

**Frontend Tier:**
- Next.js 14+ with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Shadcn/ui component library

**Backend Tier:**
- Django REST API server
- Python 3.8+ runtime
- Real-time web scraping capabilities
- OpenAI integration

**Data Tier:**
- MongoDB for document storage
- External college websites as data sources
- File system for scraped data caching

## Database Design

### MongoDB Collections Schema

#### Users Collection
```javascript
{
  "_id": ObjectId,
  "userName": String,
  "email": String (unique, indexed),
  "password": String,
  "created_at": DateTime (indexed)
}
```

#### Chats Collection
```javascript
{
  "_id": ObjectId,
  "title": String,
  "user_id": ObjectId (indexed, references Users._id),
  "created_at": DateTime (indexed)
}
```

#### Conversations Collection
```javascript
{
  "_id": ObjectId,
  "chat_id": ObjectId (indexed, references Chats._id),
  "role": String, // 'user' or 'AI'
  "message": String,
  "created_at": DateTime (compound indexed with chat_id)
}
```

### Database Indexes
- `users.email`: Unique index for authentication
- `users.created_at`: Performance optimization
- `chats.user_id`: Filter user-specific chats
- `chats.created_at`: Chronological ordering
- `conversations.chat_id + created_at`: Compound index for conversation retrieval

## Entity-Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│      Users      │         │      Chats      │         │ Conversations   │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ _id (PK)        │◄────────┤ _id (PK)        │◄────────┤ _id (PK)        │
│ userName        │ 1     ∞ │ title           │ 1     ∞ │ chat_id (FK)    │
│ email (UNIQUE)  │         │ user_id (FK)    │         │ role            │
│ password        │         │ created_at      │         │ message         │
│ created_at      │         └─────────────────┘         │ created_at      │
└─────────────────┘                                     └─────────────────┘

Relationships:
- Users → Chats (One-to-Many): One user can have multiple chats
- Chats → Conversations (One-to-Many): One chat contains multiple conversations
```

## Authentication System

### Authentication Flow
1. **User Registration/Login**: User provides name, email, and password
2. **Credential Validation**: Backend validates against static access key
3. **Session Creation**: Successful authentication stores user data
4. **API Key Generation**: User password serves as API key for subsequent requests
5. **Request Authorization**: Each API call includes `x-api-key` header

### Security Model
- **Access Control**: Static API key validation (`Abkr212@ngmc`)
- **Session Management**: localStorage-based client-side storage
- **Password Security**: Plain text storage (educational environment)
- **CORS Protection**: Whitelist-based origin validation

### Authentication Endpoints
```
POST /checkAuth/
- Purpose: User authentication and registration
- Headers: Content-Type: application/json
- Body: { apikey, userName, email, password }
- Response: Success/error status
```

## API Specifications

### Base Configuration
- **Base URL**: `https://ngmchatbot.onrender.com`
- **Protocol**: HTTPS
- **Format**: JSON
- **CORS**: Enabled for whitelisted origins

### API Endpoints

#### 1. Authentication
```
POST /checkAuth/
Purpose: User authentication and registration
Headers:
  - Content-Type: application/json
Request Body:
  {
    "apikey": "Abkr212@ngmc",
    "userName": "string",
    "email": "string",
    "password": "string"
  }
Response:
  Success (200): { "status": "success", "message": "User created/exists" }
  Error (400/401): { "error": "error_message" }
```

#### 2. Start New Chat
```
POST /postchat/
Purpose: Initiate new conversation
Headers:
  - Content-Type: application/json
Request Body:
  {
    "email": "string",
    "password": "string",
    "message": "string"
  }
Response:
  Success (200):
  {
    "chatId": "string",
    "reply": "string",
    "title": "string",
    "userId": "string"
  }
```

#### 3. Continue Existing Chat
```
POST /postchat/<chat_id>/
Purpose: Continue conversation in existing chat
Headers:
  - Content-Type: application/json
Request Body:
  {
    "email": "string",
    "password": "string",
    "message": "string"
  }
Response:
  Success (200):
  {
    "chatId": "string",
    "reply": "string",
    "userId": "string"
  }
```

#### 4. Get All Chats
```
POST /getchat/
Purpose: Retrieve all chat sessions perticularly for each user based on authentication
Headers:
  - Content-Type: application/json
Request Body:
  {
    "email": "string",
    "password": "string"
  }
Response:
  Success (200): Array of chat objects with conversations
```

#### 5. Get User-Specific Chats
```
POST /getuserchats/
Purpose: Retrieve user's chat history
Headers:
  - Content-Type: application/json
Request Body:
  {
    "email": "string",
    "password": "string"
  }
Response:
  Success (200):
  {
    "user": { "id", "userName", "email" },
    "chats": [array of chat objects]
  }
```

### Error Responses
- **400 Bad Request**: Invalid JSON, missing fields, validation errors
- **401 Unauthorized**: Invalid credentials, missing API key
- **403 Forbidden**: Unauthorized access to chat
- **404 Not Found**: Chat not found
- **405 Method Not Allowed**: Invalid HTTP method
- **500 Internal Server Error**: Server-side errors

## User Query Types

### 1. General College Information
- **Course Details**: Available programs, curriculum, duration
- **Admissions**: Eligibility criteria, application process, deadlines
- **Facilities**: Infrastructure, libraries, laboratories
- **Campus Life**: Hostels, activities, student services

**Example Queries:**
- "What courses are available at NGMC?"
- "How to apply for admission?"
- "Tell me about the computer science department"

### 2. Academic Resources
- **Exam Schedules**: Test dates, timings, venues
- **Fee Structure**: Course fees, payment methods, scholarships
- **Syllabus**: Course content, semester-wise breakdown
- **Seating Arrangements**: Exam hall assignments

**Example Queries:**
- "When is the next exam for B.Sc Computer Science?"
- "What is the fee for BCA course?"
- "Show me the syllabus for MBA program"

### 3. Staff Information
- **Faculty Details**: Department-wise staff listing
- **Contact Information**: Faculty roles, departments
- **Academic Hierarchy**: Professors, Associate Professors, Assistants

**Example Queries:**
- "Who are the faculty members in Computer Science department?"
- "Contact details of the principal"
- "List of mathematics department staff"

### 4. Specific Document Requests
- **PDF Downloads**: Direct links to official documents
- **Exam Timetables**: Semester-wise schedules
- **Fee Payment**: Official fee structure documents

**Example Queries:**
- "Download exam schedule PDF"
- "Get fee structure document"
- "Show seating arrangement for today's exam"

## System Flow Diagrams

### User Registration/Login Flow
```
User Input (Name, Email, Password)
            ↓
    Frontend Validation
            ↓
    API Call to /checkAuth/
            ↓
    Backend Validation
    ├─ Check API Key
    ├─ Validate User Data
    └─ Check Existing User
            ↓
    MongoDB Operation
    ├─ Create New User
    └─ Retrieve Existing User
            ↓
    Response to Frontend
            ↓
    Local Storage Update
            ↓
    Redirect to Chat Interface
```

### Chat Conversation Flow
```
User Message Input
        ↓
Frontend Message Validation
        ↓
API Call (/postchat/ or /postchat/<id>/)
        ↓
Backend Authentication Check
        ↓
Chat Session Management
├─ Create New Chat (if new)
└─ Retrieve Existing Chat
        ↓
Conversation History Retrieval
        ↓
AI Context Preparation
├─ System Prompt
├─ Web Scraped Data
├─ Previous Conversations
└─ Current User Message
        ↓
OpenAI API Call
        ↓
Response Processing
├─ JSON Parsing
├─ Title Generation
└─ Reply Formatting
        ↓
Database Storage
├─ User Message
└─ AI Response
        ↓
Frontend Response Display
```

### Data Scraping Flow
```
System Initialization
        ↓
Web Scraping Execution
├─ Exam Schedules (coe.ngmc.ac.in)
├─ Fee Structure (ngmc.org)
├─ Seating Arrangements
└─ Syllabus Documents
        ↓
Data Processing
├─ PDF Link Extraction
├─ Content Cleaning
└─ JSON Formatting
        ↓
File System Storage
├─ ngmc_college_links.json
├─ links.txt
└─ staff.txt
        ↓
AI Context Integration
```

## Technology Stack

### Frontend Technologies
- **Framework**: Next.js 14+ (React-based)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Icons**: Lucide React
- **Fonts**: Geist Sans & Geist Mono
- **Package Manager**: pnpm

### Backend Technologies
- **Framework**: Django (Python)
- **Language**: Python 3.8+
- **Database**: MongoDB
- **AI Integration**: OpenAI GPT-4 API
- **Web Scraping**: BeautifulSoup, Requests
- **Environment**: dotenv for configuration

### External Services
- **AI Service**: OpenAI GPT-4
- **Database**: MongoDB Atlas (cloud)
- **Deployment**: Render (backend), Vercel (frontend)
- **Data Sources**: Official NGMC websites

## Deployment Architecture

### Production Environment
```
Internet
    ↓
CDN/Load Balancer (Vercel/Render)
    ↓
┌─────────────────┬─────────────────┐
│   Frontend      │    Backend      │
│   (Vercel)      │    (Render)     │
│                 │                 │
│   Next.js App   │   Django API    │
│   Static Assets │   Python Runtime│
└─────────────────┴─────────────────┘
    ↓                       ↓
Static File Serving    MongoDB Atlas
                           ↓
                    External APIs
                    (OpenAI, College Sites)
```

### Environment Configuration
- **Frontend**: Environment variables for API URLs
- **Backend**: Secure storage of database connections and API keys
- **Database**: Cloud-hosted MongoDB with proper indexing
- **Monitoring**: Application performance tracking

## Security Considerations

### Data Protection
- **Input Validation**: Server-side validation for all user inputs
- **SQL Injection Prevention**: NoSQL MongoDB reduces SQL injection risks
- **XSS Protection**: React's built-in XSS protection
- **CORS Configuration**: Strict origin whitelisting

### Authentication Security
- **Access Control**: Static API key for educational environment
- **Session Management**: Client-side storage with validation
- **Password Policy**: Basic requirements for user accounts
- **API Rate Limiting**: Prevents abuse of OpenAI API

### Infrastructure Security
- **HTTPS Enforcement**: All communications encrypted
- **Environment Variables**: Sensitive data stored securely
- **Database Security**: MongoDB connection string protection
- **Error Handling**: Sanitized error messages

### Recommendations for Production
1. Implement proper JWT-based authentication
2. Add password hashing (bcrypt)
3. Implement API rate limiting
4. Add comprehensive input sanitization
5. Set up monitoring and logging systems
6. Regular security audits and updates

---

**System Version**: 1.0.0  
**Last Updated**: August 2025  
**Maintained by**: NGMC Development Team