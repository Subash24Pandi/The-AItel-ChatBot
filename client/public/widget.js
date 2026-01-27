// widget.js - Aitel Chatbot Widget Loader
(function() {
  const params = new URLSearchParams(document.currentScript.src.split('?')[1]);
  const appId = params.get('appId') || 'default';
  
  // Auto-detect API URL based on current location
  const getAPIURL = () => {
    const currentDomain = window.location.origin;
    const storedURL = sessionStorage.getItem('aitel_api_url');
    
    if (storedURL) return storedURL;
    
    // Try /api/chat first (relative path)
    return currentDomain + '/api/chat';
  };

  const CONFIG = {
    default: {
      API_URL: getAPIURL(),
      NAME: 'Aitel Assistant',
      LOGO: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23667eea" rx="50"/%3E%3Ctext x="50" y="60" font-size="60" font-weight="bold" fill="white" text-anchor="middle"%3EA%3C/text%3E%3C/svg%3E'
    }
  };

  const config = CONFIG[appId] || CONFIG.default;

  class AitelWidget {
    constructor() {
      this.conversationId = null;
      this.userId = this.generateUserId();
      this.isOpen = false;
      this.isLoading = false;
      this.audience = 'client';
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
        .aitel-widget-btn {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: white;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          z-index: 9998;
          transition: all 0.3s ease;
          padding: 0;
          overflow: hidden;
        }

        .aitel-widget-btn img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .aitel-widget-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
        }

        .aitel-widget-btn.active {
          bottom: 380px;
        }

        .aitel-widget-panel {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 380px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
          display: none;
          flex-direction: column;
          z-index: 9999;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.3s ease;
        }

        .aitel-widget-panel.open {
          display: flex;
          opacity: 1;
          transform: translateY(0);
        }

        .aitel-widget-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px;
          border-radius: 12px 12px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .aitel-widget-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .aitel-widget-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 20px;
          padding: 0;
        }

        .aitel-widget-audience {
          padding: 12px 16px;
          border-bottom: 1px solid #eee;
        }

        .aitel-widget-audience label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #666;
          margin-bottom: 6px;
        }

        .aitel-widget-audience select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 13px;
          font-family: inherit;
        }

        .aitel-widget-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          background: #f9f9f9;
        }

        .aitel-widget-message {
          margin-bottom: 12px;
          display: flex;
          animation: slideIn 0.3s ease;
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

        .aitel-widget-message.user {
          justify-content: flex-end;
        }

        .aitel-widget-message-bubble {
          max-width: 70%;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.4;
          word-wrap: break-word;
        }

        .aitel-widget-message.bot .aitel-widget-message-bubble {
          background: white;
          color: #333;
          border: 1px solid #ddd;
        }

        .aitel-widget-message.user .aitel-widget-message-bubble {
          background: #667eea;
          color: white;
        }

        .aitel-widget-typing {
          display: flex;
          gap: 4px;
          padding: 10px 14px;
        }

        .aitel-widget-typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #999;
          animation: pulse 1.4s infinite;
        }

        .aitel-widget-typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .aitel-widget-typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes pulse {
          0%, 60%, 100% {
            opacity: 0.3;
          }
          30% {
            opacity: 1;
          }
        }

        .aitel-widget-input-box {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid #eee;
        }

        .aitel-widget-input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 13px;
          font-family: inherit;
          resize: none;
          max-height: 60px;
        }

        .aitel-widget-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .aitel-widget-send-btn {
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          width: 36px;
          height: 36px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transition: all 0.2s;
        }

        .aitel-widget-send-btn:hover {
          background: #5568d3;
        }

        .aitel-widget-send-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

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
            max-width: 85%;
          }
        }
      `;
      document.head.appendChild(style);

      const html = `
        <button class="aitel-widget-btn" id="aitelWidgetBtn">
          <img src="${config.LOGO}" alt="Chat" />
        </button>

        <div class="aitel-widget-panel" id="aitelWidgetPanel">
          <div class="aitel-widget-header">
            <h3>${config.NAME}</h3>
            <button class="aitel-widget-close" id="aitelWidgetCloseBtn">✕</button>
          </div>

          <div class="aitel-widget-audience">
            <label>Select Department:</label>
            <select id="aitelWidgetAudience">
              <option value="client">Client Support</option>
              <option value="sales_marketing">Sales Team</option>
              <option value="engineers">Prompt Engineers</option>
            </select>
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
            <button class="aitel-widget-send-btn" id="aitelWidgetSendBtn">➤</button>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', html);
    }

    attachEventListeners() {
      const btn = document.getElementById('aitelWidgetBtn');
      const closeBtn = document.getElementById('aitelWidgetCloseBtn');
      const sendBtn = document.getElementById('aitelWidgetSendBtn');
      const input = document.getElementById('aitelWidgetInput');
      const audienceSelect = document.getElementById('aitelWidgetAudience');

      btn.addEventListener('click', () => this.togglePanel());
      closeBtn.addEventListener('click', () => this.closePanel());
      sendBtn.addEventListener('click', () => this.sendMessage());

      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      audienceSelect.addEventListener('change', (e) => {
        this.audience = e.target.value;
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
        this.displayMessage("Hello! I'm Aitel's AI assistant. How can I help you today?", 'bot');
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
      const messageDiv = document.createElement('div');
      messageDiv.className = `aitel-widget-message ${sender}`;

      const bubble = document.createElement('div');
      bubble.className = 'aitel-widget-message-bubble';
      bubble.textContent = text;

      messageDiv.appendChild(bubble);
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTyping() {
      const messagesContainer = document.getElementById('aitelWidgetMessages');
      const typingDiv = document.createElement('div');
      typingDiv.className = 'aitel-widget-message bot aitel-widget-typing-indicator';
      typingDiv.innerHTML = `
        <div class="aitel-widget-typing">
          <div class="aitel-widget-typing-dot"></div>
          <div class="aitel-widget-typing-dot"></div>
          <div class="aitel-widget-typing-dot"></div>
        </div>
      `;
      messagesContainer.appendChild(typingDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTyping() {
      const typing = document.querySelector('.aitel-widget-typing-indicator');
      if (typing) typing.remove();
    }

    async sendMessage() {
      const input = document.getElementById('aitelWidgetInput');
      const message = input.value.trim();

      if (!message || this.isLoading) return;

      this.displayMessage(message, 'user');
      input.value = '';
      input.style.height = 'auto';
      this.isLoading = true;

      this.showTyping();

      try {
        const response = await fetch(config.API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: this.conversationId,
            message,
            userId: this.userId,
            audience: this.audience
          })
        });

        let data = {};
        try {
          data = await response.json();
        } catch (e) {
          data = { answer: 'Error: Could not parse response' };
        }

        this.hideTyping();

        if (data.answer) {
          this.displayMessage(data.answer, 'bot');
          if (data.conversationId && !this.conversationId) {
            this.conversationId = data.conversationId;
            this.saveSession();
          }
        } else {
          this.displayMessage('Sorry, I could not process your request.', 'bot');
        }
      } catch (error) {
        console.error('Chat error:', error);
        this.hideTyping();
        this.displayMessage('Sorry, there was an error. Please try again.', 'bot');
      } finally {
        this.isLoading = false;
        input.focus();
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
