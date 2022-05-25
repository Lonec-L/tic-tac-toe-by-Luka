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
    'X-RapidAPI-Key': '6bf42255c6mshc654d270317c03dp12660bjsnc0ecc32947b2'
  }
};

const saveUrl = 'https://stujo-tic-tac-toe-stujo-v1.p.rapidapi.com';

function play(socket){
    var cookies = cookie.parse(socket.handshake.headers.cookie);
    if(!waitingForGame){
        waitingForGame = cookies.ID;
        waitingName = cookies.username;
        nextGameId = randomId();
        socket.join(nextGameId);
        socket.emit("waiting");
    } else {
        if(waitingForGame == cookies.ID){
            waitingForGame = undefined;
            nextGameId = undefined;
            waitingName = undefined;
            return;
        }
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
}

function updateGameState(game, socket){
    var cookies = cookie.parse(socket.handshake.headers.cookie);
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
    var cookies = cookie.parse(socket.handshake.headers.cookie);
    var gameID = randomId;
    socket.join(gameID);
    io.to(gameID).emit("connected");
    games.set(gameID, new Game(cookies.ID, cookies.username, "AI", "Computer", gameID));
    socket.emit("opponentName", "Computer");
    socket.emit("yourTurn");
    now_playing.set(cookies.ID, gameID);
    waitingForGame = undefined;
    nextGameId = undefined;
    waitingName = undefined;
}

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
        } else {
            if(cookies.mode == "normal")play(socket);
            else if(cookies.mode == "AI")playAI(socket);
        }
    }    

    socket.on('move', (tile) => {
        var cookies = cookie.parse(socket.handshake.headers.cookie);
        var game = games.get(now_playing.get(cookies.ID));
        if(!game)return;
        var tmp = game.move(cookies.ID, tile);

        if(tmp == 1){
            updateGameState(game, socket);
            if(game.p2 == "AI"){
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
        if(socket.handshake.headers.cookie){
            var cookies = cookie.parse(socket.handshake.headers.cookie);
            if(cookies.ID == waitingForGame){
                waitingForGame = undefined;
            } else if (games.get(now_playing.get(cookies.ID))){
                var game =  games.get(now_playing.get(cookies.ID));
                game.dcCount++;
                if(game.dcCount == 2){
                    now_playing.delete(game.p1);
                    if(game.p2 != "AI")now_playing.delete(game.p2);
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