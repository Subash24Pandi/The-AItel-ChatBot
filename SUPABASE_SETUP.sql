-- Aitel Chatbot Supabase Database Schema
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_identifier TEXT NOT NULL DEFAULT 'anonymous',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL, -- 'user', 'bot', 'system'
  text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text', -- 'text', 'form', 'escalation'
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Create contact_requests table
CREATE TABLE IF NOT EXISTS contact_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  department TEXT NOT NULL, -- 'sales_marketing', 'engineers' (or any text label)
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  message TEXT,
  company_name TEXT,
  budget_range TEXT,
  product_module TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'assigned', 'resolved'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create team_replies table
CREATE TABLE IF NOT EXISTS team_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_request_id UUID NOT NULL REFERENCES contact_requests(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  replied_by TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_identifier);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_requests_conversation_id ON contact_requests(conversation_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_department ON contact_requests(department);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_team_replies_contact_request_id ON team_replies(contact_request_id);

-- 6. Enable Row Level Security (optional but recommended)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_replies ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for public access (development)
CREATE POLICY "Allow public read conversations" ON conversations FOR SELECT USING (true);
CREATE POLICY "Allow public insert conversations" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert messages" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read contact_requests" ON contact_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert contact_requests" ON contact_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read team_replies" ON team_replies FOR SELECT USING (true);
CREATE POLICY "Allow public insert team_replies" ON team_replies FOR INSERT WITH CHECK (true);
