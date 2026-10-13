function runParserTests(Tokenizer, Parser, i18n) {    
    let testPassed = (testName) => {
        console.log(`%cTEST %cPASSED %cParser ${testName}`, 'color: black;', 'color: green; font-weight:bold;', 'color: grey;');
    };
    let testFailed = (testName) => {
        console.log(`%cTEST %cFAILED %cParser ${testName}`, 'color: black;', 'color: red; font-weight:bold;', 'color: grey;');
    };
    let assertExpression = (expression = "", expectedValue = 0) => {
        let tokenizer = new Tokenizer(i18n['English'].primitiveAliases); // Tests only with English primitives for expressions
        let parser = new Parser();
        
        let tokens = tokenizer.tokenize(expression);
        parser.initializeParsing(tokens);

        let actualValue = parser.getExpression();

        let success = expectedValue === actualValue;

        if (success) {
            testPassed(`Expression "${expression} = ${expectedValue}"`);
        } else {
            testFailed(`Expression "${expression} = ${expectedValue}" but we get ${actualValue} instead`);
        }

        return success;
    };
    let assertScript = (
        testName = "",
        language = "English",
        script = "",
        expectedTurtleDrawingEvents = [],
        expectedErrorCode = Parser.errors.NONE) => {

        let tokenizer = new Tokenizer(i18n[language].primitiveAliases);
        let parser = new Parser();
        let actualTurtleDrawingEvents = [];
        let actualErrorCode = Parser.errors.NONE;
        
        let onError = (e) => {
            actualErrorCode = e.detail.errorCode;
            parser.stopParsing(); // The Interpreter stops at an error too
        };
        let onTurtleDrawing = (e) => {
            actualTurtleDrawingEvents.push(e.detail);
        };
        window.addEventListener(Parser.events.errorEvent.name, onError, false);
        window.addEventListener(Parser.events.turtleDrawingEvent.name, onTurtleDrawing, false);

        let tokens = tokenizer.tokenize(script);
        parser.initializeParsing(tokens);
        do {
            parser.parsingStep();
        } while(parser.currentToken.tokenType !== Tokenizer.tokenTypes.END_OF_TOKEN_STREAM &&
            !parser.stopParsingRequested)

        window.removeEventListener(Parser.events.errorEvent.name, onError, false);
        window.removeEventListener(Parser.events.turtleDrawingEvent.name, onTurtleDrawing, false);

        let success = assertTurtleDrawingEvents(expectedTurtleDrawingEvents, actualTurtleDrawingEvents) === true
            && assertParserError(expectedErrorCode, actualErrorCode) === true;
        if (success) {
            testPassed(testName);
        } else {
            testFailed(testName);
            if (expectedTurtleDrawingEvents.length !== actualTurtleDrawingEvents.length) {
                console.table(expectedTurtleDrawingEvents, actualTurtleDrawingEvents);
                throw "Expected and actual turtle drawing events are different";
            }
        }
        return success;
    };
    let assertTurtleDrawingEvent = (expectedTurtleDrawingEvent = {}, actualTurtleDrawingEvent = {}) => {
        return expectedTurtleDrawingEvent[0] === actualTurtleDrawingEvent.primitive
            && expectedTurtleDrawingEvent[1] === actualTurtleDrawingEvent.arg;
    };
    let assertTurtleDrawingEvents = (expectedTurtleDrawingEvents = [], actualTurtleDrawingEvents = []) => {
        // Comparing lengths too, so a test also fails when the script draws more than it should (e.g. after STOP)
        return expectedTurtleDrawingEvents.length === actualTurtleDrawingEvents.length &&
            expectedTurtleDrawingEvents.every( (expectedTurtleDrawingEvent, index) =>
            assertTurtleDrawingEvent(expectedTurtleDrawingEvent, actualTurtleDrawingEvents[index])
        );
    };
    let assertParserError = (expectedErrorCode = Parser.errors.NONE, actualErrorCode = Parser.errors.NONE) => {
        return expectedErrorCode === actualErrorCode;
    };
    
    let lines = (arr) => arr.join('\n');

    let tests = [];

    tests.push(assertExpression("60", 60));
    tests.push(assertExpression("30 + 30", 60));
    tests.push(assertExpression("2 * 15 + 30", 60));
    tests.push(assertExpression("100 / 2 + 10", 60));
    tests.push(assertExpression("2 * 10 + 50 - 70 / 7", 60));
    tests.push(assertExpression("(2 + 3) * 4", 20));
    tests.push(assertExpression("100 - (30 - 10)", 80));
    tests.push(assertExpression("((1 + 2) * (3 + 4))", 21));

    tests.push(
        assertScript(
            "Drawing forward and turn right",
            "English",
            "fd 60 rt 90",
            [
                [Tokenizer.primitives.FORWARD, 60],
                [Tokenizer.primitives.RIGHT, 90]
            ]
        )
    );
    tests.push(
        assertScript(
            "Square with REPEAT primitive",
            "English",
            "repeat 4 [fd 60 rt 90]",
            [
                [Tokenizer.primitives.FORWARD, 60],
                [Tokenizer.primitives.RIGHT, 90],
                [Tokenizer.primitives.FORWARD, 60],
                [Tokenizer.primitives.RIGHT, 90],
                [Tokenizer.primitives.FORWARD, 60],
                [Tokenizer.primitives.RIGHT, 90],
                [Tokenizer.primitives.FORWARD, 60],
                [Tokenizer.primitives.RIGHT, 90]
            ]
        )
    );
    tests.push(
        assertScript(
            "Double REPEAT with inside one in the middle of the primitives of the first one",
            "English",
            "repeat 3 [fd 60 repeat 4 [lt 90 bk 20] rt 120]",
            [
                [Tokenizer.primitives.FORWARD, 60],

                [Tokenizer.primitives.LEFT, 90],
                [Tokenizer.primitives.BACK, 20],
                [Tokenizer.primitives.LEFT, 90],
                [Tokenizer.primitives.BACK, 20],
                [Tokenizer.primitives.LEFT, 90],
                [Tokenizer.primitives.BACK, 20],
                [Tokenizer.primitives.LEFT, 90],
                [Tokenizer.primitives.BACK, 20],

                [Tokenizer.primitives.RIGHT, 120],

                [Tokenizer.primitives.FORWARD, 60],

                [Tokenizer.primitives.LEFT, 90],
                [Tokenizer.primitives.BACK, 20],
                [Tokenizer.primitives.LEFT, 90],
                [Tokenizer.primitives.BACK, 20],
                [Tokenizer.primitives.LEFT, 90],
                [Tokenizer.primitives.BACK, 20],
                [Tokenizer.primitives.LEFT, 90],
                [Tokenizer.primitives.BACK, 20],

                [Tokenizer.primitives.RIGHT, 120],

                [Tokenizer.primitives.FORWARD, 60],

                [Tokenizer.primitives.LEFT, 90],
                [Tokenizer.primitives.BACK, 20],
                [Tokenizer.primitives.LEFT, 90],
                [Tokenizer.primitives.BACK, 20],
                [Tokenizer.primitives.LEFT, 90],
                [Tokenizer.primitives.BACK, 20],
                [Tokenizer.primitives.LEFT, 90],
                [Tokenizer.primitives.BACK, 20],

                [Tokenizer.primitives.RIGHT, 120]
            ]
        )
    );
    tests.push(
        assertScript(
            "Recursive tree",
            "English",
            lines([
                "to tree :length",
                "  if :length < 15 [stop]",
                "  fd :length",
                "  lt 45",
                "  tree :length/2",
                "  rt 90",
                "  tree :length/2",
                "  lt 45",
                "  bk :length",
                "end",
                "cs",
                "bk 100",
                "tree 160"
            ]),
            [
                [Tokenizer.primitives.CLEARSCREEN, 0],
                [Tokenizer.primitives.BACK, 100],

                // start tree 160 --------------------------------------------------------------
                [Tokenizer.primitives.FORWARD, 160],                                          //
                [Tokenizer.primitives.LEFT, 45],                                              //
                //                                                                            //
                // start tree 80 ---------------------------------------------------          //
                [Tokenizer.primitives.FORWARD, 80],                               //          //
                [Tokenizer.primitives.LEFT, 45],                                  //          //
                //                                                                //          //
                // start tree 40 ---------------------------------------          //          //
                [Tokenizer.primitives.FORWARD, 40],                   //          //          //
                [Tokenizer.primitives.LEFT, 45],                      //          //          //
                //                                                    //          //          //
                // start tree 20 ---------------------------          //          //          //
                [Tokenizer.primitives.FORWARD, 20],       //          //          //          //
                [Tokenizer.primitives.LEFT, 45],          //          //          //          //
                //                                        //          //          //          //
                [Tokenizer.primitives.RIGHT, 90],         //          //          //          //
                //                                        //          //          //          //
                [Tokenizer.primitives.LEFT, 45],          //          //          //          //
                [Tokenizer.primitives.BACK, 20],          //          //          //          //
                // end tree 20 -----------------------------          //          //          //
                //                                                    //          //          //
                [Tokenizer.primitives.RIGHT, 90],                     //          //          //
                //                                                    //          //          //
                // start tree 20 ---------------------------          //          //          //
                [Tokenizer.primitives.FORWARD, 20],       //          //          //          //
                [Tokenizer.primitives.LEFT, 45],          //          //          //          //
                //                                        //          //          //          //
                [Tokenizer.primitives.RIGHT, 90],         //          //          //          //
                //                                        //          //          //          //
                [Tokenizer.primitives.LEFT, 45],          //          //          //          //
                [Tokenizer.primitives.BACK, 20],          //          //          //          //
                // end tree 20 -----------------------------          //          //          //
                //                                                    //          //          //
                [Tokenizer.primitives.LEFT, 45],                      //          //          //
                [Tokenizer.primitives.BACK, 40],                      //          //          //
                // end tree 40 -----------------------------------------          //          //
                //                                                                //          //
                [Tokenizer.primitives.RIGHT, 90],                                 //          //
                //                                                                //          //
                // start tree 40 ---------------------------------------          //          //
                [Tokenizer.primitives.FORWARD, 40],                   //          //          //
                [Tokenizer.primitives.LEFT, 45],                      //          //          //
                //                                                    //          //          //
                // start tree 20 ---------------------------          //          //          //
                [Tokenizer.primitives.FORWARD, 20],       //          //          //          //
                [Tokenizer.primitives.LEFT, 45],          //          //          //          //
                //                                        //          //          //          //
                [Tokenizer.primitives.RIGHT, 90],         //          //          //          //
                //                                        //          //          //          //
                [Tokenizer.primitives.LEFT, 45],          //          //          //          //
                [Tokenizer.primitives.BACK, 20],          //          //          //          //
                // end tree 20 -----------------------------          //          //          //
                //                                                    //          //          //
                [Tokenizer.primitives.RIGHT, 90],                     //          //          //
                //                                                    //          //          //
                // start tree 20 ---------------------------          //          //          //
                [Tokenizer.primitives.FORWARD, 20],       //          //          //          //
                [Tokenizer.primitives.LEFT, 45],          //          //          //          //
                //                                        //          //          //          //
                [Tokenizer.primitives.RIGHT, 90],         //          //          //          //
                //                                        //          //          //          //
                [Tokenizer.primitives.LEFT, 45],          //          //          //          //
                [Tokenizer.primitives.BACK, 20],          //          //          //          //
                // end tree 20 -----------------------------          //          //          //
                //                                                    //          //          //
                [Tokenizer.primitives.LEFT, 45],                      //          //          //
                [Tokenizer.primitives.BACK, 40],                      //          //          //
                // end tree 40 -----------------------------------------          //          //
                //                                                                //          //
                [Tokenizer.primitives.LEFT, 45],                                  //          //
                [Tokenizer.primitives.BACK, 80],                                  //          //
                // end tree 80 -----------------------------------------------------          //
                //                                                                            //
                [Tokenizer.primitives.RIGHT, 90],                                             //
                //                                                                            //
                // start tree 80 ---------------------------------------------------          //
                [Tokenizer.primitives.FORWARD, 80],                               //          //
                [Tokenizer.primitives.LEFT, 45],                                  //          //
                //                                                                //          //
                // start tree 40 ---------------------------------------          //          //
                [Tokenizer.primitives.FORWARD, 40],                   //          //          //
                [Tokenizer.primitives.LEFT, 45],                      //          //          //
                //                                                    //          //          //
                // start tree 20 ---------------------------          //          //          //
                [Tokenizer.primitives.FORWARD, 20],       //          //          //          //
                [Tokenizer.primitives.LEFT, 45],          //          //          //          //
                //                                        //          //          //          //
                [Tokenizer.primitives.RIGHT, 90],         //          //          //          //
                //                                        //          //          //          //
                [Tokenizer.primitives.LEFT, 45],          //          //          //          //
                [Tokenizer.primitives.BACK, 20],          //          //          //          //
                // end tree 20 -----------------------------          //          //          //
                //                                                    //          //          //
                [Tokenizer.primitives.RIGHT, 90],                     //          //          //
                //                                                    //          //          //
                // start tree 20 ---------------------------          //          //          //
                [Tokenizer.primitives.FORWARD, 20],       //          //          //          //
                [Tokenizer.primitives.LEFT, 45],          //          //          //          //
                //                                        //          //          //          //
                [Tokenizer.primitives.RIGHT, 90],         //          //          //          //
                //                                        //          //          //          //
                [Tokenizer.primitives.LEFT, 45],          //          //          //          //
                [Tokenizer.primitives.BACK, 20],          //          //          //          //
                // end tree 20 -----------------------------          //          //          //
                //                                                    //          //          //
                [Tokenizer.primitives.LEFT, 45],                      //          //          //
                [Tokenizer.primitives.BACK, 40],                      //          //          //
                // end tree 40 -----------------------------------------          //          //
                //                                                                //          //
                [Tokenizer.primitives.RIGHT, 90],                                 //          //
                //                                                                //          //
                // start tree 40 ---------------------------------------          //          //
                [Tokenizer.primitives.FORWARD, 40],                   //          //          //
                [Tokenizer.primitives.LEFT, 45],                      //          //          //
                //                                                    //          //          //
                // start tree 20 ---------------------------          //          //          //
                [Tokenizer.primitives.FORWARD, 20],       //          //          //          //
                [Tokenizer.primitives.LEFT, 45],          //          //          //          //
                //                                        //          //          //          //
                [Tokenizer.primitives.RIGHT, 90],         //          //          //          //
                //                                        //          //          //          //
                [Tokenizer.primitives.LEFT, 45],          //          //          //          //
                [Tokenizer.primitives.BACK, 20],          //          //          //          //
                // end tree 20 -----------------------------          //          //          //
                //                                                    //          //          //
                [Tokenizer.primitives.RIGHT, 90],                     //          //          //
                //                                                    //          //          //
                // start tree 20 ---------------------------          //          //          //
                [Tokenizer.primitives.FORWARD, 20],       //          //          //          //
                [Tokenizer.primitives.LEFT, 45],          //          //          //          //
                //                                        //          //          //          //
                [Tokenizer.primitives.RIGHT, 90],         //          //          //          //
                [Tokenizer.primitives.LEFT, 45],          //          //          //          //
                [Tokenizer.primitives.BACK, 20],          //          //          //          //
                // end tree 20 -----------------------------          //          //          //
                //                                                    //          //          //
                [Tokenizer.primitives.LEFT, 45],                      //          //          //
                [Tokenizer.primitives.BACK, 40],                      //          //          //
                // end tree 40 -----------------------------------------          //          //
                //                                                                //          //
                [Tokenizer.primitives.LEFT, 45],                                  //          //
                [Tokenizer.primitives.BACK, 80],                                  //          //
                // end tree 80 -----------------------------------------------------          //
                //                                                                            //
                [Tokenizer.primitives.LEFT, 45],                                              //
                [Tokenizer.primitives.BACK, 160]                                              //
                // end tree 160 ----------------------------------------------------------------
            ]
        )
    );
    tests.push(
        assertScript(
            "Trigger error CODEBLOCK_EXPECTED_OPENING_BRACKET when missing opening bracket",
            "English",
            "repeat 4 fd 60",
            [],
            Parser.errors.CODEBLOCK_EXPECTED_OPENING_BRACKET
        )
    );
    tests.push(
        assertScript(
            "Trigger error CODEBLOCK_EXPECTED_OPENING_BRACKET when missing opening bracket skipping a code block",
            "English",
            "if 3>5 fd 60",
            [],
            Parser.errors.CODEBLOCK_EXPECTED_OPENING_BRACKET
        )
    );
    tests.push(
        assertScript(
            "Trigger error EXPECTED_NUMBER_OR_VARIABLE",
            "English",
            "repeat [",
            [],
            Parser.errors.EXPECTED_NUMBER_OR_VARIABLE
        )
    );
    tests.push(
        assertScript(
            "Trigger error PROCEDURE_CALL_STACK_OVERFLOW",
            "English",
            lines([
                "to getoverflow",
                "  getoverflow",
                "end",
                "getoverflow"
            ]),
            [],
            Parser.errors.PROCEDURE_CALL_STACK_OVERFLOW
        )
    );
    tests.push(
        assertScript(
            "Trigger error PROCEDURE_NOT_DEFINED",
            "English",
            "potato fd 60",
            [],
            Parser.errors.PROCEDURE_NOT_DEFINED
        )
    );
    tests.push(
        assertScript(
            "Trigger error PROCEDURE_WITHOUT_END_TOKEN",
            "English",
            lines([
                "to test",
                "  fd 60"
            ]),
            [],
            Parser.errors.PROCEDURE_WITHOUT_END_TOKEN
        )
    );
    tests.push(
        assertScript(
            "Trigger error UNKNOWN_TOKEN_FOUND",
            "English",
            "fd 2^3",
            [
                [Tokenizer.primitives.FORWARD, 2]
            ],
            Parser.errors.UNKNOWN_TOKEN_FOUND
        )
    );
    tests.push(
        assertScript(
            "Trigger error UNMATCHED_CLOSING_BRACKET",
            "English",
            "fd 60 ]",
            [
                [Tokenizer.primitives.FORWARD, 60]
            ],
            Parser.errors.UNMATCHED_CLOSING_BRACKET
        )
    );
    tests.push(
        assertScript(
            "Trigger error CODEBLOCK_EXPECTED_CLOSING_BRACKET when a code block is never closed",
            "English",
            "repeat 2 [fd 10",
            [],
            Parser.errors.CODEBLOCK_EXPECTED_CLOSING_BRACKET
        )
    );
    tests.push(
        assertScript(
            "Trigger error CODEBLOCK_EXPECTED_CLOSING_BRACKET when a nested code block is never closed",
            "English",
            "repeat 2 [fd 10 repeat 3 [rt 90]",
            [],
            Parser.errors.CODEBLOCK_EXPECTED_CLOSING_BRACKET
        )
    );
    tests.push(
        assertScript(
            "A false IF skips nested code blocks",
            "English",
            "if 1 > 2 [repeat 2 [fd 10] rt 5] fd 7",
            [
                [Tokenizer.primitives.FORWARD, 7]
            ]
        )
    );
    tests.push(
        assertScript(
            "STOP outside a procedure ends the program",
            "English",
            "fd 10 stop fd 20",
            [
                [Tokenizer.primitives.FORWARD, 10]
            ]
        )
    );
    tests.push(
        assertScript(
            "STOP inside REPEAT outside a procedure ends the program",
            "English",
            "repeat 3 [fd 10 stop] fd 20",
            [
                [Tokenizer.primitives.FORWARD, 10]
            ]
        )
    );
    tests.push(
        assertScript(
            "STOP inside IF in a procedure keeps the caller's REPEAT running",
            "English",
            lines([
                "to test :n",
                "  if :n < 1 [stop]",
                "  fd 10",
                "end",
                "repeat 3 [test 0 rt 90]"
            ]),
            [
                [Tokenizer.primitives.RIGHT, 90],
                [Tokenizer.primitives.RIGHT, 90],
                [Tokenizer.primitives.RIGHT, 90]
            ]
        )
    );
    tests.push(
        assertScript(
            "STOP inside REPEAT in a procedure keeps the caller's REPEAT running",
            "English",
            lines([
                "to test",
                "  repeat 5 [fd 10 if 1 > 0 [stop]]",
                "end",
                "repeat 2 [test rt 90]"
            ]),
            [
                [Tokenizer.primitives.FORWARD, 10],
                [Tokenizer.primitives.RIGHT, 90],
                [Tokenizer.primitives.FORWARD, 10],
                [Tokenizer.primitives.RIGHT, 90]
            ]
        )
    );
    return tests.every(test => test);
}