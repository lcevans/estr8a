var FONT_MEMORY_OFFSET = 16;
class Chip8Machine {
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
        // Add the chip font to the beginning of memory.
        for (var i = 0; i < digits.length; i++) {
            this.loadDataToOffset(digits[i], FONT_MEMORY_OFFSET + i * 5);
        }
    }

    loadGame(data) {
        // Write the loaded game to memory starting at 0x200.
        this.loadDataToOffset(data, 512);
        this.PC = 512;
    }

    loadDataToOffset(data, offset) {
        for (var i = 0; i < data.length; i++) {
            this.memory[offset + i] = data[i];
        }
    }

    tick() {
        // Update timers
        // Sound currently does nothing since the sound code has its own timer.
        // It might be worthwhile to move it here
        if (this.ST > 0) {
            this.ST--;
        }
        if (this.DT > 0) {
            this.DT--;
        }

        // Alwayd advance PC, and take that into account in the couple of instructions that do not need that
        this.PC += 2;
    }

    ////////////////////////////////////////////////////////////////////////
    /////////////////////////////// ASSEMBLY ///////////////////////////////
    ////////////////////////////////////////////////////////////////////////

    // Extract payload
    extractPayload(inst) {
        return inst & 0x0FFF;
    }

    // Extract 2 register values and a third word
    extractRegs(inst) {
        var words = new Uint8Array(3);
        for (var i = 2; i >= 0; i--) {
            words[i] = inst & 0x000F;
            inst = inst >>> 4;
        }
        return words;
    }

    // Extract a register value and a payload byte
    extractReg(inst) {
        var payload = inst & 0x00FF;
        inst = inst >>> 8;
        var reg = inst & 0x000F;
        return [reg,payload];
    }

    ////////////////////////////////////////////
    // 0nnn - SYS addr                        //
    // Jump to a machine code routine at nnn. //
    // 00E0 - CLS                             //
    // Clear the display.                     //
    // 00EE - RET                             //
    // Return from a subroutine.              //
    ////////////////////////////////////////////
    SYS(inst) {
        var [x,y] = this.extractReg(inst);
        // Ignore all syscalls other than return and cls
        if (x>0)
            return;
        // CLS
        if (y == 0xE0) {
            for (var j = 0; j < this.screen.length; j++) {
                this.screen[j] = 0;
            }
        }
        // RET
        else if (y == 0xEE) {
            if (this.regs.SP >= 0) {
                this.regs.PC = this.regs.S[this.regs.SP];
                this.regs.S[this.regs.SP] = 0;
                this.regs.SP--;
            }
            else {
                console.log("Registers:", this.regs);
                throw "Error! Attempting to return with an empty stack!";
            }
        }
    }

    ///////////////////////////
    // 1nnn - JP addr        //
    // Jump to location nnn. //
    ///////////////////////////
    JP(inst) {
        var addr = this.extractPayload(inst);
        this.regs.PC = addr-2;
    }

    /////////////////////////////
    // 2nnn - CALL addr        //
    // Call subroutine at nnn. //
    /////////////////////////////
    CALL(inst) {
        var addr = this.extractPayload(inst);
        if (this.regs.sp >= 15) {
            console.log("Registers:", this.regs);
            throw "Stack overflow!";
        }
        this.regs.SP++;
        // Return the the following address
        this.regs.S[this.regs.SP] = this.regs.PC;
        this.regs.PC = addr-2;
    }


    ///////////////////////////////////////
    // 3xkk - SE Vx, byte                //
    // Skip next instruction if Vx = kk. //
    ///////////////////////////////////////
    SE3(inst) {
        var [reg,num] = this.extractReg(inst);
        if (this.regs.V[reg] == num) {
            this.regs.PC+=2;
        }
    }

    ////////////////////////////////////////
    // 4xkk - SNE Vx, byte                //
    // Skip next instruction if Vx != kk. //
    ////////////////////////////////////////
    SNE4(inst) {
        var [reg,num] = this.extractReg(inst);
        if (this.regs.V[reg] != num) {
            this.regs.PC+=2;
        }
    }

    ///////////////////////////////////////
    // 5xy0 - SE Vx, Vy                  //
    // Skip next instruction if Vx = Vy. //
    ///////////////////////////////////////
    SE5(inst) {
        var [x,y,num] = this.extractRegs(inst);
        if (num != 0) {
            consile.log(this.regs);
            throw "Invalid instruction read!";
        }
        if (this.regs.V[x] == this.regs.V[y]) {
            this.regs.PC+=2;
        }
    }

    ////////////////////////
    // 6xkk - LD Vx, byte //
    // Set Vx = kk.       //
    ////////////////////////
    LD(inst) {
        var [reg,num] = this.extractReg(inst);
        this.regs.V[reg] = num;
    }

    /////////////////////////
    // 7xkk - ADD Vx, byte //
    // Set Vx = Vx + kk.   //
    /////////////////////////
    INC(inst) {
        var [reg,num] = this.extractReg(inst);
        this.regs.V[reg] += num;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // 8xy0 - LD Vx, Vy                                                                                           //
    // Set Vx = Vy.                                                                                               //
    // 8xy1 - OR Vx, Vy                                                                                           //
    // Set Vx = Vx OR Vy.                                                                                         //
    // 8xy2 - AND Vx, Vy                                                                                          //
    // Set Vx = Vx AND Vy.                                                                                        //
    // 8xy3 - XOR Vx, Vy                                                                                          //
    // Set Vx = Vx XOR Vy.                                                                                        //
    // 8xy4 - ADD Vx, Vy                                                                                          //
    // Set Vx = Vx + Vy, set VF = carry.                                                                          //
    // 8xy5 - SUB Vx, Vy                                                                                          //
    // Set Vx = Vx - Vy, set VF = NOT borrow.                                                                     //
    // 8xy6 - SHR Vx {, Vy}                                                                                       //
    // Set Vx = Vx SHR 1.                                                                                         //
    // If the least-significant bit of Vx is 1, then VF is set to 1, otherwise 0. Then Vx is divided by 2.        //
    // 8xy7 - SUBN Vx, Vy                                                                                         //
    // Set Vx = Vy - Vx, set VF = NOT borrow.                                                                     //
    // 8xyE - SHL Vx {, Vy}                                                                                       //
    // Set Vx = Vx SHL 1.                                                                                         //
    // If the most-significant bit of Vx is 1, then VF is set to 1, otherwise to 0. Then Vx is multiplied by 2.   //
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    ALU(inst) {
        var [x,y,z] = this.extractRegs(inst);
        switch (z) {
        case 0:
            this.regs.V[x] = this.regs.V[y];
            break;
        case 1:
            this.regs.V[x] = this.regs.V[x] | this.regs.V[y];
            break;
        case 2:
            this.regs.V[x] = this.regs.V[x] & this.regs.V[y];
            break;
        case 3:
            this.regs.V[x] = this.regs.V[x] ^ this.regs.V[y];
            break;
        case 4:
            var sum = this.regs.V[x] + this.regs.V[y];
            this.regs.V[15] = 0;
            if (sum >= 2 ** 8) {
                this.regs.V[15] = 1;
                sum -= 2 ** 8;
            }
            this.regs.V[x] = sum;
            break;
        case 5:
            var diff = this.regs.V[x] - this.regs.V[y];
            this.regs.V[15] = 1;
            if (diff < 0) {
                this.regs.V[15] = 0;
                diff += 2 ** 8;
            }
            this.regs.V[x] = diff;
            break;
        case 6:
            this.regs.V[15] = this.regs.V[x] & 0x0001;
            this.regs.V[x] = this.regs.V[x] >>> 1;
            break;
        case 7:
            var diff = this.regs.V[y] - this.regs.V[x];
            this.regs.V[15] = 1;
            if (diff < 0) {
                this.regs.V[15] = 0;
                diff += 2 ** 8;
            }
            this.regs.V[x] = diff;
            break;
        case 14:
            this.regs.V[15] = this.regs.V[x] >>> 15;
            this.regs.V[x] = this.regs.V[x] << 1;
            break;
        default:
            console.log("Registers:", this.regs);
            throw "Unrecognized instruction!";
            break;
        }
    }
}

var makeMachine = function(screenSize) {
    var machine = new Chip8Machine(screenSize);
    return machine;
}
