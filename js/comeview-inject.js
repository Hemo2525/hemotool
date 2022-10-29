/*---------------------------------------
　コメビュ機能
----------------------------------------*/
  
// WebSocketのProxyを作成
WebSocket = new Proxy(WebSocket, {
    construct: function (target, args) {
      // create WebSocket instance
      const instance = new target(...args);
      const messageHandler = (event) => { recvEvent(event); };
      instance.addEventListener('message', messageHandler);
      return instance;
    }
});

// 現在の再生時間(秒数)を取得
function getStartPlayTime() {
  var currentPlayPos;
  var posArray;
  var hour;
  var minits;
  var second;
  var totalSec;

  if(document.querySelectorAll('[class^=___time-score___] [class^=___value___]')
    && document.querySelectorAll('[class^=___time-score___] [class^=___value___]')[0])
  {
    currentPlayPos = document.querySelectorAll('[class^=___time-score___] [class^=___value___]')[0].textContent;
    posArray = currentPlayPos.split(':');

    if(posArray.length == 2) {
      // 分:秒　だけの場合

      if(posArray[0] === "00" && posArray[1] === "00") {
        // ニコ生プレイヤーの読み込み中で正確な時間が取得できないケースはundefinedにしておく
        totalSec = undefined;
      } else {
        minits = posArray[0] * 60;
        second = posArray[1];
        totalSec = minits + second;  
      }

      //console.log(posArray);

    } else if(posArray.length == 3) {
      // 時間:分:秒　の場合
      hour = Number(posArray[0]) * 60 * 60;
      minits = posArray[1] * 60;
      second = posArray[2];
      totalSec = hour + minits + second;

      //console.log(posArray);

    } else {
      //console.log("ここにはこないはず");
    }
  }
  return totalSec;
}

var _startTime;

var _commentList = {};      // KEY:コメント番号, VALUE:対応するユーザー名(最大7文字)
var _commentListFull = {};  // KEY:コメント番号, VALUE:対応するユーザー名(フルネーム)
var _183UserList = {};      // KEY:コメント番号, VALUE:184ユーザーID
var _newUserList = {};      // KEY:コメント番号, VALUE:初めて書き込むユーザーID 
var _rawUserList = {};      // KEY:ユーザーID,   VALUE:GETしてきたユーザー名(最大7文字)
var _rawUserListFull = {};  // KEY:ユーザーID,   VALUE:GETしてきたユーザー名(フルネーム)
var _gettingList = {};      // KEY:ユーザーID,   VALUE:何でもいい値


// WebSocketの受信イベントハンドラ
function recvEvent(event) {

  // 受信メッセージをJSON形式にパース
  var message = "";
  try {
    message = JSON.parse(event.data);
  } catch (err) {
    return;
  }

  // chatメッセージのみ解析
  if (message.chat) {

    if(_startTime === undefined || isNaN(_startTime)){
      _startTime = getStartPlayTime();
      console.log("再生開始秒数(vpos) : " + _startTime);
    }



    // ブラウザにWeb Speech API Speech Synthesis機能があるか判定
    if ('speechSynthesis' in window) {

      // 再生開始時
      if (_startTime !== undefined && message.chat.vpos > _startTime) {

        console.log(message);

        let yomiage_text = message.chat.content;

        if (message.chat.content.startsWith('/nicoad', 0)) {
          // 広告
          // 例 →　/nicoad {"version":"1","totalAdPoint":32000,"message":"【広告貢献3位】もぴ太郎さんが100ptニコニ広告しました"}
          const content = message.chat.content;
          const pos = content.indexOf('{');
          const obj = JSON.parse(content.substr(pos));
          yomiage_text = obj.message;
        }

        if (message.chat.content.startsWith('/gift', 0)) {
          // ギフト
          // 例 →　/gift flowerstandmsg 36777535 "げすと" 5000 "お誕生日おめでとう" "フラワースタンド" 1
          let content = message.chat.content;
          content = content.split(' ');
          if (content.length >= 3) {
            yomiage_text = content[3] + "さんが" + content[4] + "ptギフトしました";
          }
        }

        if (message.chat.content.startsWith('/spi', 0)) {
          // ゲームリクエスト
          // 例 →　/spi "「ナンプレ」がリクエストされました"
          let content = message.chat.content;
          const pos = content.indexOf(' ');
          yomiage_text = content.substr(pos);
        }

        if (message.chat.content.startsWith('/info', 0)) {
          // インフォ
          // 例 →　/info 10 放送者のサポーターが1人来場しました
          //       /info 10 ニコニ広告枠から1人が来場しました
          let content = message.chat.content;
          const pos = content.indexOf(' ', content.indexOf(' ') + 1); // ２つ目の半角スペースの位置を探す
          yomiage_text = content.substr(pos);
        }

        if (message.chat.content.startsWith('/emotion', 0)) {
          // エモーション
          // 例 →　/emotion ちいさい秋
          let content = message.chat.content;
          const pos = content.indexOf(' ');
          yomiage_text = content.substr(pos);
        }


        // 発言を設定
        const uttr = new SpeechSynthesisUtterance();
        uttr.rate = 6; // 速度　min 0.1～ max 10.0
        uttr.volume = 1.0; // 音量 min 0 ~ max 1
        uttr.text = yomiage_text;
        // 発言を再生
        window.speechSynthesis.speak(uttr);

        console.log("読み上げます → [" + message.chat.no + "] " + yomiage_text);
      } else {
        console.log('message.chat.vpos: ' + message.chat.vpos + ', _startTime: ' + _startTime);
      }


    } else {
      console.log('大変申し訳ありません。このブラウザは音声合成に対応していません。')
    }



















    //console.log(message.chat);

    console.log(message.chat.no + ", " + message.chat.content + ", " + message.chat.user_id);

    if (isNaN(message.chat.user_id)) {
      // 184さんの処理
      _commentList[message.chat.no] = message.chat.user_id.substring(0, 4) + "･･";
      _commentListFull[message.chat.no] = message.chat.user_id;
      _183UserList[message.chat.no] = message.chat.user_id;

    } else {
      // 生IDさんの処理

      // すでに名前を取得ずみであれば名前を取得しない
      if (_rawUserList[message.chat.user_id]) {
        _commentList[message.chat.no] = _rawUserList[message.chat.user_id];
        _commentListFull[message.chat.no] = _rawUserListFull[message.chat.user_id];
        return;
      } else {
        // 仮でユーザーIDをいれておく
        _commentList[message.chat.no] = message.chat.user_id;
        _commentListFull[message.chat.no] = message.chat.user_id;
      }

      // 取得中のユーザーIDなら取得せず終わる
      if(_gettingList[message.chat.user_id]) {
        return;
      } else {
        _gettingList[message.chat.user_id] = true;
      }

      //console.log("★★ " + message.chat.user_id+ " は新しいユーザーIDです。名前を取得にいきます。");

      var request = new XMLHttpRequest();
      var getURL = "https://www.nicovideo.jp/user/" + message.chat.user_id + "/video?rss=2.0";
      request.open('GET', getURL);
      request.send();
      request.addEventListener("load", function () {

        if (request.responseXML) {
          var xmlDom = request.responseXML.documentElement;
          var userNameFull = xmlDom.getElementsByTagName("dc:creator")[0].innerHTML;
          var userName = userNameFull;
          // 8文字より長い場合は省略
          if(userName.length > 7) {
            userName = userName.substring(0, 7) + "･･";
          }

          _rawUserList[message.chat.user_id] = userName;
          _rawUserListFull[message.chat.user_id] = userNameFull;

          //console.log(`★★ ${message.chat.no} コメは ${userName} に設定`);

          // 過去のコメントの名前を置き換える
          for (let key in _commentList) {
            if(_commentList[key] == message.chat.user_id) {
              _commentList[key] = userName;
            }
          }
          // 過去のコメントの名前を置き換える
          for (let key in _commentListFull) {
            if(_commentListFull[key] == message.chat.user_id) {
              _commentListFull[key] = userNameFull;
            }
          }

          var currentCommentList = document.querySelectorAll('.user_name_by_extention:not(.user184)');
          for(var i = 0 ; i < currentCommentList.length ; i++){
            if(currentCommentList[i].innerText == message.chat.user_id){
              currentCommentList[i].innerText = userName ;
              currentCommentList[i].setAttribute("title", userNameFull);
            }
          }


        } else {
          //console.log("名前をGETできませんでした。");
        }

      }, false);
    }


  }

}

function InsertUserName(currentNode, newNo) {
    // 追加する名前のDOMを作成
    var newElement = document.createElement("span");
    var newContent = document.createTextNode(_commentList[newNo]);
    newElement.appendChild(newContent);
    if (_183UserList[newNo]) {
      newElement.setAttribute("class", "user_name_by_extention user184");
    } else {
      newElement.setAttribute("class", "user_name_by_extention");
    }
    newElement.setAttribute("title", _commentListFull[newNo]);

    // 作成したDOMの挿入
    //var comment = currentNode.querySelector(".___comment-text___1pM9h"); // コメントテキストのDOM
    var comment = currentNode.querySelector("[class^=___comment-text___]"); // コメントテキストのDOM
    comment.parentNode.insertBefore(newElement, comment);
}

function watchCommentDOM(mutationsList, observer) {

  for (const mutation of mutationsList) {

    for(var i = 0 ; i < mutation.target.childNodes.length ; i++ ){
      var currentNode = mutation.target.childNodes[i];
      //if(currentNode.querySelector('.___comment-number___i8gp1')){ // コメント番号のDOM
      if(currentNode.querySelector("[class^=___comment-number___]")){ // コメント番号のDOM
        //var newNo = currentNode.querySelector('.___comment-number___i8gp1').outerText;
        var newNo = currentNode.querySelector("[class^=___comment-number___]").outerText;

        if (newNo.length > 0 && !currentNode.querySelector(".user_name_by_extention")) {

          if (_commentList[newNo]) {

            InsertUserName(currentNode, newNo);
  

          } else {
            //console.log(`${newNo} に対応する名前がありません。取得失敗さんにします。`);
            _commentList[newNo] = "取得失敗";
            InsertUserName(currentNode, newNo);
          }
  
        }        
      }
      // コメントに行送りを対応させるためクラスを付与
      //currentNode.classList.add('wordbreak');
      if(currentNode.querySelector("[class^=___comment-text___]").clientHeight > 28){
        //console.log("YES  " + currentNode.querySelector("[class^=___comment-text___]").textContent + "  " + currentNode.querySelector("[class^=___comment-text___]").clientHeight);
        currentNode.querySelector("[class^=___comment-text___]").classList.add('multiple-line');
      } else {
        //console.log("NO  " + currentNode.querySelector("[class^=___comment-text___]").textContent + "  " + currentNode.querySelector("[class^=___comment-text___]").clientHeight);
        currentNode.querySelector("[class^=___comment-text___]").classList.add('one-line');
      }
    }

  } 
}


//監視オプション
const options = {
  childList:              true,  //直接の子の変更を監視
  characterData:          true,  //文字の変化を監視
  characterDataOldValue:  false, //属性の変化前を記録
  attributes:             true,  //属性の変化を監視
  subtree:                false, //全ての子要素を監視
}

function startWathCommentDOM(){
  //const target = document.querySelector(".___table___2e1QA"); // コメントDOMの直上の親DOMを指定
  const target = document.querySelector("[class^=___table___]"); // コメントDOMの直上の親DOMを指定
  if(target){
    const obs = new MutationObserver(watchCommentDOM);
    obs.observe(target, options);  
    // 監視をスタートしたら直後に再描画させる
    var now = new Date();
    target.setAttribute("byExtention", now.getSeconds());
  }
}

function watchParentDOM(mutationsList, observer) {
  // コメントDOMの監視を開始
  startWathCommentDOM();
}

window.addEventListener('load', function() {

  // コメントDOMの監視を開始
  startWathCommentDOM();

  // コメントDOMの親DOMの監視を開始(フルスクリーン解除時、放送ネタ画面の表示時に対応するため)
  //const target_parent = document.querySelector(".___contents-area___wNY_j"); // コメントDOMの大元の親DOMを指定
  const target_parent = document.querySelector("[class^=___contents-area___]"); // コメントDOMの大元の親DOMを指定
  if(target_parent){
    const obs = new MutationObserver(watchParentDOM);
    obs.observe(target_parent, options);  
  }

});

