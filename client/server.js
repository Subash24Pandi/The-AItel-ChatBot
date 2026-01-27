const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Client port (UI)
const PORT = process.env.CLIENT_PORT || 3001;

// Backend base URL
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3000';

// --- fetch compatibility (Node 18+ has global fetch; older needs node-fetch)
let fetchFn = global.fetch;
if (!fetchFn) {
  fetchFn = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
}

// Middleware
app.use(cors());
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// --------------------
// Static pages
// --------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/team/support', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'team-support.html'));
});

app.get('/team/sales', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'team-sales.html'));
});

app.get('/team/engineers', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'team-engineers.html'));
});

// --------------------
// PROXY ROUTES (Client -> Backend)
// Frontend calls these on port 3001.
// --------------------
async function proxyJson(req, res, url, options = {}) {
  try {
    const r = await fetchFn(url, options);
    const text = await r.text();
    try {
      return res.status(r.status).json(JSON.parse(text));
    } catch {
      return res.status(r.status).send(text);
    }
  } catch (e) {
    return res.status(502).json({ error: 'Backend not reachable', details: e.message });
  }
}

app.get('/api/backend-health', async (req, res) => {
  return proxyJson(req, res, `${BACKEND_URL}/health`);
});

app.post('/api/chat', async (req, res) => {
  return proxyJson(req, res, `${BACKEND_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body || {})
  });
});

app.post('/api/contact', async (req, res) => {
  return proxyJson(req, res, `${BACKEND_URL}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body || {})
  });
});

app.get('/api/messages/:conversationId', async (req, res) => {
  const { conversationId } = req.params;
  return proxyJson(req, res, `${BACKEND_URL}/api/messages/${conversationId}`);
});

// Team routes (dashboards)
app.get('/api/team/requests', async (req, res) => {
  const qs = new URLSearchParams(req.query || {}).toString();
  const url = `${BACKEND_URL}/api/team/requests${qs ? `?${qs}` : ''}`;
  return proxyJson(req, res, url);
});

app.post('/api/team/reply', async (req, res) => {
  return proxyJson(req, res, `${BACKEND_URL}/api/team/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body || {})
  });
});

app.get('/api/team/reply/:contactRequestId', async (req, res) => {
  const { contactRequestId } = req.params;
  return proxyJson(req, res, `${BACKEND_URL}/api/team/reply/${contactRequestId}`);
});

// Client health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Aitel Chatbot Client', port: PORT, backend: BACKEND_URL });
});

// Start client server
app.listen(PORT, () => {
  console.log(`🌐 Aitel Chatbot Client running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}`);
  console.log(`Proxying API to backend: ${BACKEND_URL}`);
});

module.exports = app;
