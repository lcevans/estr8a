tickSound = function() {
    if (register_sound_timer > 0) {
        register_sound_timer--;
        document.getElementById('js-sound-register').innerHTML = register_sound_timer
    }

    if (register_sound_timer == 0) {
        audio.pause();
        audio.currentTime = 0;
    }
}

initializeSound = function() {
    // TODO: Move this with the other registers
    register_sound_timer = 0

    audio = new Audio('audio_file.mp3')

    document.getElementById('js-sound-button').onclick = function () {
        register_sound_timer = parseInt(document.getElementById('js-sound-input').value)
        audio.play()
    }

    setInterval(tickSound, 16)
}
