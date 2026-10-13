// Block editor tests. They run in the browser once the block editor has loaded and log like the upstream tests.
// Tokenizer and i18n are the globals defined by js/logo.js and js/logo.i18n.js.
export function runBlockTests({ checkProgram, roundTripProgram }) {
    let testPassed = (testName) => {
        console.log(`%cTEST %cPASSED %cBlocks ${testName}`, 'color: black;', 'color: green; font-weight:bold;', 'color: grey;');
    };
    let testFailed = (testName) => {
        console.log(`%cTEST %cFAILED %cBlocks ${testName}`, 'color: black;', 'color: red; font-weight:bold;', 'color: grey;');
    };
    let lines = (arr) => arr.join(Tokenizer.LF);
    let assertAccepted = (testName = "", program = "") => {
        let error = checkProgram(program);
        if (error === null) {
            testPassed(`Accepts ${testName}`);
        } else {
            testFailed(`Accepts ${testName}: ${error}`);
        }
        return error === null;
    };
    let assertRejected = (testName = "", program = "") => {
        let error = checkProgram(program);
        if (error !== null) {
            testPassed(`Rejects ${testName}`);
        } else {
            testFailed(`Rejects ${testName}: the program was accepted`);
        }
        return error !== null;
    };
    // Formatting may change (one command per line, spaces around operators), so compare the token texts only
    let assertRoundTrip = (language = "English", example = {}) => {
        let tokenizer = new Tokenizer(i18n[language].primitiveAliases);
        let normalize = (script) => tokenizer.tokenize(script)
            .filter(token => token.text !== Tokenizer.LF)
            .map(token => token.text)
            .join(" ");
        let original = example.code.join(Tokenizer.LF);
        let testName = `Round trip (${language}) "${example.name}"`;
        let success = false;
        try {
            let generated = roundTripProgram(original, language);
            success = normalize(original) === normalize(generated);
            if (!success) {
                console.log(`Expected: ${normalize(original)}\nActual:   ${normalize(generated)}`);
            }
        } catch (error) {
            console.log(error);
        }
        if (success) {
            testPassed(testName);
        } else {
            testFailed(testName);
        }
        return success;
    };

    let tests = [];

    i18n.English.examples.forEach(example => {
        tests.push(assertAccepted(`example "${example.name}"`, example.code.join(Tokenizer.LF)));
    });
    tests.push(assertAccepted("parentheses in expressions", "fd (10 + 20) * 2 rt 100 - (30 - 10)"));
    tests.push(assertAccepted("STOP outside a procedure", "fd 10 stop"));
    tests.push(assertAccepted("STOP inside IF in a procedure", lines([
        "to test :n",
        "  if :n < 1 [stop]",
        "  fd :n",
        "end",
        "repeat 3 [test 10 rt 120]"
    ])));
    tests.push(assertAccepted("a color number out of range", "setpc 16 fd 10"));

    tests.push(assertRejected("an unclosed code block", "repeat 2 [fd 10"));
    tests.push(assertRejected("an unmatched closing bracket", "fd 10 ]"));
    tests.push(assertRejected("an unknown symbol", "fd 10 @"));
    tests.push(assertRejected("a decimal number", "fd 1.5"));
    tests.push(assertRejected("a negative number", "rt -90"));
    tests.push(assertRejected("an undefined procedure", "square 10"));
    tests.push(assertRejected("a parameter outside its procedure", "fd :x"));
    tests.push(assertRejected("a procedure without END", lines(["to test", "  fd 10"])));
    tests.push(assertRejected("END outside a procedure", "fd 10 end"));
    tests.push(assertRejected("IF without a comparison", "if 1 [fd 10]"));

    tests.push(assertRoundTrip("English", { name: "color number out of range", code: ["setpc 16 fd 10 setbg 20"] }));
    tests.push(assertRoundTrip("English", { name: "STOP outside a procedure", code: ["repeat 3 [fd 10 stop]"] }));
    tests.push(assertRoundTrip("English", { name: "nested arithmetic", code: ["fd (10 + 20) * 2 - 100 / (2 + 3)"] }));
    tests.push(assertRoundTrip("English", { name: "parameter names with digits", code: ["to ball2 :r1 :r2", "  fd :r1 + :r2", "end", "ball2 10 20"] }));
    ["English", "Spanish", "Japanese"].forEach(language => {
        i18n[language].examples.forEach(example => tests.push(assertRoundTrip(language, example)));
    });

    return tests.every(test => test);
}
