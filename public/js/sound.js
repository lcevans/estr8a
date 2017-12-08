var SOUND_FREQ = 80; // value in hertz
var TICK_FREQ = 60; // value in hertz
var TICK_MS = 16; // ms between ticks
var TICK_S = 0.166666 // secs between ticks

tickSound = function(beeper) {
    if (beeper.machine.getSTRegister() > 0) {
        if (!beeper.playing) {
            beeper.start(TICK_S);
            beeper.playing = true;
        }
    }
    else {
        if (beeper.playing) {
            beeper.stop(TICK_S);
            beeper.playing = false;
        }
    }
}

class Beeper {
    constructor(machine) {
        this.machine = machine // Machine to watch and beep for;
        this.playing = false

        // create web audio api context
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.setup();
    }

    setup() {
        // create Oscillator node
        this.oscillator = this.audioCtx.createOscillator();
        this.oscillator.type = 'square';
        this.oscillator.frequency.value = SOUND_FREQ;
        this.oscillator.connect(this.audioCtx.destination);
        this.oscillator.onended = () => this.setup();
    }

    start(delay) {
        this.oscillator.start(delay)
    }

    stop(delay) {
        this.oscillator.stop(delay)
    }
}
