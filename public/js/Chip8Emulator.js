var TICK_MS = 16; // ms between ticks

class Chip8Emulator {

    constructor(screenWidth, screenHeight) {
        this.regs = {
            'V' : new Uint8Array(16), // General purpose registers
            'I' : 0,   // Instruction register
            'S' : new Uint16Array(16), // Stack
            'SP': -1,  // Stack pointer
            'PC': 512, // Initial address of the program
            'DT': 0,   // Delay timer
            'ST': 0,   // Sound timer
        }
        for (i=0; i<=0xF; i++) {
            this.regs[`V${i.toString(16)}`] = 0;
        }
        this.memory = new Uint8Array(4096);
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        // Each pixel only needs 1 bit, so we divide by 8 here to get the length we need.
        this.screen = new Uint8Array(Math.ceil(screenWidth * screenHeight / 8));
        this.drawFlag = false;
        this.mainLoopId = null;

        // This is dummy code to test that drawing the screen works roughly how we are expecting:
        for (var i = 0; i < 16; i++) {
            this.drawChipCharacterToScreen(digits[i], i % 8, Math.floor(i / 8) * 7);
        }
        this.drawFlag = true;
    }
    loadGame(gameName) {
        // We could add the games somewhere under `/public` and load them with fetch here.
        return fetch('games/' + gameName).then(function(response) {
            if (response.ok) {
                console.log("Fetched", gameName);
                return response.arrayBuffer();
            } else {
                var message = "Unable to load game";
                console.log(message);
                return Promise.reject(message);
            }
        }).then(ab => {
            var gd = new Uint8Array(ab);
            return gd;
        }).then(gameData => {
                console.log("Loading", gameData.length, "bytes!");
                for (var i = 0; i < gameData.length; i++) {
                    // Write the loaded game to memory starting at 0x200.
                    this.memory[0x200 + i] = gameData[i];
                }
        });
    }

    // x/y are one a werid 8x1 grid to make this simpler.
    drawChipCharacterToScreen(digit, x, y) {
        for (var j = 0; j < digit.length; j++) {
            this.screen[(y + j) * this.screenWidth / 8 + x] = digit[j];
        }
    }

    startEmulator() {
        // Clear the existing emulation loop, if for some reason this is called while emulation
        // is already running.
        if (this.mainLoopId) {
            clearInterval(this.mainLoopId);
        }
        this.mainLoopId = setInterval(() => this.emulationLoop(), TICK_MS);
        window.requestAnimationFrame(() => this.renderLoop());
    }

    moveToNextInstruction() {
        this.regs.PC += 2;
    }

    fetchOpcode() {
        let opcode = this.memory[this.regs.PC] << 8 | this.memory[this.regs.PC + 1];
        this.moveToNextInstruction();
        return opcode;
    }

    executeOpcode(opcode) {
        executeInstruction(this, opcode);
    }

    emulationLoop() {
        // Fetch Opcode
        const op = this.fetchOpcode();
        const inst = this.executeOpcode(op);

        // Decode Opcode
        // TODO: Create a mapping from most significant word to method from the selection below
        // Execute Opcode
        // TODO: Call appropriate method below with the instruction as an argument.

        // ---- RIC CODE -----
        // let opcode = fetchOpcode();
        // Execute Opcode
        // executeOpcode(opcode);
        // -------------------
        // Update timers
        // Sound currently does nothing since the sound code has its own timer.
        // It might be worthwhile to move it here
        if (this.regs.ST > 0) {
            this.regs.ST--;
        }
        if (this.regs.DT > 0) {
            this.regs.DT--;
        }

        // Code for testing the keyboard mapping. This will log 0-F
        // based on which keys are currently pressed.
        for (var i = 0; i < 16; i++) {
            if (isChipKeyDown(i)) console.log(i.toString(16));
        }
    }

    renderLoop() {
        if (this.drawFlag) {
            this.drawFlag = false;
            this.drawGraphics();
        }
        // Assume that the emulator is still running as long `this.mainLoopId` is set.
        if (this.mainLoopId) {
            window.requestAnimationFrame(() => this.renderLoop());
        }
    }

    drawGraphics() {
        drawEmulatorToCanvas(this);
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
