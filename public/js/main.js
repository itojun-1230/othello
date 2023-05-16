//サーバ接続
const socket = io.connect();
//urlを格納
const url = location.href;
//初期変数宣言
let flag = 0;
let Room = null;
let MyColor = 0;
let turn = 2;


function ElemntEvent(e) {
    if (e.getAttribute("onclick") != null) {      //onclickイベント
        if (e.id == "start-window") {
            e._click = () => {
                if (flag == 0) {
                    flag = 1;
                    anime({
                        targets: e,
                        translateY: ['0px', '-800px'],
                        duration: 3000,
                        complete: () => {
                            e.remove()
                        }
                    });

                    anime({
                        targets: document.getElementById("select-window"),
                        translateY: ['0px', '-800px'],
                        duration: 3000
                    });

                    socket.emit('socket', 'updataPlayer');
                }
            }
        } else if (e.className == "select-room") {
            e._click = function () {
                if (Room == null) {
                    let num = e.id.slice(-1);
                    socket.emit('socket', 'joingame', num);
                }
            }
        } else if (e.className == "StoneDiv") {
            e._click = function () {


                for (let i = 0; i < 8; i++)for (let l = 0; l < 8; l++) {
                    const element = document.getElementsByClassName("Tile")[i].children[l].children[0];
                    if (element.style.pointerEvents == 'auto') element.style.pointerEvents = 'none';
                }
                const x = parseInt(e.parentNode.getAttribute("x"))
                const y = parseInt(e.parentNode.parentNode.getAttribute("y"))
                socket.emit('socket', 'place-stone', MyColor, x + 1, y + 1, Room);
            }
        } else if (e.className == "janken") {
            e._click = function () {
                for (let i = 0; i < 3; i++) {
                    const janken = document.getElementsByClassName("janken")[i];
                    janken.style.pointerEvents = 'none';
                }
                e.style.backgroundColor = "#004cff";
                document.getElementsByClassName("janken-result")[1].src = e.src;
                socket.emit('socket', 'janken-input', e.getAttribute("janken"));

                document.getElementById("janken-board").style.backgroundColor = "rgb(21, 32, 57)"

            }
        } else if (e.id == "exit") {
            e._click = function () {
                socket.emit('socket', 'Leave', Room);
                Room = null;
            }
        }
    }
    if (e.getAttribute("onmouseover") != null) {  //onmouseoverイベント
        if (e.className == "select-room") e._mouseover = function () {
            anime({
                targets: e,
                rotateZ: [
                    0, '5deg', '-5deg', 0
                ],
                duration: 1500,
                easing: 'easeInOutSine',
            })
        }
    }
    if (e.getAttribute("onmouseleave") != null) { //onmouseleave
        if (e.className == "select-room") e._mouseleave = function () {
            anime({
                targets: e,
                rotateZ: 0,
                duration: 2000,
            })
        }
    }
}


function Click(target) {
    target._click();
}
function MouseOver(target) {
    target._mouseover();
}
function MouseLeave(target) {
    target._mouseleave();
}
function End() {
    anime({
        targets: document.getElementById("select-window"),
        translateY: '-800px',
        duration: 3000
    })
    anime({
        targets: document.getElementById("board-window"),
        translateY: '0px',
        duration: 1000,
        easing: 'easeInOutSine',
    })
    socket.emit('socket', 'Leave', Room);
    flag = 1; turn = 2;
    Room = null; MyColor = 0;

    for (let i = 0; i < 3; i++) {
        let janken = document.getElementsByClassName("janken")[i];
        janken.style.pointerEvents = 'auto';
        janken.style.backgroundColor = "";
    }
    document.getElementsByClassName("janken-result")[0].src = "";
    document.getElementsByClassName("janken-result")[1].src = "";
    JankenBoard();
}

function Stone(stone) {          //石の表示処理全般
    stone = stone.replace(/#/g, "");
    stone = stone.slice(1)
    stone = stone.split("/");

    for (let i = 0; i < stone.length; i++) {
        for (let l = 0; l < stone[i].length; l++) {
            const element = document.getElementsByClassName("Tile")[i].children[l].children[0];
            if (getComputedStyle(element).getPropertyValue("opacity") == 0 && (stone[i][l] == 1 || stone[i][l] == 2) && flag == 2) {
                if ((stone[i][l] == 1 && element.children[1].style.backgroundColor == 'rgb(0, 0, 0)') || (stone[i][l] == 2 && element.children[1].style.backgroundColor == 'rgb(255, 255, 255)')) element.insertBefore(element.children[1], element.children[0]);
                anime({
                    targets: element,
                    opacity: 1,
                    scaleX: [1.3, 1],
                    scaleY: [1.3, 1],
                    easing: 'easeInOutExpo',
                    duration: 1500
                })
                element.style.pointerEvents = 'none';
            } else if (getComputedStyle(element).getPropertyValue("opacity") == 1 && (stone[i][l] == 1 || stone[i][l] == 2) && flag == 2) {
                if ((stone[i][l] == 1 && element.children[1].getAttribute("color") == "black") || (stone[i][l] == 2 && element.children[1].getAttribute("color") == "white")) {
                    element.insertBefore(element.children[1], element.children[0]); //裏表逆転
                    element.children[0].style.backfaceVisibility = 'visible';
                    element.children[1].style.backfaceVisibility = 'hidden';
                    anime({
                        targets: element,
                        opacity: 1,
                        delay: 100,
                        scaleX: [1, 1.3, 1],
                        scaleY: [1, 1.3, 1],
                        rotateY: ["180deg", "0deg"],
                        duration: 1000,
                        easing: 'easeInOutQuad'
                    })
                }
            } else if (getComputedStyle(element).getPropertyValue("opacity") == 1 && ((stone[i][l] == 0 || stone[i][l] == 3) || flag == 1)) {
                element.style.opacity = 0;
            }
            let CanPlace = element.nextElementSibling;
            if (stone[i][l] == 3 && MyColor == turn && flag == 2) {
                anime({
                    targets: CanPlace,
                    opacity: 1,
                    scaleX: [0, 1],
                    scaleY: [0, 1],
                    easing: 'easeInOutExpo',
                    duration: 1000
                })
                element.style.pointerEvents = 'auto';
            } else if (CanPlace.style.opacity == 1) {
                anime({
                    targets: CanPlace,
                    opacity: 0,
                    scaleX: [1, 0],
                    scaleY: [1, 0],
                    easing: 'easeInOutExpo',
                    duration: 1000
                })
            }
        }
    }
}

function JankenBoard() {
    anime({
        targets: document.getElementById("janken-board"),
        backgroundColor: ['#152039', '#3c5ca8'],
        direction: 'alternate',
        duration: 1000,
        easing: 'easeInOutSine',
        complete: () => {
            if (document.getElementsByClassName("janken-result")[1].src == url) JankenBoard();
        }
    })
}


socket.on('socket', (...args) => {      //サーバからの入力
    if (args[0] == "GameStart") {
        anime({
            targets: document.getElementById("select-window"),
            translateY: ['-800px', '-1600px'],
            duration: 4000
        })
        anime({
            targets: document.getElementById("board-window"),
            translateY: ['0px', '-800px'],
            duration: 2000,
            easing: 'easeInOutSine',
        })
        JankenBoard();
        Stone(args[1]);
    } else if (args[0] == "LeavePlayer") {
        alert("対戦相手が切断しました");
        End();
    } else if (args[0] == "Player") {
        for (let i = 0; i <= 3; i++) {
            console.log(args[i + 1])
            document.getElementsByClassName("select-table")[i].textContent = `状態 :${args[i + 1]}/2`

        }
    } else if (args[0] == "JoinuSccess") {
        Room = args[1];
    } else if (args[0] == 'janken-result') {
        const gu = document.getElementsByClassName("janken")[0].src;
        const choki = document.getElementsByClassName("janken")[1].src;
        const pa = document.getElementsByClassName("janken")[2].src;
        const element = document.getElementsByClassName("janken-result");
        if (args[1] == -1) {      //あいこ
            element[0].src = element[1].src;
            element[2].textContent = "あいこ";

            window.setTimeout(function () {
                for (let i = 0; i < 3; i++) {
                    let janken = document.getElementsByClassName("janken")[i];
                    janken.style.pointerEvents = 'auto';
                    janken.style.backgroundColor = "";
                }
                document.getElementsByClassName("janken-result")[0].src = "";
                document.getElementsByClassName("janken-result")[1].src = "";
                JankenBoard();
            }, 5000);
        } else if (args[1] == 1) { //負け
            if (element[1].src == gu) element[0].src = pa;
            if (element[1].src == choki) element[0].src = gu;
            if (element[1].src == pa) element[0].src = choki;
            element[2].textContent = "後手";
            MyColor = args[1]; flag = 2;
            window.setTimeout(Stone, 4500, args[2]);
        } else if (args[1] == 2) { //勝ち
            if (element[1].src == gu) element[0].src = choki;
            if (element[1].src == choki) element[0].src = pa;
            if (element[1].src == pa) element[0].src = gu;
            element[2].textContent = "先手";
            MyColor = args[1]; flag = 2;
            window.setTimeout(Stone, 4500, args[2]);
        }
        anime({
            targets: '.janken-result',
            opacity: 1,
            scaleX: [0, 1],
            scaleY: [0, 1],
            duration: 3000,
            complete: () => {
                anime({
                    targets: '.janken-result',
                    opacity: 0,
                    scaleX: [1, 0],
                    scaleY: [1, 0],
                    duration: 2000,
                    delay: 1500,
                })
            }
        })


    } else if (args[0] == 'turn-change') {
        turn = args[2];
        Stone(args[1]);
    } else if (args[0] == 'ending') {
        if ((args[1] < args[2] && MyColor == 1) || (args[1] > args[2] && MyColor == 2)) alert("負けです");
        if ((args[1] < args[2] && MyColor == 2) || (args[1] > args[2] && MyColor == 1)) alert("勝ちです");
        if (args[1] == args[2]) alert("引き分け");
        End();
    }
});

window.onresize = function () {       //リサイズ時実行
    Resize(1000);
}

function Resize(duration) {
    const target = document.getElementById('main-window');
    const scale = window.innerWidth * 0.7 / 1200;               //ウィンドウサイズの70%のサイズ
    target.animate(
        {
            transform:
                `scale(${scale},${scale})`
        }
        , {
            duration: duration,
            fill: 'forwards'
        });
    target.style.setProperty('margin-left', `${(window.innerWidth - target.clientWidth * scale) / 2}px`);  //横位置を真ん中に
}

window.onload = function () {     //初期実行
    document.querySelectorAll('#main-window *').forEach((value) => {
        let left = parseInt(value.getAttribute("left"));
        let top = parseInt(value.getAttribute("top"));
        if (isNaN(left)) left = 0;
        if (isNaN(top)) top = 0;
        if (left != 0 || top != 0) value.style.transform = `translate(${left}px,${top}px)`;        //初期位置に設置
        ElemntEvent(value);
    });
    anime({
        targets: '.lines path',
        strokeDashoffset: [anime.setDashoffset, 0],
        easing: 'easeInOutSine',
        duration: 1500,
        delay: function (el, i) { return i * 250 },
        fill: {
            value: '#000', delay: 1500, duration: 4000
        },
        complete: () => {
            anime({
                targets: '.othellotitle',
                opacity: {
                    value: 1, delay: 1000, duration: 4000
                },
                rotateZ: '1turn',
                duration: 2000,
            });
            anime({
                targets: '#start-text',
                opacity: [0, 1],
                scaleY: [0, 1],
                duration: 500,
                complete: () => {
                    anime({
                        targets: '#start-text',
                        scaleX: 1.1,
                        loop: true,
                        direction: 'alternate',
                        easing: 'easeInOutQuad'
                    });
                }
            });
        }
    });

    Resize(0);
}