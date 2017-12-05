initializeTitleBar = function () {
    // Populate selector
    games = ['PONG', 'DEBUG', 'BLITZ']

    select_dom = document.getElementById('games-list');
    for (i=0; i<games.length; i++)
    {
        var opt = document.createElement('option');
        opt.value = games[i];
        opt.innerHTML = games[i];
        select_dom.appendChild(opt);
    }
}



// Handle game loading
document.onreadystatechange = function() {
    document.getElementById('load-game').onclick = function() {
        // PONG for now
        game_to_load = "PONG";
        // emulator.loadGame(game_to_load);
    };
}
