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

/**
 * 指定されたユーザーIDのコメントを\nで連結した文字列を取得する
 * @param {string} userId ユーザーID
 * @returns {string} 指定されたユーザーIDのコメントを\nで連結した文字列
 */
function getCommentsStringByUserId(userId, commentNo) {
  // ユーザーIDが一致するコメントを抽出し、コメント番号の降順でソートする
  const userComments = _allComment
                          .filter(item => item.user_id === userId)  // 特定のユーザーIDで抽出
                          .filter(item => item.no <= commentNo);     // マウスカーソルが乗ったコメント番号以前のものを抽出
                          //.sort((a, b) => a.no - b.no);

  // 最新のコメントを末尾から最大10件取得する
  const latestComments = userComments.slice(-10).map(comment => ({ ...comment }));

  for (const key in latestComments) {
    const comment = latestComments[key];
    // const totalSeconds = Math.floor(comment.vpos / 100);
    // const hours = Math.floor(totalSeconds / 3600);
    // const minutes = Math.floor((totalSeconds % 3600) / 60);
    // const seconds = totalSeconds % 60;
    // const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    // latestComments[key].comment = formattedTime + " " + latestComments[key].comment;

    latestComments[key].comment = comment.no + "　　" + latestComments[key].comment;
  }

  // コメントの文字列を抽出し、\nで連結する
  return latestComments.map(item => item.comment).join("\n");
}

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

// var _commentList = {};      // KEY:コメント番号, VALUE:対応するユーザー名(最大7文字)（184さんなら省略型のハッシュ値、生IDさんなら省略形のユーザー名）
var _commentListFull = {};  // KEY:コメント番号, VALUE:対応するユーザー名(フルネーム)（184さんならFullハッシュ値、生IDさんならFullユーザー名）
var _183UserList = {};      // KEY:コメント番号, VALUE:184ユーザーID
//var _newUserList = {};      // KEY:コメント番号, VALUE:初めて書き込むユーザーID 
var _premiumList = {};      // KEY:コメント番号, VALUE:何でもいい値
// var _rawUserList = {};      // KEY:ユーザーID,   VALUE:GETしてきたユーザー名(最大7文字)
var _rawUserListFull = {};  // KEY:ユーザーID,   VALUE:GETしてきたユーザー名(フルネーム)
var _gettingList = {};      // KEY:ユーザーID,   VALUE:何でもいい値

let _allComment = [];       // KEY:ユーザーID, 　

var _commentRawIdList = {}; // KEY:コメント番号  VALUE:ユーザーID（184さんならハッシュ値、生IDさんなら生IDが入る）
var _kotehanList = [];      // KEY:ユーザーID,   VALUE:コテハン

let _styleList = {};        // KEY:ユーザーID（184さんならハッシュ値、生IDさんなら生IDが入る）, VALUE: スタイルのindex番号(insertRule()した戻り値)

let _bIsIamOwner = false;           // 自分が配信者かどうか
let _bIsIamOwnerCheckOnce = false;  // 自分が配信者かどうか確認したかどうか

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
    //  
    --------------------------------------------------------------*/
    if (message.chat && message.chat.no && message.chat.user_id && message.chat.content && message.chat.vpos) {

/*
        _allComment[message.chat.no] = 
          {
            user_id: message.chat.user_id, 
            //vpos: message.chat.vpos,
            comment: message.chat.content,
            no: message.chat.no
          };
*/
        _allComment.push({
          user_id: message.chat.user_id,
          //vpos: message.chat.vpos,
          comment: message.chat.content,
          no: message.chat.no
        });
      
        if (_allComment.length > 20000) {
          console.log("保存しているコメント数が20000を超えたので古いコメントから半分削除します");
          _allComment.splice(0, 10000);
        }

        //console.log(_allComment);

    }

    /*--------------------------------------------------------------
    //  ユーザー名の取得処理
    --------------------------------------------------------------*/
    //console.log(message.chat);
    //console.log(message.chat.no + ", " + message.chat.content + ", " + message.chat.user_id);

    if (isNaN(message.chat.user_id)) {
      // 184さんの処理----------------------------


      _commentRawIdList[message.chat.no]  = message.chat.user_id;
      // _commentList[message.chat.no]       = message.chat.user_id.substring(0, 4) + "･･";
      // _commentList[message.chat.no]       = message.chat.user_id;
      _commentListFull[message.chat.no]   = message.chat.user_id;
      _183UserList[message.chat.no]       = message.chat.user_id;
      


    } else {
      // 生IDさんの処理----------------------------
      _commentRawIdList[message.chat.no] = message.chat.user_id;

      // すでに名前を取得ずみであれば名前を取得しない
      if (_rawUserListFull[message.chat.user_id]) {
        // _commentList[message.chat.no] = _rawUserList[message.chat.user_id];
        _commentListFull[message.chat.no] = _rawUserListFull[message.chat.user_id];
        return;
      } else {
        // 仮でユーザーIDをいれておく
        // _commentList[message.chat.no] = message.chat.user_id;
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
          // if (userName.length > 7) {
          //   userName = userName.substring(0, 7) + "･･";
          // }

          // _rawUserList[message.chat.user_id] = userName;
          _rawUserListFull[message.chat.user_id] = userNameFull;

          //console.log(`★★ ${message.chat.no} コメは ${userName} に設定`);

          // 過去のコメントの名前を置き換える
          // for (let key in _commentList) {
          //   if (_commentList[key] == message.chat.user_id) {
          //     _commentList[key] = userName;
          //   }
          // }
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

function InsertUserName(fragment, newNo, bHide) {

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
    if(userId && userId.length > 4) {
      iconPath = userId.substring(0, userId.length - 4);
    } else {
      iconPath = "0";
    }

    iconElement.setAttribute("class", "user_icon_by_extention");
    iconElement.setAttribute("style", "background-image: url(https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/" + iconPath + "/" + userId + ".jpg), url(https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank.jpg);");
    hoverElement = document.createElement("a");
    hoverElement.setAttribute("class", "user_iconHover_by_extention");
    hoverElement.setAttribute("style", "background-image: url(https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/" + iconPath + "/" + userId + ".jpg), url(https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank.jpg);");
    hoverElement.setAttribute("href", "https://www.nicovideo.jp/user/" + userId);
    hoverElement.setAttribute("target", "_blank");
  }

  iconElement.appendChild(hoverElement);

  // 自身が配信者なら非表示にする(DOMは残しておかないとカラー機能が使えなくなる)
  if(bHide) {
    iconElement.setAttribute("style", "display:none;");
  } 

  // 作成したDOMの挿入
  fragment.appendChild(iconElement);

  // 追加する名前のDOMを作成
  var newElement = document.createElement("span");
  var newContent = document.createTextNode(_commentListFull[newNo]);
  newElement.appendChild(newContent);

  if (_183UserList[newNo]) {
    newElement.setAttribute("class", "user_name_by_extention user184");
  } else {
    newElement.setAttribute("class", "user_name_by_extention");
  }
  newElement.setAttribute("title", _commentListFull[newNo]);

  // 自身が配信者なら非表示にする(DOMは残しておかないとカラー機能が使えなくなる)
  if(bHide) {
    newElement.setAttribute("style", "display:none;");
  }
  
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
    // if (kotehan.length > 7) {
    //   kotehan = kotehan.substring(0, 7) + "･･";
    // }

    //kotehan = _kotehanList[currentNoId];
    //kotehan = hitKotehan[0].kotehan;
    kotehanElement.setAttribute("class", "user_name_by_extention viewKotehan kotehan");

    kotehanContent = document.createTextNode(kotehan);
    kotehanElement.appendChild(kotehanContent);
    kotehanElement.setAttribute("title", kotehanFull);
    kotehanElement.setAttribute("data-extension-userid", _commentRawIdList[newNo]);
  } else {

    // コテハンがHITしなかった場合---------

    // let userName = _commentList[newNo];
    let fullUserName = _commentListFull[newNo];
    
    kotehan = _commentListFull[newNo]
    if (_183UserList[newNo]) {
      kotehanElement.setAttribute("class", "user_name_by_extention viewKotehan user184");
    } else {
      kotehanElement.setAttribute("class", "user_name_by_extention viewKotehan");
    }

    kotehanContent = document.createTextNode(kotehan);
    kotehanElement.appendChild(kotehanContent);  
    kotehanElement.setAttribute("title", fullUserName);
    kotehanElement.setAttribute("data-extension-userid", _commentRawIdList[newNo]);

  }

  // 自身が配信者なら非表示にする(DOMは残しておかないとカラー機能が使えなくなる)
  if(bHide) {
    kotehanElement.setAttribute("style", "display:none;");
  }

  // 作成したDOMの挿入
  fragment.appendChild(kotehanElement);


  
  return fragment;
}


function InsertPremium(fragment, newNo, bIsOwner) {

  // 追加するDOMを作成
  var newElement = document.createElement("span");
  var newContent;

  if(bIsOwner) {
    // 配信者のコメント ------------------
    // 配信者はプレ垢かどうか関わらずpremium==3になってるので配信者は(主)と表示
    // newContent = document.createTextNode("主");
    // newElement.appendChild(newContent);
    newElement.setAttribute("class", "owner_by_extention");
    newElement.setAttribute("title", "配信者");

  } else {
    // リスナーのコメント ------------------
    if (_premiumList[newNo] === true) {
      // newContent = document.createTextNode("P");
      // newElement.appendChild(newContent);
      newElement.setAttribute("class", "premium_by_extention");
      newElement.setAttribute("title", "プレミアムアカウント");   
    } else {
      // newContent = document.createTextNode("");
      // newElement.appendChild(newContent);
      newElement.setAttribute("class", "noPremium_by_extention");
      newElement.setAttribute("title", "一般アカウント");
    }  
  }




  // 作成したDOMの挿入
  fragment.appendChild(newElement);

  return fragment;
}

let _AddedNode = false;


function watchCommentDOM(mutationsList, observer) {
  //console.time("loop time");
  //console.log("-----------------------------------------");
  
  //console.log(mutationsList);
  
  for (const mutation of mutationsList) {
    

    if(mutation.type === "childList"){

      // 初回動作
      /*
      if(_AddedNode == false){

        for (var i = 0; i < mutation.target.childNodes.length; i++) {
          var currentNode = mutation.target.childNodes[i];
          editComment(currentNode);
        }
      }
      */

      // 初回動作以外
      mutation.addedNodes.forEach((currentNode) => {

        _AddedNode = true;
        
        //console.time("editComment time");
        editComment(currentNode);
        //console.timeEnd("editComment time");
      });

    }
  }

  //console.timeEnd("loop time");
}

function editComment(currentNode) {
  //console.time("  mmmm time");
  //console.time("  ccc time");
  var commentTextElement = currentNode.querySelector("[class^=___comment-text___]");
  let commentNumberDom = currentNode.querySelector("[class^=___comment-number___]"); // コメント番号のDOM
  //console.timeEnd("  ccc time");
  if (commentNumberDom) { 
    //console.time("  bbb time");
    var newNo = commentNumberDom.textContent;
    //console.timeEnd("  bbb time");
    
    //console.time("  getAttribute time");
    let bIsEdited = currentNode.getAttribute("data-extension-edited");
    //console.timeEnd("  getAttribute time");

    // 既にeditCommentしたコメントはスキップ
    if (newNo.length > 0 && !bIsEdited) {

      // 自分のコメント かつ なふだコメント かどうかを判定
      //console.time("  querySelector time");
      let bIsMyComment = currentNode.querySelector("[class^=___user-thumbnail-image___]");
      //console.timeEnd("  querySelector time");

      if(!bIsMyComment)
      {
        //----------------------------------------------------------------
        //　匿名コメントの場合
        //----------------------------------------------------------------
        //console.time("  aaa time");

        // フラグメント作成
        let fragment = document.createDocumentFragment();

        // 初回だけ自身が配信者かどうか判定
        if(_bIsIamOwnerCheckOnce === false) {
          _bIsIamOwnerCheckOnce  = true;
          const broadvastTool = document.querySelector('[class^=___broadcaster-tool___]');
          if(broadvastTool) {
            //console.log("自分が配信者ですです");
            _bIsIamOwner = true; // 配信者
          }
        }

        // 自分が配信者であればDIVでWrapする
        if(_bIsIamOwner) {
          //console.log("自分が配信者です");
          let divElement = document.createElement("div");
          divElement.setAttribute("class", "wrapComment_by_extention");
          fragment.appendChild(divElement);
          fragment = fragment.querySelector('.wrapComment_by_extention'); // wrapComment_by_extentionの中にDOMを追加するようにする
        } else {
          //console.log("自分が配信者ではありません");
        }

        // プレ垢のDOMを挿入
        let bIsOwner = false;
        
        if(currentNode.getAttribute("data-comment-type") === "operator") {
          //console.log("配信者のコメントです");
          bIsOwner = true;
        } else {
          //console.log("リスナーのコメントです");
        }

        //console.timeEnd("  aaa time");

        //console.time("  InsertPremium time");
        fragment = InsertPremium(fragment, newNo, bIsOwner);
        //console.timeEnd("  InsertPremium time");

        //console.time("  InsertUserName time");
        // 名前のDOMを挿入
        if (_commentListFull[newNo]) {
          fragment = InsertUserName(fragment, newNo, false);
        } else {
          //console.log(`${newNo} に対応する名前がありません。取得失敗さんにします。`);
          _commentListFull[newNo] = "取得失敗";
          fragment = InsertUserName(fragment, newNo, false);
        }
        //console.timeEnd("  InsertUserName time");

        // フラグメントを実DOMに挿入
        //let comment = currentNode.querySelector("[class^=___comment-text___]"); // コメントテキストのDOM
        //console.time("  insertBefore time");
        commentTextElement.parentNode.insertBefore(fragment, commentTextElement);
        //console.timeEnd("  insertBefore time");

      } else {

        //----------------------------------------------------------------
        //　なふだコメントの場合
        //----------------------------------------------------------------

        // フラグメント作成
        let fragment = document.createDocumentFragment();

        // プレ垢のDOMを挿入
        let bIsOwner = false;
        
        if(currentNode.getAttribute("data-comment-type") === "operator") {
          //console.log("配信者のコメントです");
          bIsOwner = true;
        } else {
          //console.log("リスナーのコメントです");
        }
        fragment = InsertPremium(fragment, newNo, bIsOwner);


        // 名前のDOMを挿入
        if (_commentListFull[newNo]) {
          fragment = InsertUserName(fragment, newNo , true);
        } else {
          //console.log(`${newNo} に対応する名前がありません。取得失敗さんにします。`);
          _commentListFull[newNo] = "取得失敗";
          fragment = InsertUserName(fragment, newNo, true);
        }

        // フラグメントを実DOMに挿入
        let comment = currentNode.querySelector("[class^=___user-thumbnail-image___]"); // なふだ機能のアイコンと名前の親DOM
        comment.parentNode.insertBefore(fragment, comment);

      }

      // editCommentしたコメントの証拠を残しておく（次回やらなくて済むように）
      currentNode.setAttribute("data-extension-edited", "true");
      
      
      // 受信している全てのコメントの中で、現在のユーザーIDのコメントの中で、
      // 現在のコメント番号より若いコメントが存在していなければ、そのユーザーの一番最初のコメントだと判定
      const userId = _commentRawIdList[newNo];
      const userComments = _allComment.filter(item => item.user_id === userId)  // 特定のユーザーIDで抽出
                                      .filter(item => item.no < newNo);         // 指定したコメント番号より古いコメントを抽出
      if(userComments.length === 0) {
        // 一番最初のコメントならCSSで太字にする
        currentNode.setAttribute("data-extension-firstcomment", "true");       
      }


    }
  }
  //console.time("  commentTextElement time");
  // コメントに行送りを対応させるためクラスを付与
  //var commentTextElement = currentNode.querySelector("[class^=___comment-text___]");
  /*
  if (commentTextElement.offsetHeight > 28) {
    commentTextElement.classList.add('multiple-line');
    //commentTextElement.setAttribute('multiple-line', "true");
  } else {
    commentTextElement.classList.add('one-line');
    //commentTextElement.setAttribute('one-line', "true");
  }
  */
  //console.timeEnd("  commentTextElement time");
  //console.timeEnd("  mmmm time");
}


//監視オプション
const options = {
  childList: true,  //直接の子の変更を監視
  characterData: false,  //文字の変化を監視
  characterDataOldValue: false, //属性の変化前を記録
  attributes: false,  //属性の変化を監視
  subtree: false, //全ての子要素を監視
}

function startWatchCommentDOM() {

  startWatchGridDOM();

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


  // 新しいHTML要素を作成
  let tootlTipDom = document.createElement('div');
  tootlTipDom.id = "ext_tooltipBox";

  // 指定した要素の中の末尾に挿入
  document.querySelector("[class^=___comment-data-grid___]").appendChild(tootlTipDom);


  // 新しいHTML要素を作成
  // let fragment = document.createDocumentFragment();
  let myKotehanDom = document.createElement('div');
  myKotehanDom.id = "ext_myKotehanBox";

  let myKotehanDomCenter = document.createElement('div');
  myKotehanDomCenter.id = "ext_myKotehanBox_Center";


  let myKotehanDom_comment = document.createElement('span');
  myKotehanDom_comment.id = "ext_myKotehanDom_comment";
  myKotehanDomCenter.appendChild(myKotehanDom_comment);

  let inputKotehan = document.createElement("input");
  inputKotehan.setAttribute("type", "text");
  inputKotehan.setAttribute("id", "ext_myKotehanInput");
  myKotehanDomCenter.appendChild(inputKotehan);

  let myKotehanDom_OkBtn = document.createElement('span');
  myKotehanDom_OkBtn.id = "ext_myKotehanBox_OkBtn";
  myKotehanDom_OkBtn.innerText = "決定";
  myKotehanDomCenter.appendChild(myKotehanDom_OkBtn);

  let myKotehanDom_ClearBtn = document.createElement('span');
  myKotehanDom_ClearBtn.id = "ext_myKotehanBox_ClearBtn";
  myKotehanDom_ClearBtn.innerText = "コテハンクリア";
  myKotehanDomCenter.appendChild(myKotehanDom_ClearBtn);


  let myKotehanDom_CancelBtn = document.createElement('span');
  myKotehanDom_CancelBtn.id = "ext_myKotehanBox_CancelBtn";
  myKotehanDom_CancelBtn.innerText = "キャンセル";
  myKotehanDomCenter.appendChild(myKotehanDom_CancelBtn);

  myKotehanDom.appendChild(myKotehanDomCenter);
  document.querySelector("[class^=___comment-data-grid___]").appendChild(myKotehanDom);


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

  let currentUserIDfromMouseOver = 0;

  let currentUserID = 0;
  let currentCommentNo = 0;
  let userId = "";
  let userName = "";
  let userComment = "";

  if (target) {
    const obs = new MutationObserver(function(mutationsList, observer){

      const tootlTip = document.getElementById('ext_tooltipBox');

      //console.log(mutationsList);

      for (const mutation of mutationsList) {
        if(mutation.addedNodes.length > 0) {


          // ツールチップ関係
          if(document.querySelector("[class^=___tooltip___]")) {
            if(currentUserIDfromMouseOver !== 0 && currentCommentNo !== 0) {
              // console.log("ツールチップを表示します", currentUserIDfromMouseOver, currentCommentNo);
              if(tootlTip) tootlTip.innerText = getCommentsStringByUserId(currentUserIDfromMouseOver, currentCommentNo);
            }
          }


          // 色関係
          if(document.querySelector("[class^=___context-menu___]") && !document.querySelector("[class^=___context-menu___]:empty")) {
            // 上記、:empty は、ニコ生のDOMが「へもさんが100ptニコニコ広告しました」などのシステムメッセージを右クリックした場合、コンテキストメニューのDOMが表示されていないのにDOM上は存在している状態になってしまう仕様があり、それを回避するためのもの。

            if( !document.querySelector("[class^=___context-menu___] .ext-menu") && currentUserID !== 0 ) {

              let style = document.getElementById('extension_style');
              let _tempCurrentUserID;

              console.log("▼色オブジェクトリスト");
              console.log(_styleList);
              console.log("▼CSSルール");
              console.log(style.sheet.cssRules);

              // 追加するメニューのDOMを作成
              let ulElement = document.createElement("ul");
              let liElement = document.createElement("li");
              let labelElement = document.createElement("label");
              let inputElement = document.createElement("input");

              // 追加するメニューのDOMの属性やイベントの設定
              ulElement.setAttribute("class", "ext-menu");
              //liElement.setAttribute("class", "setColor");
              inputElement.setAttribute("class", "extention");
              inputElement.setAttribute("type", "color");
              labelElement.innerText = "文字色を設定";


              if(_styleList[currentUserID] && _styleList[currentUserID].textColor !== -1) {
                inputElement.value = _styleList[currentUserID].textColor;
              } else {
                inputElement.value = "#000000";
              }
              
              // カラーピッカーの色を動かしたときのイベント
              inputElement.addEventListener('input', function(e) {
                //console.log("色をつけます" , currentUserID, this.value);

                if(!_styleList[currentUserID]) {
                  let objct = {textIndex : -1, textColor: -1, bgIndex : -1, bgColor: -1};
                  _styleList[currentUserID] = objct;
                }

                //スタイルシートの設定
                if(_styleList[currentUserID].textIndex !== -1) {
                  // 追加済みなら置換
                  style.sheet.deleteRule(_styleList[currentUserID].textIndex);
                  //style.sheet.insertRule('[ext-master-comeview][ext-opt-color] span.user_name_by_extention.viewKotehan[data-extension-userid="'+ currentUserID + '"] + span {color: ' + this.value + '!important;}', _styleList[currentUserID].textIndex);
                  style.sheet.insertRule('[ext-master-comeview][ext-opt-color] [class^=___content-area___]:has([data-extension-userid="'+ currentUserID + '"]) [class^=___comment-text___] {color: ' + this.value + '!important;}', _styleList[currentUserID].textIndex);
                } else {
                  //let index = style.sheet.insertRule('[ext-master-comeview][ext-opt-color] span.user_name_by_extention.viewKotehan[data-extension-userid="'+ currentUserID + '"] + span {color: ' + this.value + '!important;}', style.sheet.cssRules.length);
                  let index = style.sheet.insertRule('[ext-master-comeview][ext-opt-color] [class^=___content-area___]:has([data-extension-userid="'+ currentUserID + '"]) [class^=___comment-text___] {color: ' + this.value + '!important;}', style.sheet.cssRules.length);
                  _styleList[currentUserID].textIndex = index;  
                }
                //console.log("index", style.sheet.cssRules);

                // 色を選択しているユーザーIDを保存しておく
                _tempCurrentUserID = currentUserID;
              
              });
              // カラーピッカーの色変更を確定したときのイベント
              inputElement.addEventListener('change', function(e) {
                console.log("色を保存します" , _tempCurrentUserID, this.value);
                _styleList[_tempCurrentUserID].textColor = this.value;


                // カラー情報を保存するDOMに保存
                let colorBox = document.getElementById("ext_colorBox");
                if(colorBox) {
                  let item = { 
                    id : _tempCurrentUserID,
                    textColor : _styleList[_tempCurrentUserID].textColor,
                    bgColor : _styleList[_tempCurrentUserID].bgColor,
                    deleteFlag : false,
                    createDate : new Date().toUTCString()
                  };
                  var colorItemDom = document.createElement('p');
                  var newYomiCommentText = document.createTextNode(JSON.stringify(item));
                  colorItemDom.appendChild(newYomiCommentText);
                  colorBox.appendChild(colorItemDom);
                }

              });


              

              let liBgColorElement = document.createElement("li");
              let labelBgColorElement = document.createElement("label");
              let inputBgColorElement = document.createElement("input");
              inputBgColorElement.setAttribute("class", "extention");
              inputBgColorElement.setAttribute("type", "color");
              labelBgColorElement.innerText = "背景色を設定";


              if(_styleList[currentUserID] && _styleList[currentUserID].bgColor !== -1) {
                inputBgColorElement.value = _styleList[currentUserID].bgColor;
              } else {
                inputBgColorElement.value = "#ffffff";
              }

              // カラーピッカーの色を動かしたときのイベント
              inputBgColorElement.addEventListener('input', function(e) {
                // console.log("背景色をつけます" , currentUserID, this.value, _styleList);

                if(!_styleList[currentUserID]) {
                  let objct = {textIndex : -1, textColor: -1, bgIndex : -1, bgColor: -1};
                  _styleList[currentUserID] = objct;
                }

                //スタイルシートの設定
                if(_styleList[currentUserID].bgIndex !== -1) {
                  // 追加済みなら置換
                  style.sheet.deleteRule(_styleList[currentUserID].bgIndex);
                  style.sheet.insertRule('[ext-master-comeview][ext-opt-color] span:has([data-extension-userid="'+ currentUserID + '"] ) { background-color: ' + this.value + ';}', _styleList[currentUserID].bgIndex);
                } else {
                  // 未追加なら追加
                  let index = style.sheet.insertRule('[ext-master-comeview][ext-opt-color] span:has([data-extension-userid="'+ currentUserID + '"] ) { background-color: ' + this.value + ';}', style.sheet.cssRules.length);
                  _styleList[currentUserID].bgIndex = index;  
                }
                // console.log("index", style.sheet.cssRules);

                // 色を選択しているユーザーIDを保存しておく
                _tempCurrentUserID = currentUserID;
              
              });
              // カラーピッカーの色変更を確定したときのイベント
              inputBgColorElement.addEventListener('change', function(e) {

                console.log("背景色を保存します" , _tempCurrentUserID, this.value);
                _styleList[_tempCurrentUserID].bgColor = this.value;

                // カラー情報を保存するDOMに保存
                let colorBox = document.getElementById("ext_colorBox");
                if(colorBox) {
                  let item = { 
                    id : _tempCurrentUserID,
                    textColor : _styleList[_tempCurrentUserID].textColor,
                    bgColor : _styleList[_tempCurrentUserID].bgColor,
                    deleteFlag : false,
                    createDate : new Date().toUTCString()
                  };
                  var colorItemDom = document.createElement('p');
                  var newYomiCommentText = document.createTextNode(JSON.stringify(item));
                  colorItemDom.appendChild(newYomiCommentText);
                  colorBox.appendChild(colorItemDom);
                }
              });



              let liResetColorElement = document.createElement("li");
              let labelResetColorElement = document.createElement("label");
              labelResetColorElement.innerText = "色設定をクリア";

              // 色設定をクリアするボタンのイベント              
              liResetColorElement.addEventListener('click', function(e) {
                console.log("色設定を削除します", currentUserID, _styleList);

                if(_styleList[currentUserID] && _styleList[currentUserID].textIndex !== -1) {
                  // 追加済みなら置換
                  style.sheet.deleteRule(_styleList[currentUserID].textIndex);
                  style.sheet.insertRule('span.user_name_by_extention.viewKotehan[data-extension-userid="'+ currentUserID + '"] + span {color: #000000;}', _styleList[currentUserID].textIndex);
                  _styleList[currentUserID].textColor = "#000000";
                }

                if(_styleList[currentUserID] && _styleList[currentUserID].bgIndex !== -1) {
                  // 追加済みなら置換
                  style.sheet.deleteRule(_styleList[currentUserID].bgIndex);
                  style.sheet.insertRule('span:has([data-extension-userid="'+ currentUserID + '"] ) { background-color: #ffffff;}', _styleList[currentUserID].bgIndex);
                  _styleList[currentUserID].bgColor = "#ffffff";
                }

                // コンテキストメニューを閉じる
                document.querySelector('[class^=___context-menu___]').style.display = "none"


                // カラー情報を保存するDOMに保存
                let colorBox = document.getElementById("ext_colorBox");
                if(colorBox) {
                  let item = { 
                    id : currentUserID,
                    deleteFlag : true
                  };
                  var colorItemDom = document.createElement('p');
                  var newYomiCommentText = document.createTextNode(JSON.stringify(item));
                  colorItemDom.appendChild(newYomiCommentText);
                  colorBox.appendChild(colorItemDom);
                }

              });


              // コテハン設定ボタンのDOMを作成
              let liKotehanElement = document.createElement("li");
liKotehanElement.style.display = "none";
              let labelKotehanElement = document.createElement("label");
              labelKotehanElement.innerText = "コテハンを設定";              

              // コテハン設定ボタンのClickイベント
              liKotehanElement.addEventListener('click', function(e) {
                document.getElementById('ext_myKotehanBox').classList.add("show");
                document.getElementById('ext_myKotehanInput').focus();
                document.getElementById('ext_myKotehanInput').value = userName;
                document.getElementById('ext_myKotehanDom_comment').innerText = userComment;
              });

              document.getElementById("ext_myKotehanBox_OkBtn").addEventListener('click', function(e) {
                document.getElementById("ext_myKotehanBox").classList.remove("show");

                let kotehan = document.getElementById('ext_myKotehanInput').value;
                if(kotehan.length > 0) {
                  let kotehanItem = {id: currentUserID, kotehan: kotehan};
                  // 既に同じIDの人が登録されていれば削除してから追加
                  _kotehanList = _kotehanList.filter(function (x) { return x.id !== currentUserID }); // 削除
                  _kotehanList.push(kotehanItem); // 追加
                  // コテハン保存用のDOMにコテハンをテキストを挿入（結果、読み上げられる）
                  let kotehanBox = document.getElementById("ext_kotehanBox");
                  if(kotehanBox) {
                    let item = { id : currentUserID, kotehan : kotehan};
                    var newYomiCommentDom = document.createElement('p');
                    var newYomiCommentText = document.createTextNode(JSON.stringify(item));
                    newYomiCommentDom.appendChild(newYomiCommentText);
                    kotehanBox.appendChild(newYomiCommentDom);
                  }

                  // 表示中のコメントのコテハンを変更
                  var currentCommentList = document.querySelectorAll('.user_name_by_extention');
                  for (var i = 0; i < currentCommentList.length; i++) {
                    if (currentCommentList[i].innerText == currentUserID) {
                      currentCommentList[i].innerText = kotehan;
                      currentCommentList[i].classList.add("kotehan");
                      currentCommentList[i].classList.remove("user184");
                    }
                  }                  
                }
              });  
              document.getElementById("ext_myKotehanBox_ClearBtn").addEventListener('click', function(e) {
                document.getElementById("ext_myKotehanBox").classList.remove("show");

                _kotehanList = _kotehanList.filter(function (x) { return x.id !== currentUserID }); // 削除
                // コテハン保存用のDOMにコテハンをテキストを挿入（結果、読み上げられる）
                let kotehanBox = document.getElementById("ext_kotehanBox");
                if(kotehanBox) {
                  let item = { id : currentUserID, kotehan : kotehan};
                  var newYomiCommentDom = document.createElement('p');
                  var newYomiCommentText = document.createTextNode(JSON.stringify(item));
                  newYomiCommentDom.appendChild(newYomiCommentText);
                  kotehanBox.appendChild(newYomiCommentDom);
                }                
              });
              document.getElementById("ext_myKotehanBox_CancelBtn").addEventListener('click', function(e) {
                document.getElementById("ext_myKotehanBox").classList.remove("show");
              });              

              /* --------------------------
              追加するメニューを1つにまとめる
              ----------------------------*/

              // [文字色を設定]メニュー
              labelElement.appendChild(inputElement);
              liElement.appendChild(labelElement);
              ulElement.appendChild(liElement);

              // [背景色を設定]メニュー
              labelBgColorElement.appendChild(inputBgColorElement);
              liBgColorElement.appendChild(labelBgColorElement);
              ulElement.appendChild(liBgColorElement);

              // [色設定をクリア]メニュー
              liResetColorElement.appendChild(labelResetColorElement);
              ulElement.appendChild(liResetColorElement);

              // [コテハンを設定]メニュー
              liKotehanElement.appendChild(labelKotehanElement);
              ulElement.appendChild(liKotehanElement);        


              // コンテキストメニューの監視を解除
              observer.disconnect();

              // コンテキストメニューに追加メニュー項目を挿入
              let commentContext = document.querySelector("[class^=___program-comment-menu___]"); // コメント関係のメニューDOMを指定
              if(commentContext && commentContext.parentNode){
                commentContext.parentNode.insertBefore(ulElement, commentContext);    
              }

              // コンテキストメニューの監視を再開
              const target = document.querySelector("[class^=___comment-data-grid___]");
              observer.observe(target, optionsForGrid);
            }
            
          }
        }
      }

    });
    
    obs.observe(target, optionsForGrid);

    document.querySelector("[class^=___comment-data-grid___]").addEventListener("mousemove", function(e) {

      const tootlTip = document.getElementById('ext_tooltipBox');
      // console.log("mousemove", currentUserIDfromMouseOver, currentCommentNo);
      if(tootlTip) {
        if(currentUserIDfromMouseOver !== 0 && currentCommentNo !== 0) {

          // tootlTip.style.display = "block";
          tootlTip.classList.add("show");

          // 要素の位置を更新する
          // 要素の右下の座標を計算
          const right = e.clientX - 10;
          const bottom = e.clientY - 10;
    
          // 要素の位置を更新する
          tootlTip.style.right = `calc(100% - ${right}px)`;
          tootlTip.style.bottom = `calc(100% - ${bottom}px)`;  
        } else {
          // システムメッセージなどの場合は非表示にする
          tootlTip.classList.remove("show");
        }
      }
    });

    document.querySelector("[class^=___comment-data-grid___]").addEventListener("mouseleave", function(e) {
      // 要素の位置を更新する
      const tootlTip = document.getElementById('ext_tooltipBox');
      // tootlTip.style.display = "none";
      if(tootlTip) tootlTip.classList.remove("show");
    }); 

    // ツールチップや色関係で使うユーザーIDを取得する
    document.querySelector("[class^=___comment-data-grid___]").addEventListener("mouseover", function(e) {

      //console.log("★mouseover", e.target);

      if (e.target.parentNode && e.target.closest("[class^=___table-cell___]")) {
        let commentDom = e.target.closest("[class^=___table-cell___]").querySelector("[class^=___comment-number___]");
        let userNameDom = e.target.closest("[class^=___table-cell___]").querySelector(".user_name_by_extention");
        let userCommentDom = e.target.closest("[class^=___table-cell___]").querySelector("[class^=___comment-text___]");
        if(commentDom && commentDom.innerText && userNameDom && userCommentDom) {

          currentUserIDfromMouseOver = _commentRawIdList[commentDom.innerText];
          currentCommentNo = commentDom.innerText;
          userName = userNameDom.innerText;
          userComment = "コメント: " + userCommentDom.innerText;

          //console.log("★currentUserID" + currentUserID);
                    
        } else {
          currentUserIDfromMouseOver = 0;
          currentCommentNo = 0;
        }
      }
    });

    // 色関係
    document.querySelector("[class^=___comment-data-grid___]").addEventListener("mousedown", function(e) {
      
      if (e.button == 2 && e.target.parentNode) { // right click for mouse
        let commentDom = e.target.closest("[class^=___table-cell___]").querySelector("[class^=___comment-number___]");
        if(commentDom && commentDom.innerText) {

          currentUserID = _commentRawIdList[commentDom.innerText];

          console.log("★currentUserID" + currentUserID);
                    
        }
      }
    });
    
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


      const colorJson = document.querySelector("#ext_colorToInjectBox p");
      if(colorJson && colorJson.outerText){
        const styleList = JSON.parse(colorJson.outerText);
        console.log("▼inject側で受け取ったカラー情報");
        console.log(styleList);

        styleList.forEach(function(item, index) {
          let objct = {
            textIndex : -1,
            textColor: item.textColor ? item.textColor : -1,
            bgIndex : -1,
            bgColor: item.bgColor ? item.bgColor : -1,
            createDate : item.createDate ? item.createDate : new Date().toUTCString()
          };
          _styleList[item.id] = objct;
        });

        //console.log(_styleList);

        let style = document.getElementById('extension_style');
        Object.keys(_styleList).forEach(function(key) {
          var val = this[key]; // this は obj
          //console.log(key, val);
          if(val.bgColor && val.bgColor !== -1) {
            // ▼背景カラー
            _styleList[key].bgIndex = style.sheet.insertRule('[ext-master-comeview][ext-opt-color] span:has([data-extension-userid="'+ key + '"] ) { background-color: ' + val.bgColor + ';}', style.sheet.cssRules.length);
          }
          if(val.textColor && val.textColor !== -1) {
            // ▼テキストカラー
            //_styleList[key].textIndex = style.sheet.insertRule('[ext-master-comeview][ext-opt-color] span.user_name_by_extention.viewKotehan[data-extension-userid="'+ key + '"] + span {color: ' + val.textColor + '!important;}', style.sheet.cssRules.length);
            _styleList[key].textIndex = style.sheet.insertRule('[ext-master-comeview][ext-opt-color] [class^=___content-area___]:has([data-extension-userid="' + key + '"]) [class^=___comment-text___] {color: ' + val.textColor + '!important;}', style.sheet.cssRules.length);
          }
        }, _styleList);

        console.log("最終カラー情報");
        console.log(_styleList);


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
      "#ext_kotehanToInjectBox",
      "#ext_colorToInjectBox",
      "#extension_style",
      "#ext_tooltipBox",
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