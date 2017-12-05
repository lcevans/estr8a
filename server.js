const fs = require('fs');
const express = require('express');
const app = express();


const GAMES_DIR = 'games/'

app.use(express.static('public'));
app.use('/api/games/', express.static(GAMES_DIR, {index: false}));

app.get('/api/games/', (req, res) => {
    fs.readdir(GAMES_DIR, (err, files) => {
        if (err) {
            res.status(500);
            res.send({error: err})
        } else {
            res.send({data: files})
        }
    });
});


app.listen(3000);
console.log("Listening on http://localhost:3000/");
