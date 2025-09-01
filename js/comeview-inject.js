/*---------------------------------------
 コメビュ機能
----------------------------------------*/

let _firstSegment = true;
let _kugiri = [];

// バイナリデータを解析してコメントを抽出する
function extractNicoLiveCommentContent(binaryData) {
  //const binaryData = new Uint8Array(hexString.split(/\s+/).map(byte => parseInt(byte, 16)));

  let commentObjcts = [];

  let offset = 0;

  function readVarInt() {
    let value = 0;
    let shift = 0;
    while (true) {
      const byte = binaryData[offset++];
      value |= (byte & 0x7F) << shift;
      if ((byte & 0x80) === 0) break;
      shift += 7;
    }
    return value;
  }

  function extractContent(length) {
    const endOffset = offset + length;
    const contentData = binaryData.slice(offset, endOffset);
    const content = new TextDecoder('utf-8').decode(contentData);
    offset += length;
    return content;
  }


  if(_firstSegment && binaryData.length >= 3 && binaryData[2] === 0x00) {
    _firstSegment = false;
    _kugiri[0] = binaryData[0];
    _kugiri[1] = binaryData[1];
    _kugiri[2] = binaryData[2];
    console.log("区切り文字を取得しました", _kugiri);
  }

  if (binaryData[0] === _kugiri[0]
      && binaryData[1] === _kugiri[1]
      && binaryData[2] === _kugiri[2]
  ){
    // console.log("SKIPします");
    offset += 3; // Skip [02 08 00]
  }

  while (offset < binaryData.length) {

    if (binaryData[offset] === 0x0A) {
      offset++; // Skip 0A
    }

    let commentObjct = {};

    // １コメント構造体の長さを取得
    const commentLength = readVarInt();
    const commentEndOffset = offset + commentLength;

    // console.log(`コメント開始 (長さ: ${commentLength})`);

    // メタデータをスキップ
    const metadataTag = readVarInt();
    if ((metadataTag & 0x07) !== 2) {
      //throw new Error(`予期しないメタデータタグ: ${metadataTag}`);
      console.error(`予期しないメタデータタグ: ${metadataTag}`);
      break;
    }
    const metadataLength = readVarInt();
    offset += metadataLength;

    // コンテンツデータ（親フィールド）の処理
    const contentTag = readVarInt();
    if ((contentTag & 0x07) !== 2) {
      //throw new Error(`予期しないコンテンツタグ: ${contentTag}`);
      console.error(`予期しないコンテンツタグ: ${contentTag}`);
    }
    const parentContentLength = readVarInt();

    offset++; // Skip 0A

    const subContentLength = readVarInt();

    offset++; // Skip 0A
    let currentSubContentLength = 0;
    currentSubContentLength++;

    const contentLength = readVarInt();
    currentSubContentLength += contentLength;

    // console.log(`コメント内容の長さ: ${contentLength} バイト`);

    // コメント内容の抽出
    const content = extractContent(contentLength);
    // console.log(`コメント内容: ${content}`);

    commentObjct.chat = {};
    commentObjct.chat.content = content;

    // console.log("currentSubContentLength : " + currentSubContentLength + ", subContentLength : " + subContentLength);


    while(currentSubContentLength < subContentLength) {

        let fieldTag = readVarInt();
        let fieldNumber = fieldTag >> 3;

        // console.log(fieldTag, fieldNumber);

        currentSubContentLength++;


        if(fieldNumber === 2) {
            // "name"
            const oldOffset = offset;
            const nameLength = readVarInt();
            currentSubContentLength += offset - oldOffset;

            const nameData = extractContent(nameLength);
            currentSubContentLength += nameLength;

            // console.log(`name: ${nameData}`);

            commentObjct.name = nameData;

        } else if(fieldNumber === 3) {
            // "vpos"
            const oldOffset = offset;
            const vpos = readVarInt();
            currentSubContentLength += offset - oldOffset;

            // console.log(`vpos: ${vpos}`);

            commentObjct.chat.vpos = vpos;

        } else if(fieldNumber === 4) {
            // "account_status"
            const oldOffset = offset;
            const account_status = readVarInt();
            currentSubContentLength += offset - oldOffset;

            // console.log(`account_status: ${account_status}`);

            commentObjct.chat.premium = account_status;

        } else if(fieldNumber === 5) {
            // "raw_user_id"
            const oldOffset = offset;
            const raw_user_id = readVarInt();
            currentSubContentLength += offset - oldOffset;

            // console.log(`raw_user_id: ${raw_user_id}`);

            commentObjct.chat.user_id = String(raw_user_id); // lengthを調べることがあるので文字列型に変換

        } else if(fieldNumber === 6) {
            // "hashed_user_id"
            const oldOffset = offset;
            const hashed_user_idLength = readVarInt();
            currentSubContentLength += offset - oldOffset;

            const hashed_user_idData = extractContent(hashed_user_idLength);
            currentSubContentLength += hashed_user_idLength;

            // console.log(`hashed_user_id: ${hashed_user_idData}`);

            commentObjct.chat.user_id = hashed_user_idData;

        } else if(fieldNumber === 7) {
            // "modifier"（コメントの修飾情報）
            const oldOffset = offset;
            const modifierLength = readVarInt();
            currentSubContentLength += offset - oldOffset;

            // console.log(`modifierLength: ${modifierLength}`);
            if(modifierLength !== 0x00) {

              //const modifier = extractContent(modifierLength);

              const endOffset = offset + modifierLength;
              const modifier = binaryData.slice(offset, endOffset);
              // console.log(`modifier: ${modifier}`);
              commentObjct.chat.modifier = modifier;
              offset += modifierLength;

              currentSubContentLength += modifierLength;
            }

            //commentObjct.modifier = modifier;

        } else if(fieldNumber === 8) {
            // "no"
            const oldOffset = offset;
            let no = readVarInt();
            currentSubContentLength += offset - oldOffset;

            // console.log(`no: ${no}`);

            commentObjct.chat.no = no;
        } else {
            // 未知のフィールド
            // console.log(`未知のフィールド number: ${fieldNumber}`);
            // console.log(`未知のフィールド tag: ${fieldTag}`);

            const oldOffset = offset;
            let someValue = readVarInt();
            commentObjct.chat.someValue = someValue;
            currentSubContentLength += offset - oldOffset;

            // console.log(`someValue: ${someValue}`);
            // console.log("現在の位置：currentSubContentLength : " + currentSubContentLength);
        }
    }

    recvChatComment(commentObjct);

    commentObjcts.push(commentObjct);

    offset = commentEndOffset;

    // console.log("--------------------");
  }

  return commentObjcts;
}

// fetchのインターセプトを行うため、オリジナルのfetch関数を保存
const originalFetch = window.fetch;

// 累積バッファを保持するオブジェクト（ストリームごとに個別のバッファを持つ）
const streamBuffers = new Map();

// fetchのインターセプト
window.fetch = function(...args) {
  const [resource, config] = args;
  const url = typeof resource === 'string' ? resource : resource.url;
  
  if( url.includes('mpn.live.nicovideo.jp/data/backward/v4')) {
    return originalFetch.apply(this, args).then(response => {

        //console.log('[backward] Fetch:', url);
        const clonedResponse = response.clone();
        
        clonedResponse.arrayBuffer().then(buffer => {
          //console.log('Fetched Niconico live comments buffer size:', buffer.byteLength);
  
          // ArrayBufferをUint8Arrayに変換
          const uint8Array = new Uint8Array(buffer);
  
          // console.log('Decoding Niconico live messages(backward)...', uint8Array);
          const decodedMessages = extractNicoLiveCommentContent(uint8Array);
          // console.log(JSON.stringify(decodedMessages, null, 2));
            
          //const extractedComments = extractComments(buffer);
          //console.log('Extracted comments count:', extractedComments.length);
          //worker.postMessage({ action: 'parseComments', comments: extractedComments });
  
        }).catch(error => {
          console.error('Error processing comment data:', error);
        });
      
      return response;
    });
    
  }
  else if (url.includes('mpn.live.nicovideo.jp/data/segment/v4'))
  {
    return originalFetch.apply(this, args).then(response => {

      //console.log('[segment] Fetch:', url);
      const originalBody = response.body;
      
      // 新しいReadableStreamを作成
      const newBody = new ReadableStream({
        start(controller) {
          const reader = originalBody.getReader();
          
          function pump() {
            return reader.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }
  
              // ArrayBufferをUint8Arrayに変換
              const uint8Array = new Uint8Array(value);

              // console.log('Decoding Niconico live messages(segment)...', uint8Array);
              const decodedMessages = extractNicoLiveCommentContent(uint8Array);
              // console.log(JSON.stringify(decodedMessages, null, 2));

              // 新しいストリームにデータを書き込む
              controller.enqueue(value);
              return pump();
            });
          }

          return pump();
        }
      });


      // 新しいResponseオブジェクトを作成して返す
      return new Response(newBody, response);
    });

  } else {

    // ニコ生のAPI以外は通常通り処理
    return originalFetch.apply(this, args);

  }
}


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

  // console.log("測定開始------------------");

  // console.time("getCommentsStringByUserId");
  // ユーザーIDが一致するコメントを抽出し、コメント番号の降順でソートする
  const userComments = _allComment
                          .filter(item => item.user_id === userId)  // 特定のユーザーIDで抽出
                          .filter(item => item.no <= commentNo);     // マウスカーソルが乗ったコメント番号以前のものを抽出
                          //.sort((a, b) => a.no - b.no);

  // console.timeEnd("getCommentsStringByUserId");

  // console.time("userComments");
  // 最新のコメントを末尾から最大10件取得する
  const latestComments = userComments.slice(-10).map(comment => ({ ...comment }));
  // console.timeEnd("userComments");

  
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


function setKotehanInInject(userId, kotehan, is184User) {
  // 現在の時間
  const currentTime = new Date().toISOString();

  console.log("currentTime : " + currentTime);

  let kotehanItem = {id: userId, kotehan: kotehan, is184User: is184User, createDate: currentTime};
        
  // 既に同じIDの人が登録されていれば削除してから追加
  _kotehanList = _kotehanList.filter(function (x) { return x.id !== userId }); // 削除
  _kotehanList.push(kotehanItem); // 追加

  // コテハン保存用のDOMにコテハンをテキストを挿入（結果、読み上げられる）
  let kotehanBox = document.getElementById("ext_kotehanBox");
  if(kotehanBox) {
    let item = { id : userId, kotehan : kotehan, type: "add", is184User: is184User, createDate: currentTime};
    let newYomiCommentDom = document.createElement('p');
    let newYomiCommentText = document.createTextNode(JSON.stringify(item));
    newYomiCommentDom.appendChild(newYomiCommentText);
    kotehanBox.appendChild(newYomiCommentDom);
    // console.log(newYomiCommentText);
  }  
}




let _startTime;
let _currentVoiceName = "";

let _commentListFull = {};  // KEY:コメント番号, VALUE:対応するユーザー名(フルネーム)（184さんならFullハッシュ値、生IDさんならFullユーザー名）
let _183UserList = {};      // KEY:コメント番号, VALUE:184ユーザーID
let _premiumList = {};      // KEY:コメント番号, VALUE:何でもいい値
let _rawUserListFull = {};  // KEY:ユーザーID,   VALUE:GETしてきたユーザー名(フルネーム)
let _gettingList = {};      // KEY:ユーザーID,   VALUE:何でもいい値

let _allComment = [];       // KEY:ユーザーID, 　

let _commentRawIdList = {}; // KEY:コメント番号  VALUE:ユーザーID（184さんならハッシュ値、生IDさんなら生IDが入る）
let _kotehanList = [];      // KEY:ユーザーID,   VALUE:コテハン

let _styleList = {};        // KEY:ユーザーID（184さんならハッシュ値、生IDさんなら生IDが入る）, VALUE: スタイルのindex番号(insertRule()した戻り値)

let _bIsIamOwner = false;           // 自分が配信者かどうか
let _bIsIamOwnerCheckOnce = false;  // 自分が配信者かどうか確認したかどうか

// WebSocketの受信イベントハンドラ
function recvEvent(event) {
  
}


function recvChatComment(message) {

  // 受信メッセージをJSON形式にパース
  // var message = "";
  // try {
  //   message = JSON.parse(event.data);
  // } catch (err) {
  //   return;
  // }

  
  // chatメッセージのみ解析
  if (message.chat) {

    // console.log("CHAT--------------------------------");
    // console.log(message);


    /*--------------------------------------------------------------
    //  読み上げ処理
    --------------------------------------------------------------*/
    if (_startTime === undefined || isNaN(_startTime)) {
      //_startTime = getStartPlayTime();
      //console.log("再生開始ミリ秒数(vpos) : " + _startTime);
    }

    if (_startTime !== undefined && (Number(message.chat.vpos) + (10 * 100)) > _startTime) {  // startTimeは常に更新してるので10秒の足を履かせる(vposは10ミリ秒単位なので+100すると1秒プラスと同じ)
    //if (_startTime !== undefined){
      
      /*--------------------------------------------------------------
      //  読み上げ
      --------------------------------------------------------------*/
      if(_yomiage_menu.getAttribute("ext-attr-on")) {

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


      /*--------------------------------------------------------------
      //  棒読みちゃん連携
      --------------------------------------------------------------*/
      if(_bouyomi_menu.getAttribute("ext-attr-on")) {

        let yomiage_text = message.chat.content.toLowerCase();
        let isSystemComment = false;
        
        // オプションの省略機能が有効ならば
        // if (yomiage_text.length > 0 && document.querySelector('.ext-bouyomi .option.syoryaku input').value ){
        //   let syouryaku = document.querySelector('.ext-bouyomi .option.syoryaku input').value;
        //   if(!isNaN(syouryaku) && syouryaku > 0) {
        //     if(yomiage_text.length >= syouryaku) {
        //       yomiage_text = yomiage_text.substr( 0, syouryaku );
        //       yomiage_text += "、以下略";
        //     }
        //   }
        // }

        // オプションの名前の読み上げ機能がONならば
        if (isSystemComment === false && document.querySelector('.ext-bouyomi .option.nameyomiage input').checked ){

          console.log("棒読み：message.chat.user_id : " + message.chat.user_id);
          console.log("棒読み：_rawUserListFull[message.chat.user_id] : " + _rawUserListFull[message.chat.user_id]);

          if (message.chat && message.chat.user_id && isNaN(message.chat.user_id)) {
            // 184さんの処理
            // yomiage_text += "　イヤヨ";
          } else if(_rawUserListFull[message.chat.user_id]){
            yomiage_text += "、" + _rawUserListFull[message.chat.user_id];
          }
        }

        // 読み上げ用のDOMに読み上げテキストを挿入（結果、読み上げられる）
        if(yomiage_text.length > 0 && document.getElementById("ext_bouyomiBox")){
          //console.log("正常系：comeview-inject.js : " + yomiage_text);
          var newYomiCommentDom = document.createElement('p');
          var newYomiCommentText = document.createTextNode(yomiage_text);
          newYomiCommentDom.appendChild(newYomiCommentText);
          document.getElementById("ext_bouyomiBox").appendChild(newYomiCommentDom);
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
    if(kotehanAt === 0){
      let kotehan = message.chat.content.substring(kotehanAt + 1); // ＠の次の文字から後ろを抽出
      if(kotehan && kotehan.length > 0) {
        kotehan = kotehan.substr( 0, 16 ); // 最大16文字(公式の仕様にあわせる)

        // 184ユーザーの判定
        let is184User = false;
        if (isNaN(message.chat.user_id)) {
          is184User = true;
        }

        // コテハンの保存
        setKotehanInInject(message.chat.user_id, kotehan, is184User);        
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

      // NG対象のコメントの場合は_allCommentに保存しない
      const ngData = JSON.parse(localStorage.getItem('LeoPlayer_NgStore_list') || '[]');
      const ngUserIds = new Set(ngData.filter(item => item.type === 'id').map(item => item.value));
      const ngWords = ngData.filter(item => item.type === 'word').map(item => item.value);
      if(!ngUserIds.has(message.chat.user_id) && !ngWords.some(word => message.chat.content.includes(word))) {

        _allComment.push({
          user_id: message.chat.user_id,
          vpos: message.chat.vpos,
          comment: message.chat.content,
          no: message.chat.no
        });
      
        if (_allComment.length > 20000) {
          console.log("保存しているコメント数が20000を超えたので古いコメントから半分削除します");
          _allComment.splice(0, 10000);
        } 

      } else {
        console.log("NG対象のコメントです", message.chat.no, message.chat.user_id, message.chat.content);
      }
    }

    /*--------------------------------------------------------------
    //  ユーザー名の取得処理
    --------------------------------------------------------------*/

    if (isNaN(message.chat.user_id)) {
      // 184さんの処理----------------------------
      _commentRawIdList[message.chat.no]  = message.chat.user_id;
      _commentListFull[message.chat.no]   = message.chat.user_id;
      _183UserList[message.chat.no]       = message.chat.user_id;
      
    } else {
      // 生IDさんの処理----------------------------
      _commentRawIdList[message.chat.no] = message.chat.user_id;

      // すでに名前を取得ずみであれば名前を取得しない
      if (_rawUserListFull[message.chat.user_id]) {
        _commentListFull[message.chat.no] = _rawUserListFull[message.chat.user_id];
        return;
      } else {
        // 仮でユーザーIDをいれておく
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
      //var getURL = "https://www.nicovideo.jp/user/" + message.chat.user_id + "/video?rss=2.0";
      //let getURL = "https://seiga.nicovideo.jp/api/user/info?id=" + message.chat.user_id;
      let getURL = "https://www.nicovideo.jp/user/" + message.chat.user_id;
      request.open('GET', getURL);
      request.send();
      request.addEventListener("load", function () {

        /*
        console.log("★★ " + message.chat.user_id+ " の名前を取得します。");
        console.log("★★ " + request.responseXML);
        console.log("★★ " + request.responseText);
        */

        if(request.responseText) {
          try {
            // HTMLをパースしてDOMDocumentを作成
            var parser = new DOMParser();
            var htmlDoc = parser.parseFromString(request.responseText, 'text/html');
            
            var userName = "";
            var userNameFull = "";
            
            // JSON-LDスキーマから名前を取得
            const jsonLdScript = htmlDoc.querySelector('script[type="application/ld+json"]');
            
            const jsonData = JSON.parse(jsonLdScript.textContent);
                
            // Person型のスキーマからnameを取得
            if (jsonData['@type'] === 'Person' && jsonData.name) {
              userName = jsonData.name;
              userNameFull = jsonData.name;
              console.log("★★ JSON-LDから名前を取得:", userName);


              _rawUserListFull[message.chat.user_id] = userNameFull;

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

            }
            
          } catch (error) {
            console.error("★★ HTML解析エラー:", error);
            console.log("★★ レスポンステキストの一部:", request.responseText.substring(0, 500));
          }
        }


        /*
        if (request.responseXML) {

          var xmlDom = request.responseXML.documentElement;
          var userNameFull = xmlDom.getElementsByTagName("dc:creator")[0].innerHTML;
          var userName = userNameFull;

          _rawUserListFull[message.chat.user_id] = userNameFull;

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
        */

      }, false);
    }

  }

}

function InsertUserName(fragment, newNo, bIsMyComment) {

  // 追加するアイコンのDOMを作成
  var iconElement = document.createElement("div");
  let hoverElement = document.createElement("div");

  if (_183UserList[newNo]) {
    // 184さんの処理----------------------------
    iconElement.classList.add("user_icon_by_extention");
    iconElement.setAttribute("style", "background-image: url(https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank.jpg);");

    hoverElement.classList.add("user_iconHover_by_extention");
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

    iconElement.classList.add("user_icon_by_extention");
    iconElement.setAttribute("style", "background-image: url(https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/" + iconPath + "/" + userId + ".jpg), url(https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank.jpg);");
    hoverElement = document.createElement("a");
    hoverElement.classList.add("user_iconHover_by_extention");
    hoverElement.setAttribute("style", "background-image: url(https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/" + iconPath + "/" + userId + ".jpg), url(https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank.jpg);");
    hoverElement.setAttribute("href", "https://www.nicovideo.jp/user/" + userId);
    hoverElement.setAttribute("target", "_blank");
  }

  iconElement.appendChild(hoverElement);

  // 自身がコメント主なら非表示にする(DOMは残しておかないとカラー機能が使えなくなる)
  if(bIsMyComment) {
    iconElement.classList.add("myComment");
  } 

  // 作成したDOMの挿入
  fragment.appendChild(iconElement);



/*---------------- コテハンDOMの処理 --------------------*/

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

  kotehanElement.classList.add("user_name_by_extention","viewKotehan", "kotehan");

  kotehanContent = document.createTextNode(kotehanFull);
  kotehanElement.appendChild(kotehanContent);
  kotehanElement.setAttribute("title", kotehanFull);
  kotehanElement.setAttribute("data-extension-userid", _commentRawIdList[newNo]);

} else {

  // コテハンがHITしなかった場合---------

  let fullUserName = _commentListFull[newNo];
  
  kotehan = _commentListFull[newNo]
  if (_183UserList[newNo]) {
    kotehanElement.classList.add("user_name_by_extention", "viewKotehan", "user184");
  } else {
    kotehanElement.classList.add("user_name_by_extention", "viewKotehan");
  }

  kotehanContent = document.createTextNode(kotehan);
  kotehanElement.appendChild(kotehanContent);  
  kotehanElement.setAttribute("title", fullUserName);
  kotehanElement.setAttribute("data-extension-userid", _commentRawIdList[newNo]);

}

// 自分のコメントなら非表示にする
if(bIsMyComment) {
  kotehanElement.classList.add("myComment");
}

// 作成したDOMの挿入
fragment.appendChild(kotehanElement);


  /*---------------- 名前DOMの処理 --------------------*/

  // 追加する名前のDOMを作成
  var nameElement = document.createElement("span");
  var nameContent = document.createTextNode(_commentListFull[newNo]);
  nameElement.appendChild(nameContent);

  if (_183UserList[newNo]) {
    nameElement.setAttribute("class", "user_name_by_extention user184");
  } else {
    nameElement.setAttribute("class", "user_name_by_extention");
  }
  nameElement.setAttribute("title", _commentListFull[newNo]);

  // 自身がコメ主なら非表示にする(DOMは残しておかないとカラー機能が使えなくなる)
  if(bIsMyComment) {
    nameElement.classList.add("myComment");
  }
  
  // 作成したDOMの挿入
  fragment.appendChild(nameElement);

/*
  console.log("--------------------------------");
  console.log(newNo + "番目のコメント");
  console.log(_kotehanList);
  console.log(_commentListFull);
  console.log(_commentRawIdList);
*/

  
  return fragment;
}


function InsertPremium(fragment, newNo, bIsOwner) {

  // 追加するDOMを作成
  var newElement = document.createElement("span");

  if(bIsOwner) {
    // 配信者のコメント ------------------
    // 配信者はプレ垢かどうか関わらずpremium==3になってるので配信者は(主)と表示
    newElement.setAttribute("class", "owner_by_extention");
    newElement.setAttribute("title", "配信者");

  } else {
    // リスナーのコメント ------------------
    if (_premiumList[newNo] === true) {
      newElement.setAttribute("class", "premium_by_extention");
      newElement.setAttribute("title", "プレミアムアカウント");   
    } else {
      newElement.setAttribute("class", "noPremium_by_extention");
      newElement.setAttribute("title", "一般アカウント");
    }  
  }

  // 作成したDOMの挿入
  fragment.appendChild(newElement);

  return fragment;
}


function watchCommentDOM(mutationsList, observer) {
  
  for (const mutation of mutationsList) {
    if(mutation.type === "childList"){
      // 初回動作以外
      mutation.addedNodes.forEach((currentNode) => {        
        editComment(currentNode, mutationsList);
      });

    }
  }
}

function editComment(currentNode) {
  const commentTextElement = currentNode.querySelector(".comment-text"); // コメントテキストのDOM
  const commentNumberDom = currentNode.querySelector(".comment-number"); // コメント番号のDOM

  // DOMの存在確認
  if (!commentNumberDom || !commentTextElement) { 
    return;
  }
  // コメント番号とテキストが存在しているか確認(「「アニメ」が好きな2人が来場しました」などのシステムメッセージの対応)
  if (commentNumberDom.textContent.length === 0 || commentTextElement.textContent.length === 0) {
    return;
  }



  // このノードのコメント番号を取得
  let newNo = commentNumberDom.textContent;

  // このノードのテキストを取得
  const commentText = commentTextElement.textContent;

  /*
  console.log("--------------------------------");
  console.log(`対象ノードの表示コメント番号 ${newNo}のコメントは「${commentText}」です`);
  const jsonComment = _allComment.filter(item => item.no >= newNo); 
  console.log(`JSONコメントのコメント番号${newNo}のコメントは「${jsonComment[0].comment}」です`);
  */

  // _allCommentに存在しないものはNGコメントとする
  const existComment = _allComment.filter(item => item.no == newNo);
  if(existComment.length === 0) {
    console.log("◆NGコメントです◆", newNo, commentText);

    // NGのコメント以降で一番近いコメント番号を採用
    const sameComments = _allComment.filter(item => item.comment === commentText).filter(item => item.no > newNo);
    if(sameComments.length > 0) {
      console.log(`${newNo} 番のコメントは受信したJSONコメントの ${sameComments[0].no}番として扱います`);
      console.log(sameComments);
      newNo = sameComments[0].no;
    }
  }
















  // このノードが既にeditCommentしたコメントかどうかを取得
  const bIsEdited = currentNode.getAttribute("data-extension-edited");

  // 既にeditCommentしたコメントはスキップ
  if (!bIsEdited) {

    // 自分のコメント かつ なふだコメント かどうかを判定
    let bIsMyComment = currentNode.querySelector(".user-thumbnail-image");
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

      // 名前のDOMを挿入
      if (_commentListFull[newNo]) {
      } else {
        //console.log(`${newNo} に対応する名前がありません。取得失敗さんにします。`);
        _commentListFull[newNo] = "取得失敗";
      }
      fragment = InsertUserName(fragment, newNo, bIsMyComment);


      // フラグメントを実DOMに挿入
      //let comment = currentNode.querySelector("[class^=___comment-text___]"); // コメントテキストのDOM
      //console.time("  insertBefore time");
      commentTextElement.parentNode.insertBefore(fragment, commentTextElement);
      //console.timeEnd("  insertBefore time");

    } else {

      //----------------------------------------------------------------
      //　なふだコメントの場合（自分で発言したなふだコメント、または配信者がわからみたなふだコメント、が対象）
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
      } else {
        //console.log(`${newNo} に対応する名前がありません。取得失敗さんにします。`);
        _commentListFull[newNo] = "取得失敗";
      }
      fragment = InsertUserName(fragment, newNo , bIsMyComment);

      // フラグメントを実DOMに挿入
      let comment = currentNode.querySelector(".user-thumbnail-image"); // なふだ機能のアイコンと名前の親DOM
      comment.parentNode.insertBefore(fragment, comment);
      // let comment = currentNode.querySelector(".user-thumbnail-image"); // なふだ機能のユーザーアイコン
      // comment.after(fragment);

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




function startWatchCommentDOM(mutationsList, observer) {

  if(!mutationsList || mutationsList[0].addedNodes.length > 0) {

    console.log("startWatchCommentDOM", mutationsList);

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

      //監視オプション
      const options = {
        childList: true,  //直接の子の変更を監視
        characterData: false,  //文字の変化を監視
        characterDataOldValue: false, //属性の変化前を記録
        attributes: false,  //属性の変化を監視
        subtree: false, //全ての子要素を監視
      }

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

    let myKotehanDom_span = document.createElement('span');
    myKotehanDom_span.id = "ext_myKotehanDom_comment";
    myKotehanDom_span.innerText = "コテハンを入力してください(最大16文字)";
    myKotehanDomCenter.appendChild(myKotehanDom_span);

    let inputKotehan = document.createElement("input");
    inputKotehan.setAttribute("type", "text");
    inputKotehan.setAttribute("id", "ext_myKotehanInput");
    inputKotehan.setAttribute("autocomplete", "off");
    inputKotehan.setAttribute("placeholder", "コテハンを入力してください");
    inputKotehan.setAttribute("maxlength", "16");
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
        
    // DOMに追加
    myKotehanDom.appendChild(myKotehanDomCenter);
    document.querySelector("[class^=___comment-data-grid___]").appendChild(myKotehanDom);


    document.getElementById("ext_myKotehanInput").addEventListener("keydown", function(e) {
      if (e.key === "Enter") {
        document.getElementById("ext_myKotehanBox_OkBtn").click();
      }
    });

    document.getElementById("ext_myKotehanBox_OkBtn").addEventListener('click', function(e) {

      console.log("クリックイベント発生")

      document.getElementById("ext_myKotehanBox").classList.remove("show");

      let kotehan = document.getElementById('ext_myKotehanInput').value;
      if(kotehan.length > 0) {

        setKotehanInInject(mouseClick.userId, kotehan, mouseClick.is184User);

        // 表示中のコメントのコテハンを変更
        // var currentCommentList = document.querySelectorAll('.user_name_by_extention');
        const currentCommentList = document.querySelectorAll('[data-extension-userid]');
        for (var i = 0; i < currentCommentList.length; i++) {
          //console.log("名前比較", currentCommentList[i].getAttribute("data-extension-userid"), mouseClick.userId);
          if (currentCommentList[i].getAttribute("data-extension-userid") == mouseClick.userId) {
            currentCommentList[i].innerText = kotehan;
            currentCommentList[i].classList.add("kotehan");
            currentCommentList[i].classList.remove("user184");
          }
        }                  
      }
    });  
    document.getElementById("ext_myKotehanBox_ClearBtn").addEventListener('click', function(e) {
      document.getElementById("ext_myKotehanBox").classList.remove("show");

      _kotehanList = _kotehanList.filter(function (x) { return x.id !== mouseClick.userId }); // 削除
      // コテハン保存用のDOMにコテハンをテキストを挿入（結果、読み上げられる）
      let kotehanBox = document.getElementById("ext_kotehanBox");
      if(kotehanBox) {
        let item = { id : mouseClick.userId, kotehan : "", type: "delete"};
        var newYomiCommentDom = document.createElement('p');
        var newYomiCommentText = document.createTextNode(JSON.stringify(item));
        newYomiCommentDom.appendChild(newYomiCommentText);
        kotehanBox.appendChild(newYomiCommentDom);
      }
      // 表示中のコメントのコテハンを変更
      const currentCommentList = document.querySelectorAll('[data-extension-userid]');
      for (var i = 0; i < currentCommentList.length; i++) {
        //console.log("名前比較", currentCommentList[i].getAttribute("data-extension-userid"), mouseClick.userId);
        if (currentCommentList[i].getAttribute("data-extension-userid") == mouseClick.userId) {

          if(mouseClick.is184User) {
            currentCommentList[i].innerText = mouseClick.userId;
            currentCommentList[i].classList.remove("kotehan");
            currentCommentList[i].classList.add("user184");  
          } else {
            currentCommentList[i].innerText = mouseClick.userName;
            currentCommentList[i].classList.remove("kotehan");
            //currentCommentList[i].classList.add("user184");
          }
        }
      }
    });
    document.getElementById("ext_myKotehanBox_CancelBtn").addEventListener('click', function(e) {
      document.getElementById("ext_myKotehanBox").classList.remove("show");
    }); 
  }
}

let mouseOver = {
  userId: 0,      // マウスオーバーしたコメントのユーザーID
  commentNo: 0    // マウスオーバーしたコメントのコメント番号
}

let mouseClick = {
  userId: 0,        // クリックしたコメントのユーザーID
  commentNo: 0,     // クリックしたコメントのコメント番号
  userName: "",     // クリックしたコメントのユーザー名
  is184User: false, // クリックしたコメントが184さんかどうか
  userComment: "",  // クリックしたコメントの内容
  kotehan: ""       // クリックしたコメントのコテハン（あれば）
}

function startWatchGridDOM() {
  
  const target = document.querySelector("[class^=___comment-data-grid___]");
  if(!target) return;

  //監視オプション
  const optionsForGrid = {
    childList: true,              //直接の子の変更を監視
    characterData: false,         //文字の変化を監視
    characterDataOldValue: false, //属性の変化前を記録
    attributes: false,            //属性の変化を監視
    subtree: false,               //全ての子要素を監視
  }  

  const obs = new MutationObserver(function(mutationsList, observer){

    // const tootlTip = document.getElementById('ext_tooltipBox');

    //console.log(mutationsList);

    for (const mutation of mutationsList) {
      if(mutation.addedNodes.length > 0) {

        /*
        // ツールチップ関係
        if(document.querySelector("[class^=___tooltip___]")) {
          if(mouseOver.userId !== 0 && mouseOver.commentNo !== 0) {
            // ツールチップの表示テキストを取得
            if(tootlTip) tootlTip.innerText = getCommentsStringByUserId(mouseOver.userId, mouseOver.commentNo);
          }
        }
        */


        // 色関係
        if(document.querySelector("[class^=___context-menu___]") && !document.querySelector("[class^=___context-menu___]:empty")) {
          // 上記、:empty は、ニコ生のDOMが「へもさんが100ptニコニコ広告しました」などのシステムメッセージを右クリックした場合、コンテキストメニューのDOMが表示されていないのにDOM上は存在している状態になってしまう仕様があり、それを回避するためのもの。

          if( !document.querySelector("[class^=___context-menu___] .ext-menu") && mouseClick.userId !== 0 ) {

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
            liElement.id = "menu-setColor";
            inputElement.setAttribute("class", "extention");
            inputElement.setAttribute("type", "color");
            labelElement.innerText = "文字色を設定";


            if(_styleList[mouseClick.userId] && _styleList[mouseClick.userId].textColor !== -1) {
              inputElement.value = _styleList[mouseClick.userId].textColor;
            } else {
              inputElement.value = "#000000";
            }
            
            // カラーピッカーの色を動かしたときのイベント
            inputElement.addEventListener('input', function(e) {
              //console.log("色をつけます" , currentUserID, this.value);

              if(!_styleList[mouseClick.userId]) {
                let objct = {textIndex : -1, textColor: -1, bgIndex : -1, bgColor: -1};
                _styleList[mouseClick.userId] = objct;
              }

              //スタイルシートの設定
              if(_styleList[mouseClick.userId].textIndex !== -1) {
                // 追加済みなら置換
                style.sheet.deleteRule(_styleList[mouseClick.userId].textIndex);
                style.sheet.insertRule('[ext-master-comeview][ext-opt-color] .content-area:has([data-extension-userid="'+ mouseClick.userId + '"]) .comment-text {color: ' + this.value + '!important;}', _styleList[mouseClick.userId].textIndex);
              } else {
                let index = style.sheet.insertRule('[ext-master-comeview][ext-opt-color] .content-area:has([data-extension-userid="'+ mouseClick.userId + '"]) .comment-text {color: ' + this.value + '!important;}', style.sheet.cssRules.length);
                _styleList[mouseClick.userId].textIndex = index;
              }
              //console.log("index", style.sheet.cssRules);

              // 色を選択しているユーザーIDを保存しておく
              _tempCurrentUserID = mouseClick.userId;
            
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
            liBgColorElement.id = "menu-setBgColor";
            let labelBgColorElement = document.createElement("label");
            let inputBgColorElement = document.createElement("input");
            inputBgColorElement.setAttribute("class", "extention");
            inputBgColorElement.setAttribute("type", "color");
            labelBgColorElement.innerText = "背景色を設定";


            if(_styleList[mouseClick.userId] && _styleList[mouseClick.userId].bgColor !== -1) {
              inputBgColorElement.value = _styleList[mouseClick.userId].bgColor;
            } else {
              inputBgColorElement.value = "#ffffff";
            }

            // カラーピッカーの色を動かしたときのイベント
            inputBgColorElement.addEventListener('input', function(e) {


              if(!_styleList[mouseClick.userId]) {
                let objct = {textIndex : -1, textColor: -1, bgIndex : -1, bgColor: -1};
                _styleList[mouseClick.userId] = objct;
              }

              //スタイルシートの設定
              if(_styleList[mouseClick.userId].bgIndex !== -1) {
                // 追加済みなら置換
                style.sheet.deleteRule(_styleList[mouseClick.userId].bgIndex);
                style.sheet.insertRule('[ext-master-comeview][ext-opt-color] span:has([data-extension-userid="'+ mouseClick.userId + '"] ) { background-color: ' + this.value + ';}', _styleList[mouseClick.userId].bgIndex);
              } else {
                // 未追加なら追加
                let index = style.sheet.insertRule('[ext-master-comeview][ext-opt-color] span:has([data-extension-userid="'+ mouseClick.userId + '"] ) { background-color: ' + this.value + ';}', style.sheet.cssRules.length);
                _styleList[mouseClick.userId].bgIndex = index;  
              }
              // console.log("index", style.sheet.cssRules);

              // 色を選択しているユーザーIDを保存しておく
              _tempCurrentUserID = mouseClick.userId;
            
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
            liResetColorElement.id = "menu-resetColor";
            let labelResetColorElement = document.createElement("label");
            labelResetColorElement.innerText = "色設定をクリア";

            // 色設定をクリアするボタンのイベント              
            liResetColorElement.addEventListener('click', function(e) {
              console.log("色設定を削除します", mouseClick.userId, _styleList);

              if(_styleList[mouseClick.userId] && _styleList[mouseClick.userId].textIndex !== -1) {
                // 追加済みなら置換
                style.sheet.deleteRule(_styleList[mouseClick.userId].textIndex);
                style.sheet.insertRule('span.user_name_by_extention.viewKotehan[data-extension-userid="'+ mouseClick.userId + '"] + span {color: #000000;}', _styleList[mouseClick.userId].textIndex);
                _styleList[mouseClick.userId].textColor = "#000000";
              }

              if(_styleList[mouseClick.userId] && _styleList[mouseClick.userId].bgIndex !== -1) {
                // 追加済みなら置換
                style.sheet.deleteRule(_styleList[mouseClick.userId].bgIndex);
                style.sheet.insertRule('span:has([data-extension-userid="'+ mouseClick.userId + '"] ) { background-color: inherit;}', _styleList[mouseClick.userId].bgIndex);
                _styleList[mouseClick.userId].bgColor = "#ffffff";
              }

              // コンテキストメニューを閉じる
              document.querySelector('[class^=___context-menu___]').style.display = "none"


              // カラー情報を保存するDOMに保存
              let colorBox = document.getElementById("ext_colorBox");
              if(colorBox) {
                let item = { 
                  id : mouseClick.userId,
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
            //liKotehanElement.style.display = "none";
            liKotehanElement.id = "menu-kotehan";
            let labelKotehanElement = document.createElement("label");
            labelKotehanElement.innerText = "コテハンを設定";              

            // コテハン設定ボタンのClickイベント
            liKotehanElement.addEventListener('click', function(e) {
              document.getElementById('ext_myKotehanBox').classList.add("show");
              document.getElementById('ext_myKotehanInput').focus();
              document.getElementById('ext_myKotehanInput').value = mouseClick.kotehan;
              // document.getElementById('ext_myKotehanDom_comment').innerText = userComment;

              // コンテキストメニューを閉じておく
              document.querySelector('[class^=___context-menu___]').style.display = "none"              
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
            /*
            let commentContext = document.querySelector("[class^=___program-comment-menu___]"); // コメント関係のメニューDOMを指定
            if(commentContext && commentContext.parentNode){
              commentContext.parentNode.insertBefore(ulElement, commentContext);    
            }
            */

           /*
           　以下のDOMに対して、コンテキストメニューのメニューを追加する
            <div class="___context-menu___YxhCJ context-menu" style="position: absolute; left: 177px; top: 181px;">
              <!-- ★ここに挿入★ -->
              <button class="___button___wbaq8 comment-copy-button" type="button">コメントをコピー</button>
              <button class="___button___wbaq8 user-id-copy-button" type="button">ユーザーIDをコピー</button>
              <button class="___button___wbaq8 program-seek-to-comment-position-button" type="button">コメントが投稿された時点から視聴</button>
              <hr>
              <button class="___button___wbaq8 ng-comment-register-button" type="button">コメントをNGに追加</button>
              <button class="___button___wbaq8 ng-user-id-register-button" type="button">ユーザーIDをNGに追加</button>
              <hr>
              <button class="___button___wbaq8 comment-allegation-button" type="button">荒らし通報</button>
            </div>
            */
            let commentContext = document.querySelector("[class^=___context-menu___]"); // コメント関係のメニューDOMを指定
            if(commentContext && commentContext.parentNode){
              commentContext.insertBefore(ulElement, commentContext.firstChild);  
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

  document.querySelector("[class^=___comment-data-grid___]").addEventListener("mouseover", function(e) {
    // マウスオーバーしたコメント情報を保存（ツールチップや色関係で使う）
    if (e.target.parentNode && e.target.closest("[class^=___table-cell___]")) {
      const commentDom = e.target.closest("[class^=___table-cell___]").querySelector(".comment-number");
      if(commentDom && commentDom.innerText) {

        // ツールチップに表示するコメント番号が変わったらツールチップを更新
        if(mouseOver.commentNo !== commentDom.innerText) {
          // console.log("ツールチップを更新", mouseOver.commentNo);
          mouseOver.userId = _commentRawIdList[commentDom.innerText];
          mouseOver.commentNo = commentDom.innerText;

          // ツールチップを更新
          const tootlTip = document.getElementById('ext_tooltipBox');
          if(tootlTip) tootlTip.innerText = getCommentsStringByUserId(mouseOver.userId, mouseOver.commentNo);
        }


      } else {
        mouseOver.userId = 0;
        mouseOver.commentNo = 0;
      }
    }
  });    

  document.querySelector("[class^=___comment-data-grid___]").addEventListener("mousemove", function(e) {
    // マウスカーソルを移動したときにツールチップを追従させる
    const tootlTip = document.getElementById('ext_tooltipBox');
    if(tootlTip) {
      if(mouseOver.userId !== 0 && mouseOver.commentNo !== 0) {

        tootlTip.classList.add("show");

        // 要素の位置を更新。 要素の右下の座標を計算。
        const right = e.clientX - 10;
        const bottom = e.clientY - 30;
  
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
    // マウスが離れたらツールチップを非表示にする
    const tootlTip = document.getElementById('ext_tooltipBox');
    // tootlTip.style.display = "none";
    if(tootlTip) tootlTip.classList.remove("show");
  }); 

  // ツールチップや色関係で使うユーザーIDを取得する
  document.querySelector("[class^=___comment-data-grid___]").addEventListener("mousedown", function(e) {
    // 右クリックからコンテキストメニューを表示した際のクリックしたコメント情報を保存    
    if (e.button == 2 && e.target.parentNode) { // 右クリックの場合、かつ、親のDOMが存在する場合

      let commentDom = e.target.closest("[class^=___table-cell___]").querySelector(".comment-number");
      let userNameDom = e.target.closest("[class^=___table-cell___]").querySelector(".user_name_by_extention");
      let userCommentDom = e.target.closest("[class^=___table-cell___]").querySelector(".comment-text");

      if(commentDom && commentDom.innerText 
        && userCommentDom && userCommentDom.innerText 
        && userNameDom && userNameDom.innerText
      ) {

        mouseClick.userId = _commentRawIdList[commentDom.innerText];
        mouseClick.commentNo = commentDom.innerText;
        mouseClick.userComment = userCommentDom.innerText;
        mouseClick.userName = userNameDom.innerText;

        if(e.target.closest("[class^=___table-cell___]").querySelector(".user_name_by_extention.user184")){
          mouseClick.is184User = true;
        } else {
          mouseClick.is184User = false;
        }

        const userKotehanDom = e.target.closest("[class^=___table-cell___]").querySelector(".user_name_by_extention.kotehan");
        if(userKotehanDom) {
          mouseClick.kotehan = userKotehanDom.innerText;
        } else {
          mouseClick.kotehan = ""; // ちゃんと初期化する
        }
        
        console.log("クリックしたコメント情報", mouseClick);      
      }
    }
  });    
}



let _yomiage_menu;
let _bouyomi_menu;

window.addEventListener('load', function () {
  
  

  // コメントDOMの監視を開始
  startWatchCommentDOM();

  // コメントDOMの親DOMの監視を開始(フルスクリーン解除時、放送ネタ画面の表示時に対応するため)
  const target_parent = document.querySelector("[class^=___contents-area___]"); // コメントDOMの大元の親DOMを指定
  if (target_parent) {
    const obs = new MutationObserver(startWatchCommentDOM);
    //監視オプション
    const options = {
      childList: true,              //直接の子の変更を監視
      characterData: false,         //文字の変化を監視
      characterDataOldValue: false, //属性の変化前を記録
      attributes: false,            //属性の変化を監視
      subtree: false,               //全ての子要素を監視
    }
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

        // 表示中のコメントのコテハンを変更
        const currentCommentList = document.querySelectorAll('[data-extension-userid]');
        for (var i = 0; i < currentCommentList.length; i++) {
          for(kotehan of _kotehanList) {
            // console.log("名前比較", currentCommentList[i].getAttribute("data-extension-userid"), kotehan.id);
            if (currentCommentList[i].getAttribute("data-extension-userid") == kotehan.id) {
              currentCommentList[i].innerText = kotehan.kotehan;
              currentCommentList[i].classList.add("kotehan");
              currentCommentList[i].classList.remove("user184");
              break;
            }
          }
        }        
      } else {
        console.log("コテハンがありません");
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
            _styleList[key].textIndex = style.sheet.insertRule('[ext-master-comeview][ext-opt-color] .content-area:has([data-extension-userid="' + key + '"]) .comment-text {color: ' + val.textColor + '!important;}', style.sheet.cssRules.length);
          }
        }, _styleList);

        console.log("最終カラー情報");
        console.log(_styleList);
      }



      // 自身が配信者の場合のなふださんのコメント　もしくは、　自身がなふだコメントしたときのコメント　に対して、
      // 名前をクリックしたときに、プロフィール画面を開く
      const playerArea = document.querySelector("[class^=___player-area___]");
      if(playerArea) {
        document.body.addEventListener('click', function(event) {
          const clickedElement = event.target.closest('.user-summary-area .user_name_by_extention');
          if (clickedElement) {
            // console.log('挿入された要素がクリックされました！');
            const thumbnailImage = clickedElement.closest('.user-summary-area').querySelector('.user-thumbnail-image');
            if (thumbnailImage) {
              thumbnailImage.click();
            } else {
              // console.log('.user-thumbnail-image not found');
            }
          }
        });
      }


      // パフォーマンス改善のため、読み上げメニューを一度だけ取得しておく
      _yomiage_menu = document.querySelector('.ext-setting-menu .ext-yomiage');

      _bouyomi_menu = document.querySelector('.ext-setting-menu .ext-bouyomi');


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