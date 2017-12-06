// TODO: Improve the understandability of the mask and shifts.
// TODO: It's weird to increment the program counter by 2 every time.


const defaultState = {
    memory: new Uint8Array(0x1000),
    register: new Uint8Array(0x10),
    stack: new Uint16Array(0x10),
    programCounter: 0x200,
    stackPointer: 0x0,
    iRegister: 0x0,
    screen: null,
    screenSize: 0,
    // the keyboard could be updated separately
    // or else read from the keyboard itself
    keyboard: new Uint8Array(0x10),
};

const reducerModule = {
    step: (state = defaultState, instruction) => {
        const opCode = (instruction & 0xF000) >> 12;
        switch(opCode) {
            case 0x0: {
                switch(instruction) {
                    // CLS
                    case 0x00e0:
                        return Object.assign({}, reducerModule.initializeScreen(state, state.screenSize),
                                             { programCounter: state.programCounter + 2 });
                }
                break;
            }

            // JP addr
            case 0x1: {
                const addr = instruction & 0x0fff;
                return Object.assign({}, state, {
                    programCounter: addr
                });
            }

            // CALL addr
            case 0x2: {
                const addr = instruction & 0x0fff;
                const stack = state.stack.slice();
                stack[state.stackPointer] = state.programCounter;
                // FIXME throw a horrible exception for stack overflow
                console.log(state.stackPointer)
                console.log(state.programCounter)
                console.log(stack)
                return Object.assign({}, state, {
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
                return Object.assign({}, state, {
                    programCounter: state.programCounter + increment,
                });
            }

            // SNE Vx, value
            case 0x4: {
                const value = instruction & 0x00ff;
                const x = (instruction & 0x0f00) >> 8;
                const increment = value !== state.register[x] ? 4 : 2;
                return Object.assign({}, state, {
                    programCounter: state.programCounter + increment,
                });
            }

            // SE Vx,Vy
            case 0x5: {
                const x = (instruction & 0x0f00) >> 8;
                const y = (instruction & 0x00f0) >> 4;
                const increment = state.register[x] === state.register[y] ? 4 : 2;
                return Object.assign({}, state, {
                    programCounter: state.programCounter + increment,
                });
            }

            // LD Vx, value
            case 0x6: {
                const value = instruction & 0x00ff;
                const x = (instruction & 0x0f00) >> 8;
                const memory = state.memory.slice();
                memory[x] = value;
                return Object.assign({}, state, {
                    programCounter: state.programCounter + 0x2,
                    memory,
                });
            }

            // ADD Vx, value
            case 0x7: {
                const value = instruction & 0x00ff;
                const x = (instruction & 0x0f00) >> 8;
                const register = state.register.slice();
                register[x] += value;
                return Object.assign({}, state, {
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

                }

                return Object.assign({}, state, {
                    programCounter: state.programCounter + 0x2,
                    register,
                });

            }

            // SNE Vx, Vy
            case 0x9: {
                const x = (instruction & 0x0f00) >> 8;
                const y = (instruction & 0x00f0) >> 4;
                const increment = state.register[x] !== state.register[y] ? 4 : 2;
                return Object.assign({}, state, {
                    programCounter: state.programCounter + increment,
                });
            }

            // LD I, addr
            case 0xa: {
                const addr = instruction & 0x0fff;
                return Object.assign({}, state, {
                    iRegister: addr,
                    programCounter: state.programCounter + 0x2,
                });
            }

            // LD I, addr
            case 0xb: {
                const addr = instruction & 0x0fff;
                return Object.assign({}, state, {
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
                return Object.assign({}, state, {
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
                break; // Till we return
            }

        }
        return state;
    },

    loadProgram: (state = defaultState, program) => {
        const memory = state.memory.slice();
        for (let i = 0; i < program.length; i++) {
            memory[i] = program[i];
        }
        return Object.assign({}, state, { memory });
    },

    nextInstruction: (state = defaultState) => {
        const firstHalf = state.memory[state.programCounter] << 8;
        const secondHalf = state.memory[state.programCounter + 1];
        return firstHalf | secondHalf;
    },

    initializeScreen: (state, screenSize) => {
        return Object.assign({}, state, {
            screen: new Uint8Array(screenSize),
            screenSize: screenSize
        });
    }
}
