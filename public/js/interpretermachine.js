class InterpreterMachine {
    constructor(screenSize) {
        this.setState(reducerModule.initializeScreen(
            reducerModule.step(),
            screenSize
        ));
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
    }
    loadGame(data) {
        this.setState(reducerModule.loadProgram(data));
    }
}

var makeMachine = function(screenSize) {
    var machine = new InterpreterMachine(screenSize);
    return machine;
}
