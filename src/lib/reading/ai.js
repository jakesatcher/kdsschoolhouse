'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const config = require('../../config');

class AiError extends Error {
  constructor(message, code = 'ai_error') {
    super(message);
    this.code = code;
  }
}

let client = null;
const configured = () => Boolean(client || config.anthropicApiKey);
const getClient = () => {
  if (!client && config.anthropicApiKey) client = new Anthropic({ apiKey: config.anthropicApiKey, timeout: 90000, maxRetries: 2 });
  return client;
};
// Tests inject a stub with the same `messages.create` shape.
const setClient = (c) => { client = c; };

async function complete({ system, user, maxTokens = 3000 }) {
  const c = getClient();
  if (!c) throw new AiError('AI generation is not set up on this server.', 'not_configured');
  let response;
  try {
    response = await c.messages.create({
      model: config.aiModel,
      max_tokens: maxTokens,
      output_config: { effort: 'low' },
      system,
      messages: [{ role: 'user', content: user }],
    });
  } catch (err) {
    console.error('AI request failed:', err.status || '', err.message);
    throw new AiError('The writing assistant is unavailable right now. Please try again in a moment.', 'unavailable');
  }
  if (response.stop_reason === 'refusal') throw new AiError('The writing assistant could not create that. Try a different topic or word.', 'refusal');
  const text = (response.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
  if (!text) throw new AiError('The writing assistant returned nothing. Please try again.', 'empty');
  return text;
}

module.exports = { complete, configured, setClient, AiError };
