// Tests for the off-screen snapshot (js/snapshot.js) that the vision model looks at. They run when the chat module loads.
export async function runSnapshotTests({ renderSnapshot }) {
    let testPassed = (testName) => {
        console.log(`%cTEST %cPASSED %cSnapshot ${testName}`, 'color: black;', 'color: green; font-weight:bold;', 'color: grey;');
    };
    let testFailed = (testName) => {
        console.log(`%cTEST %cFAILED %cSnapshot ${testName}`, 'color: black;', 'color: red; font-weight:bold;', 'color: grey;');
    };
    let darkPixels = async (dataUrl) => {
        let image = new Image();
        image.src = dataUrl;
        await image.decode();
        let canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        let context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        let data = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] < 90 && data[i + 1] < 90 && data[i + 2] < 90) count++;
        }
        return count;
    };
    let assertDark = async (testName, program, check) => {
        let success = false;
        try {
            let image = renderSnapshot(program);
            success = image.startsWith('data:image/jpeg') && check(await darkPixels(image));
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
    tests.push(await assertDark("A square shows up in the snapshot", "setpensize 4 repeat 4 [fd 120 rt 90]", count => count > 200));
    tests.push(await assertDark("An empty program gives a blank picture without the turtle", "", count => count === 0));
    tests.push(await assertDark("Waiting does not hang the snapshot", "setpensize 4 wait 100 fd 100", count => count > 0));
    tests.push(await assertDark("A small circle is zoomed in so it fills much of the picture", "setpensize 2 repeat 36 [fd 5 rt 10]", count => count > 800));
    return tests.every(test => test);
}
