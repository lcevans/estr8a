
// Making this global for now so it is easy to debug in console.
var emulator = new Chip8Emulator();

var main = () => {
    // Set up render system and register input callbacks
    // This should create a canvas element and whatever methods we need to
    // draw the screen.
    // setupGraphics();

    // This should setup the keyboard for tracking the 0-F keys being pressed
    // setupInput();

    // Initialize the Chip8 system and load the game into the memory

    emulator.initialize();
    // This just adds an element to the DOM that displays the initial state of the memory.
    // We could add functionality to render to update this as the emulator runs.
    initializeMemoryDisplay();
    // I'm assuming loading the game will be async and return a promise.
    emulator.loadGame("pong").then(() => {
        emulator.startEmulator();
    })
};

// Run
main();
