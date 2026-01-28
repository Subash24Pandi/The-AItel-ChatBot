// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const llmService = require('./llmService');
const knowledgeBase = require('./knowledgeBase');
const supabaseService = require('./supabaseService');

const app = express();
const PORT = process.env.PORT || 3000;

// Train KB at startup
console.log('🚀 Server v2.3 - Starting initialization...');
try {
  if (typeof knowledgeBase.trainKnowledgeBase === 'function') {
    knowledgeBase.trainKnowledgeBase();
    const kbCount = knowledgeBase.getKbCount?.() ?? 0;
    console.log(`📚 KB Loaded at startup: ${kbCount} Q&A pairs`);
    if (kbCount === 0) {
      console.warn('⚠️ WARNING: KB loaded with 0 entries! Attempting fallback...');
      // Force a retry with embedded data
      knowledgeBase.trainKnowledgeBase();
      const retryCount = knowledgeBase.getKbCount?.() ?? 0;
      console.log(`📚 Retry result: ${retryCount} Q&A pairs`);
    }
  }
} catch (e) {
  console.log('❌ KB training failed:', e.message);
}

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isTamil(text = '') {
  return /[\u0B80-\u0BFF]/.test(text);
}

function contactFallback() {
  return "I don't have information about that. Please contact the Aitel team for assistance.";
}

function shouldShowContact(route) {
  return route === 'sales_marketing' || route === 'engineers';
}

function hasDeletionIntent(message = '') {
  const m = message.toLowerCase();
  return (
    m.includes('delete') ||
    m.includes('remove') ||
    m.includes('clear') ||
    m.includes('erase') ||
    m.includes('reset') ||
    m.includes('purge')
  );
}

app.get('/health', (req, res) => {
  const kbCount = knowledgeBase.getKbCount?.() ?? 0;
  const debugInfo = {
    ok: true,
    port: PORT,
    kbCount: kbCount,
    kbLoaded: kbCount > 0,
    nodeEnv: process.env.NODE_ENV || 'development',
    cwd: process.cwd(),
    __dirname: __dirname,
    version: '2.2'
  };
  res.json(debugInfo);
});

// Force KB reload endpoint for debugging
app.post('/health/reload-kb', (req, res) => {
  console.log('🔄 Manual KB reload triggered...');
  knowledgeBase.trainKnowledgeBase();
  const kbCount = knowledgeBase.getKbCount?.() ?? 0;
  res.json({ success: true, kbCount, message: `KB reloaded: ${kbCount} Q&A pairs` });
});

app.get('/api/messages/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    if (!conversationId || !UUID_RE.test(conversationId)) return res.json([]);
    const messages = await supabaseService.getMessages(conversationId, 50);
    return res.json(messages || []);
  } catch {
    return res.json([]);
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { conversationId, message, userId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (isTamil(message)) {
      return res.json({
        answer: 'Please ask your question in English. I can respond in English only.',
        confidence: 1.0,
        route: 'english_only',
        showContactCard: false,
        conversationId
      });
    }

    // Safe conversation id
    let convId = conversationId;
    if (convId && !UUID_RE.test(convId)) convId = null;

    if (!convId) {
      const conversation = await supabaseService.createConversation(userId || 'anonymous');
      convId = conversation.id;
    }

    // Save user message
    const userMsgRow = await supabaseService.saveMessage(convId, 'user', message);

    // Step 1: Use LLM to understand intent and normalize the question
    // This helps with spelling mistakes, grammatical errors, and intent understanding
    let normalizedQuestion = message;
    let llmUsedForNormalization = false;

    try {
      const normalizationPrompt = `You are a question normalizer. Your job is to understand the user's question and rephrase it in a clear, standard form. Do not answer the question, just return the normalized/clarified version of the question.

User question: "${message}"

Return only the normalized question, nothing else:`;

      // Create a timeout wrapper for LLM call
      const llmTimeoutMs = 3000; // 3 second max timeout for normalization
      const llmPromise = llmService.chat(
        [{ role: 'user', content: normalizationPrompt }],
        ''
      );

      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: false, message: '', error: 'LLM_TIMEOUT' });
        }, llmTimeoutMs);
      });

      const normResponse = await Promise.race([llmPromise, timeoutPromise]);

      if (normResponse.success && normResponse.message) {
        normalizedQuestion = (normResponse.message || '').trim();
        llmUsedForNormalization = true;
        console.log(`📝 Question normalized: "${message}" → "${normalizedQuestion}"`);
      } else {
        console.log(`⚠️ LLM normalization skipped (${normResponse.error || 'failed'}), using original question`);
      }
    } catch (e) {
      // If LLM fails for normalization, use original question
      console.log('⚠️ LLM normalization exception:', e.message, '- using original question');
    }

    // Step 2: Search KB with both original and normalized questions
    const KB_THRESHOLD = Number(process.env.KB_THRESHOLD || 0.12);
    const EFFECTIVE_KB_THRESHOLD = Math.max(KB_THRESHOLD, 0.12);
    
    let kbResult = knowledgeBase.getBestAnswer?.(normalizedQuestion);
    
    // If normalized search doesn't work well, try original question
    if (!kbResult || (kbResult.confidence ?? 0) < EFFECTIVE_KB_THRESHOLD) {
      kbResult = knowledgeBase.getBestAnswer?.(message);
    }

    // Step 3: Return ONLY KB answer, never LLM-generated content
    // If KB has a good match, return it
    if (kbResult?.answer && (kbResult.confidence ?? 0) >= EFFECTIVE_KB_THRESHOLD) {
      const botMsgRow = await supabaseService.saveMessage(convId, 'bot', kbResult.answer);

      return res.json({
        answer: kbResult.answer,
        confidence: kbResult.confidence ?? 0.8,
        route: 'kb',
        showContactCard: false, // Never auto-show contact card
        conversationId: convId,
        userMessageId: userMsgRow?.id,
        botMessageId: botMsgRow?.id,
        llmUsed: 'normalization_only',
        llmError: null
      });
    }

    // Step 4: KB not found - Check if should use LLM with system prompt as fallback
    // This only happens if KB count is 0 (KB failed to load)
    const kbCount = knowledgeBase.getKbCount?.() ?? 0;
    const shouldUseLLMFallback = kbCount === 0; // Only if KB completely failed
    
    if (shouldUseLLMFallback) {
      // Use LLM with detailed system prompt containing KB knowledge
      const systemPrompt = `You are Aitel's intelligent AI customer support assistant. You must provide helpful, accurate responses based on the following knowledge about Aitel AI Agent Platform:

AITEL PLATFORM KNOWLEDGE:
1. Login: Users must select client portal, enter mobile number, receive OTP, enter OTP to log in
2. Call History: Access via Dashboard → Call History to view all call records  
3. Making Calls: Dashboard → Make a Call → "Initiate a Manual Call" → choose agent → enter destination number → make call
4. Campaigns: Dashboard → Campaigns → "Create Campaign" → upload CSV with mobile numbers → create campaign
5. Agents: Dashboard → My Agents to view all agents and their details
6. Analytics: Dashboard → Campaigns → Analytics for campaign and AI analytics

IMPORTANT RULES:
- Only answer questions about Aitel platform features listed above
- Be concise and professional
- If asked about features not listed above, say: "I don't have information about that. Please contact our support team."
- Do not make up or assume features not mentioned above
- Guide users to relevant dashboard sections

User Question: "${message}"

Provide a helpful, accurate response:`;

      try {
        const llmPromise = llmService.chat(
          [{ role: 'user', content: systemPrompt }],
          ''
        );

        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => {
            resolve({ success: false, message: '', error: 'LLM_TIMEOUT' });
          }, 5000); // 5 second timeout for fallback LLM
        });

        const llmResponse = await Promise.race([llmPromise, timeoutPromise]);

        if (llmResponse.success && llmResponse.message) {
          const answer = (llmResponse.message || '').trim();
          const botMsgRow = await supabaseService.saveMessage(convId, 'bot', answer);

          return res.json({
            answer: answer,
            confidence: 0.7,
            route: 'llm_fallback',
            showContactCard: false,
            conversationId: convId,
            userMessageId: userMsgRow?.id,
            botMessageId: botMsgRow?.id,
            llmUsed: 'fallback_system_prompt'
          });
        }
      } catch (e) {
        console.error('LLM fallback error:', e.message);
      }
    }

    // Fallback response if both KB and LLM fail
    const noAnswerMessage = 'I don\'t have information about that. Please contact our support team for assistance.';
    const botMsgRow = await supabaseService.saveMessage(convId, 'bot', noAnswerMessage);

    return res.json({
      answer: noAnswerMessage,
      confidence: 0.0,
      route: 'contact_suggested',
      showContactCard: false, // User can click contact button manually
      conversationId: convId,
      userMessageId: userMsgRow?.id,
      botMessageId: botMsgRow?.id,
      llmUsed: 'normalization_only',
      llmError: null
    });
  } catch (error) {
    console.error('❌ /api/chat error:', error.message);
    return res.json({
      answer: 'I apologize, but I encountered an error. Please try again.',
      confidence: 0.0,
      route: 'error',
      showContactCard: false
    });
  }
});

// ✅ NEW: Contact form submission route
app.post('/api/contact', async (req, res) => {
  try {
    const {
      conversationId,
      department,
      name,
      phone,
      email,
      companyName,
      budgetRange,
      productModule,
      message
    } = req.body || {};

    // Validation
    if (!conversationId || !UUID_RE.test(String(conversationId))) {
      return res.status(400).json({ success: false, message: 'Invalid conversationId' });
    }
    if (department !== 'sales_marketing' && department !== 'engineers') {
      return res.status(400).json({ success: false, message: 'Invalid department' });
    }
    if (!name || !String(name).trim() || !phone || !String(phone).trim() || !message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: 'Name, phone, and message are required' });
    }

    // Save contact request
    const contactRow = await supabaseService.createContactRequest(conversationId, department, {
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: email ? String(email).trim() : null,
      companyName: companyName ? String(companyName).trim() : null,
      budgetRange: budgetRange ? String(budgetRange).trim() : null,
      productModule: productModule ? String(productModule).trim() : null,
      message: String(message).trim()
    });

    // Add confirmation into chat
    const confirmText = `✅ Request submitted to ${department === 'sales_marketing' ? 'Sales Team' : 'Prompt Engineers'}. We'll reach you soon.`;
    await supabaseService.saveMessage(conversationId, 'bot', confirmText, 'system');

    return res.json({
      success: true,
      message: 'Submitted successfully.',
      contactRequestId: contactRow?.id || null
    });
  } catch (error) {
    console.error('❌ /api/contact error:', error?.message || error);
    return res.status(500).json({ success: false, message: 'Server error while submitting.' });
  }
});

// ✅ Team Dashboard: Get contact requests for a department
app.get('/api/team/requests/:department', async (req, res) => {
  try {
    const { department } = req.params;
    if (department !== 'sales_marketing' && department !== 'engineers') {
      return res.status(400).json({ error: 'Invalid department' });
    }

    const requests = await supabaseService.getContactRequests(department);
    return res.json(requests || []);
  } catch (error) {
    console.error('❌ /api/team/requests error:', error?.message || error);
    return res.status(500).json({ error: 'Server error fetching requests' });
  }
});

// ✅ Team Dashboard: Submit team reply to client
app.post('/api/team/reply', async (req, res) => {
  try {
    const { conversationId, message, department } = req.body || {};

    if (!conversationId || !UUID_RE.test(String(conversationId))) {
      return res.status(400).json({ success: false, message: 'Invalid conversationId' });
    }
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    if (department !== 'sales_marketing' && department !== 'engineers') {
      return res.status(400).json({ success: false, message: 'Invalid department' });
    }

    // Save team reply as bot message
    const teamName = department === 'sales_marketing' ? 'Sales Team' : 'Prompt Engineers';
    const replyText = `📧 **${teamName} Reply:**\n\n${String(message).trim()}`;

    const botMsgRow = await supabaseService.saveMessage(conversationId, 'bot', replyText);

    return res.json({
      success: true,
      message: 'Reply sent to client.',
      botMessageId: botMsgRow?.id || null
    });
  } catch (error) {
    console.error('❌ /api/team/reply error:', error?.message || error);
    return res.status(500).json({ success: false, message: 'Server error sending reply.' });
  }
});

app.listen(PORT, () => console.log(`✅ Backend running: http://localhost:${PORT}`));
