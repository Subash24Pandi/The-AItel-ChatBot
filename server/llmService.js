const axios = require('axios');
require('dotenv').config();

class LLMService {
  constructor() {
    this.endpoint = (process.env.LLM_ENDPOINT || '').trim();
    this.model = (process.env.LLM_MODEL || '').trim();
    this.enabled = String(process.env.LLM_ENABLED ?? 'true').toLowerCase() === 'true';

    // IMPORTANT:
    // This is NOT your OpenAI/Sarvam key.
    // This must be your Supabase ANON KEY to call the Edge Function securely.
    this.supabaseAnonKey =
      (process.env.LLM_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

    console.log(`🤖 LLM Service initialized:`);
    console.log(`   Endpoint: ${this.endpoint || '❌ MISSING'}`);
    console.log(`   Model: ${this.model || '❌ MISSING'}`);
    console.log(`   Enabled: ${this.enabled ? '✅ YES' : '❌ NO'}`);
    console.log(`   Supabase JWT: ${this.supabaseAnonKey ? '✅ SET' : '❌ NOT SET'}`);

    this.http = axios.create({
      timeout: 5000, // Reduced to 5s for faster failure handling
      headers: {
        'Content-Type': 'application/json',
        ...(this.supabaseAnonKey
          ? {
              // Supabase Edge Functions auth headers
              Authorization: `Bearer ${this.supabaseAnonKey}`,
              apikey: this.supabaseAnonKey
            }
          : {})
      }
    });
  }

  buildSystemPrompt(context = '') {
    const base = `You are Aitel's intelligent customer support chatbot.
Use ONLY the Knowledge Base context when it is provided and relevant.
If the answer is not clearly present in the Knowledge Base context, respond exactly:
"I don't have information about that. Please contact the Aitel team for assistance."
Do not guess or invent details. Keep responses concise and professional.`;

    if (!context || !context.trim()) return base;
    return `${base}\n\nKnowledge Base Context:\n${context}`;
  }

  extractContent(data) {
    if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content;
    if (data?.choices?.[0]?.text) return data.choices[0].text;
    return '';
  }

  checkConfidence(message) {
    const low = [
      "don't have information",
      "i don't know",
      "not sure",
      "cannot find",
      "no information",
      "unable to",
      "contact the aitel team",
      "contact the team",
      "reach out"
    ];
    const msg = (message || '').toLowerCase();
    return low.some(x => msg.includes(x)) ? 0.3 : 0.85;
  }

  async chat(messages, context = '') {
    if (!this.enabled) {
      return { success: false, message: this.fallback(), error: 'LLM_DISABLED' };
    }
    if (!this.endpoint) {
      return { success: false, message: this.fallback(), error: 'LLM_ENDPOINT_MISSING' };
    }
    if (!this.supabaseAnonKey) {
      return { success: false, message: this.fallback(), error: 'LLM_SUPABASE_ANON_KEY_MISSING' };
    }
    if (!this.model) {
      return { success: false, message: this.fallback(), error: 'LLM_MODEL_MISSING' };
    }

    // Always use OpenAI chat-completions payload (matches your Edge Function)
    const payload = {
      model: this.model,
      messages: [
        { role: 'system', content: this.buildSystemPrompt(context) },
        ...(Array.isArray(messages) ? messages : [])
      ],
      temperature: 0,
      max_tokens: 220,
      stream: false
    };

    try {
      console.log(`\n📤 LLM request -> ${this.endpoint}`);
      console.log(`   model: ${this.model}`);
      let payloadPreview = '';
      try {
        payloadPreview = JSON.stringify(payload);
        if (payloadPreview.length > 250) payloadPreview = payloadPreview.substring(0, 250) + '...';
      } catch (e) {
        payloadPreview = '[unserializable payload]';
      }
      console.log(`   payload preview: ${payloadPreview}`);

      const resp = await this.http.post(this.endpoint, payload);
      if (!resp || !resp.data) {
        console.error('❌ LLM Error: No response or data from LLM endpoint');
        return { success: false, message: this.fallback(), error: 'LLM_NO_RESPONSE' };
      }
      const textRaw = this.extractContent(resp.data);
      let text = textRaw;
      if (typeof this.postprocess === 'function') {
        try {
          text = this.postprocess(textRaw, payload);
        } catch (e) {
          console.error('❌ LLM postprocess error:', e.message);
        }
      }

      if (!text || !text.trim()) {
        return {
          success: false,
          message: this.fallback(),
          error: 'LLM_EMPTY_RESPONSE',
          raw: resp.data
        };
      }

      return { success: true, message: text.trim(), raw: resp.data, used: 'chat-completions' };
    } catch (err) {
      const status = err?.response?.status;
      const body = err?.response?.data;
      console.error(`❌ LLM Error: ${err.message} (status=${status})`);
      let bodyStr = '';
      try {
        bodyStr = JSON.stringify(body);
        if (bodyStr.length > 500) bodyStr = bodyStr.substring(0, 500) + '...';
      } catch (e) {
        bodyStr = '[unserializable body]';
      }
      console.error(`   response: ${bodyStr}`);
      return { success: false, message: this.fallback(), error: 'LLM_CALL_FAILED' };
    }
  }

  fallback() {
    return `I don't have information about that. Please contact the Aitel team for assistance.`;
  }
}

module.exports = new LLMService();
