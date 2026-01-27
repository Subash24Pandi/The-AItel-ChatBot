# 🎯 Aitel Chatbot - Quick Reference Checklist

## ✅ Project Complete!

Your production-ready Aitel chatbot includes:

### Core Features
- [x] Client-facing chatbot widget (floating "A" button)
- [x] Black & white modern theme with animations
- [x] Knowledge base integration with TF-IDF retrieval
- [x] Smart intent classification & routing
- [x] Three escalation popups (Support, Sales, Engineering)
- [x] Three team dashboards with real-time updates
- [x] Two-way messaging system
- [x] Supabase database integration
- [x] Sarvam LLM integration

### Backend Services
- [x] Express.js API server (port 3000)
- [x] Chat endpoint (/api/chat)
- [x] Contact form submission (/api/contact)
- [x] Team dashboard endpoints (/api/team/*)
- [x] Message retrieval (/api/messages/*)
- [x] Knowledge base retrieval engine
- [x] LLM service wrapper
- [x] Supabase service layer

### Frontend
- [x] Express.js static server (port 3001)
- [x] Client chatbot UI (index.html)
- [x] Support team dashboard (team-support.html)
- [x] Sales & Marketing dashboard (team-sales.html)
- [x] Engineering dashboard (team-engineers.html)
- [x] Responsive CSS (style.css)
- [x] Client-side JavaScript (chatbot.js, team-dashboard.js)

### Database
- [x] Conversations table
- [x] Messages table
- [x] Contact requests table
- [x] Team replies table
- [x] Indexes for performance
- [x] Foreign key relationships

### Documentation
- [x] README.md - Main guide
- [x] SETUP.md - Database & environment setup
- [x] IMPLEMENTATION_GUIDE.md - Complete walkthrough
- [x] .env.example files for both services
- [x] setup.sh (Mac/Linux)
- [x] setup.bat (Windows)

---

## 🚀 Getting Started (Next Steps)

### 1. **Prepare Your Supabase Account**
   - [ ] Go to https://supabase.com
   - [ ] Create new project
   - [ ] Get Project URL from Settings → API
   - [ ] Get Service Role Key from Settings → API
   - [ ] Copy both values safely

### 2. **Get Your LLM Credentials**
   - [ ] Get LLM_ENDPOINT: `https://ooictyfklyrftfkrquok.supabase.co/functions/v1/v1-chat-completions`
   - [ ] Get LLM_API_KEY from your provider
   - [ ] Keep it secure

### 3. **Run Setup Script**
   - [ ] Windows: Double-click `setup.bat`
   - [ ] Mac/Linux: Run `chmod +x setup.sh && ./setup.sh`
   - [ ] This installs dependencies for both server & client

### 4. **Configure Environment**
   - [ ] Edit `server/.env` with your Supabase & LLM credentials
   - [ ] Edit `client/.env` to match your server URL
   - [ ] Save both files

### 5. **Create Database Tables**
   - [ ] Log into Supabase dashboard
   - [ ] Go to SQL Editor
   - [ ] Copy entire schema from SETUP.md
   - [ ] Paste and run
   - [ ] Verify 4 tables created (conversations, messages, contact_requests, team_replies)

### 6. **Start Backend**
   ```bash
   cd server
   npm start
   ```
   - [ ] Should see: "🚀 Aitel Chatbot Server running on port 3000"

### 7. **Start Frontend** (New Terminal)
   ```bash
   cd client
   npm start
   ```
   - [ ] Should see: "🌐 Aitel Chatbot Client running on port 3001"

### 8. **Test the Application**
   - [ ] Open http://localhost:3001 in browser
   - [ ] Click "A" button (bottom-right)
   - [ ] Try: "How do I log in?" (should answer from KB)
   - [ ] Try: "What's your pricing?" (should show Sales card)
   - [ ] Fill & submit contact form
   - [ ] Check Supabase - should see entry in `contact_requests`

### 9. **Test Team Dashboards**
   - [ ] Open http://localhost:3001/team/support
   - [ ] Should see the contact request you just submitted
   - [ ] Click it to open
   - [ ] Type a reply and click "Send Reply"
   - [ ] Go back to client chat - reply should appear as "team" message

### 10. **Deploy** (When Ready)
   - [ ] Choose hosting (Railway, Render, Vercel, etc.)
   - [ ] Set production environment variables
   - [ ] Deploy backend first, then frontend
   - [ ] Test again in production
   - [ ] Update DNS/domain

---

## 📂 File Structure Reference

```
chatbot/
├── README.md ........................ Start here
├── SETUP.md ......................... Database setup guide
├── IMPLEMENTATION_GUIDE.md ......... Comprehensive guide
├── setup.bat ........................ Windows setup
├── setup.sh ......................... Mac/Linux setup
│
├── server/ .......................... Backend (Node.js/Express)
│   ├── package.json
│   ├── .env ......................... Add credentials here
│   ├── server.js .................... Main API
│   ├── knowledgeBase.js ............ KB retrieval
│   ├── llmService.js ............... LLM integration
│   └── supabaseService.js ......... Database layer
│
├── client/ .......................... Frontend (Static + Server)
│   ├── package.json
│   ├── .env ......................... Configure API URL
│   ├── server.js .................... Serves HTML
│   └── public/
│       ├── index.html .............. Main chatbot app
│       ├── team-support.html ....... Support dashboard
│       ├── team-sales.html ......... Sales dashboard
│       ├── team-engineers.html .... Engineering dashboard
│       ├── css/
│       │   └── style.css ........... All styling
│       └── js/
│           ├── chatbot.js .......... Client logic
│           └── team-dashboard.js .. Team dashboard logic
│
└── knowledge/
    └── english_version.txt ........ Knowledge base (Q&A)
```

---

## 🎨 UI Quick Reference

### Client Chatbot
- **Logo Button**: Click to toggle chat drawer
  - Position: Bottom-right (30px from edge)
  - Size: 60×60px circle
  - Color: Black with white "A"
  
- **Chat Messages**:
  - User: Right-aligned, black background
  - Bot: Left-aligned, white with border
  - Time: 12-hour format (HH:MM AM/PM)

- **Input Area**:
  - Rounded 20px border
  - Auto-height when text wraps
  - Send button: Arrow icon (➤)

### Team Dashboards
- **Left Sidebar**: 250px wide, black background, ticket list
- **Main Content**: White background, ticket details & reply
- **Status Colors**: 
  - Pending: Red (#ef4444)
  - Responded: Green (#10b981)
  - Closed: Gray (#6b7280)

---

## 🔌 API Endpoints Quick Reference

### Chat
```
POST /api/chat
{ conversationId, message, userId }
→ { answer, confidence, route, showContactCard, conversationId }
```

### Messages
```
GET /api/messages/:conversationId
→ [{ id, conversation_id, sender, text, created_at }]
```

### Contact Form
```
POST /api/contact
{ conversationId, department, name, phone, email, message, ... }
→ { success, message, contactRequestId }
```

### Team Dashboard
```
GET /api/team/requests?department=sales_marketing
→ [{ id, name, phone, email, message, status, ... }]

POST /api/team/reply
{ contactRequestId, department, reply }
→ { success, message }

GET /api/team/reply/:contactRequestId
→ [{ id, department, reply_text, created_at }]
```

---

## 🎯 Department Keywords

### Sales & Marketing
```
price, pricing, cost, amount, subscription, plan, 
quote, discount, offer, renewal, contract, package, budget, fee
```

### Engineering
```
api, integration, technical, bug, error, system, server, 
deployment, performance, security, backend, database, code, issue
```

### Support (Default)
```
help, support, issue, problem, complaint, assist, 
urgent, contact, delete
```

---

## 📊 Testing Checklist

- [ ] **Basic Chat**
  - [ ] Can open/close chatbot
  - [ ] Can send messages
  - [ ] Bot responds with KB answers
  - [ ] Messages appear in Supabase

- [ ] **Escalation**
  - [ ] Sales keywords trigger Sales form
  - [ ] Tech keywords trigger Engineering form
  - [ ] Other keywords trigger Support form
  - [ ] Forms submit successfully
  - [ ] Data appears in Supabase

- [ ] **Team Dashboards**
  - [ ] Support dashboard shows requests
  - [ ] Sales dashboard shows sales requests
  - [ ] Engineering dashboard shows tech requests
  - [ ] Can read full conversation history
  - [ ] Can send replies
  - [ ] Replies appear back in client chat

- [ ] **Mobile**
  - [ ] Chat drawer is full-width on mobile
  - [ ] Touch inputs work
  - [ ] No horizontal scrolling
  - [ ] Buttons are large enough

- [ ] **Browser**
  - [ ] Chrome ✅
  - [ ] Firefox ✅
  - [ ] Safari ✅
  - [ ] Edge ✅

---

## ⚙️ Configuration Reference

### Knowledge Base
**File**: `/knowledge/english_version.txt`
**Format**: 
```
Client: Question?
Bot: Answer text.
```
**Chunk Size**: ~500-1000 characters (in knowledgeBase.js, line 27)

### LLM Prompt
**File**: `/server/llmService.js`, line 18
**Edit**: `const systemPrompt = ...`

### UI Colors
**File**: `/client/public/css/style.css`, lines 1-10
**Variables**: --primary-black, --primary-white, --light-gray, etc.

### Port Numbers
**Backend**: Port 3000 (in server/.env)
**Frontend**: Port 3001 (in client/.env)

### Auto-Refresh
**Team Dashboard**: Every 10 seconds (in team-dashboard.js, line ~150)

---

## 🔒 Security Reminders

- ✅ Never commit `.env` files
- ✅ Never share LLM_API_KEY
- ✅ Use SERVICE_ROLE_KEY only on backend
- ✅ ANON_KEY is safe for frontend
- ✅ Add authentication before production
- ✅ Enable RLS (Row-Level Security) on Supabase
- ✅ Validate all form inputs
- ✅ Use HTTPS in production

---

## 💰 Cost Estimates

- **Supabase**: Free tier up to 10K API calls/month
- **LLM**: Depends on provider (monitor usage)
- **Hosting**: $5-50/month depending on traffic
- **Domain**: $10-15/year

---

## 📞 If Something Breaks

1. **Check Error Console**
   - F12 → Console tab
   - Look for red error messages

2. **Check Server Logs**
   - Look at terminal where `npm start` was run
   - Server errors appear there

3. **Verify Credentials**
   - `.env` file exists and has values
   - Supabase URL is correct
   - LLM API key is valid

4. **Restart Both Servers**
   - Kill both terminals (Ctrl+C)
   - Run `npm start` again

5. **Clear Cache**
   - Browser: Ctrl+Shift+Delete (or Cmd+Shift+Delete)
   - LocalStorage: F12 → Application → Clear

6. **Check Database**
   - Supabase dashboard → Tables
   - Verify all 4 tables exist with data

---

## 🎓 Learning Resources

- **JavaScript Basics**: https://developer.mozilla.org/en-US/docs/Web/JavaScript
- **Express.js**: https://expressjs.com/
- **Supabase**: https://supabase.com/docs
- **REST APIs**: https://developer.mozilla.org/en-US/docs/Glossary/REST

---

## 📈 Next Steps After Launch

1. Monitor usage & performance
2. Update knowledge base with new Q&As
3. Train team on dashboards
4. Gather user feedback
5. Optimize LLM prompts
6. Add more departments if needed
7. Implement authentication
8. Setup analytics
9. Create backup strategy
10. Plan scaling for growth

---

**🚀 You're all set! Deploy with confidence!**

Questions? Check README.md, SETUP.md, or IMPLEMENTATION_GUIDE.md

Last Updated: January 2026 | Version 1.0.0
