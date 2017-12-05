var express = require('express');
var app = express();

app.use(express.static('public'));
app.use('/api/games/', express.static('games'));

app.listen(3000);
console.log("Listening on http://localhost:3000/");
