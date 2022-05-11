const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static(__dirname + '/client'));

const { Game } = require('./game');

var waitingForGame = undefined;
var nextGameId = undefined;

const games = new Map();
const crypto = require("crypto");
const randomId = () => crypto.randomBytes(8).toString("hex");

const now_playing = new Map();

io.on('connection', (socket) => {
    socket.on('move', (tile) => {
        var game = games.get(now_playing.get(socket.id));
        if(!game)return;
        var tmp = game.move(socket.id, tile);
        if(tmp == 1){
            io.to(game.ID).emit("update", game.state);
            game.flipTurn();
            var win = game.checkWin();
            if(win == -1){
                io.to(game.ID).emit("tie");
            } else if(win != 0){
                socket.emit("win");
                socket.to(game.ID).emit("lose");
            }
        } else if(tmp == 10){
            socket.emit("invalidMove");
        } else if(tmp == 20){
            socket.emit("notYourTurn");
        }
    })

    if(!waitingForGame){
        waitingForGame = socket.id;
        nextGameId = randomId();
        socket.join(nextGameId);
        socket.emit("waiting");
    } else {
        socket.join(nextGameId);
        var gameID = nextGameId;

        io.to(gameID).emit("connected");

        games.set(gameID, new Game(waitingForGame, socket.id, gameID));
        now_playing.set(waitingForGame, gameID);
        now_playing.set(socket.id, gameID);
        waitingForGame = undefined;
        nextGameId = undefined;
    }

    socket.on("disconnect", ()=>{
        if(socket.id == waitingForGame){
            waitingForGame = undefined;
        } else if (games.get(now_playing.get(socket.id))){
            var game =  games.get(now_playing.get(socket.id));
            socket.to(game.ID).emit("ragequit");
            now_playing.delete(game.p1);
            now_playing.delete(game.p2);
            games.delete(game.ID);
        }
    })
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/index.html');
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});