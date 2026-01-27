# 🚀 Aitel Chatbot - Quick Start Guide

## Embed on Your Website

Add this **single line** before the closing `</body>` tag:

```html
<script src="https://client-puce-one-81.vercel.app/widget.js?appId=default" crossorigin="anonymous"></script>
```

The chatbot will appear in the bottom-right corner with the Aitel logo.

---

## ✅ What's Implemented

- ✅ Knowledge base-only responses (from english_version.txt)
- ✅ LLM for intent understanding and question normalization
- ✅ Handles spelling mistakes and grammar errors
- ✅ Professional blue theme with Aitel logo
- ✅ Clean, minimal UI design
- ✅ Mobile responsive design
- ✅ Conversation history persistence
- ✅ Production ready on Vercel

---

## 💬 How It Works

```
User asks question
    ↓
LLM normalizes question (handles typos, grammar)
    ↓
Search knowledge base for matching answer
    ↓
Return KB answer
OR
"I don't have information about that"
```

---

## 📝 Example Conversations

### Correct Question
```
User: "How do I log in?"
Bot: "Select the client portal, enter your mobile number, 
      you will receive an OTP. Enter the OTP and log in."
```

### Typo Handling
```
User: "How doo I log in?" (typo)
Bot: "Select the client portal, enter your mobile number, 
      you will receive an OTP. Enter the OTP and log in."
```

### Unknown Question
```
User: "What's the weather?"
Bot: "I don't have information about that. 
      Please contact our support team for assistance."
```

---

## 🎨 Chat Interface

**Features**
- Professional chat button with Aitel logo
- Dark blue (#1a3a5c) theme
- Clean message bubbles
- Smooth animations
- Mobile responsive

**Layout**
- Button: 56px circle (bottom-right)
- Panel: 380px × 520px
- Header: Dark blue gradient
- Messages: Clean styling
- Input: Minimal design

---

## 📚 Knowledge Base

The chatbot knows answers to:

- **Login & Account** (5 Q&A)
- **Agents** (8 Q&A)
- **Phone Numbers** (4 Q&A)
- **Making Calls** (2 Q&A)
- **Call History** (11 Q&A)
- **Campaigns** (10 Q&A)
- **Teams** (2 Q&A)
- **Logout & Support** (3 Q&A)

**Total:** 50 predefined question-answer pairs

Full list: `knowledge/english_version.txt`

---

## 🔧 Customization

### Change Logo
Edit `widget.js` line 10 (AITEL_LOGO variable)

### Change Colors
Edit CSS in `widget.js` createDOM function:
- Primary: #1a3a5c
- Accent: #2d5a8a
- Background: White

### Add Q&A Pairs
Edit `knowledge/english_version.txt`:
```
Q: Your question
A: Your answer
```

Then redeploy backend.

### Change Welcome Message
Edit `widget.js` line ~245 (showWelcome function)

---

## ✅ Verification

- [ ] Chat button appears (bottom-right)
- [ ] Button shows Aitel logo
- [ ] Click button opens chat
- [ ] Welcome message displays
- [ ] Can send messages
- [ ] Bot responds
- [ ] Mobile works
- [ ] No console errors (F12)

---

## 🔍 Health Check

Verify backend is running:
```
https://server-three-black.vercel.app/health
```

Should return:
```json
{ "ok": true, "port": 3000, "kbCount": 50 }
```

---

## 🌐 Deployment URLs

- **Frontend**: https://client-puce-one-81.vercel.app
- **Backend**: https://server-three-black.vercel.app
- **GitHub**: https://github.com/Subash24Pandi/The-AItel-ChatBot

---

## 📊 API Reference

### Chat Endpoint
```
POST /api/chat
Input: { message, conversationId, userId }
Output: { answer, confidence, route, conversationId }
```

### Health Check
```
GET /health
Output: { ok, port, kbCount }
```

---

## 🎯 Key Features

**For Users**
- Easy question answering
- Handles typos/grammar
- Professional interface
- Mobile support
- Instant responses

**For Admin**
- Easy to add Q&A pairs
- LLM for flexibility
- KB-only responses (no hallucination)
- Conversation tracking
- Production ready

---

## 💡 Tips

1. **Optimize KB**: Focus on most-asked questions
2. **Monitor**: Check which questions lack answers
3. **Update**: Add new Q&A pairs as needed
4. **Test**: Ask various versions of same question
5. **Expand**: Add more categories over time

---

## 📖 Full Documentation

- **Implementation**: `IMPLEMENTATION_SUMMARY.md`
- **Setup**: `SETUP.md`
- **Troubleshooting**: `FIX_REPORT.md`
- **Testing**: `WIDGET_TESTING_GUIDE.md`

---

**Status:** ✅ Production Ready | **Version:** 2.0 | **Last Updated:** 2024
