// External model providers for AI Chat: a local OpenAI-compatible server (Ollama, LM Studio, llama.cpp), Claude, OpenAI and Gemini.
// Messages use one shape for every provider: { role: 'system' | 'user' | 'assistant', content }, where content is a string
// or a list of { type: 'text', text } and { type: 'image', url } (a data URL) parts. Each provider converts it to its own API.
// Every host called here must also be listed in connect-src of the Content-Security-Policy in index.html.

export const ANTHROPIC_SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.129.0/+esm';

// How much a model thinks before answering. 'default' sends nothing, for models that reject the setting.
export const THINKING_LABELS = {
  default: 'サービスの既定（指定しない）',
  none: 'none（考えない・速い）',
  low: 'low（少し考える）',
  medium: 'medium',
  high: 'high（じっくり考える・遅い）'
};
const OPENAI_THINKING = ['default', 'none', 'low', 'medium', 'high'];

export const PROVIDERS = {
  local: {
    label: 'ローカルサーバー（Ollama・LM Studio など）',
    shortLabel: 'ローカルサーバー',
    api: 'openai',
    defaultBaseUrl: 'http://localhost:11434/v1',
    keyRequired: false,
    sendsTemperature: true,
    maxTokensField: 'max_tokens',
    // Ollama cuts the start of a longer prompt (the system prompt) without an error, so this must match the server's
    // setting (OLLAMA_CONTEXT_LENGTH); it can be changed in the settings dialog.
    contextWindow: 8192,
    historyExchanges: 3,
    defaultMaxTokens: 2048,
    thinkingLevels: OPENAI_THINKING,
    // Ollama's Qwen3 otherwise spends the whole output limit thinking and answers nothing.
    defaultThinking: 'none',
    thinkingNote: 'Ollama は reasoning_effort で考える量を切り替えます。Qwen3 などは none 以外だと「考える／考えない」の2段階で、gpt-oss は none を無視して考えます。',
    modelPlaceholder: '例：qwen3:8b',
    help: 'Ollama は http://localhost:11434/v1、LM Studio は http://localhost:1234/v1 です。このページを GitHub Pages で開いているときは、サーバー側でこのサイトからのアクセス（CORS）を許可してください。Ollama は OLLAMA_ORIGINS=https://qramo.github.io を付けて起動します。文脈の長さはサーバーの設定（Ollama は OLLAMA_CONTEXT_LENGTH、LM Studio はモデルの Context Length）と同じ値にしてください。超えると、サーバーが指示文を黙って切り捨てることがあります。API キーは普通は空欄で構いません。'
  },
  anthropic: {
    label: 'Claude（Anthropic）',
    shortLabel: 'Claude',
    api: 'anthropic',
    keyRequired: true,
    // Current Claude models reject temperature, and they think before answering, so the output limit needs room.
    sendsTemperature: false,
    contextWindow: 200000,
    historyExchanges: 4,
    defaultMaxTokens: 8000,
    thinkingLevels: ['none', 'low', 'medium', 'high'],
    defaultThinking: 'low',
    thinkingNote: 'Claude Opus 5.5 は考えるのを止められないので、none は low と同じになります。Sonnet 5.5 と Haiku 5.5 は none で考えずに答えます。',
    defaultModel: 'claude-opus-5-5',
    suggestedModels: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'],
    modelPlaceholder: 'claude-opus-5-5',
    help: 'API キーは Claude Console（console.anthropic.com）で作れます。使用上限を決めたキーを使ってください。依頼文とプログラム（画像で見直すときは絵の画像も）が Anthropic に送られ、使った分の料金がかかります。'
  },
  openai: {
    label: 'OpenAI',
    shortLabel: 'OpenAI',
    api: 'openai',
    defaultBaseUrl: 'https://api.openai.com/v1',
    keyRequired: true,
    // Reasoning models accept only the default temperature and count their reasoning in max_completion_tokens.
    sendsTemperature: false,
    maxTokensField: 'max_completion_tokens',
    contextWindow: 128000,
    historyExchanges: 4,
    defaultMaxTokens: 8000,
    thinkingLevels: OPENAI_THINKING,
    defaultThinking: 'default',
    thinkingNote: '推論しないモデル（gpt-4.1 など）は、既定以外を選ぶとエラーになります。none を受け付けないモデルもあります。',
    modelPlaceholder: '例：gpt-5-mini',
    modelFilter: id => /^(gpt|o\d|chatgpt)/.test(id) && !/audio|realtime|transcribe|tts|image|search|instruct/.test(id),
    help: 'API キーは OpenAI Platform（platform.openai.com）で作れます。使用上限を決めたキーを使ってください。依頼文とプログラム（画像で見直すときは絵の画像も）が OpenAI に送られ、使った分の料金がかかります。'
  },
  gemini: {
    label: 'Gemini（Google）',
    shortLabel: 'Gemini',
    api: 'openai',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    keyRequired: true,
    sendsTemperature: true,
    maxTokensField: 'max_tokens',
    contextWindow: 128000,
    historyExchanges: 4,
    defaultMaxTokens: 8000,
    thinkingLevels: OPENAI_THINKING,
    defaultThinking: 'default',
    thinkingNote: 'Gemini の Pro 系は考えるのを止められないので、none ではエラーになります。',
    modelPlaceholder: '例：gemini-2.5-flash',
    modelFilter: id => /gemini/.test(id) && !/embedding|tts|image|live|audio/.test(id),
    help: 'API キーは Google AI Studio（aistudio.google.com）で作れます。依頼文とプログラム（画像で見直すときは絵の画像も）が Google に送られ、無料枠を超えると料金がかかります。'
  }
};

export class ProviderError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/** A Japanese explanation of a failed call, with the provider's own message kept at the end. */
export function describeError(error, providerId) {
  const provider = PROVIDERS[providerId];
  const detail = String(error?.message ?? error);
  const status = error?.status;
  if (status === 401 || status === 403) return `API キーが正しくないか、このモデルを使う権限がありません（${detail}）`;
  if (status === 404) return `モデル名か URL が見つかりません（${detail}）`;
  if (status === 429) return `利用上限か回数制限に達しました。少し待つか、利用状況を確認してください（${detail}）`;
  if (status === 529 || status === 503) return `サービスが混み合っています。少し待ってからもう一度送ってください（${detail}）`;
  if (error instanceof TypeError || /Failed to fetch|NetworkError|Load failed/i.test(detail)) {
    return provider?.api === 'openai' && providerId === 'local'
      ? `サーバーにつながりません。サーバーが起動しているか、URL と CORS の設定（⚙設定の説明）を確認してください（${detail}）`
      : `通信に失敗しました。ネットワークを確認してください（${detail}）`;
  }
  return detail;
}

function textOf(content) {
  return typeof content === 'string' ? content : content.filter(part => part.type === 'text').map(part => part.text).join('\n');
}

// ---------- OpenAI-compatible (local servers, OpenAI, Gemini) ----------

export function toOpenAiMessages(messages) {
  return messages.map(({ role, content }) => ({
    role,
    content: typeof content === 'string'
      ? content
      : content.map(part => (part.type === 'image' ? { type: 'image_url', image_url: { url: part.url } } : part))
  }));
}

async function openAiError(response) {
  let message = `${response.status} ${response.statusText}`;
  try {
    const body = await response.json();
    const error = Array.isArray(body) ? body[0]?.error : body.error;
    message = error?.message ?? (typeof error === 'string' ? error : message);
  } catch (_) { /* keep the status line */ }
  return new ProviderError(message, response.status);
}

/** Reads a Server-Sent Events body and passes each JSON payload to onData. */
export async function readEvents(body, onData) {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      const data = line.match(/^data:\s?(.*)$/)?.[1]?.trim();
      if (!data || data === '[DONE]') continue;
      onData(JSON.parse(data));
    }
  }
}

/** The API root without a trailing slash; an address typed without a scheme (localhost:11434/v1) gets http://. */
export function apiRoot(url) {
  return (/^https?:\/\//i.test(url) ? url : `http://${url}`).replace(/\/+$/, '');
}

function openAiClient(provider, { baseUrl, apiKey, model, thinking }) {
  const root = apiRoot(baseUrl || provider.defaultBaseUrl);
  const headers = { 'Content-Type': 'application/json', ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}) };
  return {
    async chat({ messages, maxTokens, temperature, onText, signal }) {
      const response = await fetch(`${root}/chat/completions`, {
        method: 'POST',
        headers,
        signal,
        body: JSON.stringify({
          model,
          messages: toOpenAiMessages(messages),
          stream: true,
          stream_options: { include_usage: true },
          [provider.maxTokensField]: maxTokens,
          ...(provider.sendsTemperature && temperature !== undefined ? { temperature } : {}),
          ...(thinking && thinking !== 'default' ? { reasoning_effort: thinking } : {})
        })
      });
      if (!response.ok) throw await openAiError(response);
      let text = '';
      let usage = null;
      let truncated = false;
      await readEvents(response.body, chunk => {
        if (chunk.error) throw new ProviderError(chunk.error.message ?? String(chunk.error), chunk.error.code);
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
          text += delta;
          onText?.(text);
        }
        if (chunk.choices?.[0]?.finish_reason === 'length') truncated = true;
        if (chunk.usage) usage = { input: chunk.usage.prompt_tokens, output: chunk.usage.completion_tokens };
      });
      return { text, usage, truncated };
    },
    async listModels() {
      const response = await fetch(`${root}/models`, { headers });
      if (!response.ok) throw await openAiError(response);
      const body = await response.json();
      return (body.data ?? []).map(item => item.id.replace(/^models\//, '')).filter(provider.modelFilter ?? (() => true)).sort();
    }
  };
}

// ---------- Claude (official SDK) ----------

export function toAnthropicContent(content) {
  if (typeof content === 'string') return content;
  return content.map(part => {
    if (part.type !== 'image') return part;
    const [, mediaType, data] = part.url.match(/^data:([^;]+);base64,(.*)$/);
    return { type: 'image', source: { type: 'base64', media_type: mediaType, data } };
  });
}

/** Request fields for a thinking level. Only some Claude models can stop thinking, and each in its own way. */
export function claudeThinking(model, level) {
  if (level !== 'none') return { output_config: { effort: level } };
  if (/haiku-5-5/.test(model)) return { thinking: { type: 'disabled' }, output_config: { effort: 'low' } };
  if (/sonnet-5-5/.test(model)) return { thinking: { type: 'between_tools' }, output_config: { effort: 'low' } };
  return { output_config: { effort: 'low' } };
}

function anthropicClient({ apiKey, model, thinking = 'low' }) {
  let client = null;
  const getClient = async () => {
    if (!client) {
      const { default: Anthropic } = await import(ANTHROPIC_SDK_URL);
      // The key belongs to the person using the page and stays in their browser, so a direct call is intended here.
      client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });
    }
    return client;
  };
  const wrap = error => (error?.status ? new ProviderError(error.error?.error?.message ?? error.message, error.status) : error);
  return {
    async chat({ messages, maxTokens, onText, signal }) {
      const anthropic = await getClient();
      const system = messages.filter(message => message.role === 'system').map(message => textOf(message.content)).join('\n\n');
      try {
        const stream = anthropic.messages.stream({
          model,
          max_tokens: maxTokens,
          ...(system ? { system } : {}),
          ...claudeThinking(model, thinking),
          messages: messages
            .filter(message => message.role !== 'system')
            .map(({ role, content }) => ({ role, content: toAnthropicContent(content) }))
        }, { signal });
        let text = '';
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            text += event.delta.text;
            onText?.(text);
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === 'refusal') throw new ProviderError('モデルがこの依頼への回答を断りました。');
        return {
          text,
          usage: { input: final.usage.input_tokens, output: final.usage.output_tokens },
          truncated: final.stop_reason === 'max_tokens'
        };
      } catch (error) {
        throw wrap(error);
      }
    },
    async listModels() {
      const anthropic = await getClient();
      try {
        const ids = [];
        for await (const item of anthropic.models.list({ limit: 100 })) ids.push(item.id);
        return ids;
      } catch (error) {
        throw wrap(error);
      }
    }
  };
}

/**
 * A client for one provider, from { baseUrl, apiKey, model, thinking }:
 * chat({ messages, maxTokens, temperature, onText, signal }) → { text, usage, truncated }, and listModels().
 * truncated is true when the reply stopped at maxTokens.
 */
export function createClient(providerId, options) {
  const provider = PROVIDERS[providerId];
  return provider.api === 'anthropic' ? anthropicClient(options) : openAiClient(provider, options);
}
