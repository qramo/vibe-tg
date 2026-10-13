// AI Chat: an in-browser LLM (WebLLM) writes LOGO programs, which are checked, put into the editor and run.
import { checkProgram, applyProgram, selectView } from './blocks.js';
import { WEBLLM_URL } from './webllm.js';
import { findPenUpProblem } from './pencheck.js';
import { runPenCheckTests } from '../test/penchecktests.js';

const SETTINGS_KEY = 'vibe-tg-chat-settings';

// VRAM figures come from WebLLM 0.2.85's prebuilt model list.
// recommendedFor marks the pick per device memory, chosen by size and by how new the model is.
const MODELS = [
  { id: 'Qwen3.5-9B-q4f16_1-MLC', label: 'Qwen3.5 9B', vram: 6.4, recommendedFor: 'メモリ24GB〜', note: '最新・最大（ダウンロード約5GB）' },
  { id: 'Qwen3.5-4B-q4f16_1-MLC', label: 'Qwen3.5 4B', vram: 3.9, note: '最新世代の4B' },
  { id: 'Qwen3-4B-q4f16_1-MLC', label: 'Qwen3 4B', vram: 3.4, recommendedFor: 'メモリ16GB', note: '4B級で軽め。動作確認済み（既定）' },
  { id: 'Phi-4-mini-instruct-q4f16_1-MLC', label: 'Phi-4-mini 3.8B', vram: 3.4 },
  { id: 'Qwen2.5-Coder-3B-Instruct-q4f16_1-MLC', label: 'Qwen2.5-Coder 3B', vram: 2.5 },
  { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 3B', vram: 2.3 },
  { id: 'Qwen3.5-2B-q4f16_1-MLC', label: 'Qwen3.5 2B', vram: 2.2, recommendedFor: 'メモリ8GB', note: '小型で一番新しい世代' },
  { id: 'Qwen3-1.7B-q4f16_1-MLC', label: 'Qwen3 1.7B', vram: 2.0 },
  { id: 'Qwen3.5-0.8B-q4f16_1-MLC', label: 'Qwen3.5 0.8B', vram: 1.6 },
  { id: 'Qwen3-0.6B-q4f16_1-MLC', label: 'Qwen3 0.6B', vram: 1.4 }
];

const DEFAULT_SYSTEM_PROMPT = `You write programs for a small LOGO turtle-graphics interpreter.
Reply with one short Japanese sentence, then exactly one code block:
\`\`\`logo
(program)
\`\`\`

The interpreter understands only these commands. Anything else is an error.
- fd N / bk N: move forward / back N steps
- rt N / lt N: turn right (clockwise) / left N degrees
- setheading N: face a direction (0 = up, 90 = right, 180 = down, 270 = left)
- home: go to the center and face up
- pu / pd: pen up (move without drawing) / pen down
- setpc C: pen color, setbg C: background color, setpensize N: line width
- cs: clear the screen and go home
- label "TEXT: write TEXT. The text runs to the end of the line, so label must be the last command on its line.
- setlabelheight N: text size
- repeat N [ commands ]
- if A < B [ commands ] and if A > B [ commands ]
- wait N: wait N/100 seconds
- to NAME :a :b ... end: define a procedure, then call it as NAME 10 20. stop leaves the current procedure (outside a procedure it ends the program).

Rules:
- Numbers are whole numbers 0 or greater. No decimals and no negative numbers: use lt instead of rt -90, bk instead of fd -10.
- Arithmetic: + - * / and ( ). :name reads a parameter, and only inside the procedure that declares it.
- Names use English letters only.
- There are no comments, no variables (make), no setxy or setpos, no arc or circle commands.
- Colors: 0 black, 1 blue, 2 green, 3 cyan, 4 red, 5 magenta, 6 yellow, 7 white, 8 brown, 9 tan, 10 dark green, 11 aqua, 12 salmon, 13 purple, 14 orange, 15 grey.
- The background is 15 (light grey), so lines drawn with 15 are invisible and 7 (white) is hard to see. Use darker colors for lines.
- The turtle starts at the center facing up. The canvas reaches about 270 steps from the center in every direction.

How to draw well:
- Before every move, work out where the turtle is and which way it faces.
- Move to the start of each part with pu, moves, then pd.
- Circle: repeat 36 [fd S rt 10] draws a circle about 11 * S wide on the right side of the turtle.
- Regular polygon with N sides: repeat N [fd S rt 360 / N].

Reference samples: these only show how programs are written. They are not part of the conversation and are not pictures drawn earlier.

Sample program for a star:
\`\`\`logo
cs
setpc 14
setpensize 3
pu fd 60 lt 90 fd 100 rt 180 pd
repeat 5 [fd 200 rt 144]
pu home pd
\`\`\`

Sample program for a tree with a brown trunk and round green leaves:
\`\`\`logo
to rect :w :h
  repeat 2 [fd :h rt 90 fd :w rt 90]
end
to circle :step
  repeat 36 [fd :step rt 10]
end
cs
setpensize 3
pu bk 150 lt 90 fd 20 rt 90 pd
setpc 8
rect 40 100
pu fd 100 rt 90 fd 20 pd
setpc 2
rt 180
circle 10
pu home pd
\`\`\``;

// Mirrors what js/blocks.js can convert, so constrained output is always syntactically valid.
// It keeps the reply shape the system prompt asks for (one sentence, then a fenced block): forcing models to start
// straight with code made them spill the sentence into the program as bogus procedure calls.
const FENCE = '```';
const LOGO_GRAMMAR = [
  `root ::= intro "${FENCE}logo\\n" program "\\n${FENCE}"`,
  'intro ::= [^\\n`]{0,80} "\\n"',
  'program ::= item ("\\n"+ item)*',
  'item ::= procdef | line',
  'procdef ::= "to " name params "\\n" ("  "? line "\\n")* "end"',
  'params ::= (" :" name)*',
  'line ::= statements (" " label)? | label',
  'label ::= "label \\"" [^\\n]*',
  'statements ::= statement (" " statement)*',
  'statement ::= command1 " " expr | command0 | "repeat " expr " [" statements "]"' +
    ' | "if " expr " " ("<" | ">") " " expr " [" statements "]" | name (" " expr)*',
  'command1 ::= "fd" | "bk" | "rt" | "lt" | "setheading" | "setpc" | "setpensize" | "setbg" | "setlabelheight" | "wait"',
  'command0 ::= "pu" | "pd" | "home" | "cs" | "clean" | "ht" | "st" | "stop"',
  'expr ::= term (" "? ("+" | "-") " "? term)*',
  'term ::= factor (" "? ("*" | "/") " "? factor)*',
  'factor ::= number | ":" name | "(" expr ")"',
  'number ::= "0" | [1-9] [0-9]? [0-9]?',
  'name ::= [a-z]+'
].join('\n');

// FNV-1a hashes of earlier default system prompts. A saved copy of one of them is treated as "use the default",
// so people who once pressed Save still get prompt improvements. Add the old hash here whenever the default changes.
const RETIRED_DEFAULT_PROMPTS = ['daf0cfbf', 'd7d65135', '02a20e71'];

function promptHash(text) {
  let hash = 0x811c9dc5;
  for (const char of text) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

const DEFAULT_SETTINGS = {
  model: 'Qwen3-4B-q4f16_1-MLC',
  temperature: 0.3,
  maxRetries: 2,
  maxTokens: 1024,
  grammar: false,
  includeCode: true,
  autoRun: true,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  // Where WebLLM keeps downloaded models: the Cache API first, OPFS after a Cache API failure.
  cacheBackend: 'cache'
};

// Requests that point at an earlier picture. Words like 前の alone are left out, since 前の足 means "front legs".
const EARLIER_PICTURE = /さっき|先ほど|前回|もう一度|もう一回|もういっかい|前の絵|前のプログラム|前に描いた|同じ絵|元の絵|again|previous/i;

const SUGGESTIONS = ['家を描いて', '花を描いて', '雪だるまを描いて', '六角形を色を変えながら回転させて描いて'];

// Every model in MODELS is configured with a 4096-token context in WebLLM 0.2.85.
const CONTEXT_WINDOW = 4096;
// Kept free beyond the output limit so a retry (the failed program plus the error message) still fits.
const RETRY_MARGIN = 350;
// Chat-template tokens added around each message.
const MESSAGE_OVERHEAD = 8;

const $ = id => document.getElementById(id);
const editor = $('logo-editor');
const log = $('chat-log');
const input = $('chat-input');
const sendButton = $('chat-send');
const loadButton = $('chat-load');
const modelStatus = $('chat-model-status');
const progress = $('chat-progress');
const progressBar = $('chat-progress-bar');
const progressText = $('chat-progress-text');
const dialog = $('chat-settings');

let settings = loadSettings();
let worker = null;
let engine = null;
let loadedModel = null;
let loading = false;
let generating = false;
let interrupted = false;
// Successful exchanges only ({ request, code, applied }); failed attempts are left out so the model does not copy them.
let history = [];
// Scales the character-based estimate to the loaded model's tokenizer, learned from the real prompt token counts.
let tokenScale = 1;
let lastUsage = null;
// The editor program at the moment a new conversation started; it is not shown to the model unless someone edits it.
let programAtNewSession = null;

// ---------- Settings ----------

function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    if (stored.systemPrompt && RETIRED_DEFAULT_PROMPTS.includes(promptHash(stored.systemPrompt))) delete stored.systemPrompt;
    const merged = { ...DEFAULT_SETTINGS, ...stored };
    merged.systemPrompt ??= DEFAULT_SYSTEM_PROMPT;
    if (!MODELS.some(model => model.id === merged.model)) merged.model = DEFAULT_SETTINGS.model;
    return merged;
  } catch (_) {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  // An unchanged prompt is stored as null so a future default replaces it.
  const stored = { ...settings, systemPrompt: settings.systemPrompt === DEFAULT_SYSTEM_PROMPT ? null : settings.systemPrompt };
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(stored)); } catch (_) { /* storage unavailable */ }
}

function modelInfo(id) {
  return MODELS.find(model => model.id === id);
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

// Recommended models first, in order of device memory; the rest keep their order.
const RECOMMENDATION_ORDER = ['メモリ8GB', 'メモリ16GB', 'メモリ24GB〜'];

function sortedModels() {
  const rank = model => (model.recommendedFor ? RECOMMENDATION_ORDER.indexOf(model.recommendedFor) : RECOMMENDATION_ORDER.length);
  return [...MODELS].sort((a, b) => rank(a) - rank(b));
}

function selectedModelId() {
  return $('setting-model').querySelector('input[name="model"]:checked')?.value ?? settings.model;
}

function renderModelList() {
  $('setting-model').replaceChildren(...sortedModels().map(model => {
    const row = document.createElement('label');
    row.className = `model-option${model.recommendedFor ? ' is-recommended' : ''}`;
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'model';
    radio.value = model.id;
    radio.checked = model.id === settings.model;
    const name = document.createElement('span');
    name.className = 'model-name';
    name.textContent = model.label;
    const meta = document.createElement('span');
    meta.className = 'model-meta';
    meta.dataset.base = [`VRAM 約${model.vram}GB`, model.note].filter(Boolean).join('・');
    meta.textContent = meta.dataset.base;
    row.append(radio, name, meta);
    if (model.recommendedFor) {
      const badge = document.createElement('span');
      badge.className = 'model-badge';
      badge.textContent = `${model.recommendedFor}向け`;
      row.append(badge);
    }
    return row;
  }));
}

function appConfig(webllm, cacheBackend = settings.cacheBackend) {
  return { ...webllm.prebuiltAppConfig, cacheBackend };
}

async function markCachedModels() {
  try {
    const webllm = await import(WEBLLM_URL);
    for (const radio of $('setting-model').querySelectorAll('input[name="model"]')) {
      const cached = await webllm.hasModelInCache(radio.value, appConfig(webllm));
      const meta = radio.parentElement.querySelector('.model-meta');
      meta.textContent = meta.dataset.base + (cached ? '・保存済み' : '');
    }
  } catch (_) { /* the rows just stay without the cached mark */ }
}

async function deleteSelectedModel() {
  const id = selectedModelId();
  if (!confirm(`${modelInfo(id).label} の保存データを削除しますか？次に使うときは再ダウンロードが必要です。`)) return;
  const webllm = await import(WEBLLM_URL);
  await webllm.deleteModelAllInfoInCache(id, appConfig(webllm));
  await markCachedModels();
}

function openSettings() {
  renderModelList();
  markCachedModels();
  $('setting-temperature').value = settings.temperature;
  $('setting-retries').value = settings.maxRetries;
  $('setting-max-tokens').value = settings.maxTokens;
  $('setting-grammar').checked = settings.grammar;
  $('setting-include-code').checked = settings.includeCode;
  $('setting-auto-run').checked = settings.autoRun;
  $('setting-system-prompt').value = settings.systemPrompt;
  dialog.showModal();
}

function setupSettings() {
  $('chat-settings-open').addEventListener('click', openSettings);
  $('chat-settings-cancel').addEventListener('click', () => dialog.close());
  $('setting-delete-model').addEventListener('click', deleteSelectedModel);
  $('setting-reset-prompt').addEventListener('click', () => { $('setting-system-prompt').value = DEFAULT_SYSTEM_PROMPT; });
  $('chat-settings-form').addEventListener('submit', () => {
    settings = {
      model: selectedModelId(),
      temperature: clampNumber($('setting-temperature').value, 0, 1.5, DEFAULT_SETTINGS.temperature),
      maxRetries: Math.round(clampNumber($('setting-retries').value, 0, 5, DEFAULT_SETTINGS.maxRetries)),
      maxTokens: Math.round(clampNumber($('setting-max-tokens').value, 256, 2048, DEFAULT_SETTINGS.maxTokens)),
      grammar: $('setting-grammar').checked,
      includeCode: $('setting-include-code').checked,
      autoRun: $('setting-auto-run').checked,
      systemPrompt: $('setting-system-prompt').value.trim() || DEFAULT_SYSTEM_PROMPT
    };
    saveSettings();
    updateUi();
  });
}

// ---------- UI ----------

function updateUi() {
  const info = modelInfo(settings.model);
  const ready = engine && loadedModel === settings.model;
  if (loading) modelStatus.textContent = `${info.label} を読み込み中…`;
  else if (ready) modelStatus.textContent = `${info.label}：準備完了`;
  else modelStatus.textContent = `${info.label}：未読み込み（VRAM 約${info.vram}GB）`;
  loadButton.hidden = Boolean(ready);
  loadButton.disabled = loading || generating || !navigator.gpu;
  loadButton.textContent = loadedModel ? 'このモデルに切り替える' : 'モデルを読み込む';
  input.disabled = !ready || loading;
  sendButton.disabled = !ready || loading || (!generating && !input.value.trim());
  sendButton.textContent = generating ? '中止' : '送信';
  sendButton.classList.toggle('is-stop', generating);
  $('chat-new').disabled = generating;
  updateGauge();
}

// ---------- Context gauge ----------

function rawTokenEstimate(text) {
  let ascii = 0;
  let other = 0;
  for (const char of text) {
    if (char.charCodeAt(0) < 128) ascii++;
    else other++;
  }
  return ascii / 3.5 + other;
}

function estimateMessages(messages) {
  return messages.reduce((total, message) => total + rawTokenEstimate(message.content) + MESSAGE_OVERHEAD, 0);
}

function estimate(messages) {
  return Math.ceil(estimateMessages(messages) * tokenScale);
}

function formatNumber(value) {
  return value.toLocaleString('ja-JP');
}

function updateGauge() {
  const pending = input.value.trim() || '　';
  const system = estimate([{ role: 'system', content: settings.systemPrompt }]);
  const past = estimate(historyMessages(history));
  const user = estimate([{ role: 'user', content: buildUserMessage(pending) }]);
  const output = settings.maxTokens;
  const total = system + past + user + output;
  const scale = 100 / Math.max(CONTEXT_WINDOW, total);
  const bar = $('chat-gauge-bar');
  [['system', system], ['history', past], ['program', user], ['output', output]].forEach(([name, value]) => {
    bar.querySelector(`.seg-${name}`).style.width = `${value * scale}%`;
  });
  bar.setAttribute('aria-valuenow', String(Math.min(total, CONTEXT_WINDOW)));
  const over = total + RETRY_MARGIN > CONTEXT_WINDOW;
  $('chat-gauge').classList.toggle('is-over', over);
  $('chat-gauge-text').textContent =
    `文脈 約${formatNumber(total)} / ${formatNumber(CONTEXT_WINDOW)}（履歴 ${history.length}件）${over ? '・次の送信で古い履歴を外します' : ''}`;
  const actual = lastUsage
    ? `\n前回の実測：入力 ${formatNumber(lastUsage.prompt_tokens)} ＋ 出力 ${formatNumber(lastUsage.completion_tokens)} トークン`
    : '';
  $('chat-gauge').title =
    `指示文 約${formatNumber(system)}・履歴 約${formatNumber(past)}・依頼と今のプログラム 約${formatNumber(user)}・出力用の枠 ${formatNumber(output)}${actual}`;
}

// ---------- Session ----------

function historyMessages(items) {
  return items.flatMap(item => [
    { role: 'user', content: item.request },
    { role: 'assistant', content: `\`\`\`logo\n${item.code}\n\`\`\`` }
  ]);
}

function buildMessages(request, items = history) {
  return [
    { role: 'system', content: settings.systemPrompt },
    ...historyMessages(items),
    { role: 'user', content: buildUserMessage(request) }
  ];
}

/** Drops the oldest exchanges until the request, the output limit and a retry fit in the context window. */
function fitHistory(request) {
  let dropped = 0;
  while (history.length && estimate(buildMessages(request)) + settings.maxTokens + RETRY_MARGIN > CONTEXT_WINDOW) {
    history.shift();
    dropped++;
  }
  if (dropped) addNote(`文脈が長くなったため、古いやり取りを${dropped}件外しました。`);
}

function startNewSession() {
  history = [];
  lastUsage = null;
  programAtNewSession = editor.value.trim();
  log.replaceChildren();
  addNote('新しい会話を始めました。エディタのプログラムは残りますが、手で直すまでAIには見せません。');
  showSuggestions();
  updateUi();
}

function scrollLog() {
  log.scrollTop = log.scrollHeight;
}

function addMessage(role, text) {
  const element = document.createElement('div');
  element.className = `chat-msg ${role}`;
  element.textContent = text;
  log.append(element);
  scrollLog();
  return element;
}

function addNote(text, kind = '') {
  const element = document.createElement('p');
  element.className = `chat-note ${kind}`.trim();
  element.textContent = text;
  log.append(element);
  scrollLog();
  return element;
}

function addActions(actions) {
  const row = document.createElement('div');
  row.className = 'chat-actions';
  actions.forEach(({ label, onClick }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chat-button';
    button.textContent = label;
    button.addEventListener('click', onClick);
    row.append(button);
  });
  log.append(row);
  scrollLog();
}

function showSuggestions() {
  const row = document.createElement('div');
  row.className = 'chat-suggestions';
  SUGGESTIONS.forEach(text => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chat-chip';
    button.textContent = text;
    button.addEventListener('click', () => {
      input.value = text;
      updateUi();
      if (!sendButton.disabled) submit();
      else input.focus();
    });
    row.append(button);
  });
  addNote('描きたいものを伝えてください。初回はモデルのダウンロード（数GB）に時間がかかります。');
  log.append(row);
}

// ---------- Model ----------

async function loadModel() {
  if (!navigator.gpu) return;
  loading = true;
  progress.hidden = false;
  progressBar.value = 0;
  progressText.textContent = '準備中…';
  updateUi();
  const onProgress = report => {
    progressBar.value = report.progress;
    progressText.textContent = `${Math.round(report.progress * 100)}% ${report.text}`;
  };
  let retryWithOpfs = false;
  try {
    const webllm = await import(WEBLLM_URL);
    if (!engine) {
      worker = new Worker(new URL('./llm-worker.js', import.meta.url), { type: 'module' });
      engine = await webllm.CreateWebWorkerMLCEngine(worker, settings.model, { initProgressCallback: onProgress, appConfig: appConfig(webllm) });
    } else {
      engine.setInitProgressCallback(onProgress);
      engine.setAppConfig(appConfig(webllm));
      await engine.reload(settings.model);
    }
    loadedModel = settings.model;
    tokenScale = 1;
    lastUsage = null;
    addNote(`${modelInfo(loadedModel).label} の準備ができました。`);
    progress.hidden = true;
  } catch (error) {
    console.error(error);
    loadedModel = null;
    if (!engine && worker) {
      worker.terminate();
      worker = null;
    }
    progressText.textContent = '';
    progress.hidden = true;
    const message = String(error.message ?? error);
    // Some browsers fail to store certain model files in the Cache API; OPFS takes them, so switch once and retry.
    if (/Cache/.test(message) && settings.cacheBackend === 'cache') {
      retryWithOpfs = true;
      settings.cacheBackend = 'opfs';
      saveSettings();
      try {
        const webllm = await import(WEBLLM_URL);
        await webllm.deleteModelAllInfoInCache(settings.model, appConfig(webllm, 'cache'));
      } catch (_) { /* leftovers in the Cache API only waste space */ }
      addNote('ブラウザーの Cache Storage にモデルを保存できなかったので、保存先を OPFS に切り替えて読み込み直します。');
      return;
    }
    const storageHint = /Cache|Quota/i.test(message)
      ? ' ブラウザーの保存容量が足りない可能性があります。⚙設定で使わないモデルの保存データを削除してから、もう一度読み込んでください。'
      : '';
    addNote(`モデルを読み込めませんでした：${message}${storageHint}`, 'error');
  } finally {
    loading = false;
    updateUi();
    if (loadedModel) input.focus();
    if (retryWithOpfs) loadModel();
  }
}

function visibleText(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/<think>[\s\S]*$/, '').trim();
}

async function generate(messages, bubble, attempt) {
  const isQwen = /^Qwen3/.test(loadedModel);
  const request = {
    messages,
    stream: true,
    // At a low temperature a retry tends to reproduce the same broken program, so loosen it a little each time.
    temperature: Math.min(1, settings.temperature + attempt * 0.3),
    max_tokens: settings.maxTokens,
    stream_options: { include_usage: true },
    ...(isQwen ? { extra_body: { enable_thinking: false } } : {}),
    ...(settings.grammar ? { response_format: { type: 'grammar', grammar: LOGO_GRAMMAR } } : {})
  };
  let text = '';
  const chunks = await engine.chat.completions.create(request);
  for await (const chunk of chunks) {
    text += chunk.choices[0]?.delta?.content ?? '';
    bubble.textContent = visibleText(text) || '…';
    scrollLog();
    if (chunk.usage) {
      lastUsage = chunk.usage;
      tokenScale = chunk.usage.prompt_tokens / estimateMessages(messages);
    }
  }
  return visibleText(text);
}

// ---------- Requests ----------

function extractCode(reply) {
  const fenced = [...reply.matchAll(/```[A-Za-z]*[ \t]*\n?([\s\S]*?)```/g)];
  let code = reply;
  if (fenced.length) code = fenced.at(-1)[1];
  else if (reply.includes('```')) code = reply.slice(reply.indexOf('```')).replace(/^```[A-Za-z]*/, '');
  return code.split('\n')
    .map(line => (/\blabel\s+"/i.test(line) ? line : line.replace(/;.*$/, '')).replace(/\s+$/, ''))
    .join('\n')
    .trim();
}

function isTextReply(reply) {
  return !reply.includes('```') && checkProgram(extractCode(reply)) !== null;
}

function currentProgram() {
  // Only an English program can be shown to the model, since the prompt teaches English commands.
  if (!settings.includeCode || interpreter.locale !== i18n.English) return '';
  const program = editor.value.trim();
  // The model's last program is already in the history; send the editor only after someone changed it.
  if (history.length && program === history.at(-1).applied.trim()) return '';
  if (program === programAtNewSession) return '';
  return program;
}

function buildUserMessage(request) {
  const program = currentProgram();
  if (!program) return request;
  return `現在のプログラム:\n\`\`\`logo\n${program}\n\`\`\`\n\n依頼: ${request}\n（今の絵を変える依頼なら現在のプログラムを直し、新しい絵の依頼なら新しく書いてください。）`;
}

function onSuccess(request, code) {
  const applied = applyProgram(code);
  history.push({ request, code, applied });
  const actions = [
    { label: 'ブロックで見る', onClick: () => selectView('blocks') },
    { label: 'コードで見る', onClick: () => selectView('text') }
  ];
  if (settings.autoRun) {
    interpreter.run();
    addNote('✓ ブロックに変換して実行しました。');
  } else {
    actions.unshift({ label: '実行', onClick: () => interpreter.run() });
    addNote('✓ ブロックに変換しました。');
  }
  addActions(actions);
  return applied;
}

function penProblemNote(problem) {
  if (problem.kind === 'invisible') return `線がすべて背景と同じ色（${problem.color}）なので、何も見えません`;
  return problem.kind === 'nothing'
    ? 'ペンが上がったまま（pu）なので、線が1本も描かれません'
    : `ペンが上がったまま（pu）で${problem.moves}回続けて動いていて、その部分の線が描かれません`;
}

function penProblemFeedback(problem) {
  if (problem.kind === 'invisible') {
    return `Every line is drawn in color ${problem.color}, the same as the background, so nothing can be seen. Use another pen color (setpc), such as 0 black or 1 blue.`;
  }
  return problem.kind === 'nothing'
    ? 'This program draws nothing: the pen is up (pu) every time the turtle moves. After moving to a starting point with pu, put pd before drawing.'
    : `Part of the picture is not drawn: the turtle moves ${problem.moves} times in a row with the pen up (pu), so that shape is invisible. After moving to the start of each part with pu, put pd before drawing it.`;
}

function onFailure(code, error) {
  addNote(`エラーが残りました：${error}`, 'error');
  addActions([{
    label: 'コードタブで直す',
    onClick: () => { editor.value = code; selectView('text'); }
  }]);
}

async function handleRequest(request) {
  generating = true;
  interrupted = false;
  updateUi();
  addMessage('user', request);
  // With no earlier program the model would "redraw" one of the samples in the system prompt, so answer here instead.
  if (!history.length && !currentProgram() && EARLIER_PICTURE.test(request)) {
    addMessage('assistant', 'この会話ではまだ何も描いていないので、前の絵が分かりません。描きたいものを教えてください。');
    generating = false;
    updateUi();
    return;
  }
  fitHistory(request);
  const base = buildMessages(request);
  let messages = base;
  try {
    for (let attempt = 0; attempt <= settings.maxRetries; attempt++) {
      const bubble = addMessage('assistant', '…');
      const reply = await generate(messages, bubble, attempt);
      if (interrupted) return;
      const textOnly = isTextReply(reply);
      const code = extractCode(reply);
      const error = textOnly ? 'AIの返事にプログラムがありませんでした。' : checkProgram(code);
      const penProblem = error ? null : findPenUpProblem(code);
      if (!error && !penProblem) {
        onSuccess(request, code);
        return;
      }
      if (attempt === settings.maxRetries) {
        if (textOnly) {
          addNote(`エラーが残りました：${error}`, 'error');
        } else if (error) {
          onFailure(code, error);
        } else {
          // The program is valid, so show it anyway rather than throwing the work away.
          onSuccess(request, code);
          addNote(`注意：${penProblemNote(penProblem)}`, 'warn');
        }
        return;
      }
      const note = error ? `エラー：${error}` : penProblemNote(penProblem);
      addNote(`${note} → AIに修正を頼みます（${attempt + 1}/${settings.maxRetries}）`, 'warn');
      const feedback = textOnly
        ? 'Your reply has no program. Write the program for the request, in one code block.'
        : error
          ? `That program has an error: ${error}\nFix it. Use only the commands in the rules, and reply with the complete corrected program in one code block.`
          : `${penProblemFeedback(penProblem)}\nReply with the complete corrected program in one code block.`;
      messages = [
        ...base,
        { role: 'assistant', content: `\`\`\`logo\n${code}\n\`\`\`` },
        { role: 'user', content: feedback }
      ];
    }
  } catch (error) {
    console.error(error);
    addNote(`生成中にエラーが起きました：${error.message ?? error}`, 'error');
  } finally {
    generating = false;
    updateUi();
  }
}

function submit() {
  if (generating) {
    interrupted = true;
    engine.interruptGenerate();
    addNote('生成を中止しました。');
    return;
  }
  const request = input.value.trim();
  if (!request) return;
  input.value = '';
  handleRequest(request);
}

// ---------- Init ----------

function init() {
  runPenCheckTests({ findPenUpProblem });
  setupSettings();
  loadButton.addEventListener('click', loadModel);
  $('chat-form').addEventListener('submit', event => {
    event.preventDefault();
    submit();
  });
  input.addEventListener('input', updateUi);
  $('chat-new').addEventListener('click', startNewSession);
  // The program can change in the other tabs, so refresh the estimate whenever the chat comes back into view.
  editor.addEventListener('input', updateGauge);
  $('tab-chat').addEventListener('click', updateGauge);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      if (!sendButton.disabled) submit();
    }
  });
  showSuggestions();
  if (!navigator.gpu) {
    addNote('このブラウザーはWebGPUに対応していないため、AI Chatを使えません。Chrome または Edge の最新版で開いてください。', 'error');
  }
  updateUi();
}

init();
