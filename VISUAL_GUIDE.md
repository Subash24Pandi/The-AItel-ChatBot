# 🎨 Aitel Chatbot - Visual Tour & Feature Guide

## 👁️ Visual Overview

### 1. Client Chatbot UI

```
┌─────────────────────────────────────────┐
│ Your Website / Application              │
│                                         │
│                                         │
│                                         │
│                                 ┌────┐ │
│                                 │ A  │ │  ← Floating Logo Button
│                                 └────┘ │
└─────────────────────────────────────────┘


When Clicked:
┌─────────────────────────────────────────┐
│ Your Website                │ Aitel Su  │
│                             │ ──────────│  
│                             │ Hi there! │  ← Bot Message
│                             │ 3:45 PM   │
│                             │           │
│                             │    Can I  │
│                             │    help?  │  ← User Message
│                             │ 3:46 PM   │
│                             │           │
│                             │ ─────────┬│
│                             │ Message..│✓│  ← Input + Send
│                             └───────────┘
```

### 2. Escalation Popup

```
When bot doesn't know:

┌──────────────────────────────────┐
│  Sales & Marketing Team          │
│  ─────────────────────────────   │
│  Get a personalized quote        │
│                                  │
│  Name *          ___________     │
│  Phone *         ___________     │
│  Email           ___________     │
│  Company         ___________     │
│  Budget          [Dropdown] ⏷   │
│  Message *       ___________     │
│                  ___________     │
│                                  │
│   [Cancel]  [Request Quote]      │
└──────────────────────────────────┘
```

### 3. Team Dashboard

```
┌─────────────────┬──────────────────────────────────┐
│  Support Team   │  Aitel Support - PENDING        │
│ ─────────────   │  ──────────────────────────────  │
│                 │  John Doe                        │
│ John Doe        │  📞 +91-9876543210              │
│ 📧 john@...     │  📧 john@example.com            │
│ Hi, I can't     │  📅 Jan 23, 2026 3:45 PM        │
│ login...        │                                  │
│                 │  Original Request:               │
│                 │  "I can't log in, need help"     │
│                 │                                  │
│ [Active]        │  ─────────────────────────────   │
│                 │  [Type reply...]                 │
│ Jane Smith      │  ─────────────────────────────   │
│ Budget help     │  [Send Reply]                    │
│                 │                                  │
│ Mike Wilson     │                                  │
│ System error    │                                  │
│                 │                                  │
└─────────────────┴──────────────────────────────────┘
```

---

## 🎯 User Journey Flow

### Happy Path (Bot Answers)

```
1. User opens app
        ↓
2. Clicks "A" button
        ↓
3. Chat drawer opens
        ↓
4. User types: "How do I log in?"
        ↓
5. Message sent to backend
        ↓
6. Knowledge base searched (TF-IDF)
        ↓
7. Top 5 chunks + LLM context
        ↓
8. Bot responds: "Select client portal, enter mobile..."
        ↓
9. Message appears in chat
        ↓
10. User satisfied ✅
```

### Escalation Path (Bot Doesn't Know)

```
1. User types: "What's your pricing?"
        ↓
2. Message sent to backend
        ↓
3. KB searched - no relevant matches
        ↓
4. LLM confidence: 0.3 (LOW)
        ↓
5. Classify intent: Keywords "pricing" 
        ↓
6. Route: "sales_marketing"
        ↓
7. Show Sales Contact Card
        ↓
8. User fills form (Name, Phone, Budget, Message)
        ↓
9. Submit form
        ↓
10. Saved to contact_requests table
        ↓
11. Success toast: "Details sent to Aitel team"
        ↓
12. Request appears in Sales dashboard
        ↓
13. Sales team reviews & replies
        ↓
14. Reply syncs back to client chat
        ↓
15. Client notified ✅
```

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  index.html (Static)                                 │   │
│  │  - Floating "A" button                              │   │
│  │  - Chat drawer                                      │   │
│  │  - Modal overlays                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  chatbot.js (Client Logic)                           │   │
│  │  - Message send/receive                             │   │
│  │  - Escalation form handling                         │   │
│  │  - Session management                              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  style.css (Styling)                                │   │
│  │  - Black & white theme                             │   │
│  │  - Animations                                      │   │
│  │  - Responsive layout                               │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/FETCH
                       ↓
┌──────────────────────────────────────────────────────────────┐
│              CLIENT EXPRESS SERVER (Port 3001)                │
│  - Serves HTML/CSS/JS                                        │
│  - Proxies requests to backend                              │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP
                       ↓
┌──────────────────────────────────────────────────────────────┐
│            BACKEND EXPRESS SERVER (Port 3000)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  server.js (Routes)                                  │   │
│  │  - POST /api/chat                                   │   │
│  │  - POST /api/contact                                │   │
│  │  - GET /api/team/requests                           │   │
│  │  - POST /api/team/reply                             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  llmService.js                                       │   │
│  │  - Calls Sarvam LLM API                             │   │
│  │  - Context-aware responses                         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  knowledgeBase.js                                    │   │
│  │  - Loads KB chunks                                  │   │
│  │  - TF-IDF scoring                                   │   │
│  │  - Intent classification                            │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  supabaseService.js                                  │   │
│  │  - Database operations                              │   │
│  │  - CRUD for all tables                              │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────┬──────────────────────────┬───────────────────────┘
           │                          │
           │ HTTP API Calls           │ PostgreSQL
           ↓                          ↓
    ┌────────────────┐          ┌──────────────────┐
    │  Sarvam LLM    │          │  Supabase        │
    │  (Text Gen)    │          │  - conversations │
    └────────────────┘          │  - messages      │
                                 │  - contact_...   │
                                 │  - team_replies  │
                                 └──────────────────┘
```

---

## 📱 Responsive Breakpoints

### Desktop (>768px)
```
┌────────────────────────────────────────────┐
│ Your App                        ┌────┐     │
│                                 │ A  │ ← 60x60px
│                                 └────┘
│                            Chat: 400px wide
└────────────────────────────────────────────┘
```

### Tablet (481px - 768px)
```
┌──────────────────────────────┐
│ Your App        ┌────┐       │
│                 │ A  │ ← 54x54px
│                 └────┘
│            Chat: 350px wide
└──────────────────────────────┘
```

### Mobile (<480px)
```
┌──────────────┐
│ Your App ┌─┐ │
│          │A│ ← 54x54px
│          └─┘
│    Chat: 100% wide
└──────────────┘
```

---

## 🎯 Conversation Flow Diagram

```
START
  │
  ├─→ [User Opens App]
  │      │
  │      └─→ [Click "A" Button]
  │             │
  │             └─→ [Chat Drawer Opens]
  │                  │
  ├──────────────────┘
  │
  ├─→ [User Types Message]
  │      │
  │      └─→ [Send Button / Enter Key]
  │             │
  │             └─→ API: POST /api/chat
  │                  │
  │                  ├─→ [Retrieve KB Chunks]
  │                  │      │
  │                  │      └─→ TF-IDF Scoring
  │                  │
  │                  ├─→ [LLM Processing]
  │                  │      │
  │                  │      └─→ Sarvam API Call
  │                  │
  │                  ├─→ [Check Confidence]
  │                  │      │
  │                  │      ├─→ High (>0.5)
  │                  │      │      │
  │                  │      │      └─→ [Show Answer]
  │                  │      │             │
  │                  │      │             └─→ Continue Chat
  │                  │      │
  │                  │      └─→ Low (<0.5)
  │                  │             │
  │                  │             ├─→ [Classify Intent]
  │                  │             │      │
  │                  │             │      ├─→ "sales_marketing"
  │                  │             │      │      │
  │                  │             │      │      └─→ [Show Sales Form]
  │                  │             │      │
  │                  │             │      ├─→ "engineers"
  │                  │             │      │      │
  │                  │             │      │      └─→ [Show Tech Form]
  │                  │             │      │
  │                  │             │      └─→ "aitelsupport"
  │                  │             │             │
  │                  │             │             └─→ [Show Support Form]
  │                  │             │
  │                  │             └─→ [Save to Supabase]
  │                  │
  │                  └─→ [Display Response]
  │                         │
  │                         └─→ [Save to Messages Table]
  │
  ├─→ [User Submits Escalation Form]
  │      │
  │      └─→ API: POST /api/contact
  │             │
  │             └─→ [Save to contact_requests]
  │                  │
  │                  └─→ [Show Success Toast]
  │
  ├─→ [Team Sees Request]
  │      │
  │      ├─→ Open /team/DEPARTMENT dashboard
  │      │      │
  │      │      └─→ [Click Ticket]
  │      │             │
  │      │             └─→ [View Conversation]
  │      │
  │      └─→ [Type Reply]
  │             │
  │             └─→ API: POST /api/team/reply
  │                  │
  │                  └─→ [Save to team_replies]
  │                  └─→ [Also save to messages]
  │
  └─→ [Client Sees Team Reply]
         │
         └─→ [Conversation Continues]

END
```

---

## 🚀 Deployment Architecture

```
LOCAL DEVELOPMENT          PRODUCTION
─────────────────          ──────────

Localhost:3001             Vercel / Netlify
  ↓                              ↓
Localhost:3000             Railway / Render
  ↓                              ↓
Supabase Dev        →        Supabase Prod
(PostgreSQL)                (PostgreSQL)
  ↓                              ↓
Sarvam API          →        Sarvam API
(Your Provider)                (Same)
```

---

## 🔐 Data Flow Security

```
Client Browser
      │ (HTTPS in prod)
      ↓
Express Client Server
      │
      ├─→ Stores session in localStorage (browser)
      │   (Sensitive data: NO)
      │
      └─→ Sends to Express Backend
            │ (HTTPS in prod)
            ↓
      Express Backend
            │
            ├─→ Validates request
            │
            ├─→ Service Role Key
            │   (Backend only, never sent to client)
            │
            └─→ Supabase
                  │
                  └─→ PostgreSQL Database
                      (Encrypted at rest)
```

---

## 📊 Database Relationship Diagram

```
┌──────────────────┐
│  conversations   │
│  ──────────────  │
│  id (PK)         │
│  user_id         │
│  created_at      │
└────────┬─────────┘
         │ (1:many)
         ↓
    ┌─────────────────┐
    │    messages     │
    │  ───────────────│
    │  id (PK)        │
    │  conv_id (FK) ──┼──→ conversations.id
    │  sender         │
    │  text           │
    │  created_at     │
    └─────────────────┘

┌──────────────────┐
│  conversations   │
│  ──────────────  │
│  id (PK)         │
└────────┬─────────┘
         │ (1:many)
         ↓
    ┌────────────────────┐
    │ contact_requests   │
    │  ────────────────  │
    │  id (PK)           │
    │  conv_id (FK) ─────┼──→ conversations.id
    │  department        │
    │  name, phone, email│
    │  message           │
    │  status            │
    │  created_at        │
    └────────┬───────────┘
             │ (1:many)
             ↓
        ┌────────────────┐
        │  team_replies  │
        │  ────────────  │
        │  id (PK)       │
        │  req_id (FK)───┼──→ contact_requests.id
        │  department    │
        │  reply_text    │
        │  created_at    │
        └────────────────┘
```

---

## 🎨 Color Palette

### Black & White Theme
```
Primary Black:       #000000  ■
Primary White:       #ffffff  □
Light Gray:          #f5f5f5  ░
Dark Gray:           #333333  ▓
Medium Gray:         #666666  ▒
Border Color:        #e0e0e0  ─

Success (Green):     #10b981  ✓
Error (Red):         #ef4444  ✗
Info (Gray):         #6b7280  ●
```

---

## 📱 Mobile Optimization

### Touch Targets
- Minimum 44×44 pixels
- Buttons are 40×40+ pixels
- Input fields are 44+ pixels tall
- Padding on interactive elements

### Responsive Images
- Logo button: 60px (desktop) → 54px (mobile)
- Chat drawer: 400px (desktop) → 100% (mobile)
- Fonts: 14px minimum for readability

### Performance
- No horizontal scroll
- Smooth animations (no jank)
- Fast input response
- Efficient rendering

---

## 🎯 Success Indicators

Your implementation is successful when you see:

✅ **Client App**
- "A" button visible
- Can open/close chat
- Messages send and receive
- Timestamps appear
- Typing indicator works

✅ **Escalation**
- Forms appear for unknown questions
- Different forms for each department
- Submissions save to Supabase
- Success toast shows

✅ **Team Dashboards**
- Tickets appear in correct dashboard
- Can view full conversation
- Can send replies
- Replies appear back in client chat

✅ **Mobile**
- No horizontal scroll
- Buttons touch-friendly
- Chat drawer full-width
- All features work

---

**Visual Guide Version**: 1.0.0  
**Created**: January 2026  
**Ready**: ✅ For Deployment
