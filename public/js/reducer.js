const defaultState = {
    memory: new Uint8Array(0x1000),
    register: new Uint8Array(0x10),
    stack: new Uint8Array(0x10),
    programCounter: 0x200,
    stackPointer: 0x0,
    iRegister: 0x0,
    screen: null /* dunno yet */,
    // the keyboard could be updated separately
    // or else read from the keyboard itself
    keyboard: new Uint8Array(0x10),
};


const step = (state = defaultState, instruction) => {
    const opCode = (instruction & 0xF000) >> 8;
    switch(opCode) {
        case 0x0: {
            switch(instruction) {
                // CLS
                case 0x00e0:
                    return Object.merge(state, {
                        screen: null,
                        programCounter: state.programCounter++,
                    });
            }
        }

        // JP addr
        case 0x1: {
            const addr = instruction & 0x0fff;
            return Object.merge(state, {
                programCounter: addr
            });
        }

        // CALL addr
        case 0x2: {
            const addr = instruction & 0x0fff;
            const stack = state.stack;
            stack[state.stackPointer] = state.programCounter;
            // FIXME throw a horrible exception for stack overflow
            return Object.merge(state, {
                stack,
                stackPointer: state.stackPointer++,
                programCounter: addr,
            });

    }
    return state;
};


module.exports = {
    defaultState,
    step,
}
