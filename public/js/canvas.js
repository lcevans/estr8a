
var canvas, context, blackPixel, whitePixel;
var initializeCanvas = (width, height) => {
    canvas = document.createElement("canvas");
    canvas.width = width * 10;
    canvas.height = height * 10;
    // scale the canvas to take up the full height of its container.
    context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    document.getElementsByClassName("js-canvasContainer")[0].append(canvas);

    // According to https://stackoverflow.com/questions/4899799/whats-the-best-way-to-set-a-single-pixel-in-an-html5-canvas
    // this is the fastest way to set individual pixels on canvases.
    blackPixel = context.createImageData(1,1);
    blackPixel.data[0] = 0;
    blackPixel.data[1] = 0;
    blackPixel.data[2] = 0;
    blackPixel.data[3] = 0xFF;
    whitePixel = context.createImageData(1,1);
    whitePixel.data[0] = 0xFF;
    whitePixel.data[1] = 0xFF;
    whitePixel.data[2] = 0xFF;
    whitePixel.data[3] = 0xFF;

    // Periodically look at the text a user has selected in the document, and if it looks like values from
    // the memory display, attempt to display those bytes as a sprite in a modal on the right side of the
    // screen.
    setInterval(() => {
        var maxHeight = 50;
        var selectedText = document.getSelection().toString();
        // Ignore text that looks like a memory address
        selectedText = selectedText.replace(/[\da-f][\da-f][\da-f]/g, '');
        // Then find all the text that looks like hex bytes.
        var spriteData = (selectedText.match(/[\da-f][\da-f]/g) || []).map(text => parseInt(text, 16));
        // Hide the sprite modal if we don't have anything that look slike sprite data selected.
        if (!spriteData.length) {
            removeSpriteModal();
        } else {
            var start = Math.max(0, spriteData.length - maxHeight);
            addSpriteModal(spriteData.slice(start));
        }
    }, 100);
};

var drawEmulatorToCanvas = (emulator) => {
    // First draw the pixels to the top left corner
    for (var y = 0; y < emulator.screenHeight; y++) {
        for (var x = 0; x < emulator.screenWidth; x++) {
            // This is the byte we read from the screen for this pixel.
            var byteAddress = Math.floor((y * emulator.screenWidth + x) / 8);
            // This is the bit we need to read from the byte for this pixel, with 0 being the left most bit.
            var bitOffset = (y * emulator.screenWidth + x) % 8;
            var byte = emulator.machine.screen[byteAddress];
            // 1 << 7 gives the left most bit in the byte(128), 1 << 0 will give the right most bit in the byte(1).
            if (byte & (1 << (7 - bitOffset))) {
                context.putImageData(blackPixel, x, y);
            } else {
                context.putImageData(whitePixel, x, y);
            }
        }
    }
    // Then draw the top left corner scaled to fill up the whole canvas.
    context.drawImage(canvas, 0, 0, emulator.screenWidth, emulator.screenHeight, 0, 0, canvas.width, canvas.height);
};

var addSpriteModal = (spriteData) => {
    removeSpriteModal();
    var canvas = document.createElement("canvas");
    canvas.id = 'spriteModal';
    canvas.style.position = 'absolute';
    canvas.style.display = 'block';
    canvas.style.right = '0';
    canvas.style.top = '0';
    canvas.width = 80;
    canvas.height = spriteData.length * 10;
    document.body.append(canvas);
    var context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    for (var y = 0; y < spriteData.length; y++) {
        for (var x = 0; x < 8; x++) {
            if (spriteData[y] & (1 << (7 - x))) {
                context.putImageData(blackPixel, x, y);
            } else {
                context.putImageData(whitePixel, x, y);
            }
        }
    }
    context.drawImage(canvas, 0, 0, 8, spriteData.length, 0, 0, canvas.width, canvas.height);
};
var removeSpriteModal = () => {
    var oldCanvas = document.getElementById('spriteModal');
    if (oldCanvas) {
        oldCanvas.parentNode.removeChild(oldCanvas);
    }
};
