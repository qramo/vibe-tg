// Tests for the external model providers (js/providers.js). They run when the chat module loads and log like the upstream tests.
export async function runProviderTests({ toOpenAiMessages, toAnthropicContent, readEvents, apiRoot, describeError, ProviderError }) {
    let testPassed = (testName) => {
        console.log(`%cTEST %cPASSED %cProviders ${testName}`, 'color: black;', 'color: green; font-weight:bold;', 'color: grey;');
    };
    let testFailed = (testName) => {
        console.log(`%cTEST %cFAILED %cProviders ${testName}`, 'color: black;', 'color: red; font-weight:bold;', 'color: grey;');
    };
    let assertEqual = (testName = "", actual, expected) => {
        let success = JSON.stringify(actual) === JSON.stringify(expected);
        if (success) {
            testPassed(testName);
        } else {
            testFailed(`${testName}: expected ${JSON.stringify(expected)} but we get ${JSON.stringify(actual)} instead`);
        }
        return success;
    };
    // Splits the text into pieces of the given size, as a network stream may.
    let streamOf = (text, size) => new ReadableStream({
        start(controller) {
            let bytes = new TextEncoder().encode(text);
            for (let i = 0; i < bytes.length; i += size) controller.enqueue(bytes.slice(i, i + size));
            controller.close();
        }
    });
    let eventsOf = async (text, size) => {
        let events = [];
        await readEvents(streamOf(text, size), data => events.push(data));
        return events;
    };

    const image = 'data:image/jpeg;base64,QUJD';
    let tests = [];

    tests.push(assertEqual("Text messages stay as they are for OpenAI-compatible APIs",
        toOpenAiMessages([{ role: 'system', content: 'S' }, { role: 'user', content: 'U' }]),
        [{ role: 'system', content: 'S' }, { role: 'user', content: 'U' }]));
    tests.push(assertEqual("An image becomes an image_url part for OpenAI-compatible APIs",
        toOpenAiMessages([{ role: 'user', content: [{ type: 'image', url: image }, { type: 'text', text: 'T' }] }]),
        [{ role: 'user', content: [{ type: 'image_url', image_url: { url: image } }, { type: 'text', text: 'T' }] }]));
    tests.push(assertEqual("An image becomes a base64 image block for Claude",
        toAnthropicContent([{ type: 'image', url: image }, { type: 'text', text: 'T' }]),
        [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'QUJD' } }, { type: 'text', text: 'T' }]));
    tests.push(assertEqual("Text content stays a string for Claude", toAnthropicContent('T'), 'T'));

    tests.push(assertEqual("An address without a scheme gets http://", apiRoot('localhost:11434/v1'), 'http://localhost:11434/v1'));
    tests.push(assertEqual("A trailing slash is removed", apiRoot('https://api.openai.com/v1/'), 'https://api.openai.com/v1'));

    const sse = 'data: {"n":1}\n\n: comment\n\ndata: {"n":2,"text":"日本語"}\n\ndata: [DONE]\n\n';
    tests.push(assertEqual("Server-sent events are read in one piece", await eventsOf(sse, 1000), [{ n: 1 }, { n: 2, text: '日本語' }]));
    tests.push(assertEqual("Server-sent events split mid-line and mid-character are read", await eventsOf(sse, 5), [{ n: 1 }, { n: 2, text: '日本語' }]));

    tests.push(assertEqual("A 401 is explained as a key problem",
        describeError(new ProviderError('invalid x-api-key', 401), 'anthropic').startsWith('API キーが正しくない'), true));
    tests.push(assertEqual("A failed fetch to a local server points at the server and CORS",
        describeError(new TypeError('Failed to fetch'), 'local').startsWith('サーバーにつながりません'), true));
    tests.push(assertEqual("Other errors keep their own message", describeError(new Error('API キーを入れてください。'), 'openai'), 'API キーを入れてください。'));

    return tests.every(test => test);
}
