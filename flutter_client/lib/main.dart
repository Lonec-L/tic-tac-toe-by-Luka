import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

void main() {
  runApp(const TicTacToe());
}

class TicTacToe extends StatelessWidget {
  const TicTacToe({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const MyHomePage(title: 'Flutter Demo Home Page'),
    );
  }
}

class MyHomePage extends StatefulWidget {
  const MyHomePage({Key? key, required this.title}) : super(key: key);

  final String title;
  
  @override
  State<StatefulWidget> createState() => _TicTacToeState();
}


class _TicTacToeState extends State<StatefulWidget>{
  late io.Socket socket;
  List<int> gameState = [0,0,0,0,0,0,0,0,0];
  String p1 ="anonymous";
  String p2 = "anonymous";
  String? id = "";

  String mode = "";

  bool enabled = false;
  bool clientHasTurn = true;

  void _showDialog(String m){
    showDialog<void>(
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            title: Text(m),
            actions: <Widget>[
              TextButton(
                child: const Text('Dismiss'),
                onPressed: () {
                  Navigator.of(context).pop();
                },
              ),
            ],
          );
        },
      );
  }

  @override
  void initState() {
    super.initState();
    initSocket();
  }

  void initSocket(){
    socket = io.io('http://ec2-52-16-219-220.eu-west-1.compute.amazonaws.com:3000',<String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': false,
    });
    socket.onConnect((_) {
      if(id == "")id = socket.id;
      socket.emit("player_info", [id, p1, mode]);
    });
    socket.on('update', (state) {
      setState(() {
        for(var i = 0; i < 9; i++){
          gameState[i] = state[i];
        }
      });
    });
    socket.on("win", (_){
      _showDialog("You WIN!");
      enabled = false;
    });

    socket.on("tie", (_){
      _showDialog("Tie");
      enabled = false;
    });

    socket.on("lose", (_){
      _showDialog("You lose.");
      enabled = false;     
    });

    socket.on("opponentName",(name){
      setState(() {
        p2 = name;
      });
    });

    socket.on("yourTurn", (_){
      setState(() {
        clientHasTurn = true;
      });
    });

    socket.on("toggleTurn", (_){
      setState(() {
        clientHasTurn = !clientHasTurn;
      });
    });

    socket.on("opponentsTurn", (_){
      setState(() {
        clientHasTurn = false;
      });
    });

    socket.on("invalidMove", (_){
      _showDialog("Invalid move");
    });

    socket.on("notYourTurn", (_){
      print("not your turn");
    });

    socket.on("waiting", (_){
      print("waiting");
    });

    socket.on("connected", (_){
      setState(() {
        for(var i = 0; i < 9; i++){
          gameState[i] = 0;
        }
      });
    });
  }

  @override
  void dispose() {
    socket.disconnect();
    super.dispose();
  }

  void saveName(String name){
    setState(() {
      p1 = name;
    });    
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("TicTacToe by Luka"),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        labelText: 'Enter your name',
                      ),
                      onSubmitted: (String name) => saveName(name),
                    ),
                  ),
                  ButtonBar(
                    children: [
                      ElevatedButton(onPressed: (){
                        mode = "normal";
                        enabled = true;
                        if(!socket.connected) {
                          socket.connect();
                        } else{
                          socket.disconnect();
                          socket.connect();
                        }
                      }, child: const Text("Play")),
                      OutlinedButton(onPressed: (){
                        mode = "AI";
                        enabled = true;
                        if(!socket.connected) {
                          socket.connect();
                        } else{
                          socket.disconnect();
                          socket.connect();
                        }
                      }, child: const Text("Play vs AI"))
                    ],
                  )                  
                ],
              ),
              Expanded(
                flex: 2,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(p2,
                        style: const TextStyle(fontSize: 28),
                      ),
                    Icon(Icons.circle,
                      color: clientHasTurn ? Colors.grey : Colors.green,
                    )
                  ],
                )
              ),
                Expanded(
                  flex: 10,
                  child: Align(
                    child: AspectRatio(
                      aspectRatio: 1/1,
                      child: Container(
                        color: Colors.blue,
                        child: GridView.count(
                          crossAxisCount: 3,
                          crossAxisSpacing: 10,
                          mainAxisSpacing: 10,
                          children: List<Widget>.generate(9, (i){
                            if(gameState[i] == 1){
                              return GestureDetector(
                                onTap: () => socket.emit("move", i),
                                child: Container(
                                  color: Colors.white,
                                  child: const FittedBox(
                                    fit: BoxFit.fill,
                                    child: Icon(Icons.close),
                                  ),
                                ),
                              );
                            }
                            if(gameState[i] == 2){
                              return GestureDetector(
                                onTap: (){
                                  if(enabled)socket.emit("move", i);
                                },
                                child: Container(
                                  color: Colors.white,
                                  child: const FittedBox(
                                    fit: BoxFit.fill,
                                    child: Icon(Icons.circle_outlined),
                                  ),
                                ),
                              );
                            }else{return GestureDetector(
                                onTap: (){
                                  if(enabled)socket.emit("move", i);
                                },
                                child: Container(
                                  color: Colors.white,
                                  child: const FittedBox(
                                    fit: BoxFit.fill,
                                  ),
                                ),
                              );
                            }
                          }),
                        ),
                      ),
                    ),
                  ),
                ),
              Expanded(
                flex: 2,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(p1,
                        style: const TextStyle(fontSize: 28),
                      ),
                    Icon(Icons.circle,
                      color: clientHasTurn ? Colors.green : Colors.grey,
                    )
                  ],
                )
              ),
            ],
          ),
        ),
      ),
    );
  }
}