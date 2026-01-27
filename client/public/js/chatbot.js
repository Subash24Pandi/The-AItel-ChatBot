// Configuration
const STORAGE_KEY = 'aitel_chat_session';

class AitelChatbot {
  constructor() {
    this.conversationId = null;
    this.userId = this.generateUserId();
    this.isOpen = false;
    this.isLoading = false;

    // Prevent duplicate message rendering during polling
    this.seenMessageIds = new Set();
    this.pollTimer = null;

    // API base (useful if client runs on different port)
    // Example: window.AITEL_API_BASE = 'http://localhost:3000'
    this.apiBase = (window.AITEL_API_BASE || '').replace(/\/$/, '');

    this.init();
  }

  apiUrl(path) {
    if (!path) return this.apiBase || '';
    if (!path.startsWith('/')) path = '/' + path;
    return (this.apiBase || '') + path;
  }

  generateUserId() {
    let userId = localStorage.getItem('aitel_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('aitel_user_id', userId);
    }
    return userId;
  }

  init() {
    this.setupDOM();
    this.setupEventListeners();
    this.loadOrCreateSession();
  }

  setupDOM() {
    if (!document.querySelector('.logo-button')) {
      const html = `
        <button class="logo-button" id="logoBtn" aria-label="Open Aitel Chat">
          <img src="/logo.svg" alt="Aitel" style="width: 100%; height: 100%;" />
        </button>

        <div class="chat-drawer" id="chatDrawer" aria-hidden="true">
          <div class="chat-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="/logo.svg" alt="Aitel" style="width: 30px; height: 30px;" />
              <h2>Aitel Assistant</h2>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              <button class="header-btn" id="newChatBtn" title="New chat">↻</button>
              <button class="close-btn" id="closeBtn" title="Close">✕</button>
            </div>
          </div>

          <div class="chat-messages" id="chatMessages"></div>

          <div class="quick-replies" id="quickReplies"></div>

          <div class="chat-input-container">
            <div class="input-group">
              <input
                type="text"
                id="messageInput"
                placeholder="Type your message..."
                autocomplete="off"
              />
              <button class="send-btn" id="sendBtn" title="Send">➤</button>
            </div>
          </div>
        </div>

        <div class="modal-overlay" id="modalOverlay" aria-hidden="true">
          <div class="contact-card" id="contactCard"></div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', html);
    }
  }

  setupEventListeners() {
    const logoBtn = document.getElementById('logoBtn');
    const closeBtn = document.getElementById('closeBtn');
    const newChatBtn = document.getElementById('newChatBtn');
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');
    const modalOverlay = document.getElementById('modalOverlay');

    if (logoBtn) logoBtn.addEventListener('click', () => this.toggleChat());
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeChat());
    if (newChatBtn) newChatBtn.addEventListener('click', () => this.resetChat());

    if (sendBtn) sendBtn.addEventListener('click', () => this.sendMessage());

    if (messageInput) {
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      messageInput.addEventListener('input', (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
      });
    }

    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) this.closeModal();
      });
    }
  }

  toggleChat() {
    if (this.isOpen) this.closeChat();
    else this.openChat();
  }

  openChat() {
    this.isOpen = true;

    const drawer = document.getElementById('chatDrawer');
    const logoBtn = document.getElementById('logoBtn');
    const input = document.getElementById('messageInput');

    if (drawer) {
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
    }
    if (logoBtn) logoBtn.classList.add('active');
    if (input) input.focus();

    if (this.conversationId) {
      this.loadMessages(true);
      this.startPolling();
    } else {
      this.renderEmptyState();
    }
  }

  closeChat() {
    this.isOpen = false;

    const drawer = document.getElementById('chatDrawer');
    const logoBtn = document.getElementById('logoBtn');

    if (drawer) {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
    }
    if (logoBtn) logoBtn.classList.remove('active');

    this.stopPolling();
    this.closeModal();
  }

  loadOrCreateSession() {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

    const looksLikeUuid = (id) =>
      typeof id === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    this.conversationId = looksLikeUuid(session.conversationId) ? session.conversationId : null;
  }

  saveSession() {
    const session = {
      conversationId: this.conversationId,
      userId: this.userId,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  resetChat() {
    this.conversationId = null;
    this.seenMessageIds.clear();
    localStorage.removeItem(STORAGE_KEY);

    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) messagesContainer.innerHTML = '';

    this.renderEmptyState();
  }

  renderEmptyState() {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    if (!messagesContainer.children.length) {
      this.displayMessage("Hello! I'm Aitel's AI assistant. How can I help you today?", 'bot');
      this.showQuickReplies();
    }
  }

  startPolling() {
    this.stopPolling();
    this.pollTimer = setInterval(() => {
      if (this.isOpen && this.conversationId && !this.isLoading) {
        this.loadMessages(false);
      }
    }, 4000);
  }

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  async sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = (messageInput?.value || '').trim();

    if (!message || this.isLoading) return;

    messageInput.value = '';
    messageInput.style.height = 'auto';

    // user message UI immediately
    this.displayMessage(message, 'user');

    this.showTypingIndicator();
    this.isLoading = true;

    try {
      const response = await fetch(this.apiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: this.conversationId,
          message,
          userId: this.userId
        })
      });

      // Safe JSON parse
      let data = null;
      try {
        data = await response.json();
      } catch {
        data = { error: 'Invalid response from server' };
      }

      this.hideTypingIndicator();

      if (!response.ok) {
        const errText = data?.error || data?.message || `Server error (${response.status})`;
        this.displayMessage(`Sorry, I couldn't process that. (${errText})`, 'bot');
        return;
      }

      // Save conversation ID from server if it's the first message
      if (data?.conversationId && !this.conversationId) {
        this.conversationId = data.conversationId;
        this.saveSession();
        this.startPolling();
      }

      // Mark userMessageId as seen (we already rendered user message)
      if (data?.userMessageId) this.seenMessageIds.add(String(data.userMessageId));

      // Debug for LLM
      if (data?.llmError) {
        console.warn('[AitelChatbot] LLM error:', data.llmError, 'used:', data.llmUsed);
      }

      // Always display bot answer when returned from /api/chat
      if (data?.answer) {
        this.displayMessage(data.answer, 'bot');
        if (data?.botMessageId) this.seenMessageIds.add(String(data.botMessageId));
      } else {
        this.displayMessage('Sorry, I did not receive an answer from the server.', 'bot');
      }

      // Contact popups
      if (data?.showContactCard) {
        const dept = this.normalizeDepartment(data.route);
        if (dept) this.showContactCard(dept);
      }

      this.showQuickReplies();
    } catch (error) {
      console.error('Error:', error);
      this.hideTypingIndicator();
      this.displayMessage('Sorry, something went wrong. Please try again.', 'bot');
    } finally {
      this.isLoading = false;
      messageInput?.focus();
    }
  }

  normalizeDepartment(route) {
    if (route === 'sales_marketing') return 'sales_marketing';
    if (route === 'engineers') return 'engineers';
    return null;
  }

  displayMessage(text, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');

    // Map team -> bot visual style
    const uiSender = sender === 'team' ? 'bot' : sender;
    messageDiv.className = `message ${uiSender}`;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;
    // (Copy button removed)

    messageDiv.appendChild(bubble);

    if (sender !== 'system') {
      const timeDiv = document.createElement('div');
      timeDiv.className = 'message-time';
      timeDiv.textContent = timeStr;
      messageDiv.appendChild(timeDiv);
    }

    messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    if (document.querySelector('.typing-message')) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot typing-message';
    typingDiv.innerHTML = `
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    messagesContainer.appendChild(typingDiv);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const typingMessage = document.querySelector('.typing-message');
    if (typingMessage) typingMessage.remove();
  }

  showQuickReplies() {
    const quickReplies = [
      'How do I log in?',
      'Where can I see my agents?',
      'How do I check my call history?',
      'I want pricing / package details'
    ];

    const quickRepliesContainer = document.getElementById('quickReplies');
    if (!quickRepliesContainer) return;

    quickRepliesContainer.innerHTML = '';

    quickReplies.forEach((reply) => {
      const btn = document.createElement('button');
      btn.className = 'quick-reply-btn';
      btn.type = 'button';
      btn.textContent = reply;
      btn.addEventListener('click', () => {
        const input = document.getElementById('messageInput');
        if (input) input.value = reply;
        this.sendMessage();
      });
      quickRepliesContainer.appendChild(btn);
    });
  }

  async loadMessages(clearBefore = false) {
    if (!this.conversationId) return;

    try {
      const response = await fetch(this.apiUrl(`/api/messages/${this.conversationId}`));
      if (!response.ok) return;

      const messages = await response.json();
      if (!Array.isArray(messages)) return;

      const messagesContainer = document.getElementById('chatMessages');
      if (!messagesContainer) return;

      if (clearBefore) {
        messagesContainer.innerHTML = '';
        this.seenMessageIds.clear();
      }

      if (!messages.length && clearBefore) {
        this.renderEmptyState();
        return;
      }

      for (const msg of messages) {
        if (msg.sender === 'system') continue;

        const key = msg.id || `${msg.created_at || ''}_${msg.sender || ''}_${msg.text || ''}`;
        if (this.seenMessageIds.has(key)) continue;

        this.seenMessageIds.add(key);
        this.displayMessage(msg.text, msg.sender);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  showContactCard(department) {
    const modal = document.getElementById('modalOverlay');
    const card = document.getElementById('contactCard');

    const departmentInfo = {
      sales_marketing: {
        title: 'Contact The Aitel Sales Team',
        description: 'Share your requirements. Our sales team will reach you with pricing and package details.',
        fields: ['name', 'phone', 'email', 'company', 'budget', 'message'],
        submitLabel: 'Submit to Sales Team'
      },
      engineers: {
        title: 'Contact The Aitel Prompt Engineers Team',
        description: 'Share your technical or prompt-related issue. Our prompt engineers will help you.',
        fields: ['name', 'phone', 'email', 'module', 'message'],
        submitLabel: 'Submit to Prompt Engineers'
      }
    };

    const info = departmentInfo[department];
    if (!info || !modal || !card) return;

    let formHTML = `
      <h3>${info.title}</h3>
      <p class="card-description">${info.description}</p>
      <form id="contactForm">
    `;

    if (info.fields.includes('name')) {
      formHTML += `
        <div class="form-group">
          <label>Name *</label>
          <input type="text" name="name" required />
        </div>
      `;
    }

    if (info.fields.includes('phone')) {
      formHTML += `
        <div class="form-group">
          <label>Phone Number *</label>
          <input type="tel" name="phone" required />
        </div>
      `;
    }

    if (info.fields.includes('email')) {
      formHTML += `
        <div class="form-group">
          <label>Email</label>
          <input type="email" name="email" />
        </div>
      `;
    }

    if (info.fields.includes('company')) {
      formHTML += `
        <div class="form-group">
          <label>Company Name</label>
          <input type="text" name="company" />
        </div>
      `;
    }

    if (info.fields.includes('budget')) {
      formHTML += `
        <div class="form-group">
          <label>Budget Range</label>
          <select name="budget">
            <option value="">Select budget range</option>
            <option value="<10k">&lt;₹10,000</option>
            <option value="10k-50k">₹10,000 - ₹50,000</option>
            <option value="50k-100k">₹50,000 - ₹1,00,000</option>
            <option value=">100k">&gt;₹1,00,000</option>
          </select>
        </div>
      `;
    }

    if (info.fields.includes('module')) {
      formHTML += `
        <div class="form-group">
          <label>Topic</label>
          <select name="module">
            <option value="">Select topic</option>
            <option value="prompting">Prompting / Agent setup</option>
            <option value="api">API Integration</option>
            <option value="dashboard">Dashboard</option>
            <option value="calling">Calling Service</option>
            <option value="campaigns">Campaigns</option>
            <option value="other">Other</option>
          </select>
        </div>
      `;
    }

    if (info.fields.includes('message')) {
      formHTML += `
        <div class="form-group">
          <label>Message / Details *</label>
          <textarea name="message" required placeholder="Please describe your request..."></textarea>
        </div>
      `;
    }

    formHTML += `
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" id="modalCancelBtn">Cancel</button>
        <button type="submit" class="btn btn-primary">${info.submitLabel}</button>
      </div>
      </form>
    `;

    card.innerHTML = formHTML;

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');

    const cancelBtn = document.getElementById('modalCancelBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeModal());

    const form = document.getElementById('contactForm');
    if (form) form.addEventListener('submit', (e) => this.submitContactForm(e, department));
  }

  async submitContactForm(e, department) {
    e.preventDefault();

    if (!this.conversationId) {
      this.displayMessage('Please send one message in chat first, then submit your details.', 'bot');
      this.closeModal();
      return;
    }

    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
      const response = await fetch(this.apiUrl('/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: this.conversationId,
          department,
          name: data.name,
          phone: data.phone,
          email: data.email,
          companyName: data.company,
          budgetRange: data.budget,
          productModule: data.module,
          message: data.message
        })
      });

      let result = null;
      try {
        result = await response.json();
      } catch {
        result = { success: false };
      }

      if (response.ok && result && result.success) {
        this.closeModal();
        this.showToast(result.message || 'Submitted successfully', 'success');
        this.displayMessage(
          `Submitted to ${department === 'sales_marketing' ? 'Sales Team' : 'Prompt Engineers'}. Please wait for their reply here.`,
          'bot'
        );
        this.startPolling();
      } else {
        const msg =
          (result && (result.message || result.error)) ||
          `Submit failed (HTTP ${response.status})`;
        this.showToast(msg, 'error');
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      this.showToast('Error submitting request. Please try again.', 'error');
    }
  }

  closeModal() {
    const modal = document.getElementById('modalOverlay');
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 0);
  }
}

// Initialize chatbot when DOM is ready
let chatbot;
document.addEventListener('DOMContentLoaded', () => {
  chatbot = new AitelChatbot();
});
