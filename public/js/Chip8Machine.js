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

        this.lookupTable = {
            0x0: this.SYS,
            0x1: this.JP,
            0x2: this.CALL,
            0x3: this.SE3,
            0x4: this.SNE4,
            0x5: this.SE5,
            0x6: this.LD,
            0x7: this.INC,
            0x8: this.ALU,
            0x9: this.SNE,
            0xA: this.LD,
            0xB: this.JP,
            0xC: this.RND,
            0xD: this.DRW,
            0xE: this.SKP,
            0xF: () => undefined,
        };
        // Add the chip font to the beginning of memory.
        for (var i = 0; i < digits.length; i++) {
            this.loadDataToOffset(digits[i], FONT_MEMORY_OFFSET + i * 5);
        }
    }

    loadGame(data) {
        // Write the loaded game to memory starting at 0x200.
        this.loadDataToOffset(data, 512);
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

        this.executeInst();

        // Alwayd advance PC, and take that into account in the couple of instructions that do not need that
        this.PC += 2;
    }

    executeInst() {
        let inst = this.memory[this.PC] << 8 | this.memory[this.PC + 1];
        this.lookupTable[inst >> 12](inst); // call the instruction function
    }

    // The maximum is inclusive and the minimum is inclusive
    getRandomInt(min, max) {
        const min = Math.ceil(min);
        const max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

    ////////////////////////////////////////////////////////////////////////
    /////////////////////////////// ASSEMBLY ///////////////////////////////
    ////////////////////////////////////////////////////////////////////////

    extractPrefix(inst) {
        return inst >> 12;
    }

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
            if (this.SP >= 0) {
                this.PC = this.S[this.SP];
                this.S[this.SP] = 0;
                this.SP--;
            }
            else {
                console.log("Registers:", this.regs);
                throw "Error! Attempting to return with an empty stack!";
            }
        }
    }

    /////////////////////////
    // 1nnn - JP addr
    // Jump to location nnn.
    // Bnnn - JP V0 + addr
    // Jump to location nnn + value of V0.
    ///////////////////////////
    JP(inst) {
        let addr = this.extractPayload(inst);
        switch (this.extractPrefix(inst)) {
            case 0x1: // Jump to address nnn
                this.PC = addr - 2;
                break;
            case 0xB: // Jump to address nnn + V0
                this.PC = this.V[0] + addr - 2;
                break;
        }
    }

    /////////////////////////////
    // 2nnn - CALL addr        //
    // Call subroutine at nnn. //
    /////////////////////////////
    CALL(inst) {
        var addr = this.extractPayload(inst);
        if (this.sp >= 15) {
            console.log("Registers:", this.regs);
            throw "Stack overflow!";
        }
        this.SP++;
        // Return the the following address
        this.S[this.SP] = this.PC;
        this.PC = addr-2;
    }


    ///////////////////////////////////////
    // 3xkk - SE Vx, byte                //
    // Skip next instruction if Vx = kk. //
    ///////////////////////////////////////
    SE3(inst) {
        var [reg,num] = this.extractReg(inst);
        if (this.V[reg] == num) {
            this.PC+=2;
        }
    }

    ////////////////////////////////////////
    // 4xkk - SNE Vx, byte                //
    // Skip next instruction if Vx != kk. //
    ////////////////////////////////////////
    SNE4(inst) {
        var [reg,num] = this.extractReg(inst);
        if (this.V[reg] != num) {
            this.PC+=2;
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
        if (this.V[x] == this.V[y]) {
            this.PC+=2;
        }
    }

    ////////////////////////
    // 6xkk - LD Vx, byte //
    // Set Vx = kk.       //
    // Annn - LD I, byte  //
    // Set I = nnn        //
    ////////////////////////
    LD(inst) {
        let [reg, num] = this.extractReg(inst);
        switch(this.extractPrefix(inst)) {
            case 0x6: // Store value on V registers
                this.V[reg] = num;
                break;
            case 0xA: // Store value on I register
                this.I = this.extractPayload(inst);
        }
    }

    /////////////////////////
    // 7xkk - ADD Vx, byte //
    // Set Vx = Vx + kk.   //
    /////////////////////////
    INC(inst) {
        var [reg,num] = this.extractReg(inst);
        this.V[reg] += num;
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
            this.V[x] = this.V[y];
            break;
        case 1:
            this.V[x] = this.V[x] | this.V[y];
            break;
        case 2:
            this.V[x] = this.V[x] & this.V[y];
            break;
        case 3:
            this.V[x] = this.V[x] ^ this.V[y];
            break;
        case 4:
            var sum = this.V[x] + this.V[y];
            this.V[15] = 0;
            if (sum >= 2 ** 8) {
                this.V[15] = 1;
                sum -= 2 ** 8;
            }
            this.V[x] = sum;
            break;
        case 5:
            var diff = this.V[x] - this.V[y];
            this.V[15] = 1;
            if (diff < 0) {
                this.V[15] = 0;
                diff += 2 ** 8;
            }
            this.V[x] = diff;
            break;
        case 6:
            this.V[15] = this.V[x] & 0x0001;
            this.V[x] = this.V[x] >>> 1;
            break;
        case 7:
            var diff = this.V[y] - this.V[x];
            this.V[15] = 1;
            if (diff < 0) {
                this.V[15] = 0;
                diff += 2 ** 8;
            }
            this.V[x] = diff;
            break;
        case 14:
            this.V[15] = this.V[x] >>> 15;
            this.V[x] = this.V[x] << 1;
            break;
        default:
            console.log("Registers:", this.regs);
            throw "Unrecognized instruction!";
            break;
        }
    }

    // 9xy0 - SNE Vx, Vy
    SNE(inst) {
        let [x, y, num] = this.extractRegs(inst);
        if (this.V[x] !== this.V[y])
            this.PC += 2;
    }

    // Cxkk - RND Vx, byte
    RND(inst) {
        let [reg, num] = this.extractReg(inst);
        this.V[reg] = this.getRandomInt(0, 255) & num;
    }

    // Dxyn - DRW Vx, Vy, nibble
    // Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision.
    DRW(inst) {
    }

    // Ex9E - SKP Vx
    // Skip next instruction if key with the value of Vx is pressed.
    // ExA1 - SKNP Vx
    // Skip next instruction if key with the value of Vx is not pressed.
    SKP(inst) {
        let [reg, num] = this.extractReg(inst);
        let keyPressed = isChipKeyDown(this.V[reg]);
        if ((num === 0x9E && keyPressed) || num === 0xA1 && !keyPressed)
            this.PC += 2;
    }

    FN(inst) {
        let [reg, num] = this.extractReg(inst);
        switch(num) {
            case 0x7:
                this.V[reg] = this.DT;
                break;
            case 0xA:
                break;
            case 0x15:
                this.DT = this.V[reg];
                break;
            case 0x18:
                this.V[reg] = this.ST;
                break;
            case 0x1E:
                this.I += this.V[reg];
                break;
            case 0x29:
                break;
            case 0x33:
                break;
            case 0x55:
                // Store registers V0 through Vx in memory starting at location I
                for (let i = 0; i <= reg; i++)
                    this.memory[this.I + i] = this.V[i];
            case 0x55:
                // Read registers V0 through Vx from memory starting at location I
                for (let i = 0; i <= reg; i++)
                    this.V[i] = this.memory[this.I + i];
                break;
        }
    }
}

var makeMachine = function(screenSize) {
    var machine = new Chip8Machine(screenSize);
    return machine;
}
