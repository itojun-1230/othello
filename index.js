const http     = require('http');
const express  = require('express');
const socketIO = require('socket.io');
const { type } = require('os');

const app    = express();
const server = http.Server(app);
const io     = socketIO(server);

const PORT = process.env.PORT || 1230;

var Room = ['','','','','']

const Game = class {
  constructor(room) { /* コンストラクタ */
    this.tile =   "\
##########/\
#00000000#/\
#00000000#/\
#00030000#/\
#00312000#/\
#00021300#/\
#00003000#/\
#00000000#/\
#00000000#/\
##########";
    this.start = false;
    this.turn = 2;
    this.player = 0;
    this.whitecount = 2;
    this.blackcount = 2;
    this.playerID = [];
    this.janken = [0,0];
    this.playerName = ["undefined","undefined"]
    this.RoomName = 'room' + room;
  }
}
for(let i=1;i<=4;i++)Room[i] = new Game(i)



io.on('connection', (socket) => {
    console.log('connection');
    socket.on('disconnect', () => {
        console.log('disconnect');
        let room = PlayerIndex(socket.id);
        if(room != -1){
              socket.leave('room'+room);
              if(Room[room].start = true){
                io.to('room'+room).emit('socket',"LeavePlayer");
                console.log(`room${room} がプレイヤーが抜けたため強制終了しました。`)
              }
              Room[room] = new Game(room);
              io.emit('socket', 'Player',Room[1].player,Room[2].player,Room[3].player,Room[4].player);
          
          
        }
        
    });
    socket.on('socket',(...args) => {
      if(args[0] == "joingame"){
        let room = args[1];
        
        if(Room[room].player != 2){
          Room[room].player += 1;
          Room[room].playerID.push(socket.id);
          socket.join('room' + room);          
          io.to(socket.id).emit('socket','JoinuSccess',room);
          io.emit('socket', 'Player',Room[1].player,Room[2].player,Room[3].player,Room[4].player);

          if(Room[room].player == 2){
            console.log(`room${room} がゲームを開始しました `)
            Room[room].start = true;
            io.to('room'+room).emit('socket', 'GameStart',Room[room].tile);
          }
        }
      }else if(args[0] == "Leave"){

        socket.leave('room'+args[1]);
        Room[args[1]] = new Game(args[1]);
        io.emit('socket', 'Player',Room[1].player,Room[2].player,Room[3].player,Room[4].player);
      }else if(args[0] == "updataPlayer"){io.emit('socket', 'Player',Room[1].player,Room[2].player,Room[3].player,Room[4].player,Room);
      }else if(args[0] == "janken-input"){
        let room = PlayerIndex(socket.id);
        if(Room[room].playerID[0] == socket.id)Room[room].janken[0] = args[1];  //じゃんけんリストに代入
        if(Room[room].playerID[1] == socket.id)Room[room].janken[1] = args[1];
        
        if(Room[room].playerID[0] == socket.id)Room[room].playerName[0] = args[2];  //名前を代入
        if(Room[room].playerID[1] == socket.id)Room[room].playerName[1] = args[2];

        if(Room[room].janken[0] != 0 && Room[room].janken[1] != 0){
          if((Room[room].janken[0] == 1 && Room[room].janken[1] == 2) || (Room[room].janken[0] == 2 && Room[room].janken[1] == 3) || (Room[room].janken[0] == 3 && Room[room].janken[1] == 1)){
            io.to(Room[room].playerID[0]).emit('socket','janken-result',2,Room[room].tile,Room[room].playerName);
            io.to(Room[room].playerID[1]).emit('socket','janken-result',1,Room[room].tile,Room[room].playerName);
          }else if((Room[room].janken[0] == 1 && Room[room].janken[1] == 3) || (Room[room].janken[0] == 2 && Room[room].janken[1] == 1) || (Room[room].janken[0] == 3 && Room[room].janken[1] == 2)){
            io.to(Room[room].playerID[0]).emit('socket','janken-result',1,Room[room].tile,Room[room].playerName);
            io.to(Room[room].playerID[1]).emit('socket','janken-result',2,Room[room].tile,Room[room].playerName);
          }else{
            Room[room].janken = [0,0];
            io.to('room'+room).emit('socket','janken-result',-1,Room[room].playerName);
          }
        }
      }else if(args[0] == "place-stone"){
        let array = Stone(Room[args[4]].tile,args[1],args[2],args[3],args[4]);
        Room[args[4]].tile = array[0];

        let Name = "";

        if(array[1] != -1){
          if(Room[args[4]].turn == 1){
            Room[args[4]].turn = 2
          }else if(Room[args[4]].turn == 2){
            Room[args[4]].turn = 1;
          }
          if(Room[args[4]].playerID[0] == socket.id)Name = Room[args[4]].playerName[1];
          if(Room[args[4]].playerID[1] == socket.id)Name = Room[args[4]].playerName[0];
        }else {
          if(Room[args[4]].playerID[0] == socket.id)Name = Room[args[4]].playerName[0];
          if(Room[args[4]].playerID[1] == socket.id)Name = Room[args[4]].playerName[1];
        }

        if((Room[args[4]].whitecount == 0 || Room[args[4]].blackcount == 0) || (Room[args[4]].blackcount + Room[args[4]].whitecount == 64 )){
          console.log(`room${args[4]} がゲームを終了しました`)
          io.to('room'+args[4]).emit('socket', 'ending', Room[args[4]].whitecount, Room[args[4]].blackcount);
          Room[args[4]] = new Game(args[4]);
        }
        
        if(Room[args[4]].whitecount != 0 && Room[args[4]].blackcount != 0)io.to('room'+args[4]).emit('socket', 'turn-change',Room[args[4]].tile,Room[args[4]].turn,Name);
      }
    })
})

function Stone(tile,color,x,y,room){
  tile = tile.split("/");
  var AiteColor = 2;
  if(color == '2')AiteColor = 1;

  tile[y] = TextIndexReplace(tile[y],color,x);
  tile = StoneCheak(tile,color,AiteColor,x,y,1,0)
  tile = StoneCheak(tile,color,AiteColor,x,y,-1,0)
  tile = StoneCheak(tile,color,AiteColor,x,y,0,1)
  tile = StoneCheak(tile,color,AiteColor,x,y,0,-1)
  tile = StoneCheak(tile,color,AiteColor,x,y,1,1)
  tile = StoneCheak(tile,color,AiteColor,x,y,1,-1)
  tile = StoneCheak(tile,color,AiteColor,x,y,-1,1)
  tile = StoneCheak(tile,color,AiteColor,x,y,-1,-1)

  let array = CanPlaceTile(tile,color,AiteColor,room);
  if(array[1] == 0){
    array = CanPlaceTile(tile,AiteColor,color,room);
    array[1] = -1;
  }
  tile = array[0];

  let output = tile[0];
  for(let i=1;i < tile.length;i++)output += "/" + tile[i] 
  return [output, array[1]]
}

function StoneCheak(tile,color,AiteColor,x,y,dx,dy){
  for(let i = dx,l = dy; tile[y+l][x+i] != "#"; i+=dx, l+=dy){
    let value = tile[y+l][x+i];
    if(value == AiteColor)tile[y+l] = TextIndexReplace(tile[y+l],4,x+i);
    if(value == color){
      for(let t=1;t < tile.length;t++)tile[t] = tile[t].replace(/4/g,color);
        break;
    }
    if(value == 0 || value == 3){
      break;
    }
  }
  for(let i=1;i < tile.length;i++)tile[i] = tile[i].replace(/4/g,AiteColor);
  return tile
}

function PlaceCheak(tile,color,AiteColor,x,y,dx,dy,flag){
  let back;
  for(let i = dx,l = dy; tile[y+l][x+i] != "#"; i+=dx, l+=dy){
    let value = tile[y+l][x+i];
    if(value == AiteColor && back == color){
      flag += 1;
      tile[y] = TextIndexReplace(tile[y],3,x);
      break;
    }
    if(value == 0 || value == 3 || value == AiteColor){
      break;
    }
    back = value;
  }
  return [tile,flag]
}

function CanPlaceTile(tile,color,AiteColor,room){
  for(let i=1;i < tile.length;i++)tile[i] = tile[i].replace(/3/g,0);

  Room[room].whitecount = 0;Room[room].blackcount = 0;
  let canplace = 0
  for(let y = 1;y < tile[0].length;y++)for(let x = 1;x < tile[y].length;x++){
    if(tile[y][x] == 1)Room[room].whitecount += 1
    if(tile[y][x] == 2)Room[room].blackcount += 1
    if(tile[y][x]==0){
      let array = [tile,0]
      array = PlaceCheak(array[0],color,AiteColor,x,y,0,1,array[1]);
      array = PlaceCheak(array[0],color,AiteColor,x,y,0,-1,array[1]);
      array = PlaceCheak(array[0],color,AiteColor,x,y,1,0,array[1]);
      array = PlaceCheak(array[0],color,AiteColor,x,y,-1,0,array[1]);
      array = PlaceCheak(array[0],color,AiteColor,x,y,1,1,array[1]);
      array = PlaceCheak(array[0],color,AiteColor,x,y,1,-1,array[1]);
      array = PlaceCheak(array[0],color,AiteColor,x,y,-1,1,array[1]);
      array = PlaceCheak(array[0],color,AiteColor,x,y,-1,-1,array[1]);
      tile = array[0];
      if(array[1] != 0)canplace += 1;
    }

  }
  return [tile,canplace]
}

function TextIndexReplace(text,value,index){
  let text1 = text.substr(0,index)
  let text2 = text.substr(index+1)
  text = text1 + value + text2;
  
  return text
}

function PlayerIndex(id){
  let i = 1;
  for(i;i<=4;i++){
    if(Room[i].playerID.length != 0)if(Room[i].playerID.indexOf(id) != -1)return i;
  }
  return -1
}

// 公開フォルダの指定
app.use(express.static(__dirname + '/public'));

// サーバーの起動
server.listen(PORT, () => {
    console.log('server starts on port: %d', PORT);
});