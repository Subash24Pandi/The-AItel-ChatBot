# Aitel Chatbot - Complete Setup Guide

A modern, production-ready AI chatbot platform for Aitel with team collaboration features, smart routing, and knowledge base integration.

## 🎯 Features

- **Public Client Chatbot**: Modern black & white UI with floating widget
- **Smart Routing**: Automatic escalation to Sales, Engineering, or Support teams
- **Knowledge Base Integration**: RAG-like retrieval with TF-IDF scoring
- **Team Dashboards**: Internal interfaces for 3 departments to respond to clients
- **Two-Way Messaging**: Team replies automatically appear in client chat
- **LLM Integration**: Sarvam model via custom Supabase endpoint
- **Responsive Design**: Mobile and desktop optimized
- **Session Management**: Conversation memory with localStorage + Supabase

## 📋 Prerequisites

- **Node.js** 14+ and npm
- **Supabase Account** with project created
- **LLM API Key** for Sarvam model endpoint
- **Basic knowledge** of terminal/command line

## 🚀 Quick Setup

### 1. **Configure Environment Variables**

Create `.env` file in the project root (copy from `.env.example`):

```bash
# LLM Configuration
LLM_ENDPOINT=https://ooictyfklyrftfkrquok.supabase.co/functions/v1/v1-chat-completions
LLM_API_KEY=your_actual_api_key_here
LLM_MODEL=sarvam-m

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App Configuration
APP_NAME=Aitel
NODE_ENV=development
PORT=3000
CLIENT_PORT=3001
```

### 2. **Install Server Dependencies**

```bash
cd server
npm install
```

### 3. **Install Client Dependencies**

```bash
cd ../client
npm install
```

### 4. **Setup Supabase Database**

Log into your Supabase project dashboard and run the SQL schema to create tables:

#### Execute in Supabase SQL Editor:

```sql
-- Conversations table
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier varchar(255),
  created_at timestamp DEFAULT current_timestamp,
  updated_at timestamp DEFAULT current_timestamp
);

-- Messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender varchar(50) NOT NULL, -- 'user', 'bot', 'team', 'system'
  text text NOT NULL,
  message_type varchar(50) DEFAULT 'text',
  created_at timestamp DEFAULT current_timestamp
);

-- Contact requests table (escalations)
CREATE TABLE contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  department varchar(50) NOT NULL, -- 'aitelsupport', 'sales_marketing', 'engineers'
  name varchar(255) NOT NULL,
  phone varchar(20) NOT NULL,
  email varchar(255),
  message text NOT NULL,
  company_name varchar(255),
  budget_range varchar(50),
  product_module varchar(100),
  status varchar(50) DEFAULT 'pending', -- 'pending', 'responded', 'closed'
  created_at timestamp DEFAULT current_timestamp,
  updated_at timestamp DEFAULT current_timestamp
);

-- Team replies table
CREATE TABLE team_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_request_id uuid NOT NULL REFERENCES contact_requests(id) ON DELETE CASCADE,
  department varchar(50) NOT NULL,
  reply_text text NOT NULL,
  created_at timestamp DEFAULT current_timestamp
);

-- Create indexes for better performance
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_contact_requests_department ON contact_requests(department);
CREATE INDEX idx_contact_requests_conversation ON contact_requests(conversation_id);
CREATE INDEX idx_team_replies_contact_request ON team_replies(contact_request_id);
```

### 5. **Start the Application**

**Terminal 1 - Backend Server** (on port 3000):
```bash
cd server
npm install  # First time only
npm start
```

**Terminal 2 - Frontend Client** (on port 3001):
```bash
cd client
npm install  # First time only
npm start
```

### 6. **Access the Application**

- **Client App**: http://localhost:3001
- **Support Team Dashboard**: http://localhost:3001/team/support
- **Sales & Marketing Dashboard**: http://localhost:3001/team/sales
- **Engineering Dashboard**: http://localhost:3001/team/engineers
- **Server Health Check**: http://localhost:3000/api/health

## 📁 Project Structure

```
chatbot/
├── server/
│   ├── package.json
│   ├── server.js              # Express server & API routes
│   ├── knowledgeBase.js       # KB retrieval & classification
│   ├── llmService.js          # LLM integration (Sarvam)
│   ├── supabaseService.js     # Database operations
│   └── .env                   # Environment variables (not in repo)
│
├── client/
│   ├── package.json
│   ├── server.js              # Express server for frontend
│   └── public/
│       ├── index.html         # Main app
│       ├── team-support.html
│       ├── team-sales.html
│       ├── team-engineers.html
│       ├── css/
│       │   └── style.css      # Black & white theme styles
│       └── js/
│           ├── chatbot.js     # Client-facing chatbot logic
│           └── team-dashboard.js
│
├── knowledge/
│   └── english_version.txt    # Knowledge base for RAG
│
└── README.md                  # This file
```

## 🤖 How It Works

### 1. **Client Chat Flow**

1. User clicks the **A** button (floating logo) to open the chatbot
2. Message is sent to backend API (`/api/chat`)
3. Backend:
   - Retrieves relevant knowledge base chunks using TF-IDF
   - Sends chunks + message to Sarvam LLM
   - Evaluates confidence (high = answer provided, low = escalate)
   - Classifies intent (sales keywords → sales team, etc.)
4. If low confidence: Shows escalation popup with form
5. User submits form → Saved to Supabase → Appears in team dashboard

### 2. **Team Workflow**

1. Team member logs into their department dashboard
2. Sees list of incoming requests/tickets (auto-refreshes)
3. Clicks a ticket to view conversation history
4. Types response and clicks "Send Reply"
5. Reply is:
   - Saved in `team_replies` table
   - Also added to client's chat as a "team" message
   - Client sees notification: "Aitel team replied"

### 3. **Knowledge Base Retrieval**

- KB is loaded from `/knowledge/english_version.txt`
- Text is chunked into ~500-1000 character segments
- For each user query:
  - TF-IDF scoring against all chunks
  - Top 5 chunks retrieved
  - Sent as context to LLM in system prompt
- Falls back to keyword matching if semantic similarity is low

### 4. **Intent Classification**

Rules-based classifier determines routing:

| Keywords | Department |
|----------|-----------|
| price, cost, quote, plan, subscription | sales_marketing |
| api, bug, technical, server, deployment | engineers |
| help, support, issue, complaint, contact | aitelsupport |
| other | none (answer provided) |

## 🔌 API Endpoints

### Chat Endpoints

```
POST /api/chat
Body: { conversationId, message, userId }
Response: { answer, confidence, route, showContactCard, conversationId }
```

```
GET /api/messages/:conversationId
Response: [{ id, conversation_id, sender, text, created_at }, ...]
```

### Contact Form Endpoints

```
POST /api/contact
Body: { conversationId, department, name, phone, email, message, ... }
Response: { success, message, contactRequestId }
```

### Team Dashboard Endpoints

```
GET /api/team/requests?department=sales_marketing
Response: [{ id, name, phone, email, message, status, ... }, ...]
```

```
POST /api/team/reply
Body: { contactRequestId, department, reply }
Response: { success, message, teamReply }
```

```
GET /api/team/reply/:contactRequestId
Response: [{ id, department, reply_text, created_at }, ...]
```

## 🎨 UI Features

- **Black & White Theme**: Clean, modern, professional
- **Floating Logo Button**: Bottom-right corner, glows on hover
- **Smooth Animations**: Slide-in messages, fade modals
- **Responsive**: Adapts to mobile (320px) and desktop (1920px+)
- **Typing Indicator**: Shows "..." while bot is thinking
- **Quick Replies**: Suggested follow-up questions
- **Toast Notifications**: Success/error messages fade in bottom-right
- **Scrollable Chat**: Auto-scrolls to latest message

## 🛠️ Development

### Adding Custom Knowledge Base Entries

Edit `/knowledge/english_version.txt`:
- One entry per topic
- Format: `Client: [question]\nBot: [answer]`
- Chunks are auto-created on server startup

### Modifying Classification Rules

Edit `/server/knowledgeBase.js`, function `classifyIntent()`:
```javascript
const supportKeywords = ['help', 'support', 'issue', ...];
if (supportKeywords.some(keyword => q.includes(keyword))) {
  return 'aitelsupport';
}
```

### Customizing LLM Prompt

Edit `/server/llmService.js`, function `chat()`:
```javascript
const systemPrompt = `You are Aitel's intelligent assistant. ...`;
```

### Styling Changes

All CSS is in `/client/public/css/style.css`. Key variables:
```css
--primary-black: #000000;
--primary-white: #ffffff;
--light-gray: #f5f5f5;
```

## 🔐 Security Best Practices

✅ **Implemented:**
- API keys in `.env` (never committed)
- Service role key used only on backend
- Supabase RLS (Row-Level Security) ready
- User conversations isolated by `conversation_id`

⚠️ **To Do for Production:**
- Enable Supabase RLS policies
- Add rate limiting on `/api/chat`
- Validate email/phone on contact form
- Add CORS whitelist for production domain
- Use HTTPS only
- Add authentication for team dashboards

## 📝 Troubleshooting

### "Cannot connect to LLM"
- Check `LLM_ENDPOINT` and `LLM_API_KEY` in `.env`
- Test endpoint: `curl https://ooictyfklyrftfkrquok.supabase.co/functions/v1/v1-chat-completions`

### "Supabase connection failed"
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Check Supabase project is active
- Ensure tables are created (run SQL schema above)

### "No messages appearing in chat"
- Clear browser cache/localStorage
- Open DevTools → Console for errors
- Check backend logs for API errors

### "Knowledge base not loading"
- Verify `/knowledge/english_version.txt` exists
- Check file encoding is UTF-8
- Restart server after modifying KB file

## 📞 Support

For issues or questions, contact the Aitel team or use the chatbot's escalation system!

## 📄 License

All rights reserved. Aitel Inc.

---

**Last Updated**: January 2026  
**Version**: 1.0.0
