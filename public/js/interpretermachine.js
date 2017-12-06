class InterpreterMachine {
    constructor(screenSize) {
        this.state = reducerModule.step();
    }
    fetchInstruction() {
        let instruction = this.memory[this.PC] << 8 | this.memory[this.PC + 1];
        return instruction;
    }
    tick() {
         // Fetch Opcode
         const instruction = this.fetchInstruction();
         this.state = reducerModule.step(this.state, instruction);
    }
    loadGame(data) {
        this.state = reducerModule.loadProgram(this.state, data);
    }
}

var makeMachine = function(screenSize) {
    var machine = new InterpreterMachine(screenSize);
    return machine;
}
