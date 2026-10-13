// Runs a LOGO program without drawing anything, to catch shapes the turtle "draws" with the pen up.
// Small models often lift the pen to move to a part and forget pd before drawing it.
// Tokenizer, Parser, Turtle and i18n are the globals defined by js/logo.js and js/logo.i18n.js.

const MAX_STEPS = 20000;
// Getting to the start of a part takes a few moves; more moves than this in one pen-up stretch means a shape was drawn with the pen up.
const MAX_JUMP_MOVES = 3;

const DEFAULT_BACKGROUND = 15;
const DEFAULT_PEN_COLOR = 0;
// WCAG contrast ratio below which a line is hard to see. On the default light grey this catches white, yellow, cyan,
// aqua and grey, while orange and tan (about 1.6) still pass.
const MIN_CONTRAST = 1.5;

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function colorOf(index) {
  const i = Math.trunc(index);
  return (Turtle.colors[i] ?? Turtle.colors[0]).color;
}

function hardToSee(penColor, background) {
  const [light, dark] = [luminance(colorOf(penColor)), luminance(colorOf(background))].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05) < MIN_CONTRAST;
}

/**
 * Returns null when the pen use looks right. Otherwise returns { kind, moves, color }:
 * kind 'nothing' when no line is drawn at all, 'shape' when a long run of moves happens with the pen up,
 * 'invisible' when every line is drawn in a color that is hard to see on the background.
 * Programs that hit a runtime error or run too long are not judged, since the real run will show those.
 */
export function findPenUpProblem(code) {
  const primitives = Tokenizer.primitives;
  const parser = new Parser();
  let penDown = true;
  let penColor = DEFAULT_PEN_COLOR;
  let background = DEFAULT_BACKGROUND;
  let drawn = 0;
  let visible = 0;
  let stretch = 0;
  let longest = 0;
  let failed = false;

  parser.execute_wait = () => {};
  // Keep the events away from the real Interpreter, which would otherwise draw them on the canvas.
  parser.raiseEvent = (name, payload) => {
    if (name === Parser.events.errorEvent.name) {
      failed = true;
      parser.stopParsing();
      return;
    }
    if (name !== Parser.events.turtleDrawingEvent.name) return;
    switch (payload.primitive) {
      case primitives.PENUP:
        penDown = false;
        stretch = 0;
        break;
      case primitives.PENDOWN:
        penDown = true;
        break;
      case primitives.SETPENCOLOR:
        penColor = payload.arg;
        break;
      case primitives.SETBACKGROUND:
        background = payload.arg;
        break;
      case primitives.FORWARD:
      case primitives.BACK:
        if (penDown) {
          drawn++;
          if (!hardToSee(penColor, background)) visible++;
        } else {
          stretch++;
          longest = Math.max(longest, stretch);
        }
        break;
      case primitives.LABEL:
        // Labels are drawn with the pen up too, so moves between labels are deliberate
        drawn++;
        if (!hardToSee(penColor, background)) visible++;
        stretch = 0;
        break;
    }
  };

  parser.initializeParsing(new Tokenizer(i18n.English.primitiveAliases).tokenize(code));
  let steps = 0;
  while (!parser.isEndOfScript() && !parser.stopParsingRequested && steps < MAX_STEPS) {
    parser.parsingStep();
    steps++;
  }
  if (failed || steps >= MAX_STEPS) return null;
  if (drawn === 0 && longest > 0) return { kind: 'nothing', moves: longest };
  if (longest > MAX_JUMP_MOVES) return { kind: 'shape', moves: longest };
  if (drawn > 0 && visible === 0) return { kind: 'invisible', color: Math.trunc(penColor), background: Math.trunc(background) };
  return null;
}
