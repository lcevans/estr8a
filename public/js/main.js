
// Some chip8 versions use different screen sizes, so I'm setting these as constants.
var SCREEN_WIDTH = 64;
var SCREEN_HEIGHT = 32;

// Making this global for now so it is easy to debug in console.
var emulator = new Chip8Emulator(SCREEN_WIDTH, SCREEN_HEIGHT);

var main = () => {
    // Set up render system and register input callbacks
    // This should create a canvas element and whatever methods we need to
    // draw the screen.
    initializeCanvas(emulator.screenWidth, emulator.screenHeight);

    // Setup listeners for the keys that map to the 0-F chip 8 keys.
    initializeKeyboard();

    // Initialize Sound
    initializeSound();

    // I'm assuming loading the game will be async and return a promise.
    emulator.loadGame("PONG").then(() => {
        // This just adds an element to the DOM that displays the initial state of the memory.
        // We could add functionality to render to update this as the emulator runs.
        initializeMemoryDisplay();

        emulator.startEmulator();
    })
};

// Run
main();
