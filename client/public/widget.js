// widget.js - Aitel Chatbot Widget Loader
(function() {
  const params = new URLSearchParams(document.currentScript.src.split('?')[1]);
  const appId = params.get('appId') || 'default';
  
  // API URL Configuration - Auto-detect environment
  const getAPIURL = () => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000'; // Local development
    }
    return 'https://server-three-black.vercel.app'; // Production Vercel
  };

  // AI Mate Chatbot Icon - Modern AI Assistant SVG
  const AI_MATE_ICON = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Cdefs%3E%3ClinearGradient id="iconGrad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%236366f1;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%238b5cf6;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="100" height="100" fill="white" rx="50"/%3E%3Ccircle cx="50" cy="50" r="48" fill="url(%23iconGrad)" opacity="0.1"/%3E%3Crect x="25" y="30" width="50" height="45" rx="6" fill="none" stroke="%236366f1" stroke-width="2.5"/%3E%3Ccircle cx="35" cy="40" r="3" fill="%236366f1"/%3E%3Ccircle cx="65" cy="40" r="3" fill="%236366f1"/%3E%3Cpath d="M 35 55 Q 50 62 65 55" stroke="%236366f1" stroke-width="2.5" fill="none" stroke-linecap="round"/%3E%3Cpath d="M 28 52 L 30 58 M 72 52 L 70 58" stroke="%238b5cf6" stroke-width="2" stroke-linecap="round"/%3E%3C/svg%3E';

  const CONFIG = {
    default: {
      API_URL: getAPIURL(),
      NAME: 'AI Mate',
      ICON: AI_MATE_ICON
    }
  };

  const config = CONFIG[appId] || CONFIG.default;

  class AitelWidget {
    constructor() {
      this.conversationId = null;
      this.userId = this.generateUserId();
      this.isOpen = false;
      this.isLoading = false;
      this.init();
    }

    generateUserId() {
      let userId = localStorage.getItem('aitel_widget_user_id');
      if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('aitel_widget_user_id', userId);
      }
      return userId;
    }

    init() {
      this.createDOM();
      this.attachEventListeners();
      this.loadSession();
    }

    createDOM() {
      const style = document.createElement('style');
      style.textContent = `
        /* ===== CHAT BUTTON ===== */
        .aitel-widget-btn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9998;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          padding: 0;
          overflow: hidden;
        }

        .aitel-widget-btn img {
          width: 80%;
          height: 80%;
          object-fit: contain;
        }

        .aitel-widget-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 30px rgba(99, 102, 241, 0.5);
        }

        .aitel-widget-btn.active {
          bottom: auto;
          top: 20px;
        }

        /* ===== CHAT PANEL ===== */
        .aitel-widget-panel {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 420px;
          height: 580px;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          display: none;
          flex-direction: column;
          z-index: 9999;
          opacity: 0;
          transform: scale(0.9) translateY(20px);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: none;
        }

        .aitel-widget-panel.open {
          display: flex;
          opacity: 1;
          transform: scale(1) translateY(0);
        }

        /* ===== HEADER ===== */
        .aitel-widget-header {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          padding: 20px;
          border-radius: 16px 16px 0 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-shrink: 0;
          border-bottom: none;
          position: relative;
        }

        .aitel-widget-header::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.1), transparent);
          border-radius: 16px 16px 0 0;
          pointer-events: none;
        }

        .aitel-widget-header-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }

        .aitel-widget-header-icon img {
          width: 32px;
          height: 32px;
          object-fit: contain;
        }

        .aitel-widget-header-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          z-index: 1;
        }

        .aitel-widget-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .aitel-widget-header-subtitle {
          margin: 0;
          font-size: 12px;
          font-weight: 500;
          opacity: 0.9;
          letter-spacing: 0.5px;
        }

        .aitel-widget-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          cursor: pointer;
          font-size: 24px;
          padding: 4px 8px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
          z-index: 2;
        }

        .aitel-widget-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        /* ===== MESSAGES ===== */
        .aitel-widget-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: linear-gradient(180deg, #f9fafb 0%, #f5f5f5 100%);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .aitel-widget-message-bubble {
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.5;
          word-wrap: break-word;
          max-width: 85%;
          animation: slideIn 0.3s ease;
          font-weight: 500;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .aitel-widget-bot-message {
          background: white;
          color: #1a1a1a;
          border: 1px solid #e5e5e5;
          align-self: flex-start;
          margin-left: 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .aitel-widget-user-message {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          align-self: flex-end;
          margin-right: 0;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        /* ===== INPUT AREA ===== */
        .aitel-widget-input-box {
          display: flex;
          gap: 10px;
          padding: 14px;
          border-top: 1px solid #e5e5e5;
          background: white;
          flex-shrink: 0;
          border-radius: 0 0 16px 16px;
        }

        .aitel-widget-input {
          flex: 1;
          padding: 11px 14px;
          border: 1.5px solid #e5e5e5;
          border-radius: 10px;
          font-size: 13px;
          font-family: inherit;
          resize: none;
          max-height: 60px;
          transition: all 0.2s;
          background: #fafafa;
        }

        .aitel-widget-input::placeholder {
          color: #999;
        }

        .aitel-widget-input:focus {
          outline: none;
          border-color: #6366f1;
          background: white;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .aitel-widget-send-btn {
          padding: 11px 16px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 44px;
          height: 44px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        .aitel-widget-send-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }

        .aitel-widget-send-btn:active {
          transform: translateY(0);
        }

        .aitel-widget-send-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* ===== MODAL ===== */
        .aitel-widget-modal-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 10000;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
        }

        .aitel-widget-modal {
          background: white;
          border-radius: 12px;
          padding: 28px;
          max-width: 420px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
          animation: modalSlideIn 0.3s ease;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .aitel-widget-modal h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          color: #6366f1;
          font-weight: 700;
        }

        .aitel-widget-modal p {
          margin: 0 0 18px 0;
          font-size: 13px;
          color: #666;
          line-height: 1.6;
        }

        .aitel-widget-modal form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .aitel-widget-modal input,
        .aitel-widget-modal textarea,
        .aitel-widget-modal select {
          padding: 11px 14px;
          border: 1.5px solid #e5e5e5;
          border-radius: 10px;
          font-size: 13px;
          font-family: inherit;
          transition: all 0.2s;
          background: #fafafa;
        }

        .aitel-widget-modal input:focus,
        .aitel-widget-modal textarea:focus,
        .aitel-widget-modal select:focus {
          outline: none;
          border-color: #6366f1;
          background: white;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .aitel-widget-modal button {
          padding: 11px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        .aitel-widget-modal button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }

        .aitel-widget-modal button:last-child {
          background: #e5e5e5;
          color: #333;
          box-shadow: none;
        }

        .aitel-widget-modal button:last-child:hover {
          background: #d5d5d5;
          transform: translateY(-2px);
        }

        /* ===== CONTACT FORM ===== */
        .aitel-contact-form {
          max-height: 400px;
          overflow-y: auto;
        }

        .aitel-contact-form h2 {
          margin: 0 0 8px 0;
          font-size: 16px;
          color: #1a3a5c;
        }

        .aitel-contact-form textarea {
          resize: vertical;
          min-height: 80px;
        }

        .aitel-contact-form button:last-child {
          background: #e0e0e0;
          color: #333;
        }

        .aitel-contact-form button:last-child:hover {
          background: #d0d0d0;
        }

        /* ===== SCROLLBAR ===== */
        .aitel-widget-messages::-webkit-scrollbar {
          width: 6px;
        }

        .aitel-widget-messages::-webkit-scrollbar-track {
          background: #f5f5f5;
          border-radius: 10px;
        }

        .aitel-widget-messages::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 10px;
        }

        .aitel-widget-messages::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #4f46e5 0%, #7c3aed 100%);
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 480px) {
          .aitel-widget-panel {
            width: calc(100vw - 20px);
            height: calc(100vh - 100px);
            right: 10px;
            bottom: 70px;
          }

          .aitel-widget-btn.active {
            bottom: auto;
            top: 10px;
          }

          .aitel-widget-message-bubble {
            max-width: 80%;
          }
        }
      `;
      document.head.appendChild(style);

      const html = `
        <button class="aitel-widget-btn" id="aitelWidgetBtn" title="Chat with AI Mate">
          <img src="${config.ICON}" alt="AI Mate" />
        </button>

        <div class="aitel-widget-panel" id="aitelWidgetPanel">
          <div class="aitel-widget-header">
            <button class="aitel-widget-close" id="aitelWidgetCloseBtn">✕</button>
            <div class="aitel-widget-header-icon">
              <img src="${config.ICON}" alt="AI Mate" />
            </div>
            <div class="aitel-widget-header-content">
              <h3>${config.NAME}</h3>
              <p class="aitel-widget-header-subtitle">Chat with our AI Mate</p>
            </div>
          </div>

          <div class="aitel-widget-messages" id="aitelWidgetMessages"></div>

          <div class="aitel-widget-input-box">
            <input
              type="text"
              id="aitelWidgetInput"
              class="aitel-widget-input"
              placeholder="Type your message..."
              autocomplete="off"
            />
            <button class="aitel-widget-send-btn" id="aitelWidgetSendBtn" title="Send">➤</button>
          </div>
        </div>

        <div class="aitel-widget-modal-overlay" id="aitelWidgetModalOverlay">
          <div class="aitel-widget-modal" id="aitelWidgetModal"></div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', html);
    }

    attachEventListeners() {
      const btn = document.getElementById('aitelWidgetBtn');
      const closeBtn = document.getElementById('aitelWidgetCloseBtn');
      const sendBtn = document.getElementById('aitelWidgetSendBtn');
      const input = document.getElementById('aitelWidgetInput');

      btn.addEventListener('click', () => this.togglePanel());
      closeBtn.addEventListener('click', () => this.closePanel());
      sendBtn.addEventListener('click', () => this.sendMessage());

      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    togglePanel() {
      if (this.isOpen) {
        this.closePanel();
      } else {
        this.openPanel();
      }
    }

    openPanel() {
      this.isOpen = true;
      document.getElementById('aitelWidgetBtn').classList.add('active');
      document.getElementById('aitelWidgetPanel').classList.add('open');
      document.getElementById('aitelWidgetInput').focus();
      this.showWelcome();
    }

    closePanel() {
      this.isOpen = false;
      document.getElementById('aitelWidgetBtn').classList.remove('active');
      document.getElementById('aitelWidgetPanel').classList.remove('open');
    }

    showWelcome() {
      const messages = document.getElementById('aitelWidgetMessages');
      if (messages.children.length === 0) {
        this.displayMessage("Hello! I'm AI Mate. How can I assist you today?", 'bot');
      }
    }

    loadSession() {
      const session = JSON.parse(localStorage.getItem('aitel_widget_session') || '{}');
      if (session.conversationId) {
        this.conversationId = session.conversationId;
      }
    }

    saveSession() {
      localStorage.setItem('aitel_widget_session', JSON.stringify({
        conversationId: this.conversationId,
        userId: this.userId,
        timestamp: new Date().toISOString()
      }));
    }

    displayMessage(text, sender) {
      const messagesContainer = document.getElementById('aitelWidgetMessages');
      const bubble = document.createElement('div');
      bubble.className = `aitel-widget-message-bubble aitel-widget-${sender}-message`;
      bubble.textContent = text;
      messagesContainer.appendChild(bubble);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async sendMessage() {
      const input = document.getElementById('aitelWidgetInput');
      const message = input.value.trim();

      if (!message || this.isLoading) return;

      this.displayMessage(message, 'user');
      input.value = '';
      input.focus();
      this.isLoading = true;

      try {
        const chatEndpoint = `${config.API_URL}/api/chat`;
        const response = await fetch(chatEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: this.conversationId,
            message,
            userId: this.userId
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.answer) {
          this.displayMessage(data.answer, 'bot');
          if (data.conversationId && !this.conversationId) {
            this.conversationId = data.conversationId;
            this.saveSession();
          }
          
          // Check if we should show a contact popup
          if (data.route === 'sales_marketing' && data.showContactCard !== false) {
            setTimeout(() => this.showContactForm('sales'), 500);
          } else if (data.route === 'engineers' && data.showContactCard !== false) {
            setTimeout(() => this.showContactForm('engineers'), 500);
          }
        } else {
          this.displayMessage('I apologize, but I encountered an issue. Please try again.', 'bot');
        }
      } catch (error) {
        console.error('Chat error:', error);
        this.displayMessage('Connection error. Please check your internet and try again.', 'bot');
      } finally {
        this.isLoading = false;
      }
    }

    showContactForm(department) {
      const overlay = document.getElementById('aitelWidgetModalOverlay');
      const modal = document.getElementById('aitelWidgetModal');

      const forms = {
        sales: `
          <h2>Connect with Sales</h2>
          <p>Tell us about your needs so our sales team can assist you.</p>
          <form class="aitel-contact-form" data-department="sales">
            <input type="text" placeholder="Your Name" required />
            <input type="email" placeholder="Email Address" required />
            <input type="tel" placeholder="Phone Number" required />
            <input type="text" placeholder="Company Name" required />
            <select required>
              <option value="">-- Select Budget Range --</option>
              <option value="under-5k">Under $5,000</option>
              <option value="5k-20k">$5,000 - $20,000</option>
              <option value="20k-100k">$20,000 - $100,000</option>
              <option value="above-100k">Above $100,000</option>
            </select>
            <textarea placeholder="Tell us about your needs..." required></textarea>
            <button type="submit">Send to Sales Team</button>
            <button type="button" class="close-form">Cancel</button>
          </form>
        `,
        engineers: `
          <h2>Connect with Engineers</h2>
          <p>Our technical team is ready to discuss your requirements.</p>
          <form class="aitel-contact-form" data-department="engineers">
            <input type="text" placeholder="Your Name" required />
            <input type="email" placeholder="Email Address" required />
            <input type="tel" placeholder="Phone Number" required />
            <input type="text" placeholder="Company Name" required />
            <select required>
              <option value="">-- Select Product Module --</option>
              <option value="agents">AI Agents</option>
              <option value="phone-numbers">Phone Numbers</option>
              <option value="call-history">Call History</option>
              <option value="campaigns">Campaigns</option>
              <option value="api">API Integration</option>
            </select>
            <textarea placeholder="Describe your technical requirements..." required></textarea>
            <button type="submit">Contact Engineering Team</button>
            <button type="button" class="close-form">Cancel</button>
          </form>
        `
      };

      modal.innerHTML = forms[department] || forms.sales;
      overlay.style.display = 'flex';

      // Attach form handlers
      const form = modal.querySelector('form');
      const closeBtn = modal.querySelector('.close-form');

      form.addEventListener('submit', (e) => this.handleContactForm(e, department));
      closeBtn.addEventListener('click', () => {
        overlay.style.display = 'none';
        modal.innerHTML = '';
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.style.display = 'none';
          modal.innerHTML = '';
        }
      });
    }

    async handleContactForm(e, department) {
      e.preventDefault();
      const form = e.target;
      const inputs = form.querySelectorAll('input, textarea, select');
      const formData = {
        department,
        conversationId: this.conversationId,
        name: inputs[0].value,
        email: inputs[1].value,
        phone: inputs[2].value,
        companyName: inputs[3].value
      };

      // Add department-specific fields
      if (department === 'sales') {
        formData.budgetRange = inputs[4].value;
        formData.message = inputs[5].value;
      } else if (department === 'engineers') {
        formData.productModule = inputs[4].value;
        formData.message = inputs[5].value;
      }

      try {
        const response = await fetch(`${config.API_URL}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (data.success) {
          const overlay = document.getElementById('aitelWidgetModalOverlay');
          overlay.style.display = 'none';
          overlay.getElementById('aitelWidgetModal').innerHTML = '';
          this.displayMessage(`Thanks! Our ${department} team will be in touch soon.`, 'bot');
        }
      } catch (error) {
        console.error('Contact form error:', error);
        this.displayMessage('Error submitting form. Please try again.', 'bot');
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new AitelWidget();
    });
  } else {
    new AitelWidget();
  }
})();
