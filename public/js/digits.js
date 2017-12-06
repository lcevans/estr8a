// Hex digits 0-F are hard coded into memory:
// http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#font

var stringToChipFont = (string) => {
    // Because of how the digits are defined in the file, they will have leading and trailing
    // new lines that we need to trim here. We can't use the actual trim function here because
    // it will also crop leading spaces, which messes up "1" for instance.
    var rows = string.substring(1, string.length - 1).split("\n");
    var bytes = new Uint8Array(rows.length);
    for (var row = 0; row < rows.length; row++) {
        value = 0;
        for (var i = 0; i < 4; i++) {
            value = (value << 1);
            // This will just be undefined if the row doesn't have a full 4 characters, which is fine.
            if (rows[row][i] === '*') {
                value |= 1;
            }
        }
        // Chip fonts only use the 4 most significant bits of each byte.
        bytes[row] = value << 4;
    }
    return bytes;
};

var addChipFontsAtAddress = (memory, address) => {
    for (var i = 0; i < digits.length; i++) {
        for (var j = 0; j < 5; j++) {
            memory[address + i * 5 + j] = digits[i][j];
        }
    }
    return memory;
};

// `*` indicate 1 bits, and spaces are 0 bits. Each row can only have 4 bits.
var digits = [`
****
*  *
*  *
*  *
****
`,`
  *
 **
  *
  *
 ***
`,`
****
   *
****
*
****
`,`
****
   *
****
   *
****
`,`
*  *
*  *
****
   *
   *
`,`
****
*
****
   *
****
`,`
****
*
****
*  *
****
`,`
****
   *
  *
 *
 *
`,`
****
*  *
****
*  *
****
`,`
****
*  *
****
   *
****
`,`
****
*  *
****
*  *
*  *
`,`
***
*  *
***
*  *
***
`,`
****
*
*
*
****
`,`
***
*  *
*  *
*  *
***
`,`
****
*
****
*
****
`,`
****
*
****
*
*
`].map(stringToChipFont);