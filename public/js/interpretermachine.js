class InterpreterMachine {
    constructor(screenSize) {
        this.state = reducerModule.step();
        this.screen = this.state.screen;
        this.memory = this.state.memory;
    }
    tick() {
         // Fetch Opcode
         const instruction = reducerModule.nextInstruction(this.state);
         this.state = reducerModule.step(this.state, instruction);
    }
    loadGame(data) {
        this.state = reducerModule.loadProgram(this.state, data);
        this.screen = this.state.screen;
        this.memory = this.state.memory;
    }
}

var makeMachine = function(screenSize) {
    var machine = new InterpreterMachine(screenSize);
    return machine;
}
