// Block editor for vibe-tg (Vibe Turtle Graphics), built on Scratch Blocks.
// The textarea stays the single source the interpreter runs; this module keeps it in sync with the block workspace.

import { runBlockTests } from '../test/blocktests.js';

// scratch-blocks 2.1.19 is bundled in vendor/ (see vendor/scratch-blocks/README.md) rather than loaded from a CDN.
const SCRATCH_BLOCKS_URL = new URL('../vendor/scratch-blocks/main.js', import.meta.url).href;
const SCRATCH_BLOCKS_MEDIA = new URL('../vendor/scratch-blocks/media/', import.meta.url).href;
const VIEW_STORAGE_KEY = 'vibe-tg-editor-view';

const editor = document.getElementById('logo-editor');
const blocksTab = document.getElementById('tab-blocks');
const editorHelp = document.getElementById('editor-help');

const VIEWS = {
  chat: { tab: document.getElementById('tab-chat'), panel: document.getElementById('chat-view') },
  blocks: { tab: blocksTab, panel: document.getElementById('blocks-view') },
  text: { tab: document.getElementById('tab-text'), panel: document.getElementById('text-view') }
};

const HELP_TEXT = {
  chat: '描きたい絵を日本語で伝えると、AIがLOGOのコードを書いて実行します。モデル（ブラウザー内・ローカルサーバー・API）や指示文は「設定」で変えられます。',
  blocks: '左のパレットからブロックをドラッグし、「旗が押されたとき」の下につなげます。定義ブロックで自分の命令も作れます。',
  text: 'コマンドは言語欄で選んだ英語・スペイン語・日本語で書きます。例を選ぶとコードを読み込めます。'
};

const COLOURS = [
  ['黒', '#000000'], ['青', '#0000FF'], ['緑', '#008000'], ['シアン', '#00FFFF'],
  ['赤', '#FF0000'], ['マゼンタ', '#FF00FF'], ['黄', '#FFFF00'], ['白', '#FFFFFF'],
  ['茶', '#A52A2A'], ['タン', '#D2B48C'], ['深緑', '#228B22'], ['水色', '#00FFFF'],
  ['サーモン', '#FA8072'], ['紫', '#800080'], ['オレンジ', '#FFA500'], ['灰', '#E8E8E8']
];

// Blocks whose only input is a single numeric expression, keyed by block type.
const NUMBER_STATEMENTS = {
  logo_forward: { primitive: 'FORWARD', input: 'STEPS', message: '%1 歩前に進む', colour: 'motion', value: 50 },
  logo_back: { primitive: 'BACK', input: 'STEPS', message: '%1 歩後ろに下がる', colour: 'motion', value: 50 },
  logo_right: { primitive: 'RIGHT', input: 'DEGREES', message: '右に %1 度回す', colour: 'motion', value: 90, icon: 'rotate-right.svg' },
  logo_left: { primitive: 'LEFT', input: 'DEGREES', message: '左に %1 度回す', colour: 'motion', value: 90, icon: 'rotate-left.svg' },
  logo_setheading: { primitive: 'SETHEADING', input: 'DEGREES', message: '向きを %1 度にする', colour: 'motion', value: 0 },
  logo_setpensize: { primitive: 'SETPENSIZE', input: 'SIZE', message: 'ペンの太さを %1 にする', colour: 'pen', value: 2 },
  logo_setlabelheight: { primitive: 'SETLABELHEIGHT', input: 'SIZE', message: '文字の大きさを %1 にする', colour: 'looks', value: 30 },
  logo_wait: { primitive: 'WAIT', input: 'TIME', message: '%1 /100秒待つ', colour: 'control', value: 50 }
};

const COLOUR_STATEMENTS = {
  logo_setpencolor: { primitive: 'SETPENCOLOR', message: 'ペンの色を %1 にする', value: 4 },
  logo_setbackground: { primitive: 'SETBACKGROUND', message: '背景の色を %1 にする', value: 15 }
};

const PLAIN_STATEMENTS = {
  logo_home: { primitive: 'HOME', message: '中央に戻る', colour: 'motion' },
  logo_pendown: { primitive: 'PENDOWN', message: 'ペンを下ろす', colour: 'pen' },
  logo_penup: { primitive: 'PENUP', message: 'ペンを上げる', colour: 'pen' },
  logo_clearscreen: { primitive: 'CLEARSCREEN', message: '全部消して中央に戻る', colour: 'pen' },
  logo_clean: { primitive: 'CLEAN', message: '描いた線だけ消す', colour: 'pen' },
  logo_showturtle: { primitive: 'SHOWTURTLE', message: 'タートルを表示する', colour: 'looks' },
  logo_hideturtle: { primitive: 'HIDETURTLE', message: 'タートルを隠す', colour: 'looks' },
  logo_stop: {
    primitive: 'STOP',
    message: '止める',
    colour: 'control',
    tooltip: '定義の中ではその定義を抜けます。「旗が押されたとき」の下ではプログラム全体を止めます。'
  }
};

const ARITHMETIC = {
  operator_add: { op: '+', precedence: 1 },
  operator_subtract: { op: '-', precedence: 1 },
  operator_multiply: { op: '*', precedence: 2 },
  operator_divide: { op: '/', precedence: 2 }
};
const COMPARISON = { operator_lt: '<', operator_gt: '>' };

// Scratch 3 category colours: [primary, secondary, tertiary]. Scratch Blocks expects the host app to supply these.
const BLOCK_STYLES = {
  motion: ['#4C97FF', '#4280D7', '#3373CC'],
  looks: ['#9966FF', '#855CD6', '#774DCB'],
  sounds: ['#CF63CF', '#C94FC9', '#BD42BD'],
  control: ['#FFAB19', '#EC9C13', '#CF8B17'],
  event: ['#FFBF00', '#E6AC00', '#CC9900'],
  sensing: ['#5CB1D6', '#47A8D1', '#2E8EB8'],
  pen: ['#0FBD8C', '#0DA57A', '#0B8E69'],
  operators: ['#59C059', '#46B946', '#389438'],
  data: ['#FF8C1A', '#FF8000', '#DB6E00'],
  data_lists: ['#FF661A', '#FF5500', '#E64D00'],
  more: ['#FF6680', '#FF4D6A', '#FF3355'],
  textField: ['#FFFFFF', '#FFFFFF', '#DDDDDD']
};

const OPERATOR_TYPES ={ '+': 'operator_add', '-': 'operator_subtract', '*': 'operator_multiply', '/': 'operator_divide' };

let SB = null;
let workspace = null;
let view = 'text';
let lastSyncedText = null;
let isLoading = false;
let toolboxSignature = '';
let toolboxTimer = null;

function setStatus(message) {
  interpreter.setStatusBar(message);
}

// ---------- LOGO keyword helpers ----------

// Set only while generating code for a language other than the selected one (the block tests do this).
let codeLocale = null;

function keyword(primitive) {
  const entry = (codeLocale ?? interpreter.locale).primitiveAliases.find(item => item.primitive === primitive);
  return entry.aliases[entry.aliases.length - 1];
}

function primitiveName(code) {
  return Object.keys(Tokenizer.primitives).find(key => Tokenizer.primitives[key] === code);
}

// Names follow the tokenizer's idea of a letter, which includes Japanese characters.
const nameTokenizer = new Tokenizer();
function isNameCharacter(char) {
  return nameTokenizer.isLetter(char);
}

// Mirrors the tokenizer: digits never start a name, procedure names keep them only after an English first letter,
// parameter names after any first letter.
function cleanName(text, digitsAllowed) {
  const chars = [...text.normalize('NFKC')].filter(char => isNameCharacter(char) || /[0-9]/.test(char));
  while (chars.length && /[0-9]/.test(chars[0])) chars.shift();
  return (digitsAllowed(chars) ? chars : chars.filter(char => !/[0-9]/.test(char))).join('');
}

function isPrimitiveAlias(word) {
  const lower = word.toLowerCase();
  return interpreter.locale.primitiveAliases.some(item => item.aliases.includes(lower));
}

// ---------- Block definitions ----------

function numberShadow(value = 0) {
  return { shadow: { type: 'math_whole_number', fields: { NUM: value } } };
}

function colourShadow(value = 0) {
  return { shadow: { type: 'logo_colour_menu', fields: { COLOUR: String(value) } } };
}

function parseParams(text = '') {
  return text.split(/[\s,]+/).map(name => name.replace(/^:/, '')).filter(Boolean);
}

function defineBlocks() {
  const Blocks = SB.Blocks;

  Object.entries(NUMBER_STATEMENTS).forEach(([type, spec]) => {
    Blocks[type] = {
      init() {
        const ws = this.workspace.options.parentWorkspace ?? this.workspace;
        const args = [{ type: 'input_value', name: spec.input }];
        let message = spec.message;
        if (spec.icon) {
          args.unshift({ type: 'field_image', src: ws.options.pathToMedia + spec.icon, width: 24, height: 24 });
          message = message.replace('%1', '%1 %2');
        }
        this.jsonInit({ message0: message, args0: args, extensions: [`colours_${spec.colour}`, 'shape_statement'] });
      }
    };
  });

  Object.entries(COLOUR_STATEMENTS).forEach(([type, spec]) => {
    Blocks[type] = {
      init() {
        this.jsonInit({
          message0: spec.message,
          args0: [{ type: 'input_value', name: 'COLOUR' }],
          extensions: ['colours_pen', 'shape_statement']
        });
      }
    };
  });

  Object.entries(PLAIN_STATEMENTS).forEach(([type, spec]) => {
    Blocks[type] = {
      init() {
        this.jsonInit({ message0: spec.message, extensions: [`colours_${spec.colour}`, 'shape_statement'] });
        if (spec.tooltip) this.setTooltip(spec.tooltip);
      }
    };
  });

  Blocks.logo_label = {
    init() {
      this.jsonInit({
        message0: '%1 と書く',
        args0: [{ type: 'field_input', name: 'TEXT', text: 'こんにちは' }],
        extensions: ['colours_looks', 'shape_statement']
      });
    }
  };

  Blocks.logo_colour_menu = {
    init() {
      this.jsonInit({
        message0: '%1',
        args0: [{
          type: 'field_dropdown',
          name: 'COLOUR',
          options: COLOURS.map(([name], index) => [`${index} ${name}`, String(index)])
        }],
        extensions: ['colours_pen', 'output_number']
      });
    }
  };

  Blocks.logo_procedure_def = {
    init() {
      this.jsonInit({
        message0: '定義 %1 引数 %2',
        args0: [
          { type: 'field_input', name: 'NAME', text: 'shape' },
          { type: 'field_input', name: 'PARAMS', text: '' }
        ],
        extensions: ['colours_more', 'shape_hat']
      });
      this.setTooltip('名前は英字か、ひらがな・カタカナ・漢字で入力します（英字で始まる名前と引数は、2文字目から数字も使えます）。引数は空白区切りです。');
      this.getField('NAME').setValidator(value => {
        const name = cleanName(value, chars => /[A-Za-z]/.test(chars[0] ?? ''));
        return name && !isPrimitiveAlias(name) ? name : null;
      });
      this.getField('PARAMS').setValidator(value =>
        value.normalize('NFKC').split(/[^\p{L}\p{N}]+/u).map(word => cleanName(word, () => true)).filter(Boolean).join(' '));
    }
  };

  Blocks.logo_param = {
    init() {
      this.jsonInit({
        message0: '%1',
        args0: [{ type: 'field_label_serializable', name: 'NAME', text: 'value' }],
        extensions: ['colours_more', 'output_number']
      });
    }
  };

  Blocks.logo_procedure_call = {
    init() {
      this.jsonInit({ message0: '%1', args0: [{ type: 'field_label_serializable', name: 'NAME', text: '' }], extensions: ['colours_more', 'shape_statement'] });
      this.setInputsInline(true);
      this.params_ = [];
    },
    saveExtraState() {
      return { name: this.getFieldValue('NAME'), params: this.params_ };
    },
    loadExtraState(state) {
      this.setFieldValue(state.name ?? '', 'NAME');
      this.updateParams_(state.params ?? []);
    },
    updateParams_(params) {
      for (let i = params.length; i < this.params_.length; i++) {
        this.removeInput(`ARG${i}`);
      }
      params.forEach((param, i) => {
        let input = this.getInput(`ARG${i}`);
        if (!input) {
          input = this.appendValueInput(`ARG${i}`);
          input.connection.setShadowState({ type: 'math_whole_number', fields: { NUM: 0 } });
        }
        input.setCheck(null);
      });
      this.params_ = [...params];
    }
  };
}

function createTheme() {
  const blockStyles = {};
  Object.entries(BLOCK_STYLES).forEach(([name, [primary, secondary, tertiary]]) => {
    blockStyles[name] = { colourPrimary: primary, colourSecondary: secondary, colourTertiary: tertiary, colourQuaternary: tertiary };
    blockStyles[`${name}_selected`] = { colourPrimary: secondary, colourSecondary: secondary, colourTertiary: tertiary, colourQuaternary: tertiary };
  });
  return SB.Theme.defineTheme('vibe-tg', {
    blockStyles,
    componentStyles: {
      workspaceBackgroundColour: '#F9F9F9',
      toolboxBackgroundColour: '#FFFFFF',
      toolboxForegroundColour: '#575E75',
      flyoutBackgroundColour: '#F9F9F9',
      flyoutForegroundColour: '#575E75',
      scrollbarColour: '#CECDCE',
      insertionMarkerColour: '#000000',
      insertionMarkerOpacity: 0.2
    }
  });
}

// ---------- Toolbox ----------

function block(type, inputs, extra = {}) {
  return { kind: 'block', type, ...(inputs ? { inputs } : {}), ...extra };
}

function procedureDefinitions() {
  if (!workspace) return [];
  return workspace.getTopBlocks(true)
    .filter(b => b.type === 'logo_procedure_def')
    .map(b => ({ name: b.getFieldValue('NAME'), params: parseParams(b.getFieldValue('PARAMS')) }));
}

function buildToolbox() {
  const numberBlock = type => block(type, { [NUMBER_STATEMENTS[type].input]: numberShadow(NUMBER_STATEMENTS[type].value) });
  const colourBlock = type => block(type, { COLOUR: colourShadow(COLOUR_STATEMENTS[type].value) });

  const procedureContents = [block('logo_procedure_def')];
  procedureDefinitions().forEach(def => {
    const inputs = {};
    def.params.forEach((_, i) => { inputs[`ARG${i}`] = numberShadow(i === 0 ? 50 : 0); });
    procedureContents.push(block('logo_procedure_call', inputs, { extraState: { name: def.name, params: def.params } }));
    def.params.forEach(param => procedureContents.push(block('logo_param', null, { fields: { NAME: param } })));
  });

  return {
    kind: 'categoryToolbox',
    contents: [
      {
        kind: 'category', name: '動き', colour: '#4C97FF', contents: [
          numberBlock('logo_forward'), numberBlock('logo_back'), numberBlock('logo_right'),
          numberBlock('logo_left'), numberBlock('logo_setheading'), block('logo_home')
        ]
      },
      {
        kind: 'category', name: 'ペン', colour: '#0FBD8C', contents: [
          block('logo_pendown'), block('logo_penup'), colourBlock('logo_setpencolor'),
          numberBlock('logo_setpensize'), colourBlock('logo_setbackground'),
          block('logo_clearscreen'), block('logo_clean')
        ]
      },
      {
        kind: 'category', name: '見た目', colour: '#9966FF', contents: [
          block('logo_label'), numberBlock('logo_setlabelheight'),
          block('logo_showturtle'), block('logo_hideturtle')
        ]
      },
      {
        kind: 'category', name: 'イベント', colour: '#FFBF00', contents: [block('event_whenflagclicked')]
      },
      {
        kind: 'category', name: '制御', colour: '#FFAB19', contents: [
          block('control_repeat', { TIMES: numberShadow(4) }),
          block('control_if'),
          numberBlock('logo_wait'),
          block('logo_stop')
        ]
      },
      {
        kind: 'category', name: '演算', colour: '#59C059', contents: [
          ...Object.keys(ARITHMETIC).map(type => block(type, { NUM1: numberShadow(), NUM2: numberShadow() })),
          ...Object.keys(COMPARISON).map(type => block(type, { OPERAND1: numberShadow(), OPERAND2: numberShadow(50) }))
        ]
      },
      { kind: 'category', name: '定義', colour: '#FF6680', contents: procedureContents }
    ]
  };
}

function refreshToolboxSoon() {
  clearTimeout(toolboxTimer);
  toolboxTimer = setTimeout(() => {
    const signature = JSON.stringify(procedureDefinitions());
    if (signature !== toolboxSignature) {
      toolboxSignature = signature;
      workspace.updateToolbox(buildToolbox());
      workspace.getToolbox().forceRerender();
    }
  }, 300);
}

// ---------- Blocks -> LOGO text ----------

function expression(target) {
  if (!target) return { code: '0', precedence: 3 };
  switch (target.type) {
    case 'math_whole_number':
    case 'math_number': {
      const value = Math.max(0, Math.trunc(Number(target.getFieldValue('NUM')) || 0));
      return { code: String(value), precedence: 3 };
    }
    case 'logo_colour_menu':
      return { code: target.getFieldValue('COLOUR'), precedence: 3 };
    case 'logo_param':
      return { code: `:${target.getFieldValue('NAME')}`, precedence: 3 };
  }
  const arithmetic = ARITHMETIC[target.type];
  if (arithmetic) {
    const left = expression(target.getInputTargetBlock('NUM1'));
    const right = expression(target.getInputTargetBlock('NUM2'));
    const nonAssociative = arithmetic.op === '-' || arithmetic.op === '/';
    const leftCode = left.precedence < arithmetic.precedence ? `(${left.code})` : left.code;
    const rightCode = right.precedence < arithmetic.precedence || (nonAssociative && right.precedence === arithmetic.precedence)
      ? `(${right.code})` : right.code;
    return { code: `${leftCode} ${arithmetic.op} ${rightCode}`, precedence: arithmetic.precedence };
  }
  return { code: '0', precedence: 3 };
}

function valueCode(block, inputName) {
  return expression(block.getInputTargetBlock(inputName)).code;
}

function conditionCode(target) {
  if (target && COMPARISON[target.type]) {
    return `${valueCode(target, 'OPERAND1')} ${COMPARISON[target.type]} ${valueCode(target, 'OPERAND2')}`;
  }
  return '0 > 1';
}

function isLabelLine(line) {
  return line.trimStart().startsWith(`${keyword('LABEL')} "`);
}

function bracketed(header, body) {
  if (body.length === 0) return [`${header} []`];
  const oneLine = body.map(line => line.trim()).join(' ');
  if (!body.some(isLabelLine) && oneLine.length <= 48) return [`${header} [${oneLine}]`];
  return [`${header} [`, ...body.map(line => `  ${line}`), ']'];
}

function statementLines(block) {
  if (NUMBER_STATEMENTS[block.type]) {
    const spec = NUMBER_STATEMENTS[block.type];
    return [`${keyword(spec.primitive)} ${valueCode(block, spec.input)}`];
  }
  if (COLOUR_STATEMENTS[block.type]) {
    return [`${keyword(COLOUR_STATEMENTS[block.type].primitive)} ${valueCode(block, 'COLOUR')}`];
  }
  if (PLAIN_STATEMENTS[block.type]) {
    return [keyword(PLAIN_STATEMENTS[block.type].primitive)];
  }
  switch (block.type) {
    case 'logo_label':
      return [`${keyword('LABEL')} "${block.getFieldValue('TEXT')}`];
    case 'control_repeat':
      return bracketed(`${keyword('REPEAT')} ${valueCode(block, 'TIMES')}`, sequenceLines(block.getInputTargetBlock('SUBSTACK')));
    case 'control_if':
      return bracketed(`${keyword('IF')} ${conditionCode(block.getInputTargetBlock('CONDITION'))}`, sequenceLines(block.getInputTargetBlock('SUBSTACK')));
    case 'logo_procedure_call': {
      const args = block.params_.map((_, i) => valueCode(block, `ARG${i}`));
      return [[block.getFieldValue('NAME'), ...args].join(' ')];
    }
  }
  return [];
}

function sequenceLines(first) {
  const lines = [];
  for (let current = first; current; current = current.getNextBlock()) {
    if (current.isEnabled()) lines.push(...statementLines(current));
  }
  return lines;
}

function generateCode(source = workspace) {
  const topBlocks = source.getTopBlocks(true);
  const sections = [];
  topBlocks.filter(b => b.type === 'logo_procedure_def').forEach(def => {
    const params = parseParams(def.getFieldValue('PARAMS')).map(p => `:${p}`);
    sections.push([
      [keyword('TO'), def.getFieldValue('NAME'), ...params].join(' '),
      ...sequenceLines(def.getNextBlock()).map(line => `  ${line}`),
      keyword('END')
    ].join('\n'));
  });
  const main = topBlocks
    .filter(b => b.type === 'event_whenflagclicked')
    .flatMap(start => sequenceLines(start.getNextBlock()));
  if (main.length) sections.push(main.join('\n'));
  return sections.join('\n\n');
}

function hasStartBlock() {
  return workspace.getTopBlocks(false).some(b => b.type === 'event_whenflagclicked');
}

// ---------- LOGO text -> blocks ----------

class ConversionError extends Error {}

function textToWorkspaceState(text, tokenizer = interpreter.tokenizer) {
  const tokens = tokenizer.tokenize(text)
    .filter(token => !(token.tokenType === Tokenizer.tokenTypes.DELIMITER && token.text === Tokenizer.LF));
  const unknown = tokens.find(token => token.tokenType === Tokenizer.tokenTypes.UNKNOWN_TOKEN);
  if (unknown) throw new ConversionError(`認識できない記号「${unknown.text}」があります。`);

  const procedures = {};
  tokens.forEach((token, i) => {
    if (token.primitive === Tokenizer.primitives.TO && tokens[i + 1]?.tokenType === Tokenizer.tokenTypes.PROCEDURE_NAME) {
      const params = [];
      for (let j = i + 2; tokens[j]?.tokenType === Tokenizer.tokenTypes.VARIABLE; j++) params.push(tokens[j].text.slice(1));
      procedures[tokens[i + 1].text] = params;
    }
  });

  let index = 0;
  let scopeParams = [];
  const peek = () => tokens[index];
  const next = () => tokens[index++];
  const isDelimiter = (token, text) => token?.tokenType === Tokenizer.tokenTypes.DELIMITER && token.text === text;
  const describe = token => token ? `「${token.text}」` : 'プログラムの終わり';

  function expect(text) {
    const token = next();
    if (!isDelimiter(token, text)) throw new ConversionError(`「${text}」が必要な場所に${describe(token)}があります。`);
  }

  function factor() {
    const token = next();
    if (token?.tokenType === Tokenizer.tokenTypes.NUMBER) return { number: Number(token.text) };
    if (token?.tokenType === Tokenizer.tokenTypes.VARIABLE) {
      const name = token.text.slice(1);
      if (!scopeParams.includes(name)) {
        throw new ConversionError(`「${token.text}」は、それを引数に持つ定義の中でしか使えません。`);
      }
      return { block: { type: 'logo_param', fields: { NAME: name } } };
    }
    if (isDelimiter(token, Tokenizer.delimiters.OPENING_PARENTHESIS)) {
      const inner = additive();
      expect(Tokenizer.delimiters.CLOSING_PARENTHESIS);
      return inner;
    }
    throw new ConversionError(`数か変数が必要な場所に${describe(token)}があります。`);
  }

  function binary(operand, operators) {
    let left = operand();
    while (peek() && peek().tokenType === Tokenizer.tokenTypes.DELIMITER && operators.includes(peek().text)) {
      const op = next().text;
      const right = operand();
      left = { block: { type: OPERATOR_TYPES[op], inputs: { NUM1: toInput(left), NUM2: toInput(right) } } };
    }
    return left;
  }
  const term = () => binary(factor, ['*', '/']);
  const additive = () => binary(term, ['+', '-']);

  function toInput(expr, shadowFor = numberShadow) {
    if (expr.number !== undefined) return shadowFor(expr.number);
    return { ...shadowFor(0), block: expr.block };
  }

  function colourInput(expr) {
    if (expr.number === undefined) return toInput(expr, colourShadow);
    if (expr.number < COLOURS.length) return colourShadow(expr.number);
    // The colour menu only has 0-15, so keep any other number as a plain number block instead of losing it.
    return { ...colourShadow(0), block: { type: 'math_whole_number', fields: { NUM: expr.number } } };
  }

  function body() {
    expect(Tokenizer.delimiters.OPENING_BRACKET);
    const statements = [];
    while (peek() && !isDelimiter(peek(), Tokenizer.delimiters.CLOSING_BRACKET)) statements.push(statement());
    expect(Tokenizer.delimiters.CLOSING_BRACKET);
    return statements;
  }

  function statement() {
    const token = next();
    if (token.tokenType === Tokenizer.tokenTypes.PROCEDURE_NAME) {
      const params = procedures[token.text];
      if (!params) throw new ConversionError(`定義されていない命令「${token.text}」があります。`);
      const inputs = {};
      params.forEach((_, i) => { inputs[`ARG${i}`] = toInput(additive()); });
      return { type: 'logo_procedure_call', extraState: { name: token.text, params }, inputs };
    }
    if (token.tokenType !== Tokenizer.tokenTypes.PRIMITIVE) {
      throw new ConversionError(`命令が必要な場所に${describe(token)}があります。`);
    }
    const name = primitiveName(token.primitive);
    const numberType = Object.keys(NUMBER_STATEMENTS).find(type => NUMBER_STATEMENTS[type].primitive === name);
    if (numberType) return { type: numberType, inputs: { [NUMBER_STATEMENTS[numberType].input]: toInput(additive()) } };
    const colourType = Object.keys(COLOUR_STATEMENTS).find(type => COLOUR_STATEMENTS[type].primitive === name);
    if (colourType) return { type: colourType, inputs: { COLOUR: colourInput(additive()) } };
    const plainType = Object.keys(PLAIN_STATEMENTS).find(type => PLAIN_STATEMENTS[type].primitive === name);
    if (plainType) return { type: plainType };

    switch (name) {
      case 'LABEL': {
        const text = peek()?.tokenType === Tokenizer.tokenTypes.TEXT ? next().text : '';
        return { type: 'logo_label', fields: { TEXT: text } };
      }
      case 'REPEAT': {
        const times = toInput(additive());
        return withSubstack({ type: 'control_repeat', inputs: { TIMES: times } }, body());
      }
      case 'IF': {
        const left = additive();
        const operator = next();
        const type = isDelimiter(operator, '<') ? 'operator_lt' : isDelimiter(operator, '>') ? 'operator_gt' : null;
        if (!type) throw new ConversionError(`比較記号（< か >）が必要な場所に${describe(operator)}があります。`);
        const right = additive();
        const condition = { block: { type, inputs: { OPERAND1: toInput(left), OPERAND2: toInput(right) } } };
        return withSubstack({ type: 'control_if', inputs: { CONDITION: condition } }, body());
      }
    }
    throw new ConversionError(`この場所では「${token.text}」を使えません。`);
  }

  function withSubstack(state, statements) {
    const substack = chain(statements);
    if (substack) state.inputs.SUBSTACK = { block: substack };
    return state;
  }

  function chain(statements) {
    for (let i = statements.length - 2; i >= 0; i--) statements[i].next = { block: statements[i + 1] };
    return statements[0] ?? null;
  }

  const definitions = [];
  const main = [];
  while (peek()) {
    if (peek().primitive === Tokenizer.primitives.TO) {
      next();
      const nameToken = next();
      if (nameToken?.tokenType !== Tokenizer.tokenTypes.PROCEDURE_NAME) {
        throw new ConversionError(`定義の名前が必要な場所に${describe(nameToken)}があります。`);
      }
      const params = [];
      while (peek()?.tokenType === Tokenizer.tokenTypes.VARIABLE) params.push(next().text.slice(1));
      scopeParams = params;
      const statements = [];
      while (peek() && peek().primitive !== Tokenizer.primitives.END) statements.push(statement());
      if (!peek()) throw new ConversionError(`定義「${nameToken.text}」の終わり（${keyword('END')}）がありません。`);
      next();
      scopeParams = [];
      const def = { type: 'logo_procedure_def', fields: { NAME: nameToken.text, PARAMS: params.join(' ') } };
      const first = chain(statements);
      if (first) def.next = { block: first };
      definitions.push(def);
    } else {
      main.push(statement());
    }
  }

  const start = { type: 'event_whenflagclicked' };
  const first = chain(main);
  if (first) start.next = { block: first };

  const blocks = [start, ...definitions].map((state, i) => ({ ...state, x: 40, y: i * 40 }));
  return { blocks: { languageVersion: 0, blocks } };
}

// ---------- Sync ----------

function syncProcedureCalls() {
  const definitions = Object.fromEntries(procedureDefinitions().map(def => [def.name, def.params]));
  workspace.getAllBlocks(false)
    .filter(b => b.type === 'logo_procedure_call')
    .forEach(call => {
      const params = definitions[call.getFieldValue('NAME')];
      if (params && JSON.stringify(params) !== JSON.stringify(call.params_)) call.updateParams_(params);
    });
}

function renameProcedureCalls(oldName, newName) {
  workspace.getAllBlocks(false)
    .filter(b => b.type === 'logo_procedure_call' && b.getFieldValue('NAME') === oldName)
    .forEach(call => call.setFieldValue(newName, 'NAME'));
}

function onWorkspaceChange(event) {
  if (isLoading || event.isUiEvent) return;
  if (event.type === SB.Events.BLOCK_CHANGE && event.element === 'field' && event.name === 'NAME') {
    const changed = workspace.getBlockById(event.blockId);
    if (changed?.type === 'logo_procedure_def') renameProcedureCalls(event.oldValue, event.newValue);
  }
  syncProcedureCalls();
  refreshToolboxSoon();
  const code = generateCode();
  editor.value = code;
  lastSyncedText = code;
}


function loadState(state) {
  isLoading = true;
  SB.Events.disable();
  try {
    workspace.clear();
    SB.serialization.workspaces.load(state, workspace);
    workspace.cleanUp();
  } finally {
    SB.Events.enable();
    isLoading = false;
  }
  workspace.clearUndo();
  refreshToolboxSoon();
}

function loadText(text) {
  loadState(textToWorkspaceState(text));
  lastSyncedText = text;
}

// Only works while the workspace is visible, because Blockly needs real metrics.
function scrollToStart() {
  const first = workspace.getTopBlocks(true)[0];
  if (!first) return;
  const position = first.getRelativeToSurfaceXY();
  workspace.scroll(24 - position.x * workspace.scale, 24 - position.y * workspace.scale);
}

// ---------- API for the chat assistant ----------

function englishTokenizer() {
  return new Tokenizer(i18n.English.primitiveAliases);
}

/** Returns null when the English LOGO program can be converted to blocks, otherwise the reason it cannot. */
export function checkProgram(text) {
  if (!text.trim()) return 'プログラムが空です。';
  try {
    textToWorkspaceState(text, englishTokenizer());
    return null;
  } catch (error) {
    if (error instanceof ConversionError) return error.message;
    throw error;
  }
}

/** Puts an English LOGO program into the editor (and blocks), rewritten in the currently selected LOGO language. */
export function applyProgram(text) {
  if (!workspace) {
    editor.value = text;
    return text;
  }
  loadState(textToWorkspaceState(text, englishTokenizer()));
  const code = generateCode();
  editor.value = code;
  lastSyncedText = code;
  if (view === 'blocks') scrollToStart();
  return code;
}

/** Converts a program to blocks and back on a throwaway workspace, in the given LOGO language (used by the tests). */
export function roundTripProgram(text, language) {
  return translateProgram(text, language, language);
}

/**
 * Rewrites a program from one LOGO language into another through blocks, on a throwaway workspace.
 * Throws ConversionError when the program cannot be read; returns null before the block editor has loaded.
 */
export function translateProgram(text, fromLanguage, toLanguage) {
  if (!SB) return null;
  const scratch = new SB.Workspace(new SB.Options({ media: SCRATCH_BLOCKS_MEDIA }));
  codeLocale = i18n[toLanguage];
  try {
    SB.serialization.workspaces.load(textToWorkspaceState(text, new Tokenizer(i18n[fromLanguage].primitiveAliases)), scratch);
    return generateCode(scratch);
  } finally {
    codeLocale = null;
    scratch.dispose();
  }
}

export function currentLanguage() {
  return Object.keys(i18n).find(name => i18n[name] === interpreter.locale);
}

export function selectView(name) {
  if (name === 'blocks') switchToBlocks();
  else switchTo(name);
}

// ---------- View switching ----------

function saveView(name) {
  try { localStorage.setItem(VIEW_STORAGE_KEY, name); } catch (_) { /* storage unavailable */ }
}

function savedView() {
  try { return localStorage.getItem(VIEW_STORAGE_KEY); } catch (_) { return null; }
}

function showView(name) {
  view = name;
  Object.entries(VIEWS).forEach(([key, { tab, panel }]) => {
    const selected = key === name;
    panel.hidden = !selected;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  editorHelp.textContent = HELP_TEXT[name];
  if (name === 'blocks' && workspace) SB.svgResize(workspace);
}

function switchToBlocks() {
  if (!workspace) return;
  const needsLoad = editor.value !== lastSyncedText;
  if (needsLoad) {
    try {
      loadText(editor.value);
    } catch (error) {
      if (!(error instanceof ConversionError)) throw error;
      setStatus(`ブロックに変換できませんでした：${error.message} コードを直してからもう一度切り替えてください。`);
      return;
    }
  }
  showView('blocks');
  saveView('blocks');
  if (needsLoad) scrollToStart();
}

function switchTo(name) {
  showView(name);
  saveView(name);
}

function setupTabs() {
  const names = Object.keys(VIEWS);
  names.forEach(name => {
    const tab = VIEWS[name].tab;
    tab.addEventListener('click', () => selectView(name));
    tab.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const step = event.key === 'ArrowRight' ? 1 : -1;
      const enabled = names.filter(n => !VIEWS[n].tab.disabled);
      const target = VIEWS[enabled[(enabled.indexOf(name) + step + enabled.length) % enabled.length]].tab;
      target.click();
      if (target.getAttribute('aria-selected') === 'true') target.focus();
    });
  });
}

function hookInterpreter() {
  const setEditor = interpreter.setEditor.bind(interpreter);
  interpreter.setEditor = text => {
    setEditor(text);
    if (view !== 'blocks') return;
    try {
      loadText(text);
      scrollToStart();
    } catch (error) {
      if (!(error instanceof ConversionError)) throw error;
      switchTo('text');
      setStatus(`このプログラムはブロックで表示できないため、コード表示に切り替えました：${error.message}`);
    }
  };

  const run = interpreter.run.bind(interpreter);
  interpreter.run = () => {
    run();
    if (view === 'blocks' && !hasStartBlock()) {
      setStatus('「旗が押されたとき」ブロックの下に、実行したいブロックをつなげてください。');
    }
  };

  document.addEventListener('keydown', event => {
    if (view === 'blocks' && (event.ctrlKey || event.metaKey) && event.key === 'Enter' && !event.isComposing) {
      event.preventDefault();
      interpreter.run();
    }
  });

  // Switching language loads that language's last run, which is empty the first time; translate the program instead.
  const languageSelect = document.getElementById('logo-languages');
  let before = { language: currentLanguage(), program: '' };
  // At the target, capture listeners run before the Interpreter's own change listener, so this still sees the old program.
  languageSelect.addEventListener('change', () => {
    before = { language: currentLanguage(), program: editor.value };
  }, { capture: true });
  languageSelect.addEventListener('change', () => {
    if (editor.value.trim() || !before.program.trim()) return;
    try {
      const translated = translateProgram(before.program, before.language, currentLanguage());
      if (translated) interpreter.setEditor(translated);
    } catch (error) {
      if (!(error instanceof ConversionError)) throw error;
    }
  });
}

// Scratch's flyout has a fixed 250px width and 0.675 scale, which leaves almost no workspace on a phone.
function fitFlyoutToNarrowScreen() {
  const flyout = workspace.getFlyout();
  flyout.getFlyoutScale = () => 0.5;
  flyout.getWidth = () => 180;
  workspace.getToolbox().forceRerender();
  SB.svgResize(workspace);
}

async function init() {
  setupTabs();
  const isNarrow = window.matchMedia('(max-width: 600px)').matches;
  const preferred = savedView() ?? 'blocks';
  try {
    SB = await import(SCRATCH_BLOCKS_URL);
    SB.ScratchMsgs.setLocale('ja');
    defineBlocks();
    // The workspace must be visible while injecting so Blockly can measure it.
    showView('blocks');
    workspace = SB.inject(document.getElementById('blocks-workspace'), {
      toolbox: buildToolbox(),
      theme: createTheme(),
      media: SCRATCH_BLOCKS_MEDIA,
      zoom: { controls: true, wheel: true, startScale: isNarrow ? 0.5 : 0.7 },
      trashcan: false,
      sounds: false
    });
    if (isNarrow) fitFlyoutToNarrowScreen();
  } catch (error) {
    console.error(error);
    workspace = null;
    blocksTab.disabled = true;
    showView(preferred === 'chat' ? 'chat' : 'text');
    setStatus('ブロックエディタを読み込めませんでした（ネットワーク接続を確認してください）。コードで編集できます。');
    return;
  }
  // Recycled flyout blocks are reused by type without reapplying fields, so parameter blocks would keep stale names.
  workspace.getFlyout().setRecyclingEnabled(false);
  workspace.addChangeListener(onWorkspaceChange);
  hookInterpreter();
  runBlockTests({ checkProgram, roundTripProgram });

  showView('text');
  if (preferred === 'blocks') switchToBlocks();
  else if (preferred === 'chat') switchTo('chat');
}

init();
