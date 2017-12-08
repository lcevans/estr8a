class InterpreterMachine {
    constructor(screenSize) {
        this.setState(reducerModule.initializeScreen(
            reducerModule.step(),
            screenSize
        ));
        this.screenSize = screenSize;
    }

    setState(state) {
        this.state = state;
        this.screen = this.state.screen.slice();
        this.memory = this.state.memory.slice();
    }

    tick() {
        // Fetch Opcode
        const instruction = reducerModule.nextInstruction(this.state);
        // Handle input separately
        this.setState(reducerModule.readInput(this.state));
        this.setState(reducerModule.step(this.state, instruction));
        return instruction >> 12 === 0xD || instruction === 0x00E0; // Hack to force redraw.
    }

    advanceTimers() {
        this.setState(decreaseTimers(this.state))
    }

    loadGame(data) {
        this.setState(reducerModule.loadProgram(data, this.screenSize));
    }

    getProgramCounter() {
        return this.state.programCounter;
    }

    getRegisters() {
        return this.state.register;
    }

    getSTRegister() {
        return this.state.stRegister;
    }
}

registerMachine('InterpreterMachine', function(screenSize) {
    var machine = new InterpreterMachine(screenSize);
    return machine;
});
