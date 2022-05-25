const socket = io();

const message = document.getElementById("message")



function CheckId(){
    if(!(cookie.get("ID") != "undefined" && cookie.get("ID") != undefined)){
        const modal = new bootstrap.Modal(document.getElementById('loginModal'));
        modal.show();
    }
}

function gameOver(msg){
    const modal = new bootstrap.Modal(document.getElementById('gameOverModal'));
    document.getElementById("gameOverText").innerHTML = msg;
    modal.show();
}

function sendToast(){
    const tmp = document.getElementById('toastMessage');
    const toast = new bootstrap.Toast(tmp);
    toast.show();
}

function play(){
    cookie.set("username", document.getElementById("nameInput").value);
    cookie.set("ID", socket.id);
    playGame();
}

function playGame(){
    document.getElementById("player").innerHTML = cookie.get("username");
    socket.emit("play");
}

socket.on("reconnected", ()=>{
    document.getElementById("player").innerHTML = cookie.get("username");
})

socket.on("connect", () => {
    console.log(socket.id);
});

socket.on("update", (state )=>{
    var tiles = document.getElementsByClassName("gameTile");
    for(var i = 0; i < 9; i++){
        if(state[i] == 1){
            tiles[i].innerHTML = "<img src=\"/assets/x-lg.svg\" class=\"h-100 w-100\">";
        } else if (state[i] == 2){
            tiles[i].innerHTML = "<img src=\"/assets/circle.svg\" class=\"h-100 w-100\">";
        }
    }
});

function clearTurn(){
    document.getElementById("opponent").classList.remove("border-success");
    document.getElementById("player").classList.remove("border-success");
}

socket.on("win", ()=>{
    clearTurn();
    gameOver("WINNER WINNER, CHICKEN DINNER!");
})

socket.on("tie", ()=>{
    clearTurn();
    gameOver("TIE :3");
})

socket.on("lose", ()=>{
    clearTurn();
    gameOver("You\nLOSE!")
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
})

socket.on("invalidMove", ()=>{
    message.innerHTML = "INVALID MOVE";
    sendToast()
})

socket.on("notYourTurn", ()=>{
    message.innerHTML = "Wait for your turn";
    sendToast()
})

socket.on("waiting", ()=>{
    message.innerHTML = "waiting for opponent!";
    sendToast()
})

socket.on("connected", ()=>{
    var tiles = document.getElementsByClassName("gameTile");
    for(var i = 0; i < tiles.length; i++){
        tiles[i].innerHTML = "";
    }
    console.log(tiles);
    message.innerHTML = "playing against worthy opponent!";
    sendToast()
})

function sendMove(tile){
    socket.emit("move", tile);
}