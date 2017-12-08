
// Some chip8 versions use different screen sizes, so I'm setting these as constants.
var SCREEN_WIDTH = 64;
var SCREEN_HEIGHT = 32;
var HORIZONTAL_WRAP_AROUND = true;
var VERTICAL_WRAP_AROUND = false;

// Making this global for now so it is easy to debug in console.
var emulator = new Chip8Emulator(SCREEN_WIDTH, SCREEN_HEIGHT, makeMachine);

var main = () => {
    // Set up render system and register input callbacks
    // This should create a canvas element and whatever methods we need to
    // draw the screen.
    initializeCanvas(emulator.screenWidth, emulator.screenHeight);
    drawEmulatorToCanvas(emulator);
    initializeRegisterDisplay(emulator.machine.getRegisters());
    initializeMemoryDisplay(emulator.machine);

    // Setup listeners for the keys that map to the 0-F chip 8 keys.
    initializeKeyboard();

    // Initialize TitleBar
    initializeTitleBar();

};

// Run
main();
