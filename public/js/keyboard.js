/*
This mapping is taken from http://mir3z.github.io/chip8-emu/doc/chip8.Keyboard.html

It assumes that the chip 8 keys are arranged as:
    123C
    456D
    789E
    A0BF

And then maps these keyboard keys to them:
    1234
    QWER
    ASDF
    ZXCV
*/
var keyCodes = [88, 49, 50, 51, 81, 87, 69, 65, 83, 68, 90, 67, 52, 82, 70, 86];
var keysDown = {};

document.onkeydown = function(event) {
    keysDown[event.keyCode] = true;
};
document.onkeyup = function(event) {
    keysDown[event.keyCode] = false;
};

// keyCode is 0 - 15 representing 0-F keys on the chip keyboard
var isChipKeyDown = (keyCode) => {
    return keysDown[keyCodes[keyCode]] === true;
};
