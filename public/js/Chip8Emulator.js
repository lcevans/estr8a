class Chip8Emulator {
    constructor(screenWidth, screenHeight, MakeMachine) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        // Each pixel only needs 1 bit, so we divide by 8 here to get the length we need.
        let screenSize = (Math.ceil(screenWidth * screenHeight / 8));
        this.machine = MakeMachine(screenSize);
        this.drawFlag = false;
        this.mainLoopId = null;
        // This is named to indicate whether the emulator should play if
        // a game is loaded.
        this.shouldPlay = true;
        // The number of instructions the emulator should attempt to run each second.
        this.instructionsPerSecond = 60;

        // This is dummy code to test that drawing the screen works roughly how we are expecting:
        for (var i = 0; i < 16; i++) {
             this.drawChipCharacterToScreen(digits[i], i % 8, Math.floor(i / 8) * 7);
        }
        this.drawFlag = true;
        window.requestAnimationFrame(() => this.renderLoop());
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
            this.machine.loadGame(gameData);
            if (this.shouldPlay) {
                this.startEmulator();
            }
        });
    }

    // x/y are one a werid 8x1 grid to make this simpler.
    drawChipCharacterToScreen(digit, x, y) {
        for (var j = 0; j < digit.length; j++) {
            this.machine.screen[(y + j) * this.screenWidth / 8 + x] = digit[j];
        }
    }

    // Returns whether the emulator is currently running.
    isRunning() {
        return !!this.mainLoopId;
    }

    startEmulator() {
        this.shouldPlay = true;
        // Clear the existing emulation loop, if for some reason this is called while emulation
        // is already running.
        if (this.mainLoopId) {
            clearInterval(this.mainLoopId);
        }
        this.mainLoopId = setInterval(() => this.emulationLoop(), Math.ceil(1000 / this.instructionsPerSecond ));
    }

    pauseEmulator() {
        this.shouldPlay = false;
        if (this.mainLoopId) {
            clearInterval(this.mainLoopId);
            // We read this.mainLoopId to determine if
            // the emulator is currently playing.
            this.mainLoopId = null;
        }
    }

    emulationLoop() {
        this.drawFlag = this.machine.tick()
    }

    renderLoop() {
        if (this.drawFlag) {
            this.drawFlag = false;
            this.drawGraphics();
        }
        // This will update the display of which keys are being pressed.
        updateKeyboard();
        updateMemoryDisplay(this.machine, this.machine.state.programCounter);
        window.requestAnimationFrame(() => this.renderLoop());
    }

    drawGraphics() {
        drawEmulatorToCanvas(this);
    }

}
