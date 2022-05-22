const socket = io();

const message = document.getElementById("message")

function CheckId(){
    if(cookie.get("ID") != "undefined" && cookie.get("ID") != undefined){
        console.log(socket.id);
    } else {
        location = "index.html";
    }
}

function skipLogin(){
    if(cookie.get("ID") != "undefined" && cookie.get("ID") != undefined){
        location = "game.html";
    }
}


function play(){
    cookie.set("username", document.getElementById("nameInput").value);
    cookie.set("ID", socket.id);    
    location = "game.html";
}

function playGame(){
    document.getElementById("PlayButton").style.display = "none";
    document.getElementById("player").innerHTML = cookie.get("username");
    socket.emit("play");
}

socket.on("connect", () => {
    console.log(socket.id);
});

socket.on("update", (state )=>{
    var tiles = document.getElementById("gameContainer").children;
    for(var i = 0; i < 9; i++){
        if(state[i] == 1){
            tiles[i].innerHTML = "<i class=\"fa-regular fa-circle\"></i>";
        } else if (state[i] == 2){
            tiles[i].innerHTML = "<i class=\"fa-solid fa-x\"></i>";
        }
    }
});

function refresh(){
    location.reload();
}

socket.on("ragequit", ()=>{
    message.innerHTML = "your opponent ragequit!\n refresing in 5s"
    setTimeout(refresh, 5000);
})

socket.on("win", ()=>{
    message.innerHTML = "WINNNER WINNER, CHICKEN DINNER!\n refreshing in 5s";
    document.getElementById("PlayButton").style.display = "block";
})

socket.on("tie", ()=>{
    message.innerHTML = "TIE :3\n refreshing in 5s";
    document.getElementById("PlayButton").style.display = "block";
})

socket.on("lose", ()=>{
    message.innerHTML = "loser!\n refreshing in 5s";
    document.getElementById("PlayButton").style.display = "block";
})

socket.on("opponentName",(name)=>{
    document.getElementById("opponent").innerHTML = name;
})

socket.on("yourTurn", ()=>{
    document.getElementById("player").style.backgroundColor = "greenyellow";
    document.getElementById("opponent").style.backgroundColor = "white";
    console.log("Your turn");
})

socket.on("opponentsTurn", ()=>{
    document.getElementById("opponent").style.backgroundColor = "greenyellow";
    document.getElementById("player").style.backgroundColor = "white";
    console.log("Not Your turn");
})

socket.on("invalidMove", ()=>{
    message.innerHTML = "INVALID MOVE";
})

socket.on("notYourTurn", ()=>{
    message.innerHTML = "not your turn m8";
})

socket.on("waiting", ()=>{
    message.innerHTML = "waiting for opponent!";
})

socket.on("connected", ()=>{
    var tiles = document.getElementsByClassName("gameTile");
    for(var i = 0; i < tiles.length; i++){
        tiles[i].innerHTML = "";
    }
    console.log(tiles);
    message.innerHTML = "playing against worthy opponent!";
})

function sendMove(tile){
    socket.emit("move", tile);
}