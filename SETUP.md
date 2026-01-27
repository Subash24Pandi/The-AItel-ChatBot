# Database Schema & Setup Instructions

## Supabase Setup

### 1. Create Supabase Project
- Go to https://supabase.com
- Create new project
- Wait for it to initialize
- Note your **Project URL** and **API Keys**

### 2. Create Tables

Copy and paste the following SQL into Supabase's SQL Editor (no need to run line-by-line):

```sql
-- ============= CONVERSATIONS TABLE =============
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier varchar(255),
  created_at timestamp DEFAULT current_timestamp,
  updated_at timestamp DEFAULT current_timestamp
);

CREATE INDEX idx_conversations_user ON conversations(user_identifier);

-- ============= MESSAGES TABLE =============
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender varchar(50) NOT NULL,
  text text NOT NULL,
  message_type varchar(50) DEFAULT 'text',
  created_at timestamp DEFAULT current_timestamp
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender);

-- ============= CONTACT REQUESTS TABLE =============
CREATE TABLE contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  department varchar(50) NOT NULL,
  name varchar(255) NOT NULL,
  phone varchar(20) NOT NULL,
  email varchar(255),
  message text NOT NULL,
  company_name varchar(255),
  budget_range varchar(50),
  product_module varchar(100),
  status varchar(50) DEFAULT 'pending',
  created_at timestamp DEFAULT current_timestamp,
  updated_at timestamp DEFAULT current_timestamp
);

CREATE INDEX idx_contact_requests_department ON contact_requests(department);
CREATE INDEX idx_contact_requests_conversation ON contact_requests(conversation_id);
CREATE INDEX idx_contact_requests_status ON contact_requests(status);

-- ============= TEAM REPLIES TABLE =============
CREATE TABLE team_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_request_id uuid NOT NULL REFERENCES contact_requests(id) ON DELETE CASCADE,
  department varchar(50) NOT NULL,
  reply_text text NOT NULL,
  created_at timestamp DEFAULT current_timestamp
);

CREATE INDEX idx_team_replies_contact_request ON team_replies(contact_request_id);
CREATE INDEX idx_team_replies_department ON team_replies(department);
```

### 3. Verify Tables
Check Supabase dashboard under **Database** → **Tables** to confirm all 4 tables exist:
- `conversations`
- `messages`
- `contact_requests`
- `team_replies`

### 4. Get Your Credentials
Go to **Settings** → **API** and copy:
- **Project URL** → `SUPABASE_URL`
- **Anon Key** → `SUPABASE_ANON_KEY`
- **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

---

## Environment Variables Setup

### Server (.env)
```
LLM_ENDPOINT=https://ooictyfklyrftfkrquok.supabase.co/functions/v1/v1-chat-completions
LLM_API_KEY=YOUR_ACTUAL_API_KEY
LLM_MODEL=sarvam-m
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
PORT=3000
NODE_ENV=development
```

### Client (.env)
```
REACT_APP_API_URL=http://localhost:3000
CLIENT_PORT=3001
NODE_ENV=development
```

---

## Testing the Setup

### 1. Test Server
```bash
cd server
npm start
# Should print: "🚀 Aitel Chatbot Server running on port 3000"
```

### 2. Test Client
```bash
cd client
npm start
# Should print: "🌐 Aitel Chatbot Client running on port 3001"
```

### 3. Test in Browser
- Open http://localhost:3001
- Click **A** button (bottom-right)
- Try sending a message
- Should see bot response

### 4. Test Escalation
- Send: "What's your pricing?"
- Should show Sales & Marketing contact card
- Fill and submit
- Check Supabase: `contact_requests` table should have new row

### 5. Test Team Dashboard
- Open http://localhost:3001/team/support
- See list of contact requests
- Click one to view details
- Type a response and send
- Response should appear back in Supabase `team_replies` table

---

## Troubleshooting

### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Solution:** Make sure server is running (`npm start` in server folder)

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** Check that backend is on port 3000 and client is on port 3001

### No Supabase Connection
```
Error: SUPABASE_URL is not defined
```
**Solution:** Create `server/.env` and add your Supabase credentials

### LLM Timeout
```
Error: Request timeout
```
**Solution:** Check your LLM_ENDPOINT and LLM_API_KEY are correct

---

## Production Deployment

### Recommended Services
- **Backend**: Railway, Render, Heroku, or AWS EC2
- **Frontend**: Vercel, Netlify, Cloudflare Pages
- **Database**: Supabase (managed)

### Pre-Production Checklist
- [ ] Update `.env` with production credentials
- [ ] Change `NODE_ENV=production`
- [ ] Update `CORS_ORIGIN` to your domain
- [ ] Enable Supabase RLS policies
- [ ] Add rate limiting to `/api/chat`
- [ ] Setup HTTPS/SSL certificates
- [ ] Configure domain DNS
- [ ] Test all 3 team dashboards
- [ ] Backup Supabase database
