# Aitel Chatbot - Complete Setup Guide

## 📋 Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- Supabase account (free tier available)
- Sarvam API key

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Backend dependencies
cd server
npm install

# Frontend dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables

Create `.env` file in `/server` with:

```
# LLM Configuration
LLM_ENDPOINT=https://ooictyfklyrftfkrquok.supabase.co/functions/v1/v1-chat-completions
LLM_API_KEY=sk_0i1g0pge_s5IU4rSXoqLnE4xpXxyO0ZIC
LLM_MODEL=sarvam-m

# Supabase Configuration
SUPABASE_URL=https://hogttprbmyfhazztbirc.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App Configuration
APP_NAME=Aitel
NODE_ENV=development
PORT=3000
```

### 3. Create Supabase Tables

**⚠️ IMPORTANT: Database Setup Required**

1. Log in to your Supabase dashboard
2. Go to **SQL Editor**
3. Create a new query and copy-paste the entire contents of `SUPABASE_SETUP.sql`
4. Click **Run** to create all tables

This creates:
- `conversations` - Stores user conversations
- `messages` - Stores all chat messages
- `contact_requests` - Stores escalation form submissions
- `team_replies` - Stores team responses to contact requests

### 4. Start the Application

**Terminal 1 - Backend Server:**
```bash
cd server
node server.js
```

Expected output:
```
🤖 LLM Service initialized:
   Endpoint: https://...
   Model: sarvam-m
   API Key: ✅ SET
📚 Knowledge Base Training Complete:
   ✅ Total chunks loaded: 6
   ✅ Status: Ready for inference
✅ Supabase connected
🚀 Aitel Chatbot Server running on port 3000
```

**Terminal 2 - Frontend Server:**
```bash
cd client
npm start
```

Then open: `http://localhost:3001`

## 📚 Knowledge Base Management

### Training Phase (Server Startup)
- `english_version.txt` is **read ONCE** when server starts
- Content is chunked and loaded into memory
- Ready for inference

### Runtime Phase (Request Handling)
- File is **NOT accessed** during requests
- All responses use **pre-loaded chunks in memory**
- Responses come from **LLM with KB context**, not direct file read
- ✅ File is never exposed to end users

### Adding New Knowledge
1. Update `/knowledge/english_version.txt`
2. Restart the server
3. Server automatically reloads and retains knowledge
4. No code changes needed

## 💬 Chat Functionality

### How It Works
1. User sends a message via the chatbot widget
2. Server retrieves relevant KB chunks (in-memory, trained at startup)
3. Chunks are sent to Sarvam LLM with system prompt
4. LLM generates response based on KB context
5. Response is saved to Supabase database
6. Bot displays answer to user

### If LLM Fails
- Fallback system activates
- Uses most relevant KB chunk as answer
- Bot shows "contact team" option
- No blank responses (graceful degradation)

### If Database Is Unavailable
- Chat still works (fallback to KB)
- Contact forms still accept submissions (temporary IDs)
- Data syncs to Supabase when it comes back online
- User receives success confirmation

## 📧 Contact Form Submission

### Support Team Form Submission Flow

**Frontend (chatbot.js):**
```javascript
POST /api/contact
{
  conversationId: "uuid",
  department: "support",
  name: "John Doe",
  phone: "+1-555-123-4567",
  email: "john@example.com",
  message: "Help needed"
}
```

**Backend (server.js):**
1. Validates required fields (name, phone, department)
2. Saves to Supabase `contact_requests` table
3. Creates system message in `messages` table
4. Returns success response

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Your details were successfully sent to the Aitel team. They will contact you soon.",
  "contactRequestId": "uuid"
}
```

**Frontend (chatbot.js):**
- Shows success message modal
- Clears form
- Closes contact card after 2 seconds

### Troubleshooting Contact Form

| Issue | Cause | Fix |
|-------|-------|-----|
| Form won't submit | Missing required fields | Ensure Name and Phone are filled |
| 500 error | Database not created | Run SUPABASE_SETUP.sql |
| Data not in database | Service role key wrong | Verify key in .env matches Supabase |
| Success but no data | Row-level security blocked | Check RLS policies in Supabase |

## 🔧 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Aitel Chatbot                         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Frontend (Client)              Backend (Server)          │
│  ├─ chatbot.js ◄──────────────► ├─ server.js             │
│  ├─ escalation forms            ├─ llmService.js ────┐   │
│  └─ team dashboards             ├─ knowledgeBase.js  │   │
│                                  └─ supabaseService.js│   │
│                                                        │   │
│  Knowledge Base (Training Only)  External Services    │   │
│  ├─ english_version.txt          ├─ Sarvam LLM ◄─────┤   │
│  │  (read at startup only)       │  (api endpoint)    │   │
│  └─ 6 KB chunks loaded           │                    │   │
│     (in-memory, never re-read)   ├─ Supabase DB ◄────┤   │
│                                  │  (conversations,    │   │
│                                  │   messages,         │   │
│                                  │   contact_requests) │   │
│                                  └─ (jwt auth)        │   │
│                                                        │   │
└─────────────────────────────────────────────────────────┘
```

## 🔐 Security Checklist

- [ ] API keys in `.env` not committed to git
- [ ] Supabase JWT tokens kept secure
- [ ] Row-level security (RLS) policies configured
- [ ] Contact form fields validated
- [ ] No sensitive data logged to console
- [ ] HTTPS enabled in production
- [ ] Database backups configured

## 📊 Team Dashboards

### Support Team Dashboard
- View all contact requests
- Filter by status (pending, assigned, resolved)
- Reply to user inquiries
- Track conversation history

### Sales & Marketing Dashboard
- View sales inquiries
- Budget and pricing requests
- Track lead status
- Send proposal responses

### Engineering Dashboard
- View technical support tickets
- API integration requests
- Bug reports
- Performance issues

## ✅ Validation Checklist

- [ ] Backend server starts without errors
- [ ] Chatbot widget loads on frontend
- [ ] Can send test message ("How do I log in?")
- [ ] Bot responds with KB-grounded answer
- [ ] Escalation form appears for unknown questions
- [ ] Contact form submits successfully
- [ ] Success message displays
- [ ] Data appears in Supabase dashboard
- [ ] Team dashboards load correctly
- [ ] Reply functionality works

## 🆘 Troubleshooting

### Server Won't Start
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill the process (Windows)
taskkill /PID <PID> /F

# Restart
cd server && node server.js
```

### Chatbot Shows "Something Went Wrong"
1. Check server terminal for error logs
2. Ensure Supabase tables exist (run SUPABASE_SETUP.sql)
3. Verify LLM_API_KEY is correct
4. Check network connectivity to Sarvam endpoint

### Contact Form Not Submitting
1. Verify all required fields are filled
2. Check browser console for network errors
3. Ensure Supabase credentials are correct
4. Verify contact_requests table exists

### Knowledge Base Not Being Used
1. Check server startup logs for "Knowledge Base Training"
2. Test with a question from english_version.txt
3. Verify KB chunks are loaded (should show count > 0)
4. LLM response should reference KB context

## 📖 API Reference

### POST /api/chat
```
Request:
{
  "conversationId": "uuid",
  "message": "How do I log in?",
  "userId": "anonymous"
}

Response:
{
  "answer": "To log in...",
  "confidence": 0.8,
  "route": "none",
  "showContactCard": false,
  "conversationId": "uuid"
}
```

### POST /api/contact
```
Request:
{
  "conversationId": "uuid",
  "department": "support",
  "name": "John Doe",
  "phone": "+1-555-123-4567",
  "email": "john@example.com",
  "message": "Help needed"
}

Response:
{
  "success": true,
  "message": "Your details were successfully sent to the Aitel team. They will contact you soon.",
  "contactRequestId": "uuid"
}
```

### GET /api/contacts/:department
```
Response:
[
  {
    "id": "uuid",
    "conversationId": "uuid",
    "department": "support",
    "name": "John Doe",
    "phone": "+1-555-123-4567",
    "email": "john@example.com",
    "message": "Help needed",
    "status": "pending",
    "createdAt": "2026-01-23T10:30:00Z"
  }
]
```

## 🎯 Next Steps

1. **Database Setup**: Run SUPABASE_SETUP.sql
2. **Test Chat**: Send messages to verify KB-LLM integration
3. **Test Escalation**: Submit contact forms
4. **Review Logs**: Check Supabase dashboard for stored data
5. **Deploy**: Move to production environment

## 📞 Support

For issues:
1. Check server terminal logs
2. Review Supabase dashboard
3. Verify all environment variables
4. Check API endpoints are accessible
5. Test with curl or Postman

---

**Last Updated**: January 23, 2026
**Version**: 1.0.0
