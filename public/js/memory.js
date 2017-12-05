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
};

// This will store the last version of memory displayed so we can diff
// it with the next display to only update rows that have changed.
var displayedMemory = null;

// Render initial state of memory to the screen.
var initializeMemoryDisplay = (memory) => {
    // TODO: Display registers as well
    var memoryDiv = document.getElementsByClassName('js-memory')[0];
    for (var row = 0; row < memory.length / 16; row++) {
        var line = document.createElement('div');
        var text = document.createTextNode(memoryLineToText(memory, row));
        line.append(text);
        memoryDiv.append(line);
    }
    displayedMemory = [...memory];
    document.getElementsByClassName('js-toggleMemory')[0].onclick = () => {
        memoryDiv.style.display = (memoryDiv.style.display == 'inline-block') ? 'none' : 'inline-block';
    }
};

// Update any lines of memory that have changed since the last time it was displayed.
var updateMemoryDisplay = (memory) => {
    var memoryDiv = document.getElementsByClassName('js-memory')[0];
    if (memoryDiv.style.display === 'none') {
        return;
    }
    var memoryRows = memoryDiv.children;
    for (var row = 0; row < memoryRows.length; row++) {
        var changed = false;
        for (var i = 0; i < 16; i++) {
            if (displayedMemory[row * 16 + i] !== memory[row * 16 + i]) {
                changed = true;
                break;
            }
        }
        if (changed) {
            memoryRows[row].innerHTML = memoryLineToText(memory, row);
        }
    }
    displayedMemory = [...memory];
};
