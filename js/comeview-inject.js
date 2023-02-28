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

let _comment_for_clip;
let _userID_for_clip;
let _userName_for_clip;
let _commentTime;

// injection先でloadイベント待機
window.addEventListener('load', function () {

  console.log("★injectionのload発生");

  // ニコ生URLであり、かつニコ生プレイヤーがあれば。
  if (location.href.startsWith("https://live.nicovideo.jp/")) {
    if (document.querySelector('[class^=___player-area___]')) {


      // コメビュ機能の初期化処理
      initialize(function (ret) {

        // コメビュ機能に必要なDOMが作成されていればtrue
        if (ret) {

          let myChatLog = document.querySelector('#ext_chat_log');
          let logBox = document.querySelector('[class^=___comment-panel___]');
        
          if(myChatLog && logBox) {
        
            myChatLog.style.width = logBox.clientWidth + "px";
            myChatLog.style.height = logBox.clientHeight + "px";
          
            var clientRect = logBox.getBoundingClientRect();
            // ページ内の位置
            var py = window.pageYOffset + clientRect.top ;
            var px = window.pageXOffset + clientRect.left ;
            myChatLog.style.top = py + "px";
            myChatLog.style.left = px + "px";
        
          }
    
          // コメントDOMの監視を開始
          console.log("☆☆☆コメントDOMの親監視が発生");
          startWatchCommentDOM();
    
          // コメントDOMの親DOMの監視を開始
          // (フルスクリーン解除時や、放送ネタ画面の表示時には監視対象のDOMが消去されるので監視を再設定する為)
          const target_parent = document.querySelector("[class^=___contents-area___]"); // コメントDOMの大元の親DOMを指定
          if (target_parent) {
    
            //監視オプション
            const parentDomOption = {
              childList:              true,   //直接の子の変更を監視
              characterData:          true,   //文字の変化を監視
              characterDataOldValue:  false,  //属性の変化前を記録
              attributes:             false,  //属性の変化を監視
              subtree:                false,  //全ての子要素を監視
            }
    
            const obs = new MutationObserver(watchParentDOM);
            obs.observe(target_parent, parentDomOption);
          }

          // [コメント]タブ、[おすすめ生放送]タブにクリックイベントを設定
          setCommentBtnEvent();

          // 再生時間の監視
          const timeOption = {
            childList:      true,  //直接の子の変更を監視
            characterData:  true,  //文字の変化を監視
            attributes:     true,  //属性の変化を監視
            subtree:        true, //全ての子要素を監視
          };
          const targetTimeDom = document.querySelector("[class^=___time-score___] span");
          const obsTimeBox = new MutationObserver(watchTime);
          obsTimeBox.observe(targetTimeDom, timeOption);

          // コテハン情報の取得
          const kotehanJson = document.querySelector("#ext_kotehanToInjectBox p");
          if(kotehanJson && kotehanJson.outerText){
            _kotehanList = JSON.parse(kotehanJson.outerText);
            console.log("▼inject側で受け取ったコテハン2");
            console.log(_kotehanList);  
          }


          let contextMenu = document.createElement("div");
          contextMenu.id = "ext_chat_menu";
          contextMenu.innerHTML = 
                                    '<div class="info">'+
                                      '<div class="id"></div>'+
                                      '<div class="name"></div>'+
                                      '<div class="comment"></div>'+
                                    '</div>'+
                                    '<hr>'+
                                    '<div class="item comment_copy" onclick="ext_comment_copy();">コメントをコピー</div>'+
                                    '<div class="item userid_copy" onclick="ext_userID_copy();">ユーザーIDをコピー</div>'+
                                    '<div class="item userid_copy" onclick="ext_userName_copy();">ユーザー名をコピー</div>'+
                                    '<div class="item seek" onclick="ext_commentTime();">コメントの時点から視聴</div>'+
                                    '<hr>'+
                                    '<div class="item comment_ng" onclick="ext_commentNG();">コメントをNGに追加</div>'+
                                    '<div class="item userid_ng" onclick="ext_userNG();">ユーザーIDをNGに追加</div>';
          myChatLog.after(contextMenu);

          myChatLog.addEventListener('contextmenu',function(e){

            // コメビュ機能が有効
            //if(document.querySelector('.ext-setting-menu .ext-comeview').getAttribute("ext-attr-on")) {

              console.log("コンテキストメニューだよ");

              // ユーザー名（184のIDがでもOK）が取得できない場合はシステムメッセージだと判断してメニューは表示しない
              let userNameDom = e.target.parentNode.querySelector('[class^=user_name_by_extention]');
              if(userNameDom) {

                let menuDom = document.getElementById('ext_chat_menu');
  
                console.log("ユーザー名 : " + userNameDom.getAttribute('title'));
                _userName_for_clip = userNameDom.getAttribute('title');
                menuDom.querySelector('.info .name').innerText = _userName_for_clip;

                
                let userIdDom = e.target.parentNode.querySelector('[class^=user_id_by_extention]');
                if(userIdDom) {
                  console.log("ユーザーID : " + userIdDom.innerText);
                  _userID_for_clip =  userIdDom.innerText;
                  menuDom.querySelector('.info .id').innerText = _userID_for_clip;
                }
                  
                let commentDom = e.target.parentNode.querySelector('[class^=___comment-text___]');
                if(commentDom) {
                  console.log("コメント内容 : " + commentDom.innerText);
                  _comment_for_clip =  commentDom.innerText;
                  menuDom.querySelector('.info .comment').innerText = _comment_for_clip;
                }
  
                let commentNumDom = e.target.parentNode.querySelector('[class^=___comment-number___]');
                if(commentNumDom) {
                  console.log("コメント番号 : " + commentNumDom.innerText);
                }
  
                let commentTimeDom = e.target.parentNode.querySelector('[class^=___comment-time___]');
                if(commentTimeDom) {
                  _commentTime = commentTimeDom.innerText;
                  console.log("コメントタイム : " + _commentTime);
                }

                
                menuDom.style.left = e.pageX+"px";
                menuDom.style.top = e.pageY+"px";

                menuDom.style.display = "block";
  
              }
  
              // デフォルトのメニューは非表示
              e.preventDefault();
            //}

          });
          
          //クリックで非表示に変更
          document.body.addEventListener('click', (e) => {
            document.getElementById('ext_chat_menu').style.display = "none";
          });
          

        }

      }, 6000 * 10 * 5); // 5分

    }
  }

});

function ext_comment_copy() {
  if(_comment_for_clip) {
    navigator.clipboard.writeText(_comment_for_clip);
    _comment_for_clip = "";
  }
}

function ext_userID_copy() {
  if(_userID_for_clip) {
    navigator.clipboard.writeText(_userID_for_clip);
    _userID_for_clip = "";
  }
}

function ext_userName_copy() {
  if(_userName_for_clip) {
    navigator.clipboard.writeText(_userName_for_clip);
    _userName_for_clip = "";
  }
}
function ext_commentTime() {
  if(_commentTime) {
    console.log(location.href + "#" + _commentTime);
    location.href = location.href + "#" + _commentTime;
    _commentTime = "";
  }
}

const NG_TYPE_WORD = "word";
const NG_TYPE_ID = "id";

function ext_commentNG() {

  setNG(NG_TYPE_WORD, _comment_for_clip);

  return;

  let json = localStorage.getItem('LeoPlayer_NgStore_list');
  if(json) {
    //console.log(json);

    let ngLimit = 500;
    if(document.querySelector('[class^=___premium-merit-appeal-banner___]')) {
      ngLimit = 40;
    }

    let ng_array = JSON.parse(json);
    if(ng_array.length < ngLimit) {  // 一般ユーザーの場合40、有料会員の場合は500

      // すでに登録済みか調査する
      let bIsAlready = false;
      ng_array.forEach((ngItem) => {
        if(ngItem.type === "word" && ngItem.value === _comment_for_clip){
          console.log("すでにNG登録されています");
          bIsAlready = true;
        }
      });
      if(bIsAlready === false) {
        // ローカルストレージにNG登録する
        var obj = {
          'value': _comment_for_clip,
          'type': 'word'
        };
        ng_array.push(obj);
        localStorage.setItem('LeoPlayer_NgStore_list', JSON.stringify(ng_array));
        
        //--------------------------------------------------------------
        //[##このコメントは表示されません##]に差し替える
        let chatDom = document.getElementById('ext_chat_log');
        _masterFrag.childNodes.forEach((node)=> { 
          let nodeText = node.querySelector('[class^=___comment-text___]');
          if(nodeText.innerText === _comment_for_clip) {
            nodeText.innerText = "##このコメントは表示されません##";
          }
        });
        // コメントBOXを空に
        while( chatDom.firstChild ){
          chatDom.removeChild( chatDom.firstChild );
        }
        // マスターフラグメントをコメントBOXに貼り付ける
        chatDom.append(_masterFrag.cloneNode(true));
        //--------------------------------------------------------------

      }
    }
  }
}

function ext_userNG() {
  setNG(NG_TYPE_ID, _userID_for_clip);
}

function setNG(type, value) {
  let json = localStorage.getItem('LeoPlayer_NgStore_list');
  if(json) {
    //console.log(json);

    let ngLimit = 500;
    if(document.querySelector('[class^=___premium-merit-appeal-banner___]')) {
      ngLimit = 40;
    }

    let ng_array = JSON.parse(json);
    if(ng_array.length < ngLimit) {  // 一般ユーザーの場合40、有料会員の場合は500

      // すでに登録済みか調査する
      let bIsAlready = false;
      ng_array.forEach((ngItem) => {
        if(ngItem.type === type && ngItem.value === value){
          console.log("すでにNG登録されています");
          bIsAlready = true;
        }
      });

      if(bIsAlready === false) {
        // ローカルストレージにNG登録する
        var obj = {
          'value': value,
          'type': type
        };
        ng_array.push(obj);
        localStorage.setItem('LeoPlayer_NgStore_list', JSON.stringify(ng_array));
        
        //--------------------------------------------------------------
        //[##このコメントは表示されません##]に差し替える
        let chatDom = document.getElementById('ext_chat_log');
        
        
        if(type === NG_TYPE_WORD) {
          _masterFrag.childNodes.forEach((node)=> { 
            let nodeText = node.querySelector('[class^=___comment-text___]');
            if(nodeText && nodeText.innerText === value) {
              nodeText.innerText = "##このコメントは表示されません##";
            }
          });
        } else if(type === NG_TYPE_ID) {
          _masterFrag.childNodes.forEach((node)=> { 
            let nodeText = node.querySelector('[class^=___comment-text___]');
            let nodeID = node.querySelector('.user_id_by_extention');
            if(nodeID && nodeID.innerText === value) {
              nodeText.innerText = "##このコメントは表示されません##";
            }
          });
        }

        // コメントBOXを空に
        while( chatDom.firstChild ){
          chatDom.removeChild( chatDom.firstChild );
        }
        // マスターフラグメントをコメントBOXに貼り付ける
        chatDom.append(_masterFrag.cloneNode(true));
        //--------------------------------------------------------------

      }
    }
  }
}



// コメビュ機能に必要なDOMが作成されるまで待機
function initialize(callback, timeoutMiliSec) {

  let domList = [
      "[class^=___time-score___] span[class^=___value___]",
      "#ext_kotehanToInjectBox",
      "[class^=___contents-area___]"
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

function watchParentDOM(mutationsList, observer) {

  console.log("コメントの親DOM監視が発生");
  //console.log(mutationsList);

  mutationsList.forEach((mutation)=> {

    // 子ノードの増減
    if(mutation.type === "childList"){

      // REMOVED ----------------------------------------------------------------
      mutation.removedNodes.forEach((removeNode) => {
        if(removeNode.querySelector('[class^=___comment-panel___]')) {
          console.log("HEREHERE");
          if(_domObs) {
            console.log("コメントDOMの監視を解除");
            _domObs.disconnect();
            document.getElementById('ext_chat_log').classList.add('hide');
          }
        }

      });
      
      // ADD ----------------------------------------------------------------
      mutation.addedNodes.forEach((addNode) => {
        if(addNode.querySelector('[class^=___comment-panel___]')) {
          console.log("コメントDOMの監視を開始");
          startWatchCommentDOM();
          document.getElementById('ext_chat_log').classList.remove('hide');
          // [コメント]タブ、[おすすめ生放送]タブにクリックイベントを再設定（DOMごと消えているので再設定が必要）
          setCommentBtnEvent();
        }
      });

      
    }

  });
}


function setCommentBtnEvent(){
  // [コメント]タブ
  document.querySelector('[class^=___comment-tab___]').addEventListener('click', function(){
    document.getElementById('ext_chat_log').classList.remove('hide');
  });
  // [おすすめ生放送]タブ
  document.querySelector('[class^=___program-recommend-tab___]').addEventListener('click', function(){
    document.getElementById('ext_chat_log').classList.add('hide');
  });  
}



// コメントDOMに新しいコメントが来たかどうか監視
let _domObs;

function startWatchCommentDOM() {

  if(_domObs) {
    console.log("監視終了");
    _domObs.disconnect();
  }

  console.log("監視スタート");

  const target = document.querySelector("[class^=___table___]"); // コメントDOMの直上の親DOMを指定
  if (target) {

    //監視オプション
    const options = {
      childList:              true,   //直接の子の変更を監視
      characterData:          false,  //文字の変化を監視
      characterDataOldValue:  false,  //属性の変化前を記録
      attributes:             true,  //属性の変化を監視
      subtree:                false,  //全ての子要素を監視
    }

    _domObs = new MutationObserver(watchCommentDOM);
    _domObs.observe(target, options);


    // 監視をスタートしたら直後に再描画させる
    // (フルスクリーン解除時や、放送ネタ画面の表示時には監視対象のDOMがすべて消去されて、再びコメントDOMが作成されるが、
    // その時はコメント監視が検知されないので、属性を変更してコメント監視の検知を発動させる）
    var now = new Date();
    target.setAttribute('currentTime', now.getMilliseconds())

  }
}

// パフォーマンスをあげるため仮想?DOMを作成しておく
let _masterFrag = document.createDocumentFragment();

// コメント監視関数
function watchCommentDOM(mutationsList, observer) {

  //console.log("START -------");
  //console.log(mutationsList);

  let chatDom = document.getElementById('ext_chat_log');

  mutationsList.forEach((mutation)=> {
    //console.log("FOR 1-------");




    // 子ノードの増減
    if(mutation.type === "childList"){

      // REMOVED ----------------------------------------------------------------
      /*
      mutation.removedNodes.forEach((removeNode) => {
        console.log("削除対象ノード");
        console.log(removeNode);

        // ものすごく単純にremovedNodesの回数だけマスターフラグメントのファーストチャイルドから消せばいいかも      
        // マスターフラグメントの先頭の子から削除していく
        if(_masterFrag.childNodes.length > 0){
          _masterFrag.firstChild.remove();
        }
      });
      */

      // 最大コメント数以下になるように古いコメントから削除していく
      while(_masterFrag.childNodes.length > 100){
        _masterFrag.firstChild.remove();
      }
      
      // ADD ----------------------------------------------------------------
      mutation.addedNodes.forEach((addNode) => {
        buildComment(addNode);          
      });

    }

    // 親ノードの属性変更
    if(mutation.type === "attributes" && mutation.attributeName === "currenttime") {
      
      console.log("強制的にリロードします");
      
      // チャットDOMを空っぽにする
      while( _masterFrag.firstChild ){
        _masterFrag.removeChild( _masterFrag.firstChild );
      }

      // チャットDOMにtargetから全コメントを追加する
      mutation.target.childNodes.forEach((node)=>{   

        buildComment(node);

      });

    }

  });

  // DOMを消す前に現在のスクロールが一番下かどうか判定
  const clientHeight = chatDom.clientHeight;
  const scrollHeight = chatDom.scrollHeight;
  const scrollTop = chatDom.scrollTop;
  let bIsMostBottom = false;
  // 一番下までスクロールされたか判定
  if (Math.abs(scrollHeight - clientHeight - scrollTop) < 1) {
    //console.log('いちばんしたまでスクロールされているよ');
    bIsMostBottom = true;
  }

  // コメントBOXを空にする方法１
  //chatDom.innerHTML = "";

  // コメントBOXを空にする方法２
  while( chatDom.firstChild ){
    chatDom.removeChild( chatDom.firstChild );
  }
  

  // コメントBOXを空にする方法３
  /*
  var clone = chatDom.cloneNode( false ); //ガワだけ複製して…
  chatDom.parentNode.replaceChild( clone , chatDom ); //すげ替え。
  */
  
  // マスターフラグメントをコメントBOXに貼り付ける
  chatDom.append(_masterFrag.cloneNode(true));
  

  // スクロールが一番下の状態であったならば引き続き一番下にスクロールしておく
  if(bIsMostBottom) {
    chatDom.scrollTop = chatDom.scrollHeight;
  }


}

function buildComment(node) {


  // HTMLのコメント文以外ならば
  if(node.querySelector) {

    let copyNode = node.cloneNode(true);
    _masterFrag.append(copyNode);
  
    if (copyNode.querySelector("[class^=___comment-number___]")) { // コメント番号のDOM
  
      //console.log("コメント番号 : " + copyNode.querySelector("[class^=___comment-number___]").outerText );
  
      var newNo = copyNode.querySelector("[class^=___comment-number___]").outerText;
  
      if (newNo.length > 0 && !copyNode.querySelector(".user_name_by_extention")) {
  
        //　パフォーマンス向上のためFragment内に仮想DOMとしてDOMを追加してから表示側のDOMに追加する
        let fragment = document.createDocumentFragment();
  
        // プレ垢のDOMを挿入
        if (_premiumList[newNo] === true) {
          InsertPremium(fragment);
        }
  
        // 名前のDOMを挿入
        if (_commentList[newNo]) {
  
          InsertUserName(fragment, newNo);
  
        } else {
          //console.log(`${newNo} に対応する名前がありません。取得失敗さんにします。`);
          _commentList[newNo] = "取得失敗";
          InsertUserName(fragment, newNo);
        }

        // 作成したDOMの挿入
        var comment = copyNode.querySelector("[class^=___comment-text___]"); // コメントテキストのDOM
        comment.parentNode.insertBefore(fragment, comment);
  
      }
    }
  
    // コメントに行送りを対応させるためクラスを付与
    //currentNode.classList.add('wordbreak');
    if (copyNode.querySelector("[class^=___comment-text___]").clientHeight > 28) {
      //console.log("YES  " + currentNode.querySelector("[class^=___comment-text___]").textContent + "  " + currentNode.querySelector("[class^=___comment-text___]").clientHeight);
      copyNode.querySelector("[class^=___comment-text___]").classList.add('multiple-line');
    } else {
      //console.log("NO  " + currentNode.querySelector("[class^=___comment-text___]").textContent + "  " + currentNode.querySelector("[class^=___comment-text___]").clientHeight);
      copyNode.querySelector("[class^=___comment-text___]").classList.add('one-line');
    }  
  }

}


/**
 * DOM要素を移動させます。
 * @param {HTMLElement} fragment 作成したDOMを追加する仮想DOM（呼び出し元で使用する）
 * @param {number} newNo 対象コメントのコメント番号です
 */
function InsertUserName(fragment, newNo) {

  // 生ID or 184ハッシュ値のDOMを作成-------------------
  // 右クリックメニューの[ユーザーIDをコピー] に使うだけで表示はしない
  let idElement = document.createElement("span");
  var idContent = document.createTextNode(_commentRawIdList[newNo]);
  idElement.appendChild(idContent);
  idElement.setAttribute("class", "user_id_by_extention");

  fragment.appendChild(idElement);


  // ユーザー名 or 184ハッシュ値のDOMを作成-------------------
  
  let userNameElement = document.createElement("span");
  var newContent = document.createTextNode(_commentList[newNo]);
  userNameElement.appendChild(newContent);

  if (_183UserList[newNo]) {
    userNameElement.setAttribute("class", "user_name_by_extention user184");
  } else {
    userNameElement.setAttribute("class", "user_name_by_extention");
  }
  userNameElement.setAttribute("title", _commentListFull[newNo]);

  fragment.appendChild(userNameElement);


  // コテハンのDOMを作成-------------------------------
  let currentNoId = _commentRawIdList[newNo];

  var kotehanElement = document.createElement("span");  
  let hitKotehan = _kotehanList.filter(function (x) { return x.id == currentNoId });

  if(hitKotehan[0]){

    // コテハンがHITした場合---------------

    let kotehanFull = hitKotehan[0].kotehan;
    let kotehan     = hitKotehan[0].kotehan;
    

    // 8文字より長い場合は省略
    if (kotehan.length > 7) {
      kotehan = kotehan.substring(0, 7) + "･･";
    }

    kotehanElement.setAttribute("class", "user_name_by_extention viewKotehan kotehan");

    let kotehanContent = document.createTextNode(kotehan);
    kotehanElement.appendChild(kotehanContent);
    kotehanElement.setAttribute("title", kotehanFull); 
    
  } else {

    // コテハンがHITしなかった場合---------

    let userName = _commentList[newNo];
    let fullUserName = _commentListFull[newNo];

    if (_183UserList[newNo]) {
      kotehanElement.setAttribute("class", "user_name_by_extention viewKotehan user184");
    } else {
      kotehanElement.setAttribute("class", "user_name_by_extention viewKotehan");
    }

    let kotehanContent = document.createTextNode(userName);
    kotehanElement.appendChild(kotehanContent);
    kotehanElement.setAttribute("title", fullUserName);

  }

  fragment.appendChild(kotehanElement);

  



}


function InsertPremium(fragment) {
  // 追加するDOMを作成
  var newElement = document.createElement("span");
  var newContent = document.createTextNode("P");
  newElement.appendChild(newContent);
  newElement.setAttribute("class", "premium_by_extention");
  newElement.setAttribute("title", "プレミアムアカウント");

  fragment.appendChild(newElement);

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
        minits = posArray[0] * 60;
        second = posArray[1];
        totalSec = minits + second;
      }

      //console.log(posArray);

    } else if (posArray.length == 3) {
      // 時間:分:秒　の場合
      hour = Number(posArray[0]) * 60 * 60;
      minits = posArray[1] * 60;
      second = posArray[2];
      totalSec = hour + minits + second;

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
      //console.log("再生開始秒数(vpos) : " + _startTime);
    }

    if (_startTime !== undefined && (message.chat.vpos + 10) > _startTime) {  // startTimeは常に更新してるので10秒?の足を履かせる
      
      //console.log(message);

      let yomiage_text = message.chat.content;
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
        if(yomiage_text.length > 0 && document.querySelector("#ext_logBox")){
          var newYomiCommentDom = document.createElement('p');
          var newYomiCommentText = document.createTextNode(yomiage_text);
          newYomiCommentDom.appendChild(newYomiCommentText);
          document.querySelector("#ext_logBox").appendChild(newYomiCommentDom);
        }

      }

      //console.log("読み上げます → [" + message.chat.no + "] " + yomiage_text);
    } else {
      //console.log('message.chat.vpos: ' + message.chat.vpos + ', _startTime: ' + _startTime);
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





function watchTime(mutationRecords, observer){ 
  // 一度に2つ以上のDOM追加にも対応
  mutationRecords.forEach(item => {
      _startTime = getStartPlayTime();
      //console.log("再生開始秒数(vpos) : " + _startTime);
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

