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
    }

    loadGame(data) {
        for (var i = 0; i < data.length; i++) {
            // Write the loaded game to memory starting at 0x200.
            this.memory[512+i] = data[i];
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
            if (this.SP >= 0) {
                this.PC = this.S[this.SP];
                this.S[this.SP] = 0;
                this.SP--;
            }
            else {
                console.log("Registers:", this);
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
        this.PC = addr-2;
    }

    /////////////////////////////
    // 2nnn - CALL addr        //
    // Call subroutine at nnn. //
    /////////////////////////////
    CALL(inst) {
        var addr = this.extractPayload(inst);
        if (this.sp >= 15) {
            console.log("Registers:", this);
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
            console.log(this);
            throw "Invalid instruction read!";
        }
        if (this.V[x] == this.V[y]) {
            this.PC+=2;
        }
    }

    ////////////////////////
    // 6xkk - LD Vx, byte //
    // Set Vx = kk.       //
    ////////////////////////
    LD(inst) {
        var [reg,num] = this.extractReg(inst);
        this.V[reg] = num;
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
            console.log("Registers:", this);
            throw "Unrecognized instruction!";
            break;
        }
    }


    ////////////////////////////////////////
    // 9xy0 - SNE Vx, Vy                  //
    // Skip next instruction if Vx != Vy. //
    ////////////////////////////////////////
    SNE9(inst) {
        var [x,y,z] = this.extractRegs(inst);
        if (z != 0) {
            console.log(this);
            throw "Unrecognized instruction!";
        }

        if (this.V[x] != this.V[y]) {
            this.PC += 2;
        }
    }

    ///////////////////////
    // Annn - LD I, addr //
    // Set I = nnn.      //
    ///////////////////////
    LDI(inst) {
        var num = this.extractPayload(inst);
        this.I = num;
    }

    ////////////////////////////////
    // Bnnn - JP V0, addr         //
    // Jump to location nnn + V0. //
    ////////////////////////////////
    JP(inst) {
        var num = this.extractPayload(inst);
        this.PC = this.V[0] + num - 2;
    }

    //////////////////////////////////
    // Cxkk - RND Vx, byte          //
    // Set Vx = random byte AND kk. //
    //////////////////////////////////
    RND(inst) {
        var [x, num] = this.extractPayload(inst);
        var rand = 1;
        while (rand == 1) {
            rand = Math.random();
        }
        this.V[x] = num & Math.floor(256*rand);
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // Dxyn - DRW Vx, Vy, nibble                                                            //
    // Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision. //
    //////////////////////////////////////////////////////////////////////////////////////////
    DRW(inst) {
        var [x,y,n] = this.extractRegs(inst);
    }

    ///////////////////////////////////////////////////////////////////////
    // Ex9E - SKP Vx                                                     //
    // Skip next instruction if key with the value of Vx is pressed.     //
    // ExA1 - SKNP Vx                                                    //
    // Skip next instruction if key with the value of Vx is not pressed. //
    ///////////////////////////////////////////////////////////////////////
    KBD(inst) {
        var [x,num] = thisextractReg(inst);
        if (num == 0x9E)
            if (isChipKeyDown(x))
                this.PC += 2;
        else if (num == 0xA1)
            if (! isChipKeyDown(x))
                this.PC += 2;
        else {
            console.log(this);
            throw "Unrecognized instruction";
        }
    }


}

var makeMachine = function(screenSize) {
    var machine = new Chip8Machine(screenSize);
    return machine;
}
