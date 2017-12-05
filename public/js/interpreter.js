const NIBBLE = 4;
const BYTE = 8;
const SLAB = 12;
const inst8 = {
    0: 'LD',
    1: 'OR',
    2: 'AND',
    3: 'XOR',
    4: 'ADD',
    5: 'SUB',
    6: 'SHR',
    7: 'SUBN',
    0xE: 'SHL'
}
// Given a number N bits long and a bit number, splits the number in two parts:
// [first `N-bit` bits, last `bit` bits]
// The following methods assume number to be a 12 bit int
const split_bits = (number, bits) => [number >> bits, number & ((2 << bits-1) - 1)];
const last_two = (number) => number & 0xFF;
const first = (number) => number >> 8;
const first_and_last_two = (number) => split_bits(number, 8); // returns 0xX and 0xYZ out of 0xXYZ
const first_and_second = (number) => split_bits(number >> 4, 4); // returns 0xX and 0xY out of 0xXYZ
const third = (number) => number & 0xF;
const first_second_and_third = (number) => [ ...first_and_second(number), third(number)]; // return 0xX, 0xY and 0xZ out of 0xXYZ

// Te following method assumes word to be a 16 bit int
const first_of_word = (word) => word >> 12;

// 00E0 - CLS            00EE - RET
// 0nnn - SYS addr       1nnn - JP addr
// 2nnn - CALL addr      3xkk - SE Vx, byte
// 4xkk - SNE Vx, byte   5xy0 - SE Vx, Vy
// 6xkk - LD Vx, byte    7xkk - ADD Vx, byte

// 8xy0 - LD Vx, Vy      8xy1 - OR Vx, Vy
// 8xy2 - AND Vx, Vy     8xy3 - XOR Vx, Vy
// 8xy4 - ADD Vx, Vy     8xy5 - SUB Vx, Vy
// 8xy6 - SHR Vx {, Vy}  8xy7 - SUBN Vx, Vy
// 8xyE - SHL Vx {, Vy}  9xy0 - SNE Vx, Vy
// Annn - LD I, addr     Bnnn - JP V0, addr
// Cxkk - RND Vx, byte   Dxyn - DRW Vx, Vy, nibble
// Ex9E - SKP Vx         ExA1 - SKNP Vx
// Fx07 - LD Vx, DT      Fx0A - LD Vx, K
// Fx15 - LD DT, Vx      Fx18 - LD ST, Vx
// Fx1E - ADD I, Vx      Fx29 - LD F, Vx
// Fx33 - LD B, Vx       Fx55 - LD [I], Vx
// Fx65 - LD Vx, [I]
const instructions = [
    [ // 0x0
        [(trail) => (trail == 0x0E0), () => ({inst: 'CLS'})],
        [(trail) => (trail == 0x0EE), () => ({inst: 'RET'})],
        [() => true, (trail) => ({inst: 'SYS', params: [trail]})]
    ],
    [ // 0x1
        [() => true, (trail) => ({inst: 'JP', params: [trail]})]
    ],
    [ // 0x2
        [() => true, (trail) => ({inst: 'CALL', params: [trail]})]
    ],
    [ // 0x3
        [() => true, (trail) => {
            const [first, last_two] = first_and_last_two(trail);
            return {inst: 'SE', params: [`V${first}`, last_two]};
        }]
    ],
    [ // 0x4
        [() => true, (trail) => {
            const [first, last_two] = first_and_last_two(trail);
            return {inst: 'SNE', params: [`V${first}`, last_two]};
        }]
    ],
    [ // 0x5
        [(trail) => (third(trail) == 0), (trail) => {
            const [first, second] = first_and_second(trail);
            return {inst: 'SE', params: [`V${first}`, `V${second}`]};
        }]
    ],
    [ // 0x6
        [() => true, (trail) => {
            const [first, last_two] = first_and_last_two(trail);
            return {inst: 'LD', params: [`V${first}`, last_two]};
        }]
    ],
    [ // 0x7
        [() => true, (trail) => {
            const [first, last_two] = first_and_last_two(trail);
            return {inst: 'ADD', params: [`V${first}`, last_two]};
        }]
    ],
    [ // 0x8
        [(trail) => {
            const trail_char = third(trail);
            return trail_char <= 7 || trail_char == 0xE;
        }, (trail) => {
            const [first, second, third] = first_second_and_third(trail);
            return {inst: inst8[third], params: [`V${first}`, `V${second}`]};
        }]
    ],
    [ // 0x9
        [(trail) => (third(trail) == 0), (trail) => {
            const [first, second] = split_bits(trail >> 4, 4);
            return {inst: 'SNE', params: [`V${first}`, `V${second}`]}
        }]
    ],
    [ // 0xA
        [() => true, (trail) => ({inst: 'LD', params: ['I', trail]})]
    ],
    [ // 0xB
        [() => true, (trail) => ({inst: 'JP', params: ['V0', trail]})]
    ],
    [ // 0xC
        [() => true, (trail) => {
            const [first, last_two] = first_and_last_two(trail);
            return {inst: 'RND', params: [`V${first}`, last_two]};
        }]
    ],
    [ // 0xD
        [() => true, (trail) => {
            const [first, second, third] = first_second_and_third(trail);
            return {inst: 'DRW', params: [`V${first}`, `V${second}`, third]};
        }]
    ],
    [ // 0xE
        [(trail) => (last_two(trail) == 0x9E), (trail) => {
            const [first, ] = first_and_last_two(trail);
            return {inst: 'SKP', params: [`V${first}`]};
        }],
        [(trail) => (last_two(trail) == 0xA1), (trail) => {
            const [first, ] = first_and_last_two(trail);
            return {inst: 'SKNP', params: [`V${first}`]}
        }]
    ],
    [ // 0xF
        [(trail) => (last_two(trail) == 0x07), (trail) => ({inst: 'LD', params: [`V${first(trail)}`, 'DT']})],
        [(trail) => (last_two(trail) == 0x0A), (trail) => ({inst: 'LD', params: [`V${first(trail)}`, 'K']})],
        [(trail) => (last_two(trail) == 0x15), (trail) => ({inst: 'LD', params: ['DT', `V${first(trail)}`]})],
        [(trail) => (last_two(trail) == 0x18), (trail) => ({inst: 'LD', params: ['ST', `V${first(trail)}`]})],
        [(trail) => (last_two(trail) == 0x1E), (trail) => ({inst: 'ADD', params: ['I', `V${first(trail)}`]})],
        [(trail) => (last_two(trail) == 0x29), (trail) => ({inst: 'LD', params: ['F', `V${first(trail)}`]})],
        [(trail) => (last_two(trail) == 0x33), (trail) => ({inst: 'LD', params: ['B', `V${first(trail)}`]})],
        [(trail) => (last_two(trail) == 0x55), (trail) => ({inst: 'LD', params: ['I', `V${first(trail)}`]})],
        [(trail) => (last_two(trail) == 0x65), (trail) => ({inst: 'LD', params: [`V${first(trail)}`, '[I]']})]
    ]
];

// Converts two byte heximal to an instruction object

var wordToASM = (hexWord) => {
    const instructionSet = instructions[first_of_word(hexWord)];
    const trailingPart = hexWord & 0xFFF;
    for (const instruction of instructionSet) {
        const [matches, interpreter] = instruction;
        if (matches(trailingPart)) {
            return interpreter(trailingPart);
        }
    }
    return `${hexWord.toString(16)} Unknown yet`;
}

var opcodeToHex = (opcode) => {
    return opcode.toString(16);
}

var getValue = (val, emulator) => {
    // TODO: Handle more cases
    if (val in emulator.regs) {
        // Get value from registry
        return emulator.regs[val[1]];
    } else if (/^\d+$/.test(val)) {
        return parseInt(val); // Parse hex value
    }
};

var getSetter = (dest, emulator) => {
    if (dest in emulator.regs) {
        return val => emulator.regs[dest] = val;
    } else {
        throw `Unknown registry ${dest}`;
    }
}

var executeInstruction = (emulator, opcode) => {
    let { inst, params } = wordToASM(opcode);
    switch(inst) {
        case 'JP':
            let setter = getSetter('PC', emulator);
            if (params.length === 1)
                setter(params[0]);
            else
                setter(getValue(params[0]) + params[1]);
            break;
        case 'LD':
            getSetter(params[0], emulator)(params[1]);
            break;
        case 'SE':
            if (getValue(params[0], emulator) === getValue(params[1], emulator))
                emulator.moveToNextInstruction();
            break;
        case 'SNE':
            if (getValue(params[0], emulator) !== getValue(params[1], emulator))
                emulator.moveToNextInstruction();
            break;
        case 'OR':
            getSetter(params[0])(getValue(params[0], emulator) | getValue(params[1], emulator));
            break;
        case 'AND':
            getSetter(params[0])(getValue(params[0], emulator) & getValue(params[1], emulator));
            break;
        case 'XOR':
            getSetter(params[0])(getValue(params[0], emulator) ^ getValue(params[1], emulator));
            break;
    };
};
