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
        this.screen = this.state.screen;
        this.memory = this.state.memory;
    }

    tick() {
        // Fetch Opcode
        const instruction = reducerModule.nextInstruction(this.state);
        this.setState(reducerModule.step(this.state, instruction));
        return instruction >> 12 === 0xD; // HAck to force redraw.
    }
    loadGame(data) {
        this.setState(reducerModule.loadProgram(data, this.screenSize));
    }
}

var makeMachine = function(screenSize) {
    var machine = new InterpreterMachine(screenSize);
    return machine;
}
