
class Chip8Emulator {

    constructor(screenWidth, screenHeight) {
        this.memory = new Uint8Array(4096);
        this.registers = new Uint8Array(17);
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        // Each pixel only needs 1 bit, so we divide by 8 here to get the length we need.
        this.screen = new Uint8Array(Math.ceil(screenWidth * screenHeight / 8));
        this.drawFlag = false;
        this.mainLoopId = null;
        this.programCounter = 0x200;

        // This is dummy code to test that drawing the screen works roughly how we are expecting:
        for (var i = 0; i < 16; i++) {
            this.drawChipCharacterToScreen(digits[i], i % 8, Math.floor(i / 8) * 7);
        }
        this.drawFlag = true;
    }
    loadGame(gameName) {
        // We could add the games somewhere under `/public` and load them with fetch here.
        return Promise.resolve([0, 0, 0, 0, 0,]).then(gameData => {
            for (var i = 0; i < gameData.length; i++) {
                // Write the loaded game to memory starting at 0x200.
                this.memory[0x200 + i] = gameData[i];
            }
        });
    }

    // x/y are one a werid 8x1 grid to make this simpler.
    drawChipCharacterToScreen(digit, x, y) {
        for (var j = 0; j < digit.length; j++) {
            this.screen[(y + j) * this.screenWidth / 8 + x] = digit[j];
        }
    }

    startEmulator() {
        // Clear the existing emulation loop, if for some reason this is called while emulation
        // is already running.
        if (this.mainLoopId) {
            clearInterval(this.mainLoopId);
        }
        this.mainLoopId = setInterval(() => this.emulationLoop(), 16);
        window.requestAnimationFrame(() => this.renderLoop());
    }

    moveToNextInstruction() {
        this.programCounter += 2;
    }

    fetchOpcode() {
        let opcode = this.memory[this.programCounter] << 8 | this.memory[this.programCounter + 1];
        this.moveToNextInstruction();
        return opcode;
    }

    executeOpcode(opcode) {
        executeInstruction(this, opcode);
    }

    emulationLoop() {
        let opcode = fetchOpcode();
        // Execute Opcode
        executeOpcode(opcode);
        // Update timers

        // Code for testing the keyboard mapping. This will log 0-F
        // based on which keys are currently pressed.
        for (var i = 0; i < 16; i++) {
            if (isChipKeyDown(i)) console.log(i.toString(16));
        }
    }

    renderLoop() {
        if (this.drawFlag) {
            this.drawFlag = false;
            this.drawGraphics();
        }
        // Assume that the emulator is still running as long `this.mainLoopId` is set.
        if (this.mainLoopId) {
            window.requestAnimationFrame(() => this.renderLoop());
        }
    }

    drawGraphics() {
        drawEmulatorToCanvas(this);
    }
}
