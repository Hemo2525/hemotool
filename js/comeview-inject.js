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
  var totalSec = undefined;

  if (document.querySelectorAll('[class^=___time-score___] [class^=___value___]')
    && document.querySelectorAll('[class^=___time-score___] [class^=___value___]')[0]) {
    currentPlayPos = document.querySelectorAll('[class^=___time-score___] [class^=___value___]')[0].textContent;
    posArray = currentPlayPos.split(':');

    if (posArray.length == 2) {
      // 分:秒　だけの場合

      if (posArray[0] === "00" && posArray[1] === "00") {
        // ニコ生プレイヤーの読み込み中で正確な時間が取得できないケースはundefinedにしておく
        totalSec = undefined;
      } else {
        minits = Number(posArray[0]) * 60;
        second = Number(posArray[1]);
        totalSec = (minits + second) * 100; // 秒単位から10ミリ秒単位に変換
      }

      //console.log(posArray);

    } else if (posArray.length == 3) {
      // 時間:分:秒　の場合
      hour = Number(posArray[0]) * 60 * 60;
      minits = Number(posArray[1]) * 60;
      second = Number(posArray[2]);
      totalSec = (hour + minits + second) * 100; // 秒単位から10ミリ秒に変換

      //console.log(posArray);

    } else {
      console.log("ここにはこないはず");
    }
  }
  return totalSec;
}

var _startTime;
var _currentVoiceName = "";

var _commentList = {};      // KEY:コメント番号, VALUE:対応するユーザー名(最大7文字)（184さんなら省略型のハッシュ値、生IDさんなら省略形のユーザー名）
var _commentListFull = {};  // KEY:コメント番号, VALUE:対応するユーザー名(フルネーム)（184さんならFullハッシュ値、生IDさんならFullユーザー名）
var _183UserList = {};      // KEY:コメント番号, VALUE:184ユーザーID
var _newUserList = {};      // KEY:コメント番号, VALUE:初めて書き込むユーザーID 
var _premiumList = {};      // KEY:コメント番号, VALUE:何でもいい値
var _rawUserList = {};      // KEY:ユーザーID,   VALUE:GETしてきたユーザー名(最大7文字)
var _rawUserListFull = {};  // KEY:ユーザーID,   VALUE:GETしてきたユーザー名(フルネーム)
var _gettingList = {};      // KEY:ユーザーID,   VALUE:何でもいい値

var _commentRawIdList = {}; // KEY:コメント番号   VALUE:ユーザーID（184さんならハッシュ値、生IDさんなら生IDが入る）
var _kotehanList = [];      // KEY:ユーザーID,    VALUE:コテハン



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


    /*--------------------------------------------------------------
    //  読み上げ処理
    --------------------------------------------------------------*/
    if (_startTime === undefined || isNaN(_startTime)) {
      //_startTime = getStartPlayTime();
      //console.log("再生開始ミリ秒数(vpos) : " + _startTime);
    }

    if (_startTime !== undefined && (Number(message.chat.vpos) + (10 * 100)) > _startTime) {  // startTimeは常に更新してるので10秒の足を履かせる(vposは10ミリ秒単位なので+100すると1秒プラスと同じ)
    //if (_startTime !== undefined){
      
      //console.log(message);

      let yomiage_text = message.chat.content.toLowerCase();
      let isSystemComment = false;
      
      if (message.chat.content.startsWith('/gift', 0)) {
        isSystemComment = true;
        if (document.querySelector('.ext-yomiage .option.gift input').checked ){
          // ギフト
          // 例 →　/gift flowerstandmsg 36777535 "げすと" 5000 "お誕生日おめでとう" "フラワースタンド" 1
          let content = message.chat.content;
          content = content.split(' ');
          if (content.length >= 3) {
            yomiage_text = content[3] + "さんが" + content[4] + "ptギフトしました";
          }
        } else {
          yomiage_text = "";
        }
      }
     
      if (message.chat.content.startsWith('/nicoad', 0)) {
        isSystemComment = true;
        if (document.querySelector('.ext-yomiage .option.koukoku input').checked ){
          // 広告
          // 例 →　/nicoad {"version":"1","totalAdPoint":32000,"message":"【広告貢献3位】もぴ太郎さんが100ptニコニ広告しました"}
          const content = message.chat.content;
          const pos = content.indexOf('{');
          const obj = JSON.parse(content.substr(pos));
          yomiage_text = obj.message;
        } else {
          yomiage_text = "";
        }
      }
      
      if (message.chat.content.startsWith('/info', 0)) {
        isSystemComment = true;
        if (document.querySelector('.ext-yomiage .option.raijosya input').checked ){
          // インフォ
          // 例 →　/info 10 放送者のサポーターが1人来場しました
          //       /info 10 ニコニ広告枠から1人が来場しました
          //       /info 8 第16位にランクインしました
          let content = message.chat.content;
          const pos = content.indexOf(' ', content.indexOf(' ') + 1); // ２つ目の半角スペースの位置を探す
          yomiage_text = content.substr(pos);
        } else {
          yomiage_text = "";
        }
      }

      if (message.chat.content.startsWith('/spi', 0)) {
        isSystemComment = true;
        if (document.querySelector('.ext-yomiage .option.request input').checked ){
          // ゲームリクエスト
          // 例 →　/spi "「ナンプレ」がリクエストされました"
          let content = message.chat.content;
          const pos = content.indexOf(' ');
          yomiage_text = content.substr(pos);
        } else {
          yomiage_text = "";
        }
      }

      if (message.chat.content.startsWith('/emotion', 0)) {
        isSystemComment = true;
        if (document.querySelector('.ext-yomiage .option.emotion input').checked ){
          // エモーション
          // 例 →　/emotion ちいさい秋
          let content = message.chat.content;
          const pos = content.indexOf(' ');
          yomiage_text = content.substr(pos);
        } else {
          yomiage_text = "";
        }
      }

      yomiage_text = yomiage_text.replace(/youtuber/g, 'ユーチューバー');
      yomiage_text = yomiage_text.replace(/youtube/g, 'ユーチューブ');
      yomiage_text = yomiage_text.replace(/twitch/g, 'ツイッチ');
      yomiage_text = yomiage_text.replace(/wwww/g, 'ワラワラ');
      yomiage_text = yomiage_text.replace(/ww/g, 'ワラワラ');
      yomiage_text = yomiage_text.replace(/w/g, 'ワラ');
      yomiage_text = yomiage_text.replace(/ｗｗｗ/g, 'ワラワラ');
      yomiage_text = yomiage_text.replace(/ｗｗ/g, 'ワラワラ');
      yomiage_text = yomiage_text.replace(/ｗ/g, 'ワラ');
      yomiage_text = yomiage_text.replace(/8888/g, 'ぱちぱちぱち');
      yomiage_text = yomiage_text.replace(/888/g, 'ぱちぱちぱち');
      yomiage_text = yomiage_text.replace(/88/g, 'ぱちぱち');
      yomiage_text = yomiage_text.replace(/８８８８/g, 'ぱちぱちぱち');
      yomiage_text = yomiage_text.replace(/８８８/g, 'ぱちぱちぱち');
      yomiage_text = yomiage_text.replace(/８８/g, 'ぱちぱち');
      yomiage_text = yomiage_text.replace(/・/g, '');  // 「なかぐろ」と読み上げられる為

      if ( yomiage_text.match(/http/)) yomiage_text = "URL省略";
      


      // オプションの省略機能が有効ならば
      if (yomiage_text.length > 0 && document.querySelector('.ext-yomiage .option.syoryaku input').value ){
        let syouryaku = document.querySelector('.ext-yomiage .option.syoryaku input').value;
        if(!isNaN(syouryaku) && syouryaku > 0) {
          if(yomiage_text.length >= syouryaku) {
            yomiage_text = yomiage_text.substr( 0, syouryaku );
            yomiage_text += "、以下略";
          }
        }
      }





      // オプションの名前の読み上げ機能がONならば
      if (isSystemComment === false && document.querySelector('.ext-yomiage .option.nameyomiage input').checked ){
        if (message.chat && message.chat.user_id && isNaN(message.chat.user_id)) {
          // 184さんの処理
          // yomiage_text += "　イヤヨ";
        } else if(_rawUserListFull[message.chat.user_id]){
          yomiage_text += "、" + _rawUserListFull[message.chat.user_id];
        }
      }

      // 読み上げ機能がONならば
      if(document.querySelector('.ext-setting-menu .ext-yomiage').getAttribute("ext-attr-on")) {
        
        // 読み上げ用のDOMに読み上げテキストを挿入（結果、読み上げられる）
        if(yomiage_text.length > 0 && document.getElementById("ext_logBox")){
          //console.log("正常系：comeview-inject.js : " + yomiage_text);
          var newYomiCommentDom = document.createElement('p');
          var newYomiCommentText = document.createTextNode(yomiage_text);
          newYomiCommentDom.appendChild(newYomiCommentText);
          document.getElementById("ext_logBox").appendChild(newYomiCommentDom);
        } else {
          //console.error("異常系：comeview-inject.js : " + yomiage_text);
        }

      }

      //console.log("読み上げます → [" + message.chat.no + "] " + yomiage_text);
    } else {
      /*
      console.log('message.chat.vpos: ' + message.chat.vpos + ', _startTime: ' + _startTime);
      console.error('読み上げスキップしてる');
      */
    }


    /*--------------------------------------------------------------
    //  コテハン処理
    --------------------------------------------------------------*/
    let kotehanAt = message.chat.content.indexOf('@');
    if(kotehanAt === -1){
      kotehanAt = message.chat.content.indexOf('＠');
    }
    if(kotehanAt !== -1){
      let kotehan = message.chat.content.substring(kotehanAt + 1); // ＠の次の文字から後ろを抽出
      if(kotehan && kotehan.length > 0) {
        kotehan = kotehan.substr( 0, 16 ); // 最大16文字(公式の仕様にあわせる)
        let kotehanItem = {id: message.chat.user_id, kotehan: kotehan};
        // 既に同じIDの人が登録されていれば削除してから追加
        _kotehanList = _kotehanList.filter(function (x) { return x.id !== message.chat.user_id }); // 削除
        _kotehanList.push(kotehanItem); // 追加

        // コテハン保存用のDOMにコテハンをテキストを挿入（結果、読み上げられる）
        let kotehanBox = document.getElementById("ext_kotehanBox");
        if(kotehanBox) {
          let item = { id : message.chat.user_id, kotehan : kotehan};
          var newYomiCommentDom = document.createElement('p');
          var newYomiCommentText = document.createTextNode(JSON.stringify(item));
          newYomiCommentDom.appendChild(newYomiCommentText);
          kotehanBox.appendChild(newYomiCommentDom);
        }
      }
    }



    /*--------------------------------------------------------------
    //  プレ垢処理
    --------------------------------------------------------------*/
    // プレ垢の判定
    if (message.chat && message.chat.no && message.chat.premium && message.chat.premium === 1) {
      _premiumList[message.chat.no] = true;
    }


    /*--------------------------------------------------------------
    //  ユーザー名の取得処理
    --------------------------------------------------------------*/
    //console.log(message.chat);
    //console.log(message.chat.no + ", " + message.chat.content + ", " + message.chat.user_id);

    if (isNaN(message.chat.user_id)) {
      // 184さんの処理----------------------------


      _commentRawIdList[message.chat.no]  = message.chat.user_id;
      _commentList[message.chat.no]       = message.chat.user_id.substring(0, 4) + "･･";
      _commentListFull[message.chat.no]   = message.chat.user_id;
      _183UserList[message.chat.no]       = message.chat.user_id;
      


    } else {
      // 生IDさんの処理----------------------------
      _commentRawIdList[message.chat.no] = message.chat.user_id;

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
      if (_gettingList[message.chat.user_id]) {
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
          if (userName.length > 7) {
            userName = userName.substring(0, 7) + "･･";
          }

          _rawUserList[message.chat.user_id] = userName;
          _rawUserListFull[message.chat.user_id] = userNameFull;

          //console.log(`★★ ${message.chat.no} コメは ${userName} に設定`);

          // 過去のコメントの名前を置き換える
          for (let key in _commentList) {
            if (_commentList[key] == message.chat.user_id) {
              _commentList[key] = userName;
            }
          }
          // 過去のコメントの名前を置き換える
          for (let key in _commentListFull) {
            if (_commentListFull[key] == message.chat.user_id) {
              _commentListFull[key] = userNameFull;
            }
          }

          var currentCommentList = document.querySelectorAll('.user_name_by_extention:not(.user184)');
          for (var i = 0; i < currentCommentList.length; i++) {
            if (currentCommentList[i].innerText == message.chat.user_id) {
              currentCommentList[i].innerText = userName;
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

function InsertUserName(fragment, newNo) {

  // 追加するアイコンのDOMを作成
  var iconElement = document.createElement("div");
  let hoverElement = document.createElement("div");

  if (_183UserList[newNo]) {
    // 184さんの処理----------------------------
    iconElement.setAttribute("class", "user_icon_by_extention");
    iconElement.setAttribute("style", "background-image: url(https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank.jpg);");

    hoverElement.setAttribute("class", "user_iconHover_by_extention");
    hoverElement.setAttribute("style", "background-image: url(https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank.jpg);");

  } else {
    // 生IDさんの処理----------------------------
    let userId = _commentRawIdList[newNo];
    let iconPath = 0;
    if(userId.length > 4) {
      iconPath = userId.substring(0, userId.length - 4);
    } else {
      iconPath = "0";
    }

    iconElement.setAttribute("class", "user_icon_by_extention");
    iconElement.setAttribute("style", "background-image: url(https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/" + iconPath + "/" + userId + ".jpg), url(https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank.jpg);");

    hoverElement.setAttribute("class", "user_iconHover_by_extention");
    hoverElement.setAttribute("style", "background-image: url(https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/" + iconPath + "/" + userId + ".jpg), url(https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank.jpg);");
  }

  iconElement.appendChild(hoverElement);

  // 作成したDOMの挿入
  fragment.appendChild(iconElement);

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
  fragment.appendChild(newElement);


  //console.log(_kotehanList);
  //console.log(_commentListFull);
  //console.log(_commentRawIdList);

  let currentNoId = _commentRawIdList[newNo];
  //console.log(currentNoId);

  var kotehanElement = document.createElement("span");
  var kotehanContent = "";
  var kotehan = "";

  let hitKotehan = _kotehanList.filter(function (x) { return x.id == currentNoId });
  //console.log("hitKotehanは下記");
  //console.log(hitKotehan);

  if(hitKotehan[0]){

    // コテハンがHITした場合---------------

    let kotehanFull = hitKotehan[0].kotehan;
    let kotehan     = hitKotehan[0].kotehan;
    

    // 8文字より長い場合は省略
    if (kotehan.length > 7) {
      kotehan = kotehan.substring(0, 7) + "･･";
    }

    //kotehan = _kotehanList[currentNoId];
    //kotehan = hitKotehan[0].kotehan;
    kotehanElement.setAttribute("class", "user_name_by_extention viewKotehan kotehan");

    kotehanContent = document.createTextNode(kotehan);
    kotehanElement.appendChild(kotehanContent);
    kotehanElement.setAttribute("title", kotehanFull);

  } else {

    // コテハンがHITしなかった場合---------

    let userName = _commentList[newNo];
    let fullUserName = _commentListFull[newNo];
    
    kotehan = _commentList[newNo]
    if (_183UserList[newNo]) {
      kotehanElement.setAttribute("class", "user_name_by_extention viewKotehan user184");
    } else {
      kotehanElement.setAttribute("class", "user_name_by_extention viewKotehan");
    }

    kotehanContent = document.createTextNode(kotehan);
    kotehanElement.appendChild(kotehanContent);  
    kotehanElement.setAttribute("title", fullUserName);

  }


  // 作成したDOMの挿入
  fragment.appendChild(kotehanElement);
  
  return fragment;
}


function InsertPremium(fragment) {
  // 追加するDOMを作成
  var newElement = document.createElement("span");
  var newContent = document.createTextNode("P");
  newElement.appendChild(newContent);
  newElement.setAttribute("class", "premium_by_extention");
  newElement.setAttribute("title", "プレミアムアカウント");

  // 作成したDOMの挿入
  fragment.appendChild(newElement);

  return fragment;
}

let _AddedNode = false;
let _bWhieelUp = false;
let _bIsMostBottom = false;

/*
document.querySelector("[class^=___comment-panel___] [class^=___body___]").addEventListener('wheel', function (e) {
  if(e.wheelDelta > 0) {
    //上スクロール
    _bWhieelUp = true;
  }
});
*/

let lastScrollPosition = 0;


function watchCommentDOM(mutationsList, observer) {

  let chatDom = document.querySelector("[class^=___comment-panel___] [class^=___body___]");

  // 現在のスクロールが一番下かどうか判定
  const clientHeight = chatDom.clientHeight;
  const scrollHeight = chatDom.scrollHeight;
  const scrollTop = chatDom.scrollTop;

  // 一番下までスクロールされたか判定
  if (Math.abs(scrollHeight - clientHeight - scrollTop) < 1) {
    // いちばんしたまでスクロールされている
    _bIsMostBottom = true;
    _bWhieelUp = false;
  }
    
  for (const mutation of mutationsList) {

    if(mutation.type === "childList"){

      //console.log(mutation);

      if(_AddedNode === false){
        for (var i = 0; i < mutation.target.childNodes.length; i++) {
          var currentNode = mutation.target.childNodes[i];
          editComment(currentNode);
        }
        chatDom.scrollTop = scrollTop;
      }

      mutation.addedNodes.forEach((currentNode) => {
        
        _AddedNode = true;

        editComment(currentNode);

      });


      
      if(_bIsMostBottom === false || _bWhieelUp === true){

      } else {
        // 最下部にスクロール
        chatDom.scrollTop = scrollHeight;
      }

    }

  }
}

function editComment(currentNode) {

  if (currentNode.querySelector("[class^=___comment-number___]")) { // コメント番号のDOM
    //var newNo = currentNode.querySelector('.___comment-number___i8gp1').outerText;
    var newNo = currentNode.querySelector("[class^=___comment-number___]").outerText;

    if (newNo.length > 0 && !currentNode.querySelector(".user_name_by_extention")) {

      // フラグメント作成
      let fragment = document.createDocumentFragment();

      // プレ垢のDOMを挿入
      if (_premiumList[newNo] === true) {
        fragment = InsertPremium(fragment);
      }

      // 名前のDOMを挿入
      if (_commentList[newNo]) {

        fragment = InsertUserName(fragment, newNo);

      } else {
        //console.log(`${newNo} に対応する名前がありません。取得失敗さんにします。`);
        _commentList[newNo] = "取得失敗";
        fragment = InsertUserName(fragment, newNo);
      }

      // フラグメントを実DOMに挿入
      let comment = currentNode.querySelector("[class^=___comment-text___]"); // コメントテキストのDOM
      comment.parentNode.insertBefore(fragment, comment);
    }
  }

  // コメントに行送りを対応させるためクラスを付与
  //currentNode.classList.add('wordbreak');
  if (currentNode.querySelector("[class^=___comment-text___]").clientHeight > 28) {
    //console.log("YES  " + currentNode.querySelector("[class^=___comment-text___]").textContent + "  " + currentNode.querySelector("[class^=___comment-text___]").clientHeight);
    currentNode.querySelector("[class^=___comment-text___]").classList.add('multiple-line');
  } else {
    //console.log("NO  " + currentNode.querySelector("[class^=___comment-text___]").textContent + "  " + currentNode.querySelector("[class^=___comment-text___]").clientHeight);
    currentNode.querySelector("[class^=___comment-text___]").classList.add('one-line');
  }  
}


//監視オプション
const options = {
  childList: true,  //直接の子の変更を監視
  characterData: true,  //文字の変化を監視
  characterDataOldValue: false, //属性の変化前を記録
  attributes: true,  //属性の変化を監視
  subtree: false, //全ての子要素を監視
}

function startWatchCommentDOM() {

  startWatchGridDOM();

  // ギフト画面を表示 → ギフト画面を非表示　をした場合にここでイベントを再設定できるようにしておく
  let commentBox = document.querySelector("[class^=___comment-panel___] [class^=___body___]");
  if(commentBox) {
    commentBox.addEventListener('scroll', function (e) {
      const currentScrollPosition = e.target.scrollTop;
      if (currentScrollPosition < lastScrollPosition) {
        _bWhieelUp = true;
      }
      lastScrollPosition = currentScrollPosition;
    });  
  }
  // ギフト画面を表示 → ギフト画面を非表示　をした場合には既存のコメントは裸のままになるのでここでeditComment()しておく
  const tableDom = document.querySelector("[class^=___table___]"); // コメントDOMの直上の親DOMを指定
  if (tableDom) {
    tableDom.childNodes.forEach((currentNode)=>{   

      editComment(currentNode);

    });
  }



  const target = document.querySelector("[class^=___table___]"); // コメントDOMの直上の親DOMを指定
  if (target) {
    const obs = new MutationObserver(watchCommentDOM);
    obs.observe(target, options);
    // 監視をスタートしたら直後に再描画させる
    var now = new Date();
    target.setAttribute("byExtention", now.getSeconds());
  }
}

function watchParentDOM(mutationsList, observer) {
  // コメントDOMの監視を開始
  startWatchCommentDOM();
}

//監視オプション
const optionsForGrid = {
  childList: true,  //直接の子の変更を監視
  characterData: false,  //文字の変化を監視
  characterDataOldValue: false, //属性の変化前を記録
  attributes: false,  //属性の変化を監視
  subtree: false, //全ての子要素を監視
}

function startWatchGridDOM() {
  const target = document.querySelector("[class^=___comment-data-grid___]");
  if (target) {
    const obs = new MutationObserver(function(){
      if(document.querySelector("[class^=___indicator___]")) {
        
        document.querySelector("[class^=___indicator___]").addEventListener('click', function (e) {

          let chatDom = document.querySelector("[class^=___comment-panel___] [class^=___body___]");
          const scrollHeight = chatDom.scrollHeight;
          window.requestAnimationFrame(() => {
            chatDom.scrollTop = scrollHeight;
          });
          //chatDom.scrollTop = scrollHeight;
        });  
      }
    });
    obs.observe(target, optionsForGrid);
  }
}


window.addEventListener('load', function () {
  
  

  // コメントDOMの監視を開始
  startWatchCommentDOM();

  // コメントDOMの親DOMの監視を開始(フルスクリーン解除時、放送ネタ画面の表示時に対応するため)
  const target_parent = document.querySelector("[class^=___contents-area___]"); // コメントDOMの大元の親DOMを指定
  if (target_parent) {
    const obs = new MutationObserver(watchParentDOM);
    obs.observe(target_parent, options);
  }

  // 拡張機能の初期化処理
  initialize(function (ret) {

    if (ret) {

      const logOption = {
        childList: true,  //直接の子の変更を監視
        characterData: true,  //文字の変化を監視
        attributes: true,  //属性の変化を監視
        subtree: true, //全ての子要素を監視
      };
      const targetTimeDom = document.querySelector("[class^=___time-score___] span");
      const obsTimeBox = new MutationObserver(watchTime);
      obsTimeBox.observe(targetTimeDom, logOption);

      /*
      const targetKotehanDom = document.querySelector("#ext_kotehanToInjectBox");
      console.log(targetKotehanDom);
      const obsKotehanBox = new MutationObserver(watchKotehan);
      obsKotehanBox.observe(targetKotehanDom, logOption);
      */

      const kotehanJson = document.querySelector("#ext_kotehanToInjectBox p");
      if(kotehanJson && kotehanJson.outerText){
        _kotehanList = JSON.parse(kotehanJson.outerText);
        console.log("▼inject側で受け取ったコテハン2");
        console.log(_kotehanList);  
      }

    }

  }, 6000 * 10 * 5); // 5分




});

function watchTime(mutationRecords, observer){ 
  // 一度に2つ以上のDOM追加にも対応
  mutationRecords.forEach(item => {
      _startTime = getStartPlayTime();
      //console.log("再生してから現在までの時間(10ミリ秒単位) : " + _startTime);
  });
};

function watchKotehan(mutationRecords, observer){ 

  // 初回に一度だけ受信する用

  console.log("コテハン検知");

  // 一度に2つ以上のDOM追加にも対応
  mutationRecords.forEach(item => {
    //console.log(item.addedNodes[0].outerText);
    _kotehanList = JSON.parse(item.addedNodes[0].outerText);
    console.log("▼inject側で受け取ったコテハン");
    console.log(_kotehanList);
  });

};

function initialize(callback, timeoutMiliSec) {

  let domList = [
      "[class^=___time-score___] span[class^=___value___]",
      "#ext_kotehanToInjectBox"
  ];

  const startMiliSec= Date.now();
  searchDoms();

  function searchDoms() {

      let bFindAllDom = true;
      for(const selector of domList) {
          if(!document.querySelector(selector)){
              console.log(selector + " が存在しません。待機します。");
              bFindAllDom = false;
              break;
          }
      }

      if (bFindAllDom) {
          callback(true);
          return;
      } else {
          setTimeout(() => {
              if (Date.now() - startMiliSec >= timeoutMiliSec) {
                  callback(false);
                  return;
              }
              searchDoms();
          }, 100);
      }
  }
}