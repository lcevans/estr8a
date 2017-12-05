class InterpreterMachine {
    constructor(screenSize) {
        this.memory = new Uint8Array(4096); // Main memory
        this.V = new Uint8Array(16); // General purpose registers
        this.I = 0;    // Instruction register
        this.S = new Uint16Array(16); // Stack
        this.SP = -1;  // Stack pointer
        this.PC = 512; // Initial address of the program
        this.DT = 0;   // Delay timer
        this.ST = 0;   // Sound timer
        this.screen = new Uint8Array(screenSize);
        for (i=0; i<=0xF; i++) {
            this[`V${i.toString(16)}`] = 0;
        }
    }
    moveToNextInstruction() {
        this.PC += 2;
    }
    fetchOpcode() {
        let opcode = this.memory[this.PC] << 8 | this.memory[this.PC + 1];
        this.moveToNextInstruction();
        return opcode;
    }
    executeOpcode(opcode) {
        executeInstruction(this, opcode);
    }
   tick() {
         // Fetch Opcode
         const op = this.fetchOpcode();
         const inst = this.executeOpcode(op);

        // IMPLEMENT
    }
}
