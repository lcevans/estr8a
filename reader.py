def format_instruction(two_bytes):
    first, second = two_bytes
    return f'{first:02x}{second:02x}'

def explain(instruction):
    if instruction == '00e0':
        return 'Clear screen'
    if instruction == '00ee':
        return 'Return from subroutine'
    if instruction.startswith('0'):
        # deprecated
        address = instruction[1:]
        return f'sys jum to machine code at: {address}'
    if instruction.startswith('1'):
        address = instruction[1:]
        return f'Jump to location: {address}'
    if instruction.startswith('2'):
        address = instruction[1:]
        return f'Call subroutine at: {address}'
    if instruction.startswith('3'):
        register = instruction[1]
        value = instruction[2:]
        return f'Skip next instruction if V{register} == {value}'
    if instruction.startswith('4'):
        register = instruction[1]
        value = instruction[2:]
        return f'Skip next instruction if V{register} != {value}'
    if instruction.startswith('5'):
        rega = instruction[1]
        regb = instruction[2]
        return f'Skip next instruction if V{rega} == V{regb}'
    if instruction.startswith('6'):
        register = instruction[1]
        value = instruction[2:]
        return f'Load the value {value} to the register V{register}'
    if instruction.startswith('7'):
        register = instruction[1]
        value = instruction[2:]
        return f'Add the value {value} to the register V{register}'
    if instruction.startswith('8'):
        rega = instruction[1]
        regb = instruction[2]
        flag = instruction[3]
        if flag == '0':
            return f'Load the value of V{rega} into V{regb}'
        if flag == '1':
            return f'Set the value of V{rega} to V{rega}  OR V{regb}'
        if flag == '2':
            return f'Set the value of V{rega} to V{rega} AND V{regb}'
        if flag == '3':
            return f'Set the value of V{rega} to V{rega} XOR V{regb}'
        if flag == '4':
            return f'Set the value of V{rega} to V{rega} + V{regb} carry goes to Vf'
        if flag == '5':
            return f'Set the value of V{rega} to V{rega} - V{regb} and Vf is set to V{rega} > V{regb}'
        if flag == '6':
            return f'Shift V{rega} by 1 to the right, the least significant bit is written in Vf'
        if flag == '7':
            return f'Set the value of V{rega} to V{regb} - V{rega} and Vf is set to V{regb} > V{rega}'
        if flag == 'e':
            return f'Shift V{rega} by 1 to the left, the most significant bit is written in Vf'
    if instruction.startswith('9'):
        rega = instruction[1]
        regb = instruction[2]
        return f'Skip next instruction if V{rega} != V{regb}'
    if instruction.startswith('a'):
        address = instruction[1:]
        return f'Set the register I to the address {address}'
    if instruction.startswith('b'):
        address = instruction[1:]
        return f'Set the program counter to the address {address} + V0'
    if instruction.startswith('c'):
        register = instruction[1]
        value = instruction[2:]
        return f'Set the register V{register} to a random byte AND {value}'
    if instruction.startswith('d'):
        rega = instruction[1]
        regb = instruction[2]
        n = instruction[3]
        return f'Draw a sprite of {n} bytes from the address stored at I to (V{rega}, V{regb}), Vf is set to whether or not a pixel was erased.'
    if instruction.startswith('e'):
        # Looks like keyboard functions
        reg = instruction[1]
        if instruction.endswith('9e'):
            return f'Skip the next instruction if the key in V{reg} is pressed'
        if instruction.endswith('a1'):
            return f'Skip the next instruction if the key in V{reg} is not pressed'
    if instruction.startswith('f'):
        # or the kitchen sinc
        reg = instruction[1]
        if instruction.endswith('07'):
            return f'Load the value of DT into the register V{reg}'
        if instruction.endswith('0a'):
            return f'Wait for a keypress and store the value at register V{reg}'
        if instruction.endswith('15'):
            return f'Set the value of DT to the value in the register V{reg}'
        if instruction.endswith('18'):
            return f'Set the sound timer to the value in the register V{reg}'
        if instruction.endswith('1e'):
            return f'Set the value of I to the sum of I and V{reg}'
        if instruction.endswith('29'):
            return f'Set I to the location of the sprite of the digit V{reg}'
        if instruction.endswith('33'):
            return f'Store the BCD representation of V{reg} at locations I, I+1, I+2'
        if instruction.endswith('55'):
            return f'Store the values of registers V0 through V{reg} in memory starting at position I'
        if instruction.endswith('65'):
            return f'Load the values of registers V0 through V{reg} from memory starting at position I'
    return ''


if __name__ == '__main__':
    filename = 'games/GUESS'
    print(f'reading the file {filename}')
    with open(filename, 'rb', buffering=0) as program:
        addr = 512
        while True:
            instruction = program.read(2)
            if not instruction:
                break
            pretty = format_instruction(instruction)
            info = explain(pretty)
            print(f'{addr:03x} {pretty} {info}')
            addr += 1


