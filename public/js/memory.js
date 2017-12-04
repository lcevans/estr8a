// Convert a row (16 bytes of memory) to text for display in memory dump.
var memoryLineToText = (memory, row) => {
    var start = row * 16, end = start + 16;
    var addressText = (start).toString(16);
    while (addressText.length < 3) addressText = `0${addressText}`;
    // Note that `\u00A0` is just a space that the browser won't collapse.
    var lineText = `${addressText}\u00A0 `;
    for (var offset = start; offset < end; offset++) {
        var hex = memory[offset].toString(16);
        if (hex.length < 2) hex = `0${hex}`;
        var space = offset % 8 ? ' ' : '\u00A0 \u00A0 ';
        lineText = `${lineText}${space}${hex}`;
    }
    return lineText;
}

// Render initial state of memory to the screen.
var initializeMemoryDisplay = () => {

    // This code was just a test for copying the chip font set into the start of
    // memory, if we wanted to do this for some reason.
    /*var chipFontOffset = 0;
    for (var i = 0; i < digits.length; i++) {
        for (var j = 0; j < digits[i].length; j++) {
            emulator.memory[chipFontOffset + i * digits[i].length + j] = digits[i][j];
        }
    }*/

    var memoryContainer = document.getElementsByClassName("js-memory")[0];
    for (var row = 0; row < emulator.memory.length / 16; row++) {
        var line = document.createElement("div");
        var text = document.createTextNode(memoryLineToText(emulator.memory, row));
        line.append(text);
        memoryContainer.append(line);
    }
};
