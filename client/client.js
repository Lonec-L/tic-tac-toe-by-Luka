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
        location = "test.html";
    }
}


function play(){
    cookie.set("username", document.getElementById("nameInput").value);
    cookie.set("ID", socket.id);    
    location = "test.html";
}

function playGame(){
    document.getElementById("PlayButton").style.display = "none";
    document.getElementById("player").innerHTML = cookie.get("username");
    console.log("ree");
    socket.emit("play");
}

socket.on("reconnected", ()=>{
    document.getElementById("PlayButton").style.display = "none";
    document.getElementById("player").innerHTML = cookie.get("username");
})

socket.on("connect", () => {
    console.log(socket.id);
});

socket.on("update", (state )=>{
    var tiles = document.getElementsByClassName("gameTile");
    for(var i = 0; i < 9; i++){
        if(state[i] == 1){
            tiles[i].innerHTML = "<img src=\"x-lg.svg\" class=\"h-100 w-100\">";
        } else if (state[i] == 2){
            tiles[i].innerHTML = "<img src=\"circle.svg\" class=\"h-100 w-100\">";
        }
    }
});

function refresh(){
    location.reload();
}

socket.on("win", ()=>{
    message.innerHTML = "WINNNER WINNER, CHICKEN DINNER!";
    document.getElementById("PlayButton").style.display = "block";
})

socket.on("tie", ()=>{
    message.innerHTML = "TIE :3";
    document.getElementById("PlayButton").style.display = "block";
})

socket.on("lose", ()=>{
    message.innerHTML = "loser!";
    document.getElementById("PlayButton").style.display = "block";
})

socket.on("opponentName",(name)=>{
    document.getElementById("opponent").innerHTML = name;
})

socket.on("yourTurn", ()=>{
    document.getElementById("player").classList.toggle("border-success");
    console.log("Your turn");
})

socket.on("toggleTurn", ()=>{
    document.getElementById("opponent").classList.toggle("border-success");
    document.getElementById("player").classList.toggle("border-success");
})

socket.on("opponentsTurn", ()=>{
    document.getElementById("opponent").classList.toggle("border-success");
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