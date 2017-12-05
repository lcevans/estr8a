const inst8 = {
    '0': 'LD',
    '1': 'OR',
    '2': 'AND',
    '3': 'XOR',
    '4': 'ADD',
    '5': 'SUB',
    '6': 'SHR',
    '7': 'SUBN',
    'E': 'SHL'
}
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
const instructions = {
    '0': [
        [/0E0/g, () => ({inst: 'CLS'})],
        [/0EE/, () => ({inst: 'RET'})],
        [/(...)/, (match) => ({inst: 'SYS', params: [match[1]]})]
    ],
    '1': [
        [/(...)/, (match) => ({inst: 'JP', params: [match[1]]})]
    ],
    '2': [
        [/(...)/, (match) => ({inst: 'CALL', params: [match[1]]})]
    ],
    '3': [
        [/(.)(..)/, (match) => ({inst: 'SE', params: [`V${match[1]}`, match[2]]})]
    ],
    '4': [
        [/(.)(..)/, (match) => ({inst: 'SNE', params: [`V${match[1]}`, match[2]]})]
    ],
    '5': [
        [/(.)(.)0/, (match) => ({inst: 'SE', params: [`V${match[1]}`, `V${match[2]}`]})]
    ],
    '6': [
        [/(.)(..)/, (match) => ({inst: 'LD', params: [`V${match[1]}`, match[2]]})]
    ],
    '7': [
        [/(.)(..)/, (match) => ({inst: 'ADD', params: [`V${match[1]}`, match[2]]})]
    ],
    '8': [
        [/(.)(.)([0-7E])/, (match) => ({inst: inst8[match[3]], params: [`V${match[1]}`, `V${match[2]}`]})]
    ],
    '9': [
        [/(.)(.)0/, (match) => ({inst: 'SNE', params: [`V${match[1]}`, `V${match[2]}`]})]
    ],
    'A': [
        [/(.{3})/, (match) => ({inst: 'LD', params: ['I', match[1]]})]
    ],
    'B': [
        [/(...)/, (match) => ({inst: 'JP', params: ['V0', match[1]]})]
    ],
    'C': [
        [/(.)(..)/, (match) => ({inst: 'RND', params: [`V${match[1]}`, match[2]]})]
    ],
    'D': [
        [/(.)(.)(.)/, (match) => ({inst: 'DRW', Vx: match[1], Vy: match[2], nibble: match[3]})]
    ],
    'E': [
        [/(.)9E/, (match) => ({inst: 'SKP', params: [`V${match[1]}`]})],
        [/(.)A1/, (match) => ({inst: 'SKNP', params: [`V${match[1]}`]})]
    ],
    'F': [
        [/(.)07/, (match) => ({inst: 'LD', params: [`V${match[1]}`, 'DT']})],
        [/(.)0A/, (match) => ({inst: 'LD', params: [`V${match[1]}`, 'K']})],
        [/(.)15/, (match) => ({inst: 'LD', params: ['DT', `V${match[1]}`]})],
        [/(.)18/, (match) => ({inst: 'LD', params: ['ST', `V${match[1]}`]})],
        [/(.)1E/, (match) => ({inst: 'ADD', params: ['I', `V${match[1]}`]})],
        [/(.)29/, (match) => ({inst: 'LD', params: ['F', `V${match[1]}`]})],
        [/(.)33/, (match) => ({inst: 'LD', params: ['B', `V${match[1]}`]})],
        [/(.)55/, (match) => ({inst: 'LD', params: ['[I]', `V${match[1]}`]})],
        [/(.)65/, (match) => ({inst: 'LD', params: [`V${match[1]}`, '[I]']})]
    ]
}

// Converts two byte heximal to an instruction object

var wordToASM = (hexWord) => {
    const instructionSet = instructions[hexWord[0]];
    for (const instruction of instructionSet) {
        const [regex, interpreter] = instruction;
        const matched = regex.exec(hexWord.slice(1));
        if (matched) {
            return interpreter(matched);
        }
    }
    return `${hexWord} Unknown yet`;
}
