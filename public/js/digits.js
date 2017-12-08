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
        for (var i = 0; i < rows[row].length; i++) {
            value = (value << 1);
            // This will just be undefined if the row doesn't have a full 4 characters, which is fine.
            if (rows[row][i] === '*') {
                value |= 1;
            }
        }
        // Chip fonts only use the 4 most significant bits of each byte.
        bytes[row] = value << (8 - rows[row].length);
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
`,
// Characters  G and beyond aren't part of the original spec,
// but we have plenty of free memory, and I want to use these
// for the loading screen.
`
 **
*
* **
*  *
 ***
`,`
*  *
*  *
****
*  *
*  *
`,`
****
 **
 **
 **
****
`,`
 ***
   *
   *
*  *
 **
`,`
*  *
* *
**
* *
*  *
`,`
*
*
*
*
****
`,
// Couldn't fit M into 4 wide, but since each font
// is actually 8 wide in memory, we do have room for this.
`
*   *
** **
* * *
*   *
*   *
`,`
*  *
** *
****
* **
*  *
`,`
 **
*  *
*  *
*  *
 **
`,`
***
*  *
***
*
*
`,`
 **
*  *
*  *
 **
   *
`,`
***
*  *
***
*  *
*  *
`,`
 ***
*
 **
   *
***
`,`
****
 **
 **
 **
 **
`
// Not bothering with the rest of the alphabet as we don't currently need it.
].map(stringToChipFont);