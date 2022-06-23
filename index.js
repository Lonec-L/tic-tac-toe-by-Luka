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

const cookie = require("cookie")

const axios = require("axios");

const options = {
  method: 'GET',
  url: 'https://stujo-tic-tac-toe-stujo-v1.p.rapidapi.com',
  headers: {
    'X-RapidAPI-Host': 'stujo-tic-tac-toe-stujo-v1.p.rapidapi.com',
    'X-RapidAPI-Key': 'MY_API_KEY_1'
  }
};

const saveUrl = 'https://stujo-tic-tac-toe-stujo-v1.p.rapidapi.com';

function play(socket){
    if(!waitingForGame){
        waitingForGame = socket.playerID;
        waitingName = socket.playerName;
        nextGameId = randomId();
        socket.join(nextGameId);
        socket.emit("waiting");
    } else {
        if(waitingForGame == socket.playerID){
            waitingForGame = undefined;
            nextGameId = undefined;
            waitingName = undefined;
            return;
        }
        socket.join(nextGameId);
        var gameID = nextGameId;
        io.to(gameID).emit("connected");
        games.set(gameID, new Game(waitingForGame, waitingName, socket.playerID, socket.playerName, gameID));
        socket.to(gameID).emit("opponentName", socket.playerName);
        socket.to(gameID).emit("yourTurn");
        socket.emit("opponentName", waitingName);
        socket.emit("opponentsTurn");
        now_playing.set(waitingForGame, gameID);
        now_playing.set(socket.playerID, gameID);
        waitingForGame = undefined;
        nextGameId = undefined;
        waitingName = undefined;
    }
}

function updateGameState(game, socket){
    io.to(game.ID).emit("update", game.state);
    game.flipTurn();
    io.to(game.ID).emit("toggleTurn");
    var win = game.checkWin();
    if(win == -1){
        io.to(game.ID).emit("tie");
        now_playing.delete(game.p1);
        if(game.p2 != "AI")now_playing.delete(game.p2);
        games.delete(game.ID);
        return;
    } else if(win != 0){
        if(game.p2 != "AI"){
            socket.emit("win");
            socket.to(game.ID).emit("lose");
        } else {
            if(win == 1){
                socket.emit("win");
            } else socket.emit("lose");
        }        
        now_playing.delete(game.p1);
        if(game.p2 != "AI")now_playing.delete(game.p2);
        games.delete(game.ID);
        return;
    }
    return;
}

function playAI(socket){
    var gameID = randomId;
    socket.join(gameID);
    io.to(gameID).emit("connected");
    games.set(gameID, new Game(socket.playerID, socket.playerName, "AI", "Computer", gameID));
    socket.emit("opponentName", "Computer");
    socket.emit("yourTurn");
    games.get(gameID).dcCount = 1;
    now_playing.set(socket.playerID, gameID);
    if(waitingForGame == socket.playerID){
        waitingForGame = undefined;
        nextGameId = undefined;
        waitingName = undefined;
    }    
}

io.on('connection', (socket) => {
    socket.on("player_info", (id, pName, mode) => {
        socket.playerID = id;
        socket.playerName = pName;
        socket.gameMode = mode;

        if(now_playing.get(socket.playerID)){
            var game = games.get(now_playing.get(socket.playerID));
            socket.join(game.ID);
            io.to(game.ID).emit("update", game.state);
            if(socket.playerID == game.hasTurn)socket.emit("yourTurn");
            else socket.emit("opponentsTurn");
    
            if(socket.playerID == game.p1)socket.emit("opponentName", game.name2);
            else socket.emit("opponentName", game.name1);
            game.dcCount--;
            socket.emit("reconnected");
        } else {
            if(socket.gameMode == "normal")play(socket);
            else if(socket.gameMode == "AI")playAI(socket);
        }
    })

    socket.on('move', (tile) => {
        var game = games.get(now_playing.get(socket.playerID));
        if(!game)return;
        var tmp = game.move(socket.playerID, tile);
        if(tmp == 1){
            updateGameState(game, socket);
            if(game.p2 == "AI" && games.get(now_playing.get(socket.playerID))){
                options.url += game.getStateAI();
                axios.request(options).then((response)=>{
                    if(game.hasTurn != "AI")game.flipTurn();
                    game.move("AI", response.data.recommendation);
                    updateGameState(game, socket);
                    options.url = saveUrl;
                }).catch(function (error) {
                    console.error(error);
                });                
            }
        } else if(tmp == 10){
            socket.emit("invalidMove");
        } else if(tmp == 20){
            socket.emit("notYourTurn");
        }
    })

    socket.on("disconnect", ()=>{
        if(socket.playerID == waitingForGame){
            waitingForGame = undefined;
        } else if (games.get(now_playing.get(socket.playerID))){
            var game =  games.get(now_playing.get(socket.playerID));
            game.dcCount++;
            if(game.dcCount == 2){
                now_playing.delete(game.p1);
                if(game.p2 != "AI")now_playing.delete(game.p2);
                games.delete(game.ID);
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
