// Stores the last version of registers so we can highlight registers that have changed.
var previousRegisters;
var registersDiv = document.getElementById('registers');

var toHex = (value, digits) => {
    var hex = value.toString(16);
    while (hex.length < digits) hex = `0${hex}`;
    return hex;
}

// Render initial state of memory to the screen.
var initializeRegisterDisplay = (registers) => {
    while(registersDiv.firstChild) {
        registersDiv.removeChild(registersDiv.firstChild);
    }

    for (var i = 0; i < registers.length; i++) {
        var register = document.createElement('span');
        register.className = 'register';
        register.innerHTML = toHex(registers[i], 2);
        registersDiv.append(register);
    }
    previousRegisters = [...registers];
};

// Update any lines of memory that have changed since the last time it was displayed.
var updateRegisterDisplay = (registers) => {
    var registerElements = registersDiv.children;
    for (var i = 0; i < registers.length; i++) {
        var register = registerElements[i];
        register.innerHTML = toHex(registers[i], 2);
        if (registers[i] !== previousRegisters[i]) {
            register.className = 'register updated';
        } else {
            register.className = 'register';
        }
    }
    previousRegisters = [...registers];
};
