function runTokenizerTests(i18n) {
    let testPassed = (testName) => {
        console.log(`%cTEST %cPASSED %c${testName}`, 'color: black;', 'color: green; font-weight:bold;', 'color: grey;');
    };
    let testFailed = (testName) => {
        console.log(`%cTEST %cFAILED %c${testName}`, 'color: black;', 'color: red; font-weight:bold;', 'color: grey;');
    };
    let assertToken = (expectedToken = {}, actualToken = {}) => {
        let success = actualToken.startIndex === expectedToken.startIndex &&
            actualToken.endIndex === expectedToken.endIndex &&
            actualToken.text === expectedToken.text &&
            actualToken.tokenType === expectedToken.tokenType &&
            actualToken.primitive === expectedToken.primitive;
        if (!success) {
            throw `Expected token: ${expectedToken} - Actual token: ${actualToken}`;
        }
        return success;
    };
    let assertTokens = (testName = "", language = "English", script = "", actualTokens = []) => {
        let tokenizer = new Tokenizer(i18n[language].primitiveAliases);

        let expectedTokens = tokenizer.tokenize(script);
        
        if (actualTokens.length !== expectedTokens.length) {
            console.table(expectedTokens);
            console.table(actualTokens);
            throw `TEST "${testName}": Expected and actual have different number of tokens`;
        }
        let success = expectedTokens.every((expectedToken, index) => assertToken(expectedToken, actualTokens[index]));
        
        if (success) {
            testPassed(`Tokenizer "${testName}"`);
        } else {
            testFailed(`Tokenizer "${testName}"`);
        }

        return success;
    };
    let lines = (arr) => arr.join(Tokenizer.LF);

    let tests = [];

    tests.push(
        assertTokens(
            'One space only',
            "English",
            " ",
            []
        )
    );
    tests.push(
        assertTokens(
            'Two spaces only',
            "English",
            "  ",
            []
        )
    );
    tests.push(
        assertTokens(
            'Three spaces only',
            "English",
            "   ",
            []
        )
    );
    tests.push(
        assertTokens(
            'All delimiters',
            "English",
            "[ ] + - * / > <",
            [
                new Token(0,    "[",        Tokenizer.tokenTypes.DELIMITER, Tokenizer.primitives.NONE),
                new Token(2,    "]",        Tokenizer.tokenTypes.DELIMITER, Tokenizer.primitives.NONE),
                new Token(4,    "+",        Tokenizer.tokenTypes.DELIMITER, Tokenizer.primitives.NONE),
                new Token(6,    "-",        Tokenizer.tokenTypes.DELIMITER, Tokenizer.primitives.NONE),
                new Token(8,    "*",        Tokenizer.tokenTypes.DELIMITER, Tokenizer.primitives.NONE),
                new Token(10,   "/",        Tokenizer.tokenTypes.DELIMITER, Tokenizer.primitives.NONE),
                new Token(12,   ">",        Tokenizer.tokenTypes.DELIMITER, Tokenizer.primitives.NONE),
                new Token(14,   "<",        Tokenizer.tokenTypes.DELIMITER, Tokenizer.primitives.NONE),
            ]
        )
    );
    tests.push(
        assertTokens(
            'All primitives full and shorthand in English',
            "English",
            lines([
                "back bk clean clearscreen cs end forward fd hideturtle ht home",
                "if label left lt pendown pd penup pu repeat right rt",
                "setbackground setbg setheading seth setlabelheight setpencolor setpc",
                "setpensize showturtle st stop to wait"
            ]),
            [
                new Token(0,    "back",             Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.BACK),
                new Token(5,    "bk",               Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.BACK),
                new Token(8,    "clean",            Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.CLEAN),
                new Token(14,   "clearscreen",      Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.CLEARSCREEN),
                new Token(26,   "cs",               Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.CLEARSCREEN),
                new Token(29,   "end",              Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.END),
                new Token(33,   "forward",          Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.FORWARD),
                new Token(41,   "fd",               Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.FORWARD),
                new Token(44,   "hideturtle",       Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.HIDETURTLE),
                new Token(55,   "ht",               Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.HIDETURTLE),
                new Token(58,   "home",             Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.HOME),
                new Token(62,   Tokenizer.LF,       Tokenizer.tokenTypes.DELIMITER,     Tokenizer.primitives.NONE),
                new Token(63,   "if",               Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.IF),
                new Token(66,   "label",            Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.LABEL),
                new Token(72,   "left",             Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.LEFT),
                new Token(77,   "lt",               Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.LEFT),
                new Token(80,   "pendown",          Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.PENDOWN),
                new Token(88,   "pd",               Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.PENDOWN),
                new Token(91,   "penup",            Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.PENUP),
                new Token(97,   "pu",               Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.PENUP),
                new Token(100,  "repeat",           Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.REPEAT),
                new Token(107,  "right",            Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.RIGHT),
                new Token(113,  "rt",               Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.RIGHT),
                new Token(115,  Tokenizer.LF,       Tokenizer.tokenTypes.DELIMITER,     Tokenizer.primitives.NONE),
                new Token(116,  "setbackground",    Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.SETBACKGROUND),
                new Token(130,  "setbg",            Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.SETBACKGROUND),
                new Token(136,  "setheading",       Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.SETHEADING),
                new Token(147,  "seth",             Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.SETHEADING),
                new Token(152,  "setlabelheight",   Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.SETLABELHEIGHT),
                new Token(167,  "setpencolor",      Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.SETPENCOLOR),
                new Token(179,  "setpc",            Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.SETPENCOLOR),
                new Token(184,  Tokenizer.LF,       Tokenizer.tokenTypes.DELIMITER,     Tokenizer.primitives.NONE),
                new Token(185,  "setpensize",       Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.SETPENSIZE),
                new Token(196,  "showturtle",       Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.SHOWTURTLE),
                new Token(207,  "st",               Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.SHOWTURTLE),
                new Token(210,  "stop",             Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.STOP),
                new Token(215,  "to",               Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.TO),
                new Token(218,  "wait",             Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.WAIT)
            ]
        )
    );
    tests.push(
        assertTokens(
            'All primitives full and shorthand in Spanish',
            "Spanish",
            lines([
                "retrocede re limpia borrapantalla bp fin avanza av ocultatortuga ot centro",
                "si etiqueta giraizquierda gi bajalapiz bl subelapiz sl repite giraderecha gd",
                "ponfondo ponrumbo ponr ponfuente poncolorlapiz poncl",
                "pongrosor pong muestratortuga mt alto para espera"
            ]),
            [
                new Token(0,    "retrocede",        Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.BACK),
                new Token(10,   "re",               Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.BACK),
                new Token(13,   "limpia",           Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.CLEAN),
                new Token(20,   "borrapantalla",    Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.CLEARSCREEN),
                new Token(34,   "bp",               Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.CLEARSCREEN),
                new Token(37,   "fin",              Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.END),
                new Token(41,   "avanza",           Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.FORWARD),
                new Token(48,   "av",               Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.FORWARD),
                new Token(51,   "ocultatortuga",    Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.HIDETURTLE),
                new Token(65,   "ot",               Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.HIDETURTLE),
                new Token(68,   "centro",           Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.HOME),
                new Token(74,   Tokenizer.LF,       Tokenizer.tokenTypes.DELIMITER,     Tokenizer.primitives.NONE),
                new Token(75,   "si",               Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.IF),
                new Token(78,   "etiqueta",         Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.LABEL),
                new Token(87,   "giraizquierda",    Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.LEFT),
                new Token(101,  "gi",               Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.LEFT),
                new Token(104,  "bajalapiz",        Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.PENDOWN),
                new Token(114,  "bl",               Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.PENDOWN),
                new Token(117,  "subelapiz",        Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.PENUP),
                new Token(127,  "sl",               Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.PENUP),
                new Token(130,  "repite",           Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.REPEAT),
                new Token(137,  "giraderecha",      Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.RIGHT),
                new Token(149,  "gd",               Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.RIGHT),
                new Token(151,  Tokenizer.LF,       Tokenizer.tokenTypes.DELIMITER,     Tokenizer.primitives.NONE),
                new Token(152,  "ponfondo",         Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.SETBACKGROUND),
                new Token(161,  "ponrumbo",         Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.SETHEADING),
                new Token(170,  "ponr",             Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.SETHEADING),
                new Token(175,  "ponfuente",        Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.SETLABELHEIGHT),
                new Token(185,  "poncolorlapiz",    Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.SETPENCOLOR),
                new Token(199,  "poncl",            Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.SETPENCOLOR),
                new Token(204,  Tokenizer.LF,       Tokenizer.tokenTypes.DELIMITER,     Tokenizer.primitives.NONE),
                new Token(205,  "pongrosor",        Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.SETPENSIZE),
                new Token(215,  "pong",             Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.SETPENSIZE),
                new Token(220,  "muestratortuga",   Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.SHOWTURTLE),
                new Token(235,  "mt",               Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.SHOWTURTLE),
                new Token(238,  "alto",             Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.STOP),
                new Token(243,  "para",             Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.TO),
                new Token(248,  "espera",           Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.WAIT)
            ]
        )
    );
    tests.push(
        assertTokens(
            'Unknown token found',
            "English",
            "fd 2^3",
            [
                new Token(0,    "fd",   Tokenizer.tokenTypes.PRIMITIVE,     Tokenizer.primitives.FORWARD),
                new Token(3,    "2",    Tokenizer.tokenTypes.NUMBER,        Tokenizer.primitives.NONE),
                new Token(4,    "^",    Tokenizer.tokenTypes.UNKNOWN_TOKEN, Tokenizer.primitives.NONE),
                new Token(5,    "3",    Tokenizer.tokenTypes.NUMBER,        Tokenizer.primitives.NONE)
            ]
        )
    );
    tests.push(
        assertTokens(
            'Square without REPEAT primitive',
            "English",
            "fd 60 rt 90 fd 60 rt 90 fd 60 rt 90 fd 60 rt 90",
            [
                new Token(0,    "fd",   Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.FORWARD),
                new Token(3,    "60",   Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(6,    "rt",   Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.RIGHT),
                new Token(9,    "90",   Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(12,   "fd",   Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.FORWARD),
                new Token(15,   "60",   Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(18,   "rt",   Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.RIGHT),
                new Token(21,   "90",   Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(24,   "fd",   Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.FORWARD),
                new Token(27,   "60",   Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(30,   "rt",   Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.RIGHT),
                new Token(33,   "90",   Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(36,   "fd",   Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.FORWARD),
                new Token(39,   "60",   Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(42,   "rt",   Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.RIGHT),
                new Token(45,   "90",   Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE)
            ]
        )
    );
    tests.push(
        assertTokens(
            'Square with REPEAT primitive and brackets next to other tokens',
            "English",
            "repeat 4 [fd 60 rt 90]",
            [
                new Token(0,    "repeat",   Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.REPEAT),
                new Token(7,    "4",        Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(9,    "[",        Tokenizer.tokenTypes.DELIMITER, Tokenizer.primitives.NONE),
                new Token(10,   "fd",       Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.FORWARD),
                new Token(13,   "60",       Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(16,   "rt",       Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.RIGHT),
                new Token(19,   "90",       Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(21,   "]",        Tokenizer.tokenTypes.DELIMITER, Tokenizer.primitives.NONE)
            ]
        )
    );
    tests.push(
        assertTokens(
            'Square with REPEAT primitive and brackets with spaces each side',
            "English",
            "repeat 4 [ fd 60 rt 90 ]",
            [
                new Token(0,    "repeat",   Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.REPEAT),
                new Token(7,    "4",        Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(9,    "[",        Tokenizer.tokenTypes.DELIMITER, Tokenizer.primitives.NONE),
                new Token(11,   "fd",       Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.FORWARD),
                new Token(14,   "60",       Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(17,   "rt",       Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.RIGHT),
                new Token(20,   "90",       Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(23,   "]",        Tokenizer.tokenTypes.DELIMITER, Tokenizer.primitives.NONE)
            ]
        )
    );
    tests.push(
        assertTokens(
            'Double REPEAT with inside one in the middle of the primitives of the first one',
            "English",
            "repeat 3 [fd 60 repeat 4 [lt 90 bk 20] rt 120]",
            [
                new Token(0,    "repeat",   Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.REPEAT),
                new Token(7,    "3",        Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(9,    "[",        Tokenizer.tokenTypes.DELIMITER, Tokenizer.primitives.NONE),
                new Token(10,   "fd",       Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.FORWARD),
                new Token(13,   "60",       Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(16,   "repeat",   Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.REPEAT),
                new Token(23,   "4",        Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(25,   "[",        Tokenizer.tokenTypes.DELIMITER, Tokenizer.primitives.NONE),
                new Token(26,   "lt",       Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.LEFT),
                new Token(29,   "90",       Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(32,   "bk",       Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.BACK),
                new Token(35,   "20",       Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(37,   "]",        Tokenizer.tokenTypes.DELIMITER, Tokenizer.primitives.NONE),
                new Token(39,   "rt",       Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.RIGHT),
                new Token(42,   "120",      Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(45,   "]",        Tokenizer.tokenTypes.DELIMITER, Tokenizer.primitives.NONE)
            ]
        )
    );
    tests.push(
        assertTokens(
            'PROCEDURE with no parameters in one line and the PROCEDURE is not called',
            "English",
            "to line fd 60 end",
            [
                new Token(0,    "to",   Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.TO),
                new Token(3,    "line", Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(8,    "fd",   Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.FORWARD),
                new Token(11,   "60",   Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE),
                new Token(14,   "end",  Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.END)
            ]
        )
    );
    tests.push(
        assertTokens(
            'PROCEDURE with no parameters in multiple lines and the PROCEDURE is not called',
            "English",
            lines([
                "to line",
                "fd 60",
                "end"
            ]),
            [
                new Token(0,    "to",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.TO),
                new Token(3,    "line",         Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(7,    Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(8,    "fd",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.FORWARD),
                new Token(11,   "60",           Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE),
                new Token(13,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(14,   "end",          Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.END)
            ]
        )
    );
    tests.push(
        assertTokens(
            'PROCEDURE with no parameters in one line and the PROCEDURE is called once',
            "English",
            "to line fd 60 end line",
            [
                new Token(0,    "to",   Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.TO),
                new Token(3,    "line", Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(8,    "fd",   Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.FORWARD),
                new Token(11,   "60",   Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE),
                new Token(14,   "end",  Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.END),
                new Token(18,   "line", Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE)
            ]
        )
    );
    tests.push(
        assertTokens(
            'PROCEDURE with no parameters in multiple lines and the PROCEDURE is called once',
            "English",
            lines([
                "to line",
                "fd 60",
                "end",
                "line"
            ]),
            [
                new Token(0,    "to",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.TO),
                new Token(3,    "line",         Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(7,    Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(8,    "fd",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.FORWARD),
                new Token(11,   "60",           Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE),
                new Token(13,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(14,   "end",          Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.END),
                new Token(17,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(18,   "line",         Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE)
            ]
        )
    );
    tests.push(
        assertTokens(
            'PROCEDURE with no parameters in one line and the PROCEDURE is called twice',
            "English",
            "to line fd 60 end line rt 90 line",
            [
                new Token(0,    "to",   Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.TO),
                new Token(3,    "line", Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(8,    "fd",   Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.FORWARD),
                new Token(11,   "60",   Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE),
                new Token(14,   "end",  Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.END),
                new Token(18,   "line", Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(23,   "rt",   Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.RIGHT),
                new Token(26,   "90",   Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE),
                new Token(29,   "line", Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE)
            ]
        )
    );
    tests.push(
        assertTokens(
            'PROCEDURE with no parameters in multiple lines and the PROCEDURE is called twice',
            "English",
            lines([
                "to line",
                "fd 60",
                "end",
                "line",
                "rt 90",
                "line"
            ]),
            [
                new Token(0,    "to",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.TO),
                new Token(3,    "line",         Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(7,    Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(8,    "fd",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.FORWARD),
                new Token(11,   "60",           Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE),
                new Token(13,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(14,   "end",          Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.END),
                new Token(17,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(18,   "line",         Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(22,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(23,   "rt",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.RIGHT),
                new Token(26,   "90",           Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE),
                new Token(28,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(29,   "line",         Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE)
            ]
        )
    );
    tests.push(
        assertTokens(
            'PROCEDURE with one parameter in one line and the PROCEDURE is called twice',
            "English",
            "to line :length fd :length end line 60 rt 90 line 30",
            [
                new Token(0,    "to",       Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.TO),
                new Token(3,    "line",     Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(8,    ":length",  Tokenizer.tokenTypes.VARIABLE,          Tokenizer.primitives.NONE),
                new Token(16,   "fd",       Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.FORWARD),
                new Token(19,   ":length",  Tokenizer.tokenTypes.VARIABLE,          Tokenizer.primitives.NONE),
                new Token(27,   "end",      Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.END),
                new Token(31,   "line",     Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(36,   "60",       Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE),
                new Token(39,   "rt",       Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.RIGHT),
                new Token(42,   "90",       Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE),
                new Token(45,   "line",     Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(50,   "30",       Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE)
            ]
        )
    );
    tests.push(
        assertTokens(
            'PROCEDURE with one parameter in multiple lines and the PROCEDURE is called twice',
            "English",
            lines([
                "to line :length",
                "fd :length",
                "end",
                "line 60",
                "rt 90",
                "line 30"
            ]),
            [
                new Token(0,    "to",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.TO),
                new Token(3,    "line",         Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(8,    ":length",      Tokenizer.tokenTypes.VARIABLE,          Tokenizer.primitives.NONE),
                new Token(15,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(16,   "fd",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.FORWARD),
                new Token(19,   ":length",      Tokenizer.tokenTypes.VARIABLE,          Tokenizer.primitives.NONE),
                new Token(26,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(27,   "end",          Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.END),
                new Token(30,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(31,   "line",         Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(36,   "60",           Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE),
                new Token(38,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(39,   "rt",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.RIGHT),
                new Token(42,   "90",           Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE),
                new Token(44,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(45,   "line",         Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(50,   "30",           Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE)
            ]
        )
    );
    tests.push(
        assertTokens(
            'Primitive with an expression "a + b" as parameter',
            "English",
            "fd 1 + 60",
            [
                new Token(0,    "fd",   Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.FORWARD),
                new Token(3,    "1",    Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(5,    "+",    Tokenizer.tokenTypes.DELIMITER, Tokenizer.primitives.NONE),
                new Token(7,    "60",   Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE)            
            ]
        )
    );
    tests.push(
        assertTokens(
            'Primitive with an expression "a - b" as parameter',
            "English",
            "fd 60 - 50",
            [
                new Token(0,    "fd",   Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.FORWARD),
                new Token(3,    "60",   Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(6,    "-",    Tokenizer.tokenTypes.DELIMITER, Tokenizer.primitives.NONE),
                new Token(8,    "50",   Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE)            
            ]
        )
    );
    tests.push(
        assertTokens(
            'Primitive with an expression "a * b" as parameter',
            "English",
            "fd 10 * 5",
            [
                new Token(0, "fd",  Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.FORWARD),
                new Token(3, "10",  Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(6, "*",   Tokenizer.tokenTypes.DELIMITER, Tokenizer.primitives.NONE),
                new Token(8, "5",   Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE)
            ]
        )
    );
    tests.push(
        assertTokens(
            'Primitive with an expression "a / b" as parameter',
            "English",
            "fd 100 / 5",
            [
                new Token(0,    "fd",   Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.FORWARD),
                new Token(3,    "100",  Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(7,    "/",    Tokenizer.tokenTypes.DELIMITER, Tokenizer.primitives.NONE),
                new Token(9,    "5",    Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE)
            ]
        )
    );
    tests.push(
        assertTokens(
            'PROCEDURE with one parameter in multiple lines and the parameter is an expression "a + b"',
            "English",
            lines([
                "to line :length",
                "fd :length",
                "end",
                "line 10 + 60"
            ]),
            [
                new Token(0,    "to",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.TO),
                new Token(3,    "line",         Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(8,    ":length",      Tokenizer.tokenTypes.VARIABLE,          Tokenizer.primitives.NONE),
                new Token(15,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(16,   "fd",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.FORWARD),
                new Token(19,   ":length",      Tokenizer.tokenTypes.VARIABLE,          Tokenizer.primitives.NONE),
                new Token(26,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(27,   "end",          Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.END),
                new Token(30,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(31,   "line",         Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(36,   "10",           Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE),
                new Token(39,   "+",            Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(41,   "60",           Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE)
            ]
        )
    );
    tests.push(
        assertTokens(
            'PROCEDURE with one parameter in multiple lines move FORWARD only if condition is met',
            "English",
            lines([
                "to line :length",
                "if :length < 50 [ stop ]",
                "fd :length",
                "end",
                "line 100",
                "rt 90",
                "line 30",
                "rt 90"
            ]),
            [
                new Token(0,    "to",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.TO),
                new Token(3,    "line",         Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(8,    ":length",      Tokenizer.tokenTypes.VARIABLE,          Tokenizer.primitives.NONE),
                new Token(15,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(16,   "if",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.IF),
                new Token(19,   ":length",      Tokenizer.tokenTypes.VARIABLE,          Tokenizer.primitives.NONE),
                new Token(27,   "<",            Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(29,   "50",           Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE),
                new Token(32,   "[",            Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(34,   "stop",         Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.STOP),
                new Token(39,   "]",            Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(40,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(41,   "fd",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.FORWARD),
                new Token(44,   ":length",      Tokenizer.tokenTypes.VARIABLE,          Tokenizer.primitives.NONE),
                new Token(51,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(52,   "end",          Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.END),
                new Token(55,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(56,   "line",         Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(61,   "100",          Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE),
                new Token(64,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(65,   "rt",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.RIGHT),
                new Token(68,   "90",           Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE),
                new Token(70,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(71,   "line",         Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(76,   "30",           Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE),
                new Token(78,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(79,   "rt",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.RIGHT),
                new Token(82,   "90",           Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE)
            ]
        )
    );
    tests.push(
        assertTokens(
            'PROCEDURE with one parameter in multiple lines called recursively with IF and STOP',
            "English",
            lines([
                "to hook :length",
                "if :length < 10 [ stop ]",
                "fd :length",
                "rt 45",
                "hook :length/2",
                "end",
                "hook 120"
            ]),
            [
                new Token(0,    "to",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.TO),
                new Token(3,    "hook",         Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(8,    ":length",      Tokenizer.tokenTypes.VARIABLE,          Tokenizer.primitives.NONE),
                new Token(15,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(16,   "if",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.IF),
                new Token(19,   ":length",      Tokenizer.tokenTypes.VARIABLE,          Tokenizer.primitives.NONE),
                new Token(27,   "<",            Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(29,   "10",           Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE),
                new Token(32,   "[",            Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(34,   "stop",         Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.STOP),
                new Token(39,   "]",            Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(40,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(41,   "fd",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.FORWARD),
                new Token(44,   ":length",      Tokenizer.tokenTypes.VARIABLE,          Tokenizer.primitives.NONE),
                new Token(51,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(52,   "rt",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.RIGHT),
                new Token(55,   "45",           Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE),
                new Token(57,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(58,   "hook",         Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(63,   ":length",      Tokenizer.tokenTypes.VARIABLE,          Tokenizer.primitives.NONE),
                new Token(70,   "/",            Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(71,   "2",            Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE),
                new Token(72,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(73,   "end",          Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.END),
                new Token(76,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(77,   "hook",         Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(82,   "120",          Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE)
            ]
        )
    );
    tests.push(
        assertTokens(
            'Japanese commands with full-width digits and spaces',
            "Japanese",
            "まえ　１００　みぎ　９０",
            [
                new Token(0,    "まえ",     Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.FORWARD),
                new Token(3,    "100",      Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE),
                new Token(7,    "みぎ",     Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.RIGHT),
                new Token(10,   "90",       Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE)
            ]
        )
    );
    tests.push(
        assertTokens(
            'Japanese command directly followed by a number',
            "Japanese",
            "まえ100",
            [
                new Token(0,    "まえ",     Tokenizer.tokenTypes.PRIMITIVE, Tokenizer.primitives.FORWARD),
                new Token(2,    "100",      Tokenizer.tokenTypes.NUMBER,    Tokenizer.primitives.NONE)
            ]
        )
    );
    tests.push(
        assertTokens(
            'Japanese procedure and parameter names, with kanji aliases',
            "Japanese",
            "つくる しかく ：へん\n繰り返す ４ ［前 ：へん 右 ９０］",
            [
                new Token(0,    "つくる",       Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.TO),
                new Token(4,    "しかく",       Tokenizer.tokenTypes.PROCEDURE_NAME,    Tokenizer.primitives.NONE),
                new Token(8,    ":へん",        Tokenizer.tokenTypes.VARIABLE,          Tokenizer.primitives.NONE),
                new Token(11,   Tokenizer.LF,   Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(12,   "繰り返す",     Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.REPEAT),
                new Token(17,   "4",            Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE),
                new Token(19,   "[",            Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE),
                new Token(20,   "前",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.FORWARD),
                new Token(22,   ":へん",        Tokenizer.tokenTypes.VARIABLE,          Tokenizer.primitives.NONE),
                new Token(26,   "右",           Tokenizer.tokenTypes.PRIMITIVE,         Tokenizer.primitives.RIGHT),
                new Token(28,   "90",           Tokenizer.tokenTypes.NUMBER,            Tokenizer.primitives.NONE),
                new Token(30,   "]",            Tokenizer.tokenTypes.DELIMITER,         Tokenizer.primitives.NONE)
            ]
        )
    );

    return tests.every(test => test);
}
