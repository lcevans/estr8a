
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
};

var drawEmulatorToCanvas = (emulator) => {
    // First draw the pixels to the top left corner
    for (var y = 0; y < emulator.screenHeight; y++) {
        for (var x = 0; x < emulator.screenWidth; x++) {
            // This is the byte we read from the screen for this pixel.
            var byteAddress = Math.floor((y * emulator.screenWidth + x) / 8);
            // This is the bit we need to read from the byte for this pixel, with 0 being the left most bit.
            var bitOffset = (y * emulator.screenWidth + x) % 8;
            var byte = emulator.screen[byteAddress];
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
