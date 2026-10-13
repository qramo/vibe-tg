// Tests for the AI Chat pen check (js/pencheck.js). They run when the chat module loads and log like the upstream tests.
export function runPenCheckTests({ findPenUpProblem }) {
    let testPassed = (testName) => {
        console.log(`%cTEST %cPASSED %cPenCheck ${testName}`, 'color: black;', 'color: green; font-weight:bold;', 'color: grey;');
    };
    let testFailed = (testName) => {
        console.log(`%cTEST %cFAILED %cPenCheck ${testName}`, 'color: black;', 'color: red; font-weight:bold;', 'color: grey;');
    };
    let lines = (arr) => arr.join(Tokenizer.LF);
    let assertProblem = (testName = "", program = "", expectedKind = null) => {
        let problem = findPenUpProblem(program);
        let actualKind = problem === null ? null : problem.kind;
        let success = actualKind === expectedKind;
        if (success) {
            testPassed(testName);
        } else {
            testFailed(`${testName}: expected ${expectedKind} but we get ${actualKind} instead`);
        }
        return success;
    };

    let tests = [];

    i18n.English.examples.forEach(example => {
        tests.push(assertProblem(`Example "${example.name}" is fine`, example.code.join(Tokenizer.LF), null));
    });
    tests.push(assertProblem("Drawing with the pen down is fine", "fd 50 rt 90 fd 50", null));
    tests.push(assertProblem("Jumping with the pen up and then drawing is fine", "pu fd 20 rt 90 fd 30 lt 90 fd 10 pd repeat 4 [fd 50 rt 90]", null));
    tests.push(assertProblem("A program with no moves is fine", "cs ht", null));
    tests.push(assertProblem("Waiting does not hang the check", "fd 10 wait 50 fd 10", null));
    tests.push(assertProblem("A runtime error is left to the real run", lines([
        "to forever :n",
        "  fd 10",
        "  forever :n + 1",
        "end",
        "pu forever 1"
    ]), null));
    tests.push(assertProblem("Forgetting pd draws nothing", "pu fd 50 rt 90 fd 50", "nothing"));
    tests.push(assertProblem("A whole drawing with the pen up draws nothing", "cs pu bk 100 repeat 4 [fd 50 rt 90] pu home", "nothing"));
    tests.push(assertProblem("A shape drawn after a jump without pd is caught", "fd 50 pu fd 20 rt 90 repeat 4 [fd 30 rt 90] pd fd 10", "shape"));
    tests.push(assertProblem("A procedure shape drawn with the pen up is caught", lines([
        "to square :s",
        "  repeat 4 [fd :s rt 90]",
        "end",
        "square 50",
        "pu fd 80",
        "square 20"
    ]), "shape"));

    return tests.every(test => test);
}
