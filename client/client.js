

const socket = io();

const message = document.getElementById("message")


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
    var tiles = document.getElementById("gameContainer").children;
    for(var i = 0; i < 9; i++){
        tiles[i].removeAttribute("onclick");
    }
    setTimeout(refresh, 5000);
})

socket.on("tie", ()=>{
    message.innerHTML = "TIE :3\n refreshing in 5s";
    var tiles = document.getElementById("gameContainer").children;
    for(var i = 0; i < 9; i++){
        tiles[i].removeAttribute("onclick");
    }
    setTimeout(refresh, 5000);
})

socket.on("lose", ()=>{
    message.innerHTML = "loser!\n refreshing in 5s";
    var tiles = document.getElementById("gameContainer").children;
    for(var i = 0; i < 9; i++){
        tiles[i].removeAttribute("onclick");
    }
    setTimeout(refresh, 5000);
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
    message.innerHTML = "playing against worthy opponent!";
})

function sendMove(tile){
    socket.emit("move", tile);
}