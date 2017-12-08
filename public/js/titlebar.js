var initializeTitleBar = function () {

    // Populate games-list selector
    fetch('api/games/')
        .then((resp) => resp.json())
        .then(function(data) {
            games = data.data
            select_dom = document.getElementById('games-list');
            for (let i = 0; i < games.length; i++) {
                var opt = document.createElement('option');
                opt.value = games[i].name;
                opt.innerHTML = games[i].name;
                select_dom.appendChild(opt);
            }
    });

    // Handle game loading
    document.getElementById('load-game').onclick = function() {
        select_dom = document.getElementById('games-list');
        game_to_load = select_dom.options[select_dom.selectedIndex].value
        emulator.loadGame(game_to_load);
        document.getElementById('current-game').innerHTML=game_to_load;
    };

    document.getElementById('play-button').onclick = function() {
        emulator.startEmulator();
        updatePlayButtons();
    };
    document.getElementById('pause-button').onclick = function() {
        emulator.pauseEmulator();
        updatePlayButtons();
    };
    document.getElementById('step-button').onclick = function() {
        emulator.emulationLoop();
    };

    var speedSelect = document.getElementById('speed-select');
    // Initialize the emulator speed to match the initially selected speed option.
    emulator.instructionsPerFrame = parseInt(speedSelect.options[speedSelect.selectedIndex].value);
    // Update the emulator speed when the user selects a new speed option.
    speedSelect.onchange = function () {
        emulator.instructionsPerFrame = parseInt(speedSelect.options[speedSelect.selectedIndex].value);
    };

    let url = new URL(window.location.href);
    let machineSelect = document.getElementById('version-select');
    Object.keys(machines).forEach(k => {
        let op = document.createElement('option');
        op.value = k;
        op.innerText = k;
        machineSelect.appendChild(op);
    });
    let selectedMachine = url.searchParams.get('machine') || DEFAULT_MACHINE;
    if (!machines[selectedMachine])
        selectedMachine = DEFAULT_MACHINE;
    machineSelect.value = selectedMachine;
    machineSelect.onchange = function () {
        url.searchParams.set('machine', machineSelect.options[machineSelect.selectedIndex].value);
        window.location.href = url.href;  // Refresh the page pointing to the new machine
    };

    updatePlayButtons();
};

var updatePlayButtons = () => {
    document.getElementById('play-button').style.display = emulator.shouldPlay ? 'none' : 'inline-block';
    document.getElementById('pause-button').style.display = !emulator.shouldPlay ? 'none' : 'inline-block';
    document.getElementById('step-button').style.display = emulator.shouldPlay ? 'none' : 'inline-block';
};
