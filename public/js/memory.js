// Convert a row (16 bytes of memory) to text for display in memory dump.
var memoryLineToMarkup = (memory, row, highlightAddress) => {
    var start = row * 16, end = start + 16;
    var addressText = (start).toString(16);
    while (addressText.length < 3) addressText = `0${addressText}`;
    // Note that `\u00A0` is just a space that the browser won't collapse.
    var lineText = `${addressText}\u00A0 `;
    for (var address = start; address < end; address++) {
        var hex = memory[address].toString(16);
        if (hex.length < 2) hex = `0${hex}`;
        var space = address % 8 ? ' ' : '\u00A0 \u00A0 ';
        // Highlight the two bytes starting at highlightAddress.
        if (highlightAddress === address || highlightAddress + 1 === address) {
            lineText = `${lineText}${space}<span style="background-color: #0FF;">${hex}</span>`;
        } else {
            lineText = `${lineText}${space}${hex}`;
        }
    }
    return lineText;
};

// This will store the last version of memory displayed so we can diff
// it with the next display to only update rows that have changed.
var displayedMemory = null, highlightedAddress = null;

// Render initial state of memory to the screen.
var initializeMemoryDisplay = (machine) => {
    var memory = machine.memory;
    // TODO: Display registers as well
    var memoryDiv = document.getElementsByClassName('js-memory')[0];
    for (var row = 0; row < memory.length / 16; row++) {
        var line = document.createElement('div');
        line.innerHTML = memoryLineToMarkup(memory, row, machine.PC);
        memoryDiv.append(line);
    }
    displayedMemory = [...memory];
    highlightedAddress = machine.state.programCounter;
    document.getElementsByClassName('js-toggleMemory')[0].onclick = () => {
        memoryDiv.style.display = (memoryDiv.style.display == 'inline-block') ? 'none' : 'inline-block';
    }
};

// Update any lines of memory that have changed since the last time it was displayed.
var updateMemoryDisplay = (machine, highlightAddress) => {
    let memory = machine.memory;
    var memoryDiv = document.getElementsByClassName('js-memory')[0];
    if (memoryDiv.style.display === 'none') {
        return;
    }
    var memoryRows = memoryDiv.children;
    for (var row = 0; row < memoryRows.length; row++) {
        var changed = false;
        for (var i = 0; i < 16; i++) {
            var address = row * 16 + i;
            if (address === highlightedAddress || address === highlightAddress || displayedMemory[address] !== memory[address]) {
                changed = true;
                break;
            }
        }
        if (changed) {
            memoryRows[row].innerHTML = memoryLineToMarkup(memory, row, highlightAddress);
        }
    }
    displayedMemory = [...memory];
    highlightedAddress = highlightAddress;
};
