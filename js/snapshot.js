// Draws a LOGO program's finished picture off screen, without the turtle's animation, and returns it as a small JPEG.
// The vision model looks at this instead of waiting for the on-screen turtle to finish.
// Tokenizer, Parser, Turtle and i18n are the globals defined by js/logo.js and js/logo.i18n.js.

const CANVAS_SIZE = 560;
// WebLLM splits a Phi-3.5-vision image into up to 16 tiles of 336px, depending on its aspect ratio. A square image takes
// 16 tiles (about 2,500 tokens), more than the model's 2,048-token prefill chunk, so it fails. A 3:4 portrait image takes
// 12 tiles (about 1,930 tokens), so the square drawing is padded top and bottom to that shape.
const IMAGE_WIDTH = 336;
const IMAGE_HEIGHT = 448;
const MAX_STEPS = 20000;

export function renderSnapshot(code) {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const turtle = new Turtle(canvas);
  turtle.execute_hideturtle();

  const p = Tokenizer.primitives;
  const actions = {
    [p.BACK]: arg => turtle.execute_back(arg),
    [p.CLEAN]: () => turtle.execute_clean(),
    [p.CLEARSCREEN]: () => turtle.execute_clearscreen(),
    [p.FORWARD]: arg => turtle.execute_forward(arg),
    [p.HOME]: () => turtle.execute_home(),
    [p.LABEL]: arg => turtle.execute_label(arg),
    [p.LEFT]: arg => turtle.execute_left(arg),
    [p.PENDOWN]: () => turtle.execute_pendown(),
    [p.PENUP]: () => turtle.execute_penup(),
    [p.RIGHT]: arg => turtle.execute_right(arg),
    [p.SETBACKGROUND]: arg => turtle.execute_setbackground(arg),
    [p.SETHEADING]: arg => turtle.execute_setheading(arg),
    [p.SETLABELHEIGHT]: arg => turtle.execute_setlabelheight(arg),
    [p.SETPENCOLOR]: arg => turtle.execute_setpencolor(arg),
    [p.SETPENSIZE]: arg => turtle.execute_setpensize(arg)
  };

  const parser = new Parser();
  parser.execute_wait = () => {};
  // Keep the events away from the real Interpreter, which would otherwise draw them on the page's canvas.
  parser.raiseEvent = (name, payload) => {
    if (name === Parser.events.errorEvent.name) parser.stopParsing();
    else if (name === Parser.events.turtleDrawingEvent.name) actions[payload.primitive]?.(payload.arg);
  };
  parser.initializeParsing(new Tokenizer(i18n.English.primitiveAliases).tokenize(code));
  for (let steps = 0; !parser.isEndOfScript() && !parser.stopParsingRequested && steps < MAX_STEPS; steps++) {
    parser.parsingStep();
  }

  const image = document.createElement('canvas');
  image.width = IMAGE_WIDTH;
  image.height = IMAGE_HEIGHT;
  const context = image.getContext('2d');
  context.fillStyle = turtle.getColor(turtle.state.backgroundColorIndex);
  context.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
  context.drawImage(canvas, 0, (IMAGE_HEIGHT - IMAGE_WIDTH) / 2, IMAGE_WIDTH, IMAGE_WIDTH);
  return image.toDataURL('image/jpeg', 0.9);
}
