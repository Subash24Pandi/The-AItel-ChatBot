# 🤖 Aitel Chatbot - Complete Implementation Guide

## ✨ What You've Just Received

A **production-ready, modern AI chatbot platform** for Aitel with:

✅ **Client-Facing Chatbot**
- Floating widget (black "A" button, bottom-right)
- Modern black & white UI with smooth animations
- Real-time chat with typing indicators
- Responsive mobile & desktop design

✅ **Knowledge Base Integration (RAG)**
- Reads from `/knowledge/english_version.txt`
- TF-IDF powered semantic search
- Auto-chunks text for relevance
- Context-aware LLM responses

✅ **Smart Intent Routing**
- 3 Department Escalation Options:
  - Sales & Marketing (pricing, quotes, plans)
  - Engineering (API, technical, deployment)
  - Support (help, issues, complaints)
- Confidence scoring
- Automatic form generation

✅ **Team Collaboration Dashboards**
- Support Team Dashboard
- Sales & Marketing Dashboard  
- Engineering Dashboard
- Real-time ticket updates
- Two-way messaging (replies appear in client chat)

✅ **Full Stack Implementation**
- Node.js/Express Backend
- Vanilla JavaScript Frontend
- Supabase Database
- Sarvam LLM Integration

---

## 📁 Complete File Structure

```
chatbot/
├── README.md                          # Main documentation
├── SETUP.md                           # Database & environment setup
├── setup.sh                           # Linux/Mac setup script
├── setup.bat                          # Windows setup script
├── .env.example                       # Environment template (root)
│
├── server/                            # Backend (Node.js/Express)
│   ├── package.json                   # Dependencies
│   ├── .env.example                   # Server environment template
│   ├── .env                           # Server environment (create after setup)
│   ├── server.js                      # Express server & API routes
│   ├── knowledgeBase.js               # KB retrieval & TF-IDF scoring
│   ├── llmService.js                  # Sarvam LLM integration
│   └── supabaseService.js             # Supabase database operations
│
├── client/                            # Frontend (Static + Express server)
│   ├── package.json                   # Dependencies
│   ├── .env.example                   # Client environment template
│   ├── .env                           # Client environment (create after setup)
│   ├── server.js                      # Express server to serve static files
│   └── public/
│       ├── index.html                 # Main app (client chatbot)
│       ├── team-support.html          # Support team dashboard
│       ├── team-sales.html            # Sales & marketing dashboard
│       ├── team-engineers.html        # Engineering dashboard
│       ├── css/
│       │   └── style.css              # All styles (black & white theme)
│       └── js/
│           ├── chatbot.js             # Client-side chatbot logic
│           └── team-dashboard.js      # Team dashboard logic
│
├── knowledge/
│   └── english_version.txt            # Knowledge base (Q&A pairs)
│
└── English_Version.txt                # Original KB file
```

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Get Your Credentials
You'll need:
- **Supabase URL & Keys** (from supabase.com)
- **LLM API Key** (Sarvam endpoint)

### Step 2: Run Setup Script

**Windows:**
```powershell
cd c:\Users\Lenovo\Documents\chatbot
.\setup.bat
```

**Mac/Linux:**
```bash
cd ~/Documents/chatbot
chmod +x setup.sh
./setup.sh
```

### Step 3: Update Credentials
Edit `server/.env`:
```
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
LLM_API_KEY=your_api_key
```

### Step 4: Create Database Tables
Go to Supabase dashboard → SQL Editor → Paste schema from SETUP.md → Run

### Step 5: Start Both Servers

**Terminal 1 (Backend):**
```bash
cd server
npm start
```

**Terminal 2 (Frontend):**
```bash
cd client
npm start
```

### Step 6: Test
- Open http://localhost:3001
- Click the **A** button (bottom-right)
- Try: "How do I log in?" or "What's your pricing?"

---

## 🔄 How It Works (Architecture)

```
┌─────────────────────┐
│   Client Browser    │
│  (index.html)       │
│  - Chatbot Widget   │
│  - Black & White UI │
└──────────┬──────────┘
           │ XHR/Fetch
           ↓
┌─────────────────────┐
│  Client Server      │
│  Express Port 3001  │
│  - Serves HTML/CSS  │
│  - Proxies to API   │
└──────────┬──────────┘
           │ HTTP
           ↓
┌─────────────────────┐
│  Backend Server     │
│  Express Port 3000  │
│  - /api/chat        │
│  - /api/contact     │
│  - /api/team/*      │
│  - /api/messages    │
└──────────┬──────────┘
           │
        ┌──┴────────────────┬──────────────┐
        ↓                   ↓              ↓
    ┌────────┐      ┌──────────────┐  ┌──────────┐
    │ Sarvam │      │ Knowledge    │  │ Supabase │
    │  LLM   │      │ Base (TF-IDF)│  │   DB     │
    └────────┘      └──────────────┘  └──────────┘
```

### Flow Example: User Sends Message

```
1. User types: "How do I create a campaign?"
2. Chatbot.js sends to /api/chat
3. server.js receives request
4. knowledgeBase.js searches KB using TF-IDF
5. llmService.js sends chunks + query to Sarvam
6. Sarvam returns: "Go to Dashboard → Campaigns..."
7. Response shown in UI with bot avatar
8. Message saved to Supabase via supabaseService.js
```

### Flow Example: User Escalates

```
1. User types: "What's your pricing?"
2. LLM confidence = 0.3 (low)
3. classifyIntent() → "sales_marketing"
4. Chatbot shows Sales & Marketing contact card
5. User fills form (name, phone, email, budget)
6. Form POSTs to /api/contact
7. Data saved to contact_requests table
8. Appears in http://localhost:3001/team/sales
9. Sales team clicks, sees conversation history
10. Types reply: "I'll send you a quote"
11. POST to /api/team/reply
12. Reply appears back in client chat as "team" message
```

---

## 🤝 The Three Dashboards

### Support Team Dashboard
**URL:** http://localhost:3001/team/support

**When it's used:**
- Generic help requests
- Account/login issues  
- General complaints
- Default escalation

**Auto-triggers on keywords:** help, support, issue, complaint, contact, delete, assist

### Sales & Marketing Dashboard
**URL:** http://localhost:3001/team/sales

**When it's used:**
- Pricing inquiries
- Subscription/plan questions
- Quote requests
- Budget discussions

**Auto-triggers on keywords:** price, pricing, cost, amount, subscription, plan, quote, discount, offer, renewal, contract, package, budget

### Engineering Dashboard  
**URL:** http://localhost:3001/team/engineers

**When it's used:**
- API integration questions
- Technical issues
- Deployment & performance
- Bug reports
- System architecture

**Auto-triggers on keywords:** api, integration, technical, bug, system, issue, error, deployment, performance, security, backend, server, database

---

## 🎨 UI/UX Features Implemented

### Client Chatbot
- ✅ Floating logo button (bottom-right, 60x60px)
- ✅ Drawer opens from right (400px wide, responsive)
- ✅ Smooth slide-in animations
- ✅ User messages right-aligned (black)
- ✅ Bot messages left-aligned (white + border)
- ✅ Typing indicator (three animated dots)
- ✅ Timestamps on messages
- ✅ Quick reply buttons
- ✅ Auto-scroll to latest message
- ✅ Custom scrollbar (minimal design)
- ✅ Touch-friendly inputs (mobile)

### Team Dashboards
- ✅ Sidebar ticket list (left 250px, black bg)
- ✅ Main detail panel (right, white bg)
- ✅ Status indicators (color-coded dots)
- ✅ Original request highlighted
- ✅ Conversation thread above
- ✅ Reply input at bottom
- ✅ Auto-refresh every 10 seconds

### Escalation Forms
- ✅ Modal overlay with blur
- ✅ Slide-up animation
- ✅ Dynamic fields based on department
- ✅ Form validation
- ✅ Success/error toast notifications
- ✅ Cancel button (close modal)

---

## 🔧 Customization Guide

### Change Knowledge Base
Edit `/knowledge/english_version.txt`:
```
Client: How do I reset my password?
Bot: Go to login page, click "Forgot Password", enter your email.
```

Server auto-reloads on restart.

### Modify Bot Personality
Edit `/server/llmService.js`, the `systemPrompt`:
```javascript
const systemPrompt = `You are Aitel's friendly support bot...`;
```

### Change Color Scheme
Edit `/client/public/css/style.css`:
```css
:root {
  --primary-black: #000000;
  --primary-white: #ffffff;
  --light-gray: #f5f5f5;
}
```

### Add New Team Department
1. Create `team-DEPARTMENT.html` in `/client/public/`
2. Copy from `team-support.html`, change `data-department`
3. Add keywords to `knowledgeBase.js` classifyIntent()
4. Add form fields to `chatbot.js` showContactCard()

### Custom LLM Model
Edit `/server/llmService.js`:
```javascript
this.model = process.env.LLM_MODEL;  // Change to different model
```

### Adjust KB Chunk Size
Edit `/server/knowledgeBase.js`, line ~27:
```javascript
if ((currentChunk + line).length > 1000) {  // Change 1000 to desired size
```

---

## 🔐 Security Notes

### Current Implementation
- ✅ API keys in `.env` (not hardcoded)
- ✅ Service role key only on backend
- ✅ Conversations isolated by UUID

### For Production
- [ ] Enable Supabase RLS (Row-Level Security)
- [ ] Add rate limiting on `/api/chat`
- [ ] Validate email/phone format
- [ ] Add team authentication
- [ ] Use HTTPS only
- [ ] Add CORS whitelist
- [ ] Rotate API keys regularly
- [ ] Monitor usage/costs

---

## 📊 Database Schema

### conversations
```
id (UUID)              - Unique conversation ID
user_identifier (str)  - User identifier (anonymous or user ID)
created_at             - When conversation started
updated_at             - Last activity
```

### messages
```
id (UUID)                    - Message ID
conversation_id (UUID FK)    - Links to conversation
sender (str)                 - 'user', 'bot', 'team', 'system'
text (str)                   - Message content
message_type (str)           - 'text', 'form', etc.
created_at                   - Timestamp
```

### contact_requests
```
id (UUID)                    - Request ID
conversation_id (UUID FK)    - Links to conversation
department (str)             - 'aitelsupport', 'sales_marketing', 'engineers'
name, phone, email (str)     - Contact info
message (str)                - User's message
company_name (str)           - Optional (sales)
budget_range (str)           - Optional (sales)
product_module (str)         - Optional (engineers)
status (str)                 - 'pending', 'responded', 'closed'
created_at, updated_at       - Timestamps
```

### team_replies
```
id (UUID)                         - Reply ID
contact_request_id (UUID FK)      - Links to contact request
department (str)                  - Which team replied
reply_text (str)                  - Team's response
created_at                        - When sent
```

---

## 🐛 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| **Cannot connect to backend** | Server not running | `cd server && npm start` |
| **Chat widget doesn't appear** | Client CSS not loading | Check browser console, reload |
| **Bot not responding** | LLM API key invalid | Verify `LLM_API_KEY` in `.env` |
| **Supabase connection fails** | Wrong credentials | Check `SUPABASE_SERVICE_ROLE_KEY` |
| **Escalation form doesn't show** | Classification failed | Check console logs for errors |
| **Team replies not appearing** | Messages not syncing | Check Supabase `team_replies` table |
| **Knowledge base not found** | File path wrong | Verify `/knowledge/english_version.txt` exists |

---

## 📈 Performance Tips

1. **Knowledge Base**: Large KB files slow retrieval. Keep under 100KB.
2. **LLM Timeout**: Set timeout to 30s, increase if needed.
3. **Database Queries**: Indexes are pre-created for speed.
4. **Browser Cache**: Clear localStorage if testing sessions.
5. **Auto-Refresh**: Team dashboard refreshes every 10s, adjust if needed.

---

## 🚀 Deployment Checklist

- [ ] All `.env` files have production credentials
- [ ] Supabase RLS policies enabled
- [ ] CORS configured for your domain
- [ ] HTTPS certificate installed
- [ ] Rate limiting configured
- [ ] Error logging setup
- [ ] Backup Supabase database
- [ ] Team dashboards password-protected
- [ ] Knowledge base reviewed & updated
- [ ] LLM API key has spending limits set
- [ ] Test all 3 escalation paths
- [ ] Mobile UI tested on devices

---

## 📞 Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Express.js Guide**: https://expressjs.com
- **MDN Web Docs**: https://developer.mozilla.org
- **Sarvam LLM**: Your provider's documentation

---

## 📝 License & Rights

**All rights reserved © Aitel Inc.**

This chatbot is proprietary software for Aitel. Unauthorized copying or redistribution is prohibited.

---

## ✅ Checklist for You

- [ ] Read this entire guide
- [ ] Run setup script (`setup.bat` or `setup.sh`)
- [ ] Create Supabase database tables
- [ ] Fill in `.env` files with credentials
- [ ] Test client chatbot (index.html)
- [ ] Test all 3 team dashboards
- [ ] Customize knowledge base for your content
- [ ] Deploy to production
- [ ] Monitor costs & performance

---

**🎉 Congratulations! Your Aitel Chatbot is ready to deploy!**

For updates or issues, refer to README.md and SETUP.md files.

Last Updated: January 2026 | Version 1.0.0
