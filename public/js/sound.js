var SOUND_FREQ = 80; // value in hertz
var TICK_FREQ = 60; // value in hertz
var TICK_MS = 16; // ms between ticks
var TICK_S = 0.166666 // secs between ticks

tickSound = function(oscillator) {
    if (register_sound_timer > 0) {
        register_sound_timer--;
      if (register_sound_timer == 0) {
        oscillator.stop(TICK_S);
      };
      document.getElementById('js-sound-register').innerHTML = register_sound_timer;
    }
}

class Beeper {
  constructor() {
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

initializeSound = function() {
    // TODO: Move this with the other registers
    register_sound_timer = 0;
    var audio = new Beeper();
    document.getElementById('js-sound-button').onclick = function () {
        register_sound_timer = parseInt(document.getElementById('js-sound-input').value || TICK_FREQ)
        audio.start();
    }

  setInterval(() => {tickSound(audio);}, TICK_MS);
}
