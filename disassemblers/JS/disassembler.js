console.log("Hello World")

document.onreadystatechange = function() {
    document.getElementById('fileInput').onchange = function(e) {

        // Log to webpage
        my_log = function(to_log) {
            outp = document.getElementById('output')
            outp.innerHTML += (to_log + "<br>")
        }


        // Disassemble a binary string
        disassemble = function(bytes) {
            v = new DataView(bytes);

            b0 = v.getUint8(0);
            b1 = v.getUint8(1);
            b = b0 << 8 | b1;
            hex_str = (b0 >> 4).toString(16) + (b0 & 0xF).toString(16) + (b1 >> 4).toString(16) + (b1 & 0xF).toString(16)

            switch(b0 >> 4) {
            case 0x0:
                switch(b) {
                case 0x00e0:
                    asm = "CLS";
                    break;
                case 0x00ee:
                    asm = "RET";
                    break
                default:
                    asm = "SYS";
                    break;
                }

                break;
            case 0x1:
                asm = "JMP";
                break;
            default:
                asm = "UNK";
                break;
            }

            console.log(hex_str + " -> " + asm);
            my_log(hex_str + " -> " + asm);
        }


        game_file = this.files[0]

        var reader = new FileReader();
        reader.addEventListener("loadend", function () {
            game = reader.result;
            for(i=0; i<game.byteLength; i = i + 2) {
                disassemble(game.slice(i, i+2))
            }
        });
        reader.readAsArrayBuffer(game_file);
    };
}
