console.log("Hello World")

function ASMtoString(asmInstruction) {
    if (typeof asmInstruction === "string") {
        return asmInstruction;
    }
    const inst = asmInstruction['inst'];
    const props = 'params' in asmInstruction ? asmInstruction['params']: [];
    return `${inst} ${props.join(", ").toUpperCase()}`;
}
document.onreadystatechange = function() {
    document.getElementById('fileInput').onchange = function(e) {

        // Log to webpage
        my_log = function(to_log) {
            outp = document.getElementById('output')
            outp.innerHTML += (to_log + "<br>")
        }

        game_file = this.files[0]

        var reader = new FileReader();
        reader.addEventListener("loadend", function () {
            game = reader.result;
            console.log(game, game.byteLength)
            view = new DataView(game);
            for(i=0; i < game.byteLength; i = i + 2) {
                console.log(i)
                b0 = view.getUint8(i);
                b1 = view.getUint8(i+1);
                hex_str = (b0 >> 4).toString(16) + (b0 & 0xF).toString(16) + (b1 >> 4).toString(16) + (b1 & 0xF).toString(16);
                my_log(hex_str + " -> " + ASMtoString(wordToASM(hex_str)));
            }
        });
        reader.readAsArrayBuffer(game_file);

    };
}
