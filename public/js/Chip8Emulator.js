var TICK_MS = 16; // ms between ticks

class Chip8Emulator {
    constructor(screenWidth, screenHeight, Machine) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        // Each pixel only needs 1 bit, so we divide by 8 here to get the length we need.
        let screenSize = (Math.ceil(screenWidth * screenHeight / 8));
        this.machine = Machine(screenSize);
        this.drawFlag = false;
        this.mainLoopId = null;

        // This is dummy code to test that drawing the screen works roughly how we are expecting:
        for (var i = 0; i < 16; i++) {
            this.drawChipCharacterToScreen(digits[i], i % 8, Math.floor(i / 8) * 7);
        }
        this.drawFlag = true;
    }

    loadGame(gameName) {
        // We could add the games somewhere under `/public` and load them with fetch here.
        return fetch('api/games/' + gameName).then(function(response) {
            if (response.ok) {
                console.log("Fetched", gameName);
                return response.arrayBuffer();
            } else {
                var message = "Unable to load game";
                console.log(message);
                return Promise.reject(message);
            }
        }).then(ab => {
            var gd = new Uint8Array(ab);
            return gd;
        }).then(gameData => {
            console.log("Loading", gameData.length, "bytes!");
            for (var i = 0; i < gameData.length; i++) {
                // Write the loaded game to memory starting at 0x200.
                this.memory[0x200 + i] = gameData[i];
            }
            initializeMemoryDisplay();
            this.startEmulator();
        });
    }

    // x/y are one a werid 8x1 grid to make this simpler.
    drawChipCharacterToScreen(digit, x, y) {
        for (var j = 0; j < digit.length; j++) {
            this.machine.screen[(y + j) * this.screenWidth / 8 + x] = digit[j];
        }
    }

    startEmulator() {
        // Clear the existing emulation loop, if for some reason this is called while emulation
        // is already running.
        if (this.mainLoopId) {
            clearInterval(this.mainLoopId);
        }
        this.mainLoopId = setInterval(() => this.emulationLoop(), TICK_MS);
        window.requestAnimationFrame(() => this.renderLoop());
    }

    emulationLoop() {
        machine.tick()
        // Fetch Opcode
        const op = this.fetchOpcode();
        const inst = this.executeOpcode(op);

        // Decode Opcode
        // TODO: Create a mapping from most significant word to method from the selection below
        // Execute Opcode
        // TODO: Call appropriate method below with the instruction as an argument.

    }

    renderLoop() {
        if (this.drawFlag) {
            this.drawFlag = false;
            this.drawGraphics();
        }
        // This will update the display of which keys are being pressed.
        updateKeyboard();
        updateMemoryDisplay(emulator.memory);
        // Assume that the emulator is still running as long `this.mainLoopId` is set.
        if (this.mainLoopId) {
            window.requestAnimationFrame(() => this.renderLoop());
        }
    }

    drawGraphics() {
        drawEmulatorToCanvas(this.machine);
    }

}
