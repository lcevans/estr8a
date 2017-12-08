class Chip8Emulator {
    constructor(screenWidth, screenHeight, MakeMachine) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        // Each pixel only needs 1 bit, so we divide by 8 here to get the length we need.
        let screenSize = (Math.ceil(screenWidth * screenHeight / 8));
        this.machine = MakeMachine(screenSize, screenWidth, screenHeight);
        this.drawFlag = false;
        this.mainLoopId = null;
        // This is named to indicate whether the emulator should play if
        // a game is loaded.
        this.shouldPlay = true;
        // The number of instructions the emulator should attempt to run each second.
        this.instructionsPerFrame = 10;

        this.drawFlag = false;
        window.requestAnimationFrame(() => this.renderLoop());

        // Set up sound loop
        this.beeper = new Beeper(this.machine);
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
            drawLoadingScreen(this);
            this.machine.loadGame(gameData);
            if (this.shouldPlay) {
                this.startEmulator();
            }

            // Set instructions
            var instructionsDiv = document.getElementById('instructions');
            if (gameName in gameInstructions)
            {
                instructionsDiv.innerHTML = gameInstructions[gameName];
            }
            else
            {
                instructionsDiv.innerHTML = "No instructions for this game"
            }
        });
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
        this.mainLoopId = setInterval(() => this.emulationLoop(), TICK_MS);

        if (this.soundLoopId) {
            clearInterval(this.soundLoopId);
        }
        this.soundLoopId = setInterval(() => {tickSound(this.beeper);}, TICK_MS);
    }

    pauseEmulator() {
        this.shouldPlay = false;
        if (this.mainLoopId) {
            clearInterval(this.mainLoopId);
            // We read this.mainLoopId to determine if
            // the emulator is currently playing.
            this.mainLoopId = null;
        }

        if (this.soundLoopId) {
            clearInterval(this.soundLoopId);
            // Need to shut off beeper directly
            if(this.beeper.playing == true) {
                this.beeper.stop(TICK_S)
                this.beeper.playing = false;
            }
            this.soundLoopId = null;
        }

    }

    emulationLoop() {
        for (var i = 0; i < this.instructionsPerFrame; i++) {
            this.drawFlag = this.machine.tick() || this.drawFlag;
        }
        this.machine.advanceTimers();
    }

    renderLoop() {
        if (this.drawFlag) {
            this.drawFlag = false;
            this.drawGraphics();
        }
        // This will update the display of which keys are being pressed.
        updateKeyboard();
        updateMemoryDisplay(this.machine, this.machine.getProgramCounter());
        updateRegisterDisplay(this.machine.getRegisters());
        window.requestAnimationFrame(() => this.renderLoop());
    }

    drawGraphics() {
        drawEmulatorToCanvas(this);
    }

}
