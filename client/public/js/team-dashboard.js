// Get script tag attributes for configuration
const scriptTag = document.currentScript;
const DEPARTMENT = scriptTag.getAttribute('data-department');
const TEAM_TITLE = scriptTag.getAttribute('data-title');
const API_URL = '';// use same-origin proxy routes

class TeamDashboard {
  constructor() {
    this.department = DEPARTMENT;
    this.teamTitle = TEAM_TITLE;
    this.requests = [];
    this.selectedRequest = null;
    this.init();
  }

  async init() {
    document.title = `${this.teamTitle} Dashboard - Aitel`;
    await this.loadRequests();
    this.setupEventListeners();
    this.startAutoRefresh();
  }

  async loadRequests() {
    try {
      const response = await fetch(`${API_URL}/api/team/requests?department=${this.department}`);
      this.requests = await response.json();
      this.renderTicketList();
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  }

  renderTicketList() {
    const ticketList = document.getElementById('ticketList');
    ticketList.innerHTML = '';

    if (this.requests.length === 0) {
      ticketList.innerHTML = '<div style="padding: 20px; color: #999; text-align: center;">No requests yet</div>';
      return;
    }

    this.requests.forEach(request => {
      const ticketDiv = document.createElement('div');
      ticketDiv.className = `team-ticket ${this.selectedRequest?.id === request.id ? 'active' : ''}`;
      
      const statusColor = {
        'pending': '#ef4444',
        'responded': '#10b981',
        'closed': '#6b7280'
      }[request.status] || '#ef4444';

      ticketDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
          <div style="font-weight: 600; font-size: 13px;">${request.name}</div>
          <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${statusColor}; flex-shrink: 0;"></div>
        </div>
        <div style="font-size: 12px; color: rgba(255,255,255,0.7); margin-bottom: 4px;">📧 ${request.email || 'N/A'}</div>
        <div style="font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.3;">
          ${request.message.substring(0, 50)}...
        </div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 4px;">
          ${new Date(request.created_at).toLocaleDateString()}
        </div>
      `;

      ticketDiv.addEventListener('click', () => this.selectRequest(request));
      ticketList.appendChild(ticketDiv);
    });
  }

  async selectRequest(request) {
    this.selectedRequest = request;
    await this.renderTicketDetail();
    this.renderTicketList(); // Update active state
  }

  async renderTicketDetail() {
    if (!this.selectedRequest) return;

    const request = this.selectedRequest;
    const ticketDetail = document.getElementById('ticketDetail');

    // Load conversation messages
    let messages = [];
    try {
      const response = await fetch(`${API_URL}/api/messages/${request.conversation_id}`);
      messages = await response.json();
    } catch (error) {
      console.error('Error loading messages:', error);
    }

    // Load team replies
    let teamReplies = [];
    try {
      const response = await fetch(`${API_URL}/api/team/reply/${request.id}`);
      teamReplies = await response.json();
    } catch (error) {
      console.error('Error loading replies:', error);
    }

    let html = `
      <div style="height: 100%; display: flex; flex-direction: column;">
        <div class="ticket-header">
          <h3>${request.name} - ${request.status.toUpperCase()}</h3>
          <div class="ticket-info">
            <div>📞 ${request.phone}</div>
            <div>📧 ${request.email || 'N/A'}</div>
            <div>📅 ${new Date(request.created_at).toLocaleString()}</div>
          </div>
        </div>

        <div class="ticket-messages" style="flex: 1; overflow-y: auto; margin-bottom: 20px;">
          <div style="background-color: #f5f5f5; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
            <strong>Original Request:</strong>
            <p style="margin-top: 8px; font-size: 14px;">${request.message}</p>
          </div>

          ${messages.filter(m => m.sender !== 'system').map(msg => `
            <div class="ticket-message ${msg.sender === 'user' ? 'from-client' : 'from-team'}">
              <div class="message-bubble">
                <div style="font-size: 12px; font-weight: 600; margin-bottom: 4px;">
                  ${msg.sender === 'user' ? 'Client' : 'Bot'}
                </div>
                <div>${msg.text}</div>
                <div style="font-size: 11px; margin-top: 4px; opacity: 0.7;">
                  ${new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          `).join('')}

          ${teamReplies.length > 0 ? `
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e0e0e0;">
              <strong style="color: #10b981;">Team Responses:</strong>
              ${teamReplies.map(reply => `
                <div class="ticket-message from-team" style="margin-top: 12px;">
                  <div class="message-bubble">
                    <div style="font-size: 12px; font-weight: 600; margin-bottom: 4px;">
                      ${this.teamTitle}
                    </div>
                    <div>${reply.reply_text}</div>
                    <div style="font-size: 11px; margin-top: 4px; opacity: 0.7;">
                      ${new Date(reply.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <div class="team-reply-input">
          <textarea id="replyText" placeholder="Type your response..."></textarea>
          <button onclick="dashboard.submitReply()">Send Reply</button>
        </div>
      </div>
    `;

    ticketDetail.innerHTML = html;
  }

  async submitReply() {
    const replyText = document.getElementById('replyText')?.value.trim();
    
    if (!replyText || !this.selectedRequest) return;

    try {
      const response = await fetch(`${API_URL}/api/team/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactRequestId: this.selectedRequest.id,
          department: this.department,
          reply: replyText
        })
      });

      const result = await response.json();

      if (result.success) {
        // Reload and re-render
        await this.selectRequest(this.selectedRequest);
        this.showToast('Reply sent successfully!', 'success');
      } else {
        this.showToast('Failed to send reply', 'error');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      this.showToast('Error sending reply', 'error');
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  startAutoRefresh() {
    // Refresh requests every 10 seconds
    setInterval(() => this.loadRequests(), 10000);
  }

  setupEventListeners() {
    // Additional event listeners can be added here
  }
}

// Initialize dashboard
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
  dashboard = new TeamDashboard();
});
