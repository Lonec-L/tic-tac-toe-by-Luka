const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static(__dirname + '/client'));

const { Game } = require('./game');

var waitingForGame = undefined;
var waitingName = undefined;
var nextGameId = undefined;

const games = new Map();
const crypto = require("crypto");
const randomId = () => crypto.randomBytes(8).toString("hex");

const now_playing = new Map();
const getScoketId = new Map();

const cookie = require("cookie")

io.on('connection', (socket) => {
    if(socket.handshake.headers.cookie){
        var cookies = cookie.parse(socket.handshake.headers.cookie);
        var game = games.get(now_playing.get(cookies.ID));
        if(now_playing.get(cookies.ID)){
            var game = games.get(now_playing.get(cookies.ID));
            socket.join(game.ID);
            io.to(game.ID).emit("update", game.state);
            if(cookies.ID == game.hasTurn)socket.emit("yourTurn");
            else socket.emit("opponentsTurn");

            if(cookies.ID == game.p1)socket.emit("opponentName", game.name2);
            else socket.emit("opponentName", game.name1);
            game.dcCount--;
            socket.emit("reconnected");
        }
    }
    

    socket.on('move', (tile) => {
        var cookies = cookie.parse(socket.handshake.headers.cookie);
        var game = games.get(now_playing.get(cookies.ID));
        if(!game)return;
        var tmp = game.move(cookies.ID, tile);
        if(tmp == 1){
            io.to(game.ID).emit("update", game.state);
            game.flipTurn();
            socket.to(game.ID).emit("yourTurn");
            socket.emit("opponentsTurn");
            var win = game.checkWin();
            if(win == -1){
                io.to(game.ID).emit("tie");
                now_playing.delete(game.p1);
                now_playing.delete(game.p2);
                games.delete(game.ID);
            } else if(win != 0){
                socket.emit("win");
                socket.to(game.ID).emit("lose");
                now_playing.delete(game.p1);
                now_playing.delete(game.p2);
                games.delete(game.ID);
            }
        } else if(tmp == 10){
            socket.emit("invalidMove");
        } else if(tmp == 20){
            socket.emit("notYourTurn");
        }
    })

    socket.on("play",()=>{
        var cookies = cookie.parse(socket.handshake.headers.cookie);
        getScoketId.set(cookies.ID, socket.id);
        if(!waitingForGame){
            waitingForGame = cookies.ID;
            waitingName = cookies.username;
            nextGameId = randomId();
            socket.join(nextGameId);
            socket.emit("waiting");
            console.log(waitingName + "is waiting for game");
        } else {
            console.log("connecting " + waitingName + " and " + cookies.username);
            socket.join(nextGameId);
            var gameID = nextGameId;
            io.to(gameID).emit("connected");
            games.set(gameID, new Game(waitingForGame, waitingName, cookies.ID, cookies.username, gameID));
            socket.to(gameID).emit("opponentName", cookies.username);
            socket.to(gameID).emit("yourTurn");
            socket.emit("opponentName", waitingName);
            socket.emit("opponentsTurn");
            now_playing.set(waitingForGame, gameID);
            now_playing.set(cookies.ID, gameID);
            waitingForGame = undefined;
            nextGameId = undefined;
            waitingName = undefined;
        }
    })    

    socket.on("disconnect", ()=>{
        if(socket.handshake.headers.cookie){
            var cookies = cookie.parse(socket.handshake.headers.cookie);
            if(cookies.ID == waitingForGame){
                waitingForGame = undefined;
            } else if (games.get(now_playing.get(cookies.ID))){
                var game =  games.get(now_playing.get(cookies.ID));
                game.dcCount++;
                if(game.dcCount == 2){
                    now_playing.delete(game.p1);
                    now_playing.delete(game.p2);
                    games.delete(game.ID);
                }                
            }    
        }        
    })
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/index.html');
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});