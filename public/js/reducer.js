// TODO: Improve the understandability of the mask and shifts.
// TODO: It's weird to increment the program counter by 2 every time.

// Chip font will be loaded into memory at this address.
const FONT_ADDRESS = 0x0;

const defaultState = {
    memory: addChipFontsAtAddress(new Uint8Array(0x1000), FONT_ADDRESS),
    register: new Uint8Array(0x10), // VX
    stack: new Uint16Array(0x10),
    programCounter: 0x200, // PC
    stackPointer: 0x0,
    iRegister: 0x0, // I
    stRegister: 0, // ST
    dtRegister: 0, // DT
    screen: null,
    screenSize: 0,
    // the keyboard could be updated separately
    // or else read from the keyboard itself
    keyboard: new Uint8Array(0x10),
};


const decreaseTimers = (state, overrides) => {
    return Object.assign({}, state, {
        dtRegister: state.dtRegister > 0 ? state.dtRegister-- : 0,
        stRegister: state.stRegister > 0 ? state.stRegister-- : 0,
    }, overrides);
}


const reducerModule = {
    step: (state = defaultState, instruction) => {
        if (typeof(instruction) === 'undefined') {
            console.warn('Using default state');
            return state;
        }

        const displayInstruction = '0x' + instruction.toString(16)
        const opCode = (instruction & 0xF000) >> 12;
        switch(opCode) {
            case 0x0: {
                switch(instruction) {
                    // CLS
                    case 0x00e0: {
                        const newState = reducerModule.initializeScreen(
                            state, state.screenSize
                        );
                        return decreaseTimers(newState, {
                            programCounter: state.programCounter + 2
                        });
                    }
                    // RET
                    case 0x00ee: {
                        const stackPointer = state.stackPointer - 1;
                        const programCounter = state.stack[stackPointer] + 2;
                        return decreaseTimers(state, {
                            programCounter,
                            stackPointer,
                        });
                    }
                }
                throw `Unrecognized instruction ${displayInstruction}`;
            }

            // JP addr
            case 0x1: {
                const addr = instruction & 0x0fff;
                return decreaseTimers(state, {
                    programCounter: addr
                });
            }

            // CALL addr
            case 0x2: {
                const addr = instruction & 0x0fff;
                const stack = state.stack.slice();
                stack[state.stackPointer] = state.programCounter;
                // FIXME throw a horrible exception for stack overflow
                return decreaseTimers(state, {
                    stack,
                    stackPointer: state.stackPointer + 0x1,
                    programCounter: addr,
                });
            }

            // SE Vx, byte
            case 0x3: {
                const value = instruction & 0x00ff;
                const x = (instruction & 0x0f00) >> 8;
                const increment = value === state.register[x] ? 4 : 2;
                return decreaseTimers(state, {
                    programCounter: state.programCounter + increment,
                });
            }

            // SNE Vx, value
            case 0x4: {
                const value = instruction & 0x00ff;
                const x = (instruction & 0x0f00) >> 8;
                const increment = value !== state.register[x] ? 4 : 2;
                return decreaseTimers(state, {
                    programCounter: state.programCounter + increment,
                });
            }

            // SE Vx,Vy
            case 0x5: {
                const x = (instruction & 0x0f00) >> 8;
                const y = (instruction & 0x00f0) >> 4;
                const increment = state.register[x] === state.register[y] ? 4 : 2;
                return decreaseTimers(state, {
                    programCounter: state.programCounter + increment,
                });
            }

            // LD Vx, value
            case 0x6: {
                const value = instruction & 0x00ff;
                const x = (instruction & 0x0f00) >> 8;
                const register = state.register.slice();
                register[x] = value;
                return decreaseTimers(state, {
                    programCounter: state.programCounter + 0x2,
                    register,
                });
            }

            // ADD Vx, value
            case 0x7: {
                const value = instruction & 0x00ff;
                const x = (instruction & 0x0f00) >> 8;
                const register = state.register.slice();
                register[x] += value;
                return decreaseTimers(state, {
                    programCounter: state.programCounter + 0x2,
                    register,
                });
            }

            // ALU family looks like
            case 0x8: {
                const x = (instruction & 0x0f00) >> 8;
                const y = (instruction & 0x00f0) >> 4;
                const operation = (instruction & 0x000f);
                const register = state.register.slice();

                switch (operation) {
                    // LD Vx, Vy
                    case 0x0: {
                        register[x] = register[y];
                        break;
                    }

                    // OR Vx, Vy
                    case 0x1: {
                        register[x] = register[x] | register[y];
                        break;
                    }

                    // AND Vx, Vy
                    case 0x2: {
                        register[x] = register[x] & register[y];
                        break;
                    }

                    // XOR Vx, Vy
                    case 0x3: {
                        register[x] = register[x] ^ register[y];
                        break;
                    }

                    // ADD Vx, Vy
                    case 0x4: {
                        const extendedSum = register[x] + register[y];
                        const sum = extendedSum & 0x00ff;
                        const carry = (extendedSum & 0xff00) >> 8;
                        register[x] = sum;
                        register[0xf] = carry;
                        break;
                    }

                    // SUB Vx, Vy
                    case 0x5: {
                        const diff = register[x] - register[y];
                        let notBorrow;
                        if (register[x] > register[y]) {
                            notBorrow = 1;
                        } else {
                            notBorrow = 0;
                            diff += 0x100;
                        }
                        register[x] = diff;
                        register[0xf] = notBorrow;
                        break;
                    }

                    // SHR Vx {, Vy}
                    // TODO does this mean to apply the same for Vy?
                    case 0x6: {
                        const lsb = register[x] & 0b1;
                        register[x] = register[x] >> 1;
                        register[0xF] = lsb;
                        break;
                    }

                    // SUBN Vx, Vy
                    case 0x7: {
                        const diff = register[y] - register[x];
                        let notBorrow;
                        if (register[y] > register[x]) {
                            notBorrow = 1;
                        } else {
                            notBorrow = 0;
                            diff += 0x100;
                        }
                        register[x] = diff;
                        register[0xf] = notBorrow;
                        break;
                    }

                    // SHL Vx {, Vy}
                    // TODO does this mean to apply the same for Vy?
                    case 0x6: {
                        const msb = register[x] & 0b10000000;
                        register[x] = register[x] << 1;
                        register[0xF] = msb;
                        break;
                    }

                    default:
                        throw `Unrecognized instruction ${displayInstruction}`;


                }

                return decreaseTimers(state, {
                    programCounter: state.programCounter + 0x2,
                    register,
                });

            }

            // SNE Vx, Vy
            case 0x9: {
                const x = (instruction & 0x0f00) >> 8;
                const y = (instruction & 0x00f0) >> 4;
                const increment = state.register[x] !== state.register[y] ? 4 : 2;
                return decreaseTimers(state, {
                    programCounter: state.programCounter + increment,
                });
            }

            // LD I, addr
            case 0xa: {
                const addr = instruction & 0x0fff;
                return decreaseTimers(state, {
                    iRegister: addr,
                    programCounter: state.programCounter + 0x2,
                });
            }

            // LD I, addr
            case 0xb: {
                const addr = instruction & 0x0fff;
                return decreaseTimers(state, {
                    programCounter: addr + state.register[0x0],
                });
            }

            // RDN Vx, value
            case 0xc: {
                const x = (instruction & 0x0f00) >> 8;
                const value = instruction & 0x00ff;
                const rand = Math.floor(0x100 * Math.random());
                const register = state.register.slice();
                register[x] = rand & value;
                return decreaseTimers(state, {
                    register,
                    programCounter: state.programCounter + 0x2,
                });
            }

            // DRW Vx, Vy, nibble
            case 0xd: {
                const x = (instruction & 0x0f00) >> 8;
                const y = (instruction & 0x00f0) >> 4;
                const n = (instruction & 0x000f) >> 0;
                // TODO Biggest ever
                return Object.assign({}, reducerModule.draw(state, state.register[x], state.register[y], n), { programCounter: state.programCounter + 0x2 });
            }

            // Misc comands (mostly LD)
            case 0xf: {
                const x = (instruction & 0x0f00) >> 8;
                const subOpCode = (instruction & 0x00ff);
                const register = state.register.slice();
                const memory = state.memory.slice();
                switch(subOpCode) {
                    // LD Vx, DT
                    case 0x07: {
                        register[x] = state.dtRegister;
                        break;
                    }
                    // LD Vx, K
                    // Wait for a key press, store the value of the key in Vx.
                    // We simulate this by not incrementing PC if no key is down => we will call this command again next cycle
                    case 0x0a: {
                        for(var i=1; i<16; i++)
                        {
                            if(state.keyboard[i]) {
                                register[x] = i;
                                return decreaseTimers(state, {
                                    register,
                                    programCounter: state.programCounter + 2,
                                });
                                break;
                            }
                        }
                        // No key is down so do nothing (PC unchanged so we will call this command again)
                        return decreaseTimers(state, {});
                    }
                    // LD DT, Vx
                    case 0x15: {
                        return decreaseTimers(state, {
                            dtRegister: state.register[x],
                            programCounter: state.programCounter + 2,
                        });
                    }
                    // LD ST, Vx
                    case 0x18: {
                        state.stRegister = state.register[x];
                        return decreaseTimers(state, {
                            stRegister: state.register[x],
                            programCounter: state.programCounter + 2,
                        });
                    }
                    // ADD I, Vx
                    case 0x1e: {
                        return decreaseTimers(state, {
                            iRegister: state.register[x],
                            programCounter: state.programCounter + 2,
                        });
                    }
                    // LD F, Vx
                    // The value of I is set to the location for the hexadecimal sprite corresponding to the value of Vx.
                    case 0x29: {
                        // NOTE: This assumes the "chip-font" sprites are loaded here in memory
                        return decreaseTimers(state, {
                            iRegister: 5 * x,
                            programCounter: state.programCounter + 2,
                        });
                        break;
                    }
                    // LD B, Vx
                    // The interpreter takes the decimal value of Vx, and places the hundreds digit in memory at location in I,
                    // the tens digit at location I+1, and the ones digit at location I+2.
                    case 0x33: {
                        var number = state.register[x];
                        const ones_digit = number % 10;
                        number = (number - ones_digit) / 10;
                        const tens_digit = number % 10;
                        const hundreds_digit = (number - ones_digit) / 10;
                        memory[state.iRegister] = hundreds_digit;
                        memory[state.iRegister + 1] = tens_digit;
                        memory[state.iRegister + 2] = ones_digit;
                        break;
                    }
                    // LD [I], Vx
                    // The interpreter copies the values of registers V0 through Vx into memory, starting at the address in I.
                    case 0x55: {
                        for (var i=0; i<x+1; i++) {
                            memory[state.iRegister + i] = state.register[i];
                        }
                        break;
                    }
                    // LD Vx, [I]
                    // The interpreter reads values from memory starting at location I into registers V0 through Vx.
                    case 0x65: {
                        for (var i=0; i<x+1; i++) {
                            register[i] = state.memory[state.iRegister + i];
                        }
                        break;
                    }

                    default:
                        throw `Unrecognized instruction ${displayInstruction}`;
                }

                return decreaseTimers(state, {
                    memory,
                    register,
                    programCounter: state.programCounter + 2,
                });

            }

            default:
                throw `Unrecognized instruction ${displayInstruction}`;

        }
        // shouldn't get to this stage either
        return state;
    },

    loadProgram: (program, screenSize) => {
        const state = Object.assign({}, defaultState);
        const memory = state.memory.slice();
        const reserved = 0x200;
        for (let i = 0; i < program.length; i++) {
            memory[reserved + i] = program[i];
        }
        return Object.assign({}, reducerModule.initializeScreen(state, screenSize), { memory });
    },

    nextInstruction: (state = defaultState) => {
        const firstHalf = state.memory[state.programCounter] << 8;
        const secondHalf = state.memory[state.programCounter + 1];
        return firstHalf | secondHalf;
    },

    readInput: (state = defaultState) => {
        const keyboard = new Uint8Array(0x10);
        for (let i = 0; i < 0x10; i++) {
            keyboard[i] = isChipKeyDown(i);
        }
        return Object.assign({}, state, { keyboard });
    },

    initializeScreen: (state, screenSize) => {
        return Object.assign({}, state, {
            screen: new Uint8Array(screenSize),
            screenSize: screenSize
        });
    },

    draw: (state, Vx, Vy, n) => {
        var screen = new Uint8Array(state.screen);
        var memory = state.memory;
        var I = state.iRegister;
        var register = new Uint8Array(state.register);

        var colision = false;
        var xBitPos = Vx % (SCREEN_WIDTH * 8);
        for (i=0; i<n; i++) {
            var byteToDraw = memory[I + i];
            var yBitPos = (Vy + i) % SCREEN_HEIGHT;
            var screenBitPosition = xBitPos + yBitPos * SCREEN_WIDTH;
            var screenPositionI = screenBitPosition >> 3;
            // ByteToDraw will be drawn in two parts, a left part and a right part
            var rightChunkSize = screenBitPosition % 8;
            var leftMostPart = byteToDraw >> rightChunkSize;

            if (colision == false && screen[screenPositionI] & leftMostPart) {
                colision = true;
            }
            screen[screenPositionI] = screen[screenPositionI] ^ leftMostPart;

            // Just skip this if the sprite is positioned in perfect alignment
            // with memory
            if (rightChunkSize > 0) {
                var rightMostPart = byteToDraw << (8-rightChunkSize);
                var wrapCoord = screenPositionI + 1;
                // If this wrapped across the screen, wrapCoord % 8 will be 0,
                // and we need to subtract 8 to move back to the beginning of the
                // initial row. The number 8 is screenWidth(64) / pixels per byte (8).
                if (wrapCoord % 8 === 0) wrapCoord -= 8;
                if (colision == false && screen[wrapCoord] & rightMostPart) {
                    colision = true;
                }
                screen[wrapCoord] = screen[wrapCoord] ^ rightMostPart;
            }

        }
        register[0xF] = colision ? 1 : 0;
        return Object.assign({}, state, {screen: screen, register: register});
    }
}
