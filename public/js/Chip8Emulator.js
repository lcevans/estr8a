
class Chip8Emulator {

    initialize() {
        this.memory = new Uint8Array(4096);
        this.mainLoopId = null;
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

    startEmulator() {
        // Clear the existing emulation loop, if for some reason this is called while emulation
        // is already running.
        if (this.mainLoopId) {
            clearInterval(this.mainLoopId);
        }
        this.mainLoopId = setInterval(() => this.emulationLoop(), 16);
        window.requestAnimationFrame(() => this.renderLoop());
    }

    emulationLoop() {
        // Fetch Opcode
        // Decode Opcode
        // Execute Opcode

        // Update timers

        // This would check to update which keys are being pressed by the user.
        // this.setKeys();
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
        // Draw the current screen to the canvas.
    }
}