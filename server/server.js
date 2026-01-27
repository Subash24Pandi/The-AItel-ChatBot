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
try {
  if (typeof knowledgeBase.trainKnowledgeBase === 'function') {
    knowledgeBase.trainKnowledgeBase();
    console.log(`📚 KB Loaded at startup: ${knowledgeBase.getKbCount?.() ?? 0}`);
  }
} catch (e) {
  console.log('❌ KB training failed:', e.message);
}

app.use(cors());
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
  res.json({ ok: true, port: PORT, kbCount: knowledgeBase.getKbCount?.() ?? 0 });
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

    // Intent decide (sales / engineers / aitelsupport)
    const intent = knowledgeBase.classifyIntent?.(message) || 'aitelsupport';

    // Popup rules
    const popupByIntent =
      intent === 'sales_marketing' ? 'sales_marketing' :
      intent === 'engineers' ? 'engineers' :
      null;

    const KB_THRESHOLD = Number(process.env.KB_THRESHOLD || 0.22);
    // Safety floor to reduce false KB matches without changing .env
    const EFFECTIVE_KB_THRESHOLD = Math.max(KB_THRESHOLD, 0.32);
    const kbResult = knowledgeBase.getBestAnswer?.(message);

    // Guard: if user asks delete/remove/clear and KB answer doesn't mention it, skip KB.
    const deletionQuery = hasDeletionIntent(message);
    const kbLooksWrongForDelete =
      deletionQuery &&
      kbResult?.answer &&
      !/delete|remove|clear|erase|reset|purge/i.test(kbResult.answer);

    // KB answer
    if (
      kbResult?.answer &&
      (kbResult.confidence ?? 0) >= EFFECTIVE_KB_THRESHOLD &&
      !kbLooksWrongForDelete
    ) {
      const botMsgRow = await supabaseService.saveMessage(convId, 'bot', kbResult.answer);
      const route = popupByIntent ? popupByIntent : 'kb';

      return res.json({
        answer: kbResult.answer,
        confidence: kbResult.confidence ?? 0.8,
        route,
        showContactCard: shouldShowContact(route),
        conversationId: convId,
        userMessageId: userMsgRow?.id,
        botMessageId: botMsgRow?.id,
        llmUsed: null,
        llmError: null
      });
    }

    // Build KB context for LLM
    let context = '';
    const chunks = knowledgeBase.retrieve?.(message, 3);
    if (Array.isArray(chunks) && chunks.length) context = chunks.join('\n\n---\n\n');

    // Build history
    // NOTE: To avoid "wrong answer drift" from earlier assistant messages, we only send the current user question.
    // (Your conversation is still stored in Supabase; this is only the LLM request context.)
    const messages = [{ role: 'user', content: message }];

    // Call LLM
    const llmResponse = await llmService.chat(messages, context);

    // LLM fail -> show popup
    if (!llmResponse.success) {
      const fallback = contactFallback();
      const botMsgRow = await supabaseService.saveMessage(convId, 'bot', fallback);

      const route = popupByIntent ? popupByIntent : 'engineers';

      return res.json({
        answer: fallback,
        confidence: 0.2,
        route,
        showContactCard: shouldShowContact(route),
        conversationId: convId,
        userMessageId: userMsgRow?.id,
        botMessageId: botMsgRow?.id,
        llmUsed: llmResponse?.used || null,
        llmError: llmResponse?.error || 'LLM_FAILED'
      });
    }

    // LLM success
    const botAnswer = (llmResponse.message || '').trim() || contactFallback();
    const confidence = llmService.checkConfidence(botAnswer);
    const botMsgRow = await supabaseService.saveMessage(convId, 'bot', botAnswer);

    let route = 'llm';
    if (popupByIntent) route = popupByIntent;
    else if (confidence < 0.4 || botAnswer === contactFallback()) route = 'engineers';

    return res.json({
      answer: botAnswer,
      confidence,
      route,
      showContactCard: shouldShowContact(route),
      conversationId: convId,
      userMessageId: userMsgRow?.id,
      botMessageId: botMsgRow?.id,
      llmUsed: llmResponse?.used || null,
      llmError: null
    });
  } catch (error) {
    console.error('❌ /api/chat error:', error.message);
    return res.json({
      answer: 'I apologize, but I encountered an error. Please try again.',
      confidence: 0.3,
      route: 'engineers',
      showContactCard: true
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
