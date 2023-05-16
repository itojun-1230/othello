//初期設定
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

const PORT = process.env.PORT || 1230;
/////

const Game = class {
  constructor(room) { // コンストラクタ
    this.tile = "\
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
    this.janken = [0, 0];
    this.playerName = new Array(2).fill(undefined);
    this.RoomName = 'room' + room;
  }
}
let Room = new Array(4).fill('');
for (let i = 1; i <= 4; i++)Room[i] = new Game(i)



io.on('connection', (socket) => {
  console.log('connection');  //接続処理

  socket.on('disconnect', () => { //切断処理
    console.log('disconnect');
    let room = PlayerIndex(socket.id);
    if (room != -1) {
      socket.leave('room' + room);

      if (Room[room].start = true) {
        io.to('room' + room).emit('socket', "LeavePlayer");
        console.log(`room${room} がプレイヤーが抜けたため強制終了しました`);
      }
      Room[room] = new Game(room);  //リセット
      io.emit('socket', 'Player', //player数の反映
        Room[1].player,
        Room[2].player,
        Room[3].player,
        Room[4].player
      );


    }

  });
  socket.on('socket', (...args) => {  //受信処理
    if (args[0] == "joingame") {  //joingameイベント
      const room = args[1];

      if (Room[room].player < 2) { //roomのプレイヤー数が2未満
        Room[room].player += 1;
        Room[room].playerID.push(socket.id);
        socket.join('room' + room);

        io.to(socket.id).emit('socket', 'JoinuSccess', room);
        io.emit('socket', 'Player',   //player数の反映
          Room[1].player,
          Room[2].player,
          Room[3].player,
          Room[4].player
        );

        if (Room[room].player == 2) { //roomのプレイヤー数が2
          console.log(`room${room} がゲームを開始しました `);

          Room[room].start = true;
          io.to('room' + room).emit(  //Game開始命令
            'socket',
            'GameStart',
            Room[room].tile
          );
        }
      }
    } else if (args[0] == "Leave") {

      socket.leave('room' + args[1]);
      Room[args[1]] = new Game(args[1]);
      io.emit('socket', 'Player',   //player数の反映
        Room[1].player,
        Room[2].player,
        Room[3].player,
        Room[4].player
      );

    } else if (args[0] == "updataPlayer") {
      io.emit('socket', 'Player',   //player数の反映
        Room[1].player,
        Room[2].player,
        Room[3].player,
        Room[4].player
      );
    } else if (args[0] == "janken-input") {
      const room = PlayerIndex(socket.id);

      if (Room[room].playerID[0] == socket.id) {  //じゃんけんリストに代入
        Room[room].janken[0] = args[1];

      } else if (Room[room].playerID[1] == socket.id) {
        Room[room].janken[1] = args[1];

      }

      if (Room[room].playerID[0] == socket.id) {  //名前を代入
        Room[room].playerName[0] = args[2];

      } else if (Room[room].playerID[1] == socket.id) {
        Room[room].playerName[1] = args[2];

      }

      if (Room[room].janken[0] != 0 && Room[room].janken[1] != 0) {
        if (  //player[1] 勝利
          (Room[room].janken[0] == 1 && Room[room].janken[1] == 2)
          || (Room[room].janken[0] == 2 && Room[room].janken[1] == 3)
          || (Room[room].janken[0] == 3 && Room[room].janken[1] == 1)
        ) {
          io.to(Room[room].playerID[0]).emit(
            'socket',
            'janken-result',
            2,
            Room[room].tile,
            Room[room].playerName
          );
          io.to(Room[room].playerID[1]).emit(
            'socket',
            'janken-result',
            1,
            Room[room].tile,
            Room[room].playerName
          );

        } else if (   //player[0] 勝利
          (Room[room].janken[0] == 1 && Room[room].janken[1] == 3)
          || (Room[room].janken[0] == 2 && Room[room].janken[1] == 1)
          || (Room[room].janken[0] == 3 && Room[room].janken[1] == 2)
        ) {
          io.to(Room[room].playerID[0]).emit(
            'socket',
            'janken-result',
            1,
            Room[room].tile,
            Room[room].playerName
          );
          io.to(Room[room].playerID[1]).emit(
            'socket',
            'janken-result',
            2,
            Room[room].tile,
            Room[room].playerName
          );
        } else {
          Room[room].janken = [0, 0];
          io.to('room' + room).emit(
            'socket',
            'janken-result',
            -1,
            Room[room].playerName
          );
        }
      }
    } else if (args[0] == "place-stone") {  //石設置処理
      let array = Stone(
        Room[args[4]].tile,
        args[1], //color
        args[2], //x
        args[3], //y
        args[4] //room番号
      );
      Room[args[4]].tile = array[0];

      let Name = "";

      if (array[1] != -1) {
        if (Room[args[4]].turn == 1) {
          Room[args[4]].turn = 2

        } else if (Room[args[4]].turn == 2) {
          Room[args[4]].turn = 1;

        }
        if (Room[args[4]].playerID[0] == socket.id) {
          Name = Room[args[4]].playerName[1];

        } else if (Room[args[4]].playerID[1] == socket.id) {
          Name = Room[args[4]].playerName[0];

        }
      } else {
        if (Room[args[4]].playerID[0] == socket.id) {
          Name = Room[args[4]].playerName[0];

        } else if (Room[args[4]].playerID[1] == socket.id) {
          Name = Room[args[4]].playerName[1];

        }
      }

      if (
        (Room[args[4]].whitecount == 0 || Room[args[4]].blackcount == 0) //どちらかの石がなくなった場合
        || (Room[args[4]].blackcount + Room[args[4]].whitecount == 64)) {   //石の合計値が64になった場合
        console.log(`room${args[4]} がゲームを終了しました`);

        io.to('room' + args[4]).emit( //Game終了命令
          'socket',
          'ending',
          Room[args[4]].whitecount,
          Room[args[4]].blackcount
        );
        Room[args[4]] = new Game(args[4]);
      }

      if (Room[args[4]].whitecount != 0 && Room[args[4]].blackcount != 0) {
        io.to('room' + args[4]).emit( //ターン入れ替え命令
          'socket',
          'turn-change',
          Room[args[4]].tile,
          Room[args[4]].turn,
          Name
        );
      }
    }
  })
})

function Stone(tile, color, x, y, room) { //石処理
  tile = tile.split("/"); //"/"区切りで分割
  const AiteColor = color == '2' ? 1 : 2;

  tile[y] = TextIndexReplace(tile[y], color, x);
  tile = StoneCheak(tile, color, AiteColor, x, y, 1, 0);  //右
  tile = StoneCheak(tile, color, AiteColor, x, y, -1, 0); //左
  tile = StoneCheak(tile, color, AiteColor, x, y, 0, 1);  //上
  tile = StoneCheak(tile, color, AiteColor, x, y, 0, -1); //下
  tile = StoneCheak(tile, color, AiteColor, x, y, 1, 1);  //右上
  tile = StoneCheak(tile, color, AiteColor, x, y, 1, -1); //右下
  tile = StoneCheak(tile, color, AiteColor, x, y, -1, 1); //左上
  tile = StoneCheak(tile, color, AiteColor, x, y, -1, -1);  //左下

  let [newTile, canPlace] = CanPlaceTile(tile, color, AiteColor, room); //設置可能位置探索
  if (canPlace == 0) {  //設置できない場、合相手の色で再探索
    [newTile, canPlace] = CanPlaceTile(tile, AiteColor, color, room);
    canPlace = -1;
  }
  tile = newTile;

  let output = tile[0];
  for (let i = 1; i < tile.length; i++) {
    output += "/" + tile[i];
  }
  return [output, canPlace];
}

function StoneCheak(tile, color, AiteColor, x, y, dx, dy) {
  for (let i = dx, l = dy; tile[y + l][x + i] != "#"; i += dx, l += dy) { //一直線に見ていくためこんなに気持ち悪いfor文してる
    const Value = tile[y + l][x + i];
    if (Value == AiteColor) {
      tile[y + l] = TextIndexReplace(tile[y + l], 4, x + i);

    } else if (Value == color) {
      for (let t = 1; t < tile.length; t++)tile[t] = tile[t].replace(/4/g, color);

      break;
    } else if (Value == 0 || Value == 3) {

      break;
    }
  }
  for (let i = 1; i < tile.length; i++) {
    tile[i] = tile[i].replace(/4/g, AiteColor);
  }
  return tile;
}

function PlaceCheak(tile, color, AiteColor, x, y, dx, dy, flag) {
  let back;
  for (let i = dx, l = dy; tile[y + l][x + i] != "#"; i += dx, l += dy) {
    let value = tile[y + l][x + i];

    if (value == AiteColor && back == color) {
      flag += 1;
      tile[y] = TextIndexReplace(tile[y], 3, x);

      break;
    }
    if (value == 0 || value == 3 || value == AiteColor) {

      break;
    }
    back = value;
  }
  return [tile, flag];
}

function CanPlaceTile(tile, color, AiteColor, room) {
  for (let i = 1; i < tile.length; i++)tile[i] = tile[i].replace(/3/g, 0);

  Room[room].whitecount = 0;
  Room[room].blackcount = 0;

  let canplace = 0
  for (let y = 1; y < tile[0].length; y++)for (let x = 1; x < tile[y].length; x++) {
    if (tile[y][x] == 1) Room[room].whitecount += 1
    if (tile[y][x] == 2) Room[room].blackcount += 1
    if (tile[y][x] == 0) {
      let array = [tile, 0]
      array = PlaceCheak(array[0], color, AiteColor, x, y, 0, 1, array[1]);
      array = PlaceCheak(array[0], color, AiteColor, x, y, 0, -1, array[1]);
      array = PlaceCheak(array[0], color, AiteColor, x, y, 1, 0, array[1]);
      array = PlaceCheak(array[0], color, AiteColor, x, y, -1, 0, array[1]);
      array = PlaceCheak(array[0], color, AiteColor, x, y, 1, 1, array[1]);
      array = PlaceCheak(array[0], color, AiteColor, x, y, 1, -1, array[1]);
      array = PlaceCheak(array[0], color, AiteColor, x, y, -1, 1, array[1]);
      array = PlaceCheak(array[0], color, AiteColor, x, y, -1, -1, array[1]);
      tile = array[0];

      if (array[1] != 0) canplace += 1;
    }

  }
  return [tile, canplace]
}

function TextIndexReplace(text, value, index) { //テキストを分割してindexの位置に代入
  const text1 = text.substr(0, index)
  const text2 = text.substr(index + 1)
  text = text1 + value + text2;

  return text
}

function PlayerIndex(id) {
  let i = 1;
  for (i; i <= 4; i++) {
    if (Room[i].playerID.length != 0) if (Room[i].playerID.indexOf(id) != -1) return i;
  }
  return -1
}

// 公開フォルダの指定
app.use(express.static(__dirname + '/public'));

// サーバーの起動
server.listen(PORT, () => {
  console.log('server starts on port: %d', PORT);
});