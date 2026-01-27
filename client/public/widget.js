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

  // Anu Chatbot Icon - Simple Purple Circle with Text
  const ANU_ICON = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%236366f1"/%3E%3Ctext x="50" y="65" font-size="40" font-weight="bold" fill="white" text-anchor="middle" font-family="Arial, sans-serif"%3EAnu%3C/text%3E%3C/svg%3E';

  const CONFIG = {
    default: {
      API_URL: getAPIURL(),
      NAME: 'Anu',
      ICON: ANU_ICON
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
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border: none;
          cursor: pointer;
          box-shadow: 0 6px 28px rgba(99, 102, 241, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9998;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          padding: 0;
          overflow: hidden;
          position: relative;
        }

        .aitel-widget-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2), transparent);
          border-radius: 50%;
        }

        /* Floating chat icon inside button */
        .aitel-widget-btn::after {
          content: '';
          position: absolute;
          width: 28px;
          height: 24px;
          background: white;
          border-radius: 6px;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
          z-index: 1;
        }

        .aitel-widget-btn:hover {
          transform: scale(1.12);
          box-shadow: 0 8px 35px rgba(99, 102, 241, 0.55);
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
          border-radius: 18px;
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.18);
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
          display: none;
        }

        .aitel-floating-icon {
          width: 60px;
          height: 60px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: float 3s ease-in-out infinite;
          margin-bottom: 12px;
        }

        .aitel-floating-icon::before {
          content: '';
          position: absolute;
          width: 35px;
          height: 30px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
        }

        .aitel-floating-icon::after {
          content: '';
          position: absolute;
          width: 28px;
          height: 22px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 6px;
          z-index: 1;
          clip-path: polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%);
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .aitel-widget-header-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          z-index: 1;
        }

        .aitel-widget-header h3 {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.3px;
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
        }

        .aitel-widget-header-subtitle {
          margin: 0;
          font-size: 13px;
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
          padding: 18px;
          background: linear-gradient(180deg, #fafbfc 0%, #f5f7fa 100%);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .aitel-widget-message-bubble {
          padding: 12px 15px;
          border-radius: 14px;
          font-size: 13px;
          line-height: 1.6;
          word-wrap: break-word;
          max-width: 85%;
          animation: slideIn 0.3s ease;
          font-weight: 500;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .aitel-widget-bot-message {
          background: white;
          color: #1f2937;
          border: 1px solid #e5e7eb;
          align-self: flex-start;
          margin-left: 0;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
        }

        .aitel-widget-user-message {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          align-self: flex-end;
          margin-right: 0;
          box-shadow: 0 3px 10px rgba(99, 102, 241, 0.35);
        }



        /* ===== INPUT AREA ===== */
        .aitel-widget-input-box {
          display: flex;
          gap: 12px;
          padding: 16px;
          border-top: 1px solid #f0f0f0;
          background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
          flex-shrink: 0;
          border-radius: 0 0 16px 16px;
        }

        .aitel-widget-input {
          flex: 1;
          padding: 12px 16px;
          border: 1.5px solid #e5e7eb;
          border-radius: 11px;
          font-size: 13px;
          font-family: inherit;
          resize: none;
          max-height: 60px;
          transition: all 0.2s;
          background: white;
        }

        .aitel-widget-input::placeholder {
          color: #a1a5b0;
        }

        .aitel-widget-input:focus {
          outline: none;
          border-color: #6366f1;
          background: white;
          box-shadow: 0 0 0 3.5px rgba(99, 102, 241, 0.12);
        }

        .aitel-widget-send-btn {
          padding: 12px 18px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 11px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 48px;
          height: 48px;
          font-weight: 700;
          box-shadow: 0 3px 12px rgba(99, 102, 241, 0.35);
        }

        .aitel-widget-send-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 18px rgba(99, 102, 241, 0.45);
        }

        .aitel-widget-send-btn:active {
          transform: translateY(-1px);
        }

        .aitel-widget-send-btn:disabled {
          background: #d1d5db;
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
          background: rgba(0, 0, 0, 0.6);
          z-index: 10000;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
        }

        .aitel-widget-modal-overlay[style*="display: flex"] {
          display: flex;
        }

        .aitel-widget-modal {
          background: white;
          border-radius: 12px;
          padding: 28px;
          max-width: 420px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: modalSlideIn 0.3s ease;
          max-height: 90vh;
          overflow-y: auto;
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

        .aitel-widget-modal h2 {
          margin: 0 0 12px 0;
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

        .aitel-contact-form {
          max-height: 400px;
          overflow-y: auto;
        }

        .aitel-contact-form h2 {
          margin: 0 0 8px 0;
          font-size: 18px;
          color: #6366f1;
        }

        .aitel-contact-form textarea {
          resize: vertical;
          min-height: 80px;
        }

        .aitel-contact-form button {
          width: 100%;
          margin-top: 8px;
        }

        .aitel-contact-form button[type="submit"] {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s;
          padding: 11px;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        .aitel-contact-form button[type="submit"]:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }

        .aitel-contact-form .close-form {
          background: #e5e5e5;
          color: #333;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s;
          padding: 11px;
        }

        .aitel-contact-form .close-form:hover {
          background: #d5d5d5;
          transform: translateY(-2px);
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
        <button class="aitel-widget-btn" id="aitelWidgetBtn" title="Chat with Anu"></button>

        <div class="aitel-widget-panel" id="aitelWidgetPanel">
          <div class="aitel-widget-header">
            <button class="aitel-widget-close" id="aitelWidgetCloseBtn">✕</button>
            <div class="aitel-widget-header-content">
              <div class="aitel-floating-icon"></div>
              <h3>${config.NAME}</h3>
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
        this.displayMessage("Hi! I'm Anu, your AI assistant. How can I help you today?", 'bot');
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
      bubble.id = `msg-${Date.now()}`;
      messagesContainer.appendChild(bubble);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      return bubble;
    }

    streamMessage(sender) {
      const messagesContainer = document.getElementById('aitelWidgetMessages');
      const bubble = document.createElement('div');
      bubble.className = `aitel-widget-message-bubble aitel-widget-${sender}-message`;
      bubble.id = `stream-msg-${Date.now()}`;
      bubble.textContent = '';
      messagesContainer.appendChild(bubble);
      return bubble;
    }

    appendToStream(bubble, text) {
      bubble.textContent += text;
      const messagesContainer = document.getElementById('aitelWidgetMessages');
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
          // Stream the response character by character
          const streamBubble = this.streamMessage('bot');
          const answer = data.answer;
          const delayPerChar = 5; // milliseconds per character (fast streaming)
          
          for (let i = 0; i < answer.length; i++) {
            await new Promise(resolve => {
              setTimeout(() => {
                this.appendToStream(streamBubble, answer.charAt(i));
                resolve();
              }, delayPerChar);
            });
          }
          
          if (data.conversationId && !this.conversationId) {
            this.conversationId = data.conversationId;
            this.saveSession();
          }
          
          // Trigger contact forms based on KB and content - STRICT MODE
          const messageText = message.toLowerCase();
          const answerText = data.answer.toLowerCase();
          
          // Only trigger for meaningful keywords (exclude simple greetings and KB responses)
          const isGreeting = ['hi', 'hello', 'hey', 'ok', 'okay', 'thanks', 'thank you', 'yes', 'no'].includes(messageText);
          const hasKBInfo = data.confidence > 0.5 && data.route !== 'llm_fallback';
          
          // ONLY show Sales popup if: user asked about pricing AND answer came from KB
          if (!isGreeting && !hasKBInfo && (messageText.includes('package') || messageText.includes('amount') || 
              messageText.includes('discount') || messageText.includes('price') || 
              messageText.includes('cost') || messageText.includes('pricing') ||
              messageText.includes('budget') || messageText.includes('plan'))) {
            setTimeout(() => this.showContactForm('sales'), 800);
          } 
          // ONLY show Engineer popup if: answer is clearly from LLM (outside KB) AND not a greeting
          else if (!isGreeting && data.route === 'llm_fallback' && data.confidence < 0.3) {
            setTimeout(() => this.showContactForm('engineers'), 800);
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
          const modal = document.getElementById('aitelWidgetModal');
          overlay.style.display = 'none';
          modal.innerHTML = '';
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
