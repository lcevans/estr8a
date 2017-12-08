var SOUND_FREQ = 80; // value in hertz
var TICK_FREQ = 60; // value in hertz
var TICK_MS = 16; // ms between ticks
var TICK_S = 0.166666 // secs between ticks

tickSound = function(beeper) {
    if (beeper.machine.state.stRegister > 0) {
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
        this.oscillator.onended = () => this.setup();
        // create Gain node to reduce volume.
        this.gainNode = this.audioCtx.createGain();
        // At least on my machine, this is reasonable volume at 50%
        // and still quite loud with volume turned up.
        this.gainNode.gain.value = .005;

        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);
    }

    start(delay) {
        this.oscillator.start(delay)
    }

    stop(delay) {
        this.oscillator.stop(delay)
    }
}
