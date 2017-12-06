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
// Tracks which keys on the keyboard are currently pressed.
var keysDown = {};
// Tracks which keyboard button element is currently pressed.
var buttonPressed = null;

var initializeKeyboard = () => {
    document.onkeydown = function(event) {
        console.log(event.keyCode);
        keysDown[event.keyCode] = true;
    };
    document.onkeyup = function(event) {
        keysDown[event.keyCode] = false;
    };

    var container = document.getElementsByClassName("js-keyboardContainer")[0];
    var layout = ['123C', '456D', '789E', 'A0BF'];
    for (var string of layout) {
        var row = document.createElement("div");
        for (var key of string) {
            var button = document.createElement("button");
            button.className = 'js-keyboardButton keyboardButton';
            button.setAttribute('data-key', key);
            var text = document.createTextNode(key);
            button.append(text);
            row.append(button);
        }
        container.append(row);
    }
    // Clicking a controller button can set a key being pressed.
    container.onmousedown = function (event) {
        var key = event.target.getAttribute('data-key');
        if (key) {
            buttonPressed = parseInt(key, 16);
        }
    }
    document.onmouseup = function (event) {
        buttonPressed = null;
    }
};

// Update the display of which chip 8 keys are pressed.
var updateKeyboard = () => {
    for (var button of document.getElementsByClassName("js-keyboardButton")) {
        var key  = parseInt(button.getAttribute('data-key'), 16);
        if (isChipKeyDown(key)) {
            // The active class is used to simulate the :active state when the button is pressed.
            button.className = 'js-keyboardButton keyboardButton active';
        } else {
            button.className = 'js-keyboardButton keyboardButton';
        }

    }
};

// keyCode is 0 - 15 representing 0-F keys on the chip keyboard
var isChipKeyDown = (keyCode) => {
    return buttonPressed === keyCode || keysDown[keyCodes[keyCode]] === true;
};
