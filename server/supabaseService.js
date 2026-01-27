const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

let supabase = null;

// Initialize Supabase only if valid credentials are provided
if (
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_URL !== 'your_supabase_url' &&
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_supabase_service_role_key'
) {
  try {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('✅ Supabase connected');
  } catch (error) {
    console.warn('⚠️  Supabase connection failed:', error.message);
  }
} else {
  console.warn('⚠️  Supabase credentials not configured. Database features will be mocked.');
}

class SupabaseService {
  // Conversations
  async createConversation(userId) {
    if (!supabase) {
      return { id: 'mock_' + Date.now(), user_identifier: userId, created_at: new Date().toISOString() };
    }
    const { data, error } = await supabase
      .from('conversations')
      .insert([{ user_identifier: userId }])
      .select();

    if (error) throw error;
    return data[0];
  }

  async getConversation(conversationId) {
    if (!supabase) {
      return { id: conversationId, user_identifier: 'user', created_at: new Date().toISOString() };
    }
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) throw error;
    return data;
  }

  // Messages
  async saveMessage(conversationId, sender, text, messageType = 'text') {
    if (!supabase) {
      return {
        id: 'mock_' + Date.now(),
        conversation_id: conversationId,
        sender,
        text,
        created_at: new Date().toISOString()
      };
    }
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          sender,
          text,
          message_type: messageType
        }
      ])
      .select();

    if (error) throw error;
    return data[0];
  }

  async getMessages(conversationId, limit = 50) {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // Contact Requests
  async createContactRequest(conversationId, department, contactData) {
    if (!supabase) {
      return { id: 'mock_' + Date.now(), conversation_id: conversationId, department, ...contactData, status: 'pending' };
    }
    const { data, error } = await supabase
      .from('contact_requests')
      .insert([
        {
          conversation_id: conversationId,
          department,
          name: contactData.name,
          phone: contactData.phone,
          email: contactData.email || null,
          message: contactData.message,
          company_name: contactData.companyName || null,
          budget_range: contactData.budgetRange || null,
          product_module: contactData.productModule || null,
          status: 'pending'
        }
      ])
      .select();

    if (error) throw error;
    return data[0];
  }

  // Alias (some server versions call this name)
  async saveContactRequest(payload) {
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
    } = payload || {};

    return this.createContactRequest(conversationId, department, {
      name,
      phone,
      email,
      companyName,
      budgetRange,
      productModule,
      message
    });
  }

  async getContactRequests(department = null) {
    if (!supabase) return [];
    let query = supabase.from('contact_requests').select('*');
    if (department) query = query.eq('department', department);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async updateContactRequestStatus(contactRequestId, status) {
    if (!supabase) return { id: contactRequestId, status };
    const { data, error } = await supabase
      .from('contact_requests')
      .update({ status })
      .eq('id', contactRequestId)
      .select();

    if (error) throw error;
    return data[0];
  }

  // Team Replies
  async saveTeamReply(contactRequestId, department, replyText) {
    if (!supabase) {
      return { id: 'mock_' + Date.now(), contact_request_id: contactRequestId, department, reply_text: replyText };
    }
    const { data, error } = await supabase
      .from('team_replies')
      .insert([
        {
          contact_request_id: contactRequestId,
          department,
          reply_text: replyText
        }
      ])
      .select();

    if (error) throw error;
    return data[0];
  }

  async getTeamReplies(contactRequestId) {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('team_replies')
      .select('*')
      .eq('contact_request_id', contactRequestId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }
}

module.exports = new SupabaseService();
