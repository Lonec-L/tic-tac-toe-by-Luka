class Game{
    p1;
    p2;
    state;
    hasTurn;
    ID;
    name1;
    name2;
    dcCount;

    constructor(player1, name1, player2, name2, ID){
        this.p1 = player1;
        this.p2 = player2;
        this.name1 = name1;
        this.name2 = name2;
        this.state = [];
        this.ID = ID;
        this.dcCount = 0;
        for(var i = 0; i < 9; i++){
            this.state.push(0);
        }
        this.hasTurn = this.p1;
    }

    checkWin(){
        for(var i = 0; i < 3; i++){
            if(this.state[0+i*3] == this.state[1+i*3] && this.state[0+i*3] == this.state[2+i*3] && this.state[0+i*3] != 0){
                return this.state[0+i*3];
            } else if(this.state[0+i] == this.state[3+i] && this.state[0+i] == this.state[6+i] && this.state[6+i] != 0){
                return this.state[0+i];
            }
        }

        if(this.state[0] == this.state[4] && this.state[0] == this.state[8] && this.state[0] != 0){
            return this.state[0];
        } else if(this.state[2] == this.state[4] && this.state[2] == this.state[6] && this.state[2] != 0){
            return this.state[2];
        }

        for(var i = 0; i < 9; i++){
            if(this.state[i]==0){
                return this.state[i];
            }
        }

        return -1;
    }

    move(p, tile){
        if(this.state[tile] != 0) return 10;
        if(p != this.hasTurn) return 20;
        if(p == this.p1)this.state[tile] = 1;
        else this.state[tile] = 2;
        return 1;
    }

    flipTurn(){
        if(this.hasTurn == this.p1) this.hasTurn = this.p2;
        else this.hasTurn = this.p1;
    }

    getStateAI(){
        var tmp="/";
        for(var i = 0; i < 9; i++){
            if(this.state[i] == 0){
                tmp += "-";
            }
            if(this.state[i] == 1){
                tmp += "X";
            }
            if(this.state[i] == 2){
                tmp += "O";
            }
        }
        tmp += "/O";
        return tmp;
    }
}

module.exports = {
    Game,
}