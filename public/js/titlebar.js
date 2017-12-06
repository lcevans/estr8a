var initializeTitleBar = function () {

    // Populate games-list selector
    fetch('api/games/')
        .then((resp) => resp.json())
        .then(function(data) {
            games = data.data
            select_dom = document.getElementById('games-list');
            for (i=0; i<games.length; i++)
            {
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
    updatePlayButtons();
};

var updatePlayButtons = () => {
    document.getElementById('play-button').style.display = emulator.shouldPlay ? 'none' : 'inline-block';
    document.getElementById('pause-button').style.display = !emulator.shouldPlay ? 'none' : 'inline-block';
    document.getElementById('step-button').style.display = emulator.shouldPlay ? 'none' : 'inline-block';
};
