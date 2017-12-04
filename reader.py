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
        if flag == '4':
            return f'Set the value of V{rega} to V{rega} - V{regb} and Vf is set to V{rega} > V{regb}'
    return ''


if __name__ == '__main__':
    filename = 'c8games/GUESS'
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


