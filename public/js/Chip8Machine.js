var FONT_MEMORY_OFFSET = 16;
class Chip8Machine {
    constructor(screenSize, screenWidth, screenHeight) {
        this.memory = new Uint8Array(4096); // Main memory
        this.V = new Uint8Array(16); // General purpose registers
        this.I = 0;    // Instruction register
        this.S = new Uint16Array(16); // Stack
        this.SP = -1;  // Stack pointer
        this.PC = 512; // Initial address of the program
        this.DT = 0;   // Delay timer
        this.ST = 0;   // Sound timer
        this.screen = new Uint8Array(screenSize);
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.hold = false;  // Indicate if the machine should advance to the next instruction

        this.lookupTable = {
            0x0: this.SYS.bind(this),
            0x1: this.JP1.bind(this),
            0x2: this.CALL.bind(this),
            0x3: this.SE3.bind(this),
            0x4: this.SNE4.bind(this),
            0x5: this.SE5.bind(this),
            0x6: this.LD.bind(this),
            0x7: this.INC.bind(this),
            0x8: this.ALU.bind(this),
            0x9: this.SNE.bind(this),
            0xA: this.LD.bind(this),
            0xB: this.JPB.bind(this),
            0xC: this.RND.bind(this),
            0xD: this.DRW.bind(this),
            0xE: this.KBD.bind(this),
            0xF: this.FN.bind(this),
        };
        // Add the chip font to the beginning of memory.
        for (var i = 0; i < digits.length; i++) {
            this.loadDataToOffset(digits[i], FONT_MEMORY_OFFSET + i * 5);
        }
    }

    getProgramCounter() {
        return this.PC;
    }

    getRegisters() {
        return this.V;
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

        const inst = this.executeInst();

        if (!this.hold) {
            // Advance PC, and take that into account in the couple of instructions that do not need that
            this.PC += 2;
        } else
            this.hold = false;

        return this.extractPrefix(inst) === 0xD || inst === 0x00E0;
    }

    executeInst() {
        let inst = this.memory[this.PC] << 8 | this.memory[this.PC + 1];
        this.lookupTable[this.extractPrefix(inst)](inst); // call the instruction function
        return inst;
    }

    // The maximum is inclusive and the minimum is inclusive
    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
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
        let payload = inst & 0x00FF;
        inst = inst >>> 8;
        let reg = inst & 0x000F;
        return [reg, payload];
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
        let [x, y] = this.extractReg(inst);
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
    JP1(inst) {
        let addr = this.extractPayload(inst);
        this.PC = addr;
        this.hold = true;
    }

    /////////////////////////
    // Bnnn - JP V0 + addr
    // Jump to location nnn + value of V0.
    ///////////////////////////
    JPB(inst) {
        let addr = this.extractPayload(inst);
        this.PC = this.V[0] + addr;
        this.hold = true;
    }

    /////////////////////////////
    // 2nnn - CALL addr        //
    // Call subroutine at nnn. //
    /////////////////////////////
    CALL(inst) {
        var addr = this.extractPayload(inst);
        if (this.SP >= 15) {
            console.log("Registers:", this);
            throw "Stack overflow!";
        }
        this.SP++;
        // Return the the following address
        this.S[this.SP] = this.PC;
        this.PC = addr;
        this.hold = true;
    }


    ///////////////////////////////////////
    // 3xkk - SE Vx, byte                //
    // Skip next instruction if Vx = kk. //
    ///////////////////////////////////////
    SE3(inst) {
        var [reg,num] = this.extractReg(inst);
        if (this.V[reg] == num) {
            this.PC += 2;
        }
    }

    ////////////////////////////////////////
    // 4xkk - SNE Vx, byte                //
    // Skip next instruction if Vx != kk. //
    ////////////////////////////////////////
    SNE4(inst) {
        var [reg,num] = this.extractReg(inst);
        if (this.V[reg] != num) {
            this.PC += 2;
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
            this.PC += 2;
        }
    }

    ////////////////////////
    // 6xkk - LD Vx, byte //
    // Set Vx = kk.       //
    // Annn - LD I, byte  //
    // Set I = nnn        //
    ////////////////////////
    LD(inst) {
        switch(this.extractPrefix(inst)) {
            case 0x6: // Store value on V registers
                let [reg, num] = this.extractReg(inst);
                this.V[reg] = num;
                break;
            case 0xA: // Store value on I register
                this.I = this.extractPayload(inst);
                break;
            default:
                console.log(this);
                throw `Invalid instruction read: 0x${this.extractPrefix(inst).toString(16).toUpperCase()}`;
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
            this.V[x] = this.V[x] >>> 1; // TODO: Bug? Shift before assignment?
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
    SNE(inst) {
        let [x, y, num] = this.extractRegs(inst);
        if (this.V[x] !== this.V[y])
            this.PC += 2;
    }

    //////////////////////////////////
    // Cxkk - RND Vx, byte          //
    // Set Vx = random byte AND kk. //
    //////////////////////////////////
    RND(inst) {
        let [reg, num] = this.extractReg(inst);
        this.V[reg] = this.getRandomInt(0, 255) & num;
    }

    // Fx07 - LD Vx, DT
    // Set Vx = delay timer value.
    // Fx0A - LD Vx, K
    // Wait for a key press, store the value of the key in Vx.
    // Fx15 - LD DT, Vx
    // Set delay timer = Vx.
    // Fx18 - LD ST, Vx
    // Set sound timer = Vx.
    // Fx1E - ADD I, Vx
    // Set I = I + Vx.
    // Fx29 - LD F, Vx
    // Set I = location of sprite for digit Vx.
    // Fx33 - LD B, Vx
    // Store BCD representation of Vx in memory locations I, I+1, and I+2.
    // Fx55 - LD [I], Vx
    // Store registers V0 through Vx in memory starting at location I.
    // Fx65 - LD Vx, [I]
    // Read registers V0 through Vx from memory starting at location I.
    FN(inst) {
        let [reg, num] = this.extractReg(inst);
        switch(num) {
            case 0x7:
                this.V[reg] = this.DT;
                break;
            case 0xA:
                // Wait for a key press, store the value of the key in Vx.
                for (let i = 0; i <= 15; i++)
                    if (isChipKeyDown(i)) {
                        this.V[reg] = i;
                        this.hold = false;
                    }
                // Indicate the machine that it must not advance to the next instruction
                this.hold = true;
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
                this.I = FONT_MEMORY_OFFSET + this.V[reg] * 5;
                break;
            case 0x33:
                // Store BCD representation of Vx in memory locations I, I+1, and I+2
                let val = this.V[reg].toString();
                for (let i = 0; i < 3; i++) {
                    this.memory[this.I + i] = val[i];
                }
                break;
            case 0x55:
                // Store registers V0 through Vx in memory starting at location I
                for (let i = 0; i <= reg; i++) {
                    this.memory[this.I] = this.V[i];
                    this.I += 1;
                }
            case 0x65:
                // Read registers V0 through Vx from memory starting at location I
                for (let i = 0; i <= reg; i++) {
                    this.V[i] = this.memory[this.I];
                    this.I += 1;
                }
                break;
        }
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // Dxyn - DRW Vx, Vy, nibble                                                            //
    // Display n-byte sprite starting at memory location I at (Vx, Vy), set VF = collision. //
    //////////////////////////////////////////////////////////////////////////////////////////
    DRW(inst) {
        let [regX, regY, n] = this.extractRegs(inst);
        let cX = this.V[regX],
            cY = this.V[regY];
        let collision = false;
        this.V[0xF] = 0;
        // Convert (x,y) to index
        let coordsToIndex = (x, y) => y * this.screenWidth / 8 + Math.floor(x / 8);
        // Update the bits of the screen at index and return a flag indicating if any bit
        // was set from 1 to 0
        let updateByte = (byte, index) => {
            let screenByte = this.screen[index];
            let setBits = screenByte & 0xFF; // Get the bits that currently are set on screen
            let result = screenByte ^ byte;
            this.screen[index] = result;
            return result & setBits !== setBits; // Check if the result has the same bits set
        };
        let y2 = cY;
        for (let i = 0; i < n; i++) {
            // Check if we need to wrap row values
            if (y2 + i > this.screenHeight - 1) y2 = 0;
            let byteIndex = coordsToIndex(cX, y2 + i);
            let spriteByte = this.memory[this.I + i];
            if (cX % 8 !== 0) {
                // Set the left part of the byte
                collision |= updateByte(spriteByte >> (cX % 8), byteIndex);
                // Check if we need to wrap col values
                byteIndex = (byteIndex + 1) % 8 === 0 ? coordsToIndex(0, cY) : byteIndex + 1;
                // Set the right part of the byte
                collision |= updateByte((0x01 << (cX % 8)) & spriteByte, byteIndex);
            } else {
                collision |= updateByte(spriteByte, byteIndex);
            }
        }
        this.V[0xF] = collision ? 1 : 0;
    }

    ///////////////////////////////////////////////////////////////////////
    // Ex9E - SKP Vx                                                     //
    // Skip next instruction if key with the value of Vx is pressed.     //
    // ExA1 - SKNP Vx                                                    //
    // Skip next instruction if key with the value of Vx is not pressed. //
    ///////////////////////////////////////////////////////////////////////
    KBD(inst) {
        var [x, num] = this.extractReg(inst);
        if (num == 0x9E) {
            if (isChipKeyDown(this.V[x])) {
                this.PC += 2;
            }
        }
        else if (num == 0xA1) {
            if (!isChipKeyDown(this.V[x])) {
                this.PC += 2;
            }
        }
        else {
            console.log(this);
            throw "Unrecognized instruction";
        }
    }


}

var makeMachine = function(screenSize, screenWidth, screenHeight) {
    var machine = new Chip8Machine(screenSize, screenWidth, screenHeight);
    return machine;
}
