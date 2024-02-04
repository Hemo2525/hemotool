let _callbackId;
let _canvasCtx;
let _pip_comment;
let _pip_video;
let _pip_game;
var _pip_Canvas;
let _videoElementForPip;

let _videoBitrate;
//let _opt_kaku;


function setRecBitrato(value) {
    _videoBitrate = value;
}

function getRecBitrato() {
    return _videoBitrate;
}
/*
function setRecKaku(value) {
    if(value === "webm") {
        _opt_kaku = "webm";
    } else if(value === "mp4") {
        _opt_kaku = "mp4";
    } else {
        // Default
        _opt_kaku = "webm";
    }
}
function getRecKaku() {
    return _opt_kaku;
}

function apllyRecSize(value) {
    if(value === "FULLHD") {
        _pip_Canvas.width  = 1920;
        _pip_Canvas.height = 1080;
    } else if(value === "HD") {
        _pip_Canvas.width  = 1280;
        _pip_Canvas.height = 720;
    } else if(value === "SD") {
        _pip_Canvas.width  = 854;
        _pip_Canvas.height = 480;
    } else {
        // Default
        _pip_Canvas.width  = 1280;
        _pip_Canvas.height = 720;
    }
}
*/

window.addEventListener('load', function() {

    if(location.href.startsWith("https://live.nicovideo.jp/")){

        var insertHere = document.querySelector('[class^=___player-area___]');
        if(insertHere){
        } else {
            return;
        }

        
        // canvas要素をつくる
        let downloadBtn = document.createElement('a');
        downloadBtn.id = 'downloadlink';
        downloadBtn.style.display = 'none';
        insertHere.appendChild(downloadBtn);

        // 各DOM要素を取得しておく
        _pip_comment = document.querySelector('div[data-layer-name="commentLayer"] canvas');
        _pip_video = document.querySelector('div[data-layer-name="videoLayer"] video');
        _pip_game = document.querySelector('div[data-layer-name="akashicGameViewLayer"] canvas');

        // 動画とコメントを統合する用のcanvas要素をつくる
        _pip_Canvas = document.createElement('canvas');
        _pip_Canvas.id = 'hemo-canvas';
        _pip_Canvas.style.display = 'none';
        
        _pip_Canvas.width  = 1280;
        _pip_Canvas.height = 720;

        //let playerArea =  document.querySelector('[class^=___player-display-screen]');
        //if(playerArea){
            /*
            _pip_Canvas.width  = playerArea.clientWidth;
            _pip_Canvas.height = playerArea.clientHeight;
            */
           /*
            _pip_Canvas.width  = 1920;
            _pip_Canvas.height = 1080;
            */
           /*
            _pip_Canvas.width  = 1280;
            _pip_Canvas.height = 720;
           */
            /*
            1080p：1920×1080（フルHD）
            720p：1280×720（HD）
            480p：854×480（SD）
            */
        //}

        var insertHere = document.querySelector('[class^=___player-area___]');
        if(insertHere){
            insertHere.appendChild(_pip_Canvas);
        }


        // コンテキストを取得しておく
        _canvasCtx = _pip_Canvas.getContext('2d');

        
        // キャンバスが空だとPIP時にエラーになるので一瞬何かを描画しておく
        _canvasUpdate_forPip();
        cancelAnimationFrame(_callbackId);
        
        // PIP用の統合videoを作成しておく
        _videoElementForPip = document.createElement('video');
        _videoElementForPip.muted = true;           // PIPに必須
        _videoElementForPip.playsInline = true;     // PIPに必須
        _videoElementForPip.srcObject = _pip_Canvas.captureStream(60);
        
        // PIP終了時のイベント
        _videoElementForPip.addEventListener("leavepictureinpicture", onExitPip, false);    
    }
});

function onExitPip() {

    // ショートカットを非アクティブ状態
    document.querySelector('#ext_shortcut .item.picture').removeAttribute("active");

    // ニコ生の映像を表示
    _pip_video.style.visibility = "visible";
    
    // 統合video を停止
    _videoElementForPip.pause();

    // 統合canvas を停止
    cancelAnimationFrame(_callbackId);

    document.querySelector('.ext-setting-menu .ext-pip').removeAttribute("ext-attr-on");
}








//let _recorder;
//let _videoBlob;
let _bangumiUserName;
let _bangumiTitle;
let _startRecTime;
//var _mediaParts;
var _recStartTime;
let _recTimerId;











function recStop() {
    
    encodeWorker.postMessage({ type: 'stop'});
    document.querySelector('#ext_shortcut .item.rec').removeAttribute("recording");
    document.querySelector('#ext_shortcut .item.rec .recBtn').textContent = "録画開始";
    document.querySelector('#ext_shortcut .item.rec .status').removeAttribute("rec");
    document.querySelector('#ext_shortcut .item.rec').setAttribute("aria-label", "録画を開始します");  

    // オプション操作を有効化
    document.querySelector('.option.videoBitrato select').removeAttribute("disabled");
    /*
    document.querySelector('.option.size select').removeAttribute("disabled");
    document.querySelector('.option.kaku select').removeAttribute("disabled");
    */
    

    clearInterval(_recTimerId);
    //_recorder.stop();
    cancelAnimationFrame(_callbackId);

    return;
}


let encodeWorker = null;
let stream = null;
let videoTrack = null;

async function startRecording(handle, videoOutputStream) {
    console.assert("録画開始");

    console.log("videoOutputStream.getTracks()", videoOutputStream.getTracks());

    videoTrack = videoOutputStream.getTracks()[1];
    console.log("★ビデオトラック", videoTrack);
    let trackSettings = videoTrack.getSettings();
    console.log("★セッティング", trackSettings);

    let trackProcessor = new MediaStreamTrackProcessor(videoTrack);
    let frameStream = trackProcessor.readable;
    
    var newWorkerViaBlob = function(relativePath) {
        var array = ['importScripts("' + relativePath + '");'];
        var blob = new Blob(array, {type: 'text/javascript'});
        var url = window.URL.createObjectURL(blob);

        // エンコーダーのI/Oとファイルの書き込みは、UIの応答性を保つためにWorkerで行われる。
        return new Worker(url);
    };
    
    encodeWorker = newWorkerViaBlob(chrome.runtime.getURL('/js/lib/encode-worker.js'));
    
    encodeWorker.addEventListener("message", (e) => {
        console.log("parent received message:", e.data);
        if(e.data === "finish") {
            encodeWorker.terminate();
        }
      });

    audioTrack = videoOutputStream.getTracks()[0];
    let trackProcessor_audio = new MediaStreamTrackProcessor({ track: audioTrack });
    let audioStream = trackProcessor_audio.readable;

    // ワーカーに、フレームのエンコードとファイルの書き込みを開始するよう伝える。
    // 注: ここで frameStream を読み込んで VideoFrames を個別に転送するよりも、frameStream を転送してワーカーで読み込む方が効率的です。
    //これにより、 メイン（UI）スレッドでのフレーム処理を完全に回避できます。
    encodeWorker.postMessage({
      type: 'start',
      fileHandle: handle,
      frameStream: frameStream,
      trackSettings: trackSettings,
      importUrl : chrome.runtime.getURL('/js/lib/mp4-muxer.min.js'),
      audioStream : audioStream,
      videoBitrate: getRecBitrato()
    }, [frameStream, audioStream]);

  }


async function recStart() {

    // 配信者名、番組名、録画開始時間を取得
    _bangumiUserName = "";
    _bangumiTitle = "";
    let bangumiUserDom = document.querySelector('[class^=___user-name-area___] .name');
    if(bangumiUserDom) {
        _bangumiUserName = escapeFileName(bangumiUserDom.textContent);
    } else {
        let bangumiChannelDom = document.querySelector('[class^=___channel-name-anchor___]');
        if(bangumiChannelDom) {
            _bangumiUserName = escapeFileName(bangumiChannelDom.textContent);
        }
    }
    let bangumiTitleDom = document.querySelector('h1[class^=___program-title___] > span');
    if(bangumiTitleDom) {
        _bangumiTitle = escapeFileName(bangumiTitleDom.textContent);
    }
    _startRecTime = getCurrentDateTimeFormatted();
  

    // 名前をつけて保存ダイアログを表示
    let handle;
    try {
        handle = await window.showSaveFilePicker({
            startIn: 'videos',
            //suggestedName: 'myVideo.mp4',
            suggestedName: `[${_bangumiUserName}]_${_startRecTime}_${_bangumiTitle}.mp4`,
            types: [{
              description: 'Video File',
              accept: {'video/mp4' :['.mp4']}
              }],
        });
    
    } catch(e) {
        // 名前をつけて保存ダイアログでキャンセルを押した場合
        return;
    }
    
    document.querySelector('#ext_shortcut .item.rec').setAttribute("recording", "ON");
    document.querySelector('#ext_shortcut .item.rec .recBtn').textContent = "録画停止";
    document.querySelector('#ext_shortcut .item.rec .status').setAttribute("rec", "on");
    document.querySelector('#ext_shortcut .item.rec').setAttribute("aria-label", "録画を停止します");

    _canvasUpdate();

    // <video>からAudioTrackを取得
    var video = document.querySelector('div[data-layer-name="videoLayer"] video');
    video.setAttribute("crossorigin", "anonymous");
    let stream = video.captureStream();  
    let audioTrack = new MediaStream(stream.getAudioTracks());

    // AudioTrackの出力先を作成したAudioContextに接続
    var ctx = new AudioContext();
    var source = ctx.createMediaStreamSource(audioTrack);
    var stream_dest = ctx.createMediaStreamDestination(); // 出力先を取得
    source.connect(stream_dest);

    // grab the real MediaStream
    let audioStream = stream_dest.stream;



    var videoOutputStream = _pip_Canvas.captureStream(60);
    [audioStream, videoOutputStream].forEach(function(s) {
        s.getTracks().forEach(function(t) {
            videoOutputStream.addTrack(t);
        });
    });

    
    //startRecording(_pip_Canvas.captureStream(60));
    startRecording(handle, videoOutputStream);


    _recStartTime = Date.now();

    // タイマー開始        
    _recTimerId = setInterval(function(){
        const currentTime = Date.now();
        const elapsedTimeInSeconds = Math.floor((currentTime - _recStartTime) / 1000); // 経過時間を秒単位で取得
        const h = String(Math.floor(elapsedTimeInSeconds / 3600)).padStart(2, "0");
        const m = String(Math.floor((elapsedTimeInSeconds % 3600) / 60)).padStart(2, "0");
        const s = String(elapsedTimeInSeconds % 60).padStart(2, "0");
        document.querySelector('#ext_shortcut .item.rec').setAttribute('aria-label', `${h}:${m}:${s}`);
    }, 1000);
    
    
    return;
}


function downloadURI(uri, name) {
    // <------------------------------------------       Do something (show loading)
        fetch(uri)
            .then(resp => resp.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.getElementById('downloadlink');
                a.style.display = 'none';
                a.href = url;
                // the filename you want
                a.download = name;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                // <----------------------------------------  Detect here (hide loading)

                //alert('File detected');

                document.querySelector('#ext_shortcut .item.rec').removeAttribute("recording");
                document.querySelector('#ext_shortcut .item.rec .recBtn').textContent = "録画開始";
                document.querySelector('#ext_shortcut .item.rec .status').removeAttribute("rec");
                document.querySelector('#ext_shortcut .item.rec').setAttribute("aria-label", "録画を開始します");  

                // オプション操作を有効化
                
                document.querySelector('.option.videoBitrato select').removeAttribute("disabled");
                /*
                document.querySelector('.option.size select').removeAttribute("disabled");
                document.querySelector('.option.kaku select').removeAttribute("disabled");
                */

                //a.remove(); // remove element
            })
            .catch((error ) => {
                alert('エラーが発生しました : ' + error);
                console.error(error);
                document.querySelector('#ext_shortcut .item.rec').removeAttribute("recording");
                document.querySelector('#ext_shortcut .item.rec .recBtn').textContent = "録画開始";
                document.querySelector('#ext_shortcut .item.rec .status').removeAttribute("rec");
                document.querySelector('#ext_shortcut .item.rec').setAttribute("aria-label", "録画を開始します");  

                // オプション操作を有効化
                document.querySelector('.option.videoBitrato select').removeAttribute("disabled");
                /*
                document.querySelector('.option.size select').removeAttribute("disabled");
                document.querySelector('.option.kaku select').removeAttribute("disabled");
                */
            });
    }

function getCurrentDateTimeFormatted() {
    const now = new Date();
    
    // 年、月、日、時、分、秒を取得
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 月は0から始まるため+1が必要
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    // フォーマットに合わせて文字列を組み立てる
    const formattedDateTime = `${year}年${month}月${day}日_${hours}時${minutes}分${seconds}秒`;
    
    return formattedDateTime;
  }
  
  function escapeFileName(fileName) {
    // Windowsのファイル名に使用できない文字を置き換えるマップを作成
    const invalidChars = /[\/:*?"<>|]/g;
    const replacementChar = '_'; // 置き換える文字
  
    // 不適切な文字を置き換えてエスケープ
    const escapedFileName = fileName.replace(invalidChars, replacementChar);
    
    return escapedFileName;
  }


async function pip() {

/* COMMENT OUT 20230704

  // Picture-in-Picture ウインドウに表示したい要素を取得
  const player = document.querySelector("[class^=___player-display-screen___]");
  const header = document.querySelector("[class^=___player-display-header___]");
  const display = document.querySelector("[class^=___player-display___]");
  display.classList.add("pipMode");

  let commentBox = document.createElement("input");
  commentBox.setAttribute('id', 'pipCommentBox');
  commentBox.setAttribute('maxlength', 75);
  commentBox.setAttribute('minlength', 0);
  commentBox.setAttribute('type', 'text');
  commentBox.setAttribute('style', 'width: calc(100% - 20px);margin: 10px;padding: 10px;');
  commentBox.addEventListener("keyup", (e) => { 
    console.log("keyup--------------")

    if(e.keyCode !== 13) {
        const nicoInputBox = document.querySelector("[class^=___comment-text-box___]");
  
        // inputイベントの作成（キー入力をシミュレーションする）
        var event = new Event('input', { bubbles: true }); // inputイベントの作成
        nicoInputBox.value = pipWindow.document.getElementById("pipCommentBox").value; // 値を設定
        nicoInputBox.dispatchEvent(event); // inputイベントの送信
    
    
    }
  });
  commentBox.addEventListener("keypress", (e) => { 
    if (e.keyCode === 13 && pipWindow.document.getElementById("pipCommentBox").value.length > 0) {
        document.querySelector("[class^=___submit-button___]").click();
        pipWindow.document.getElementById("pipCommentBox").value = "";
    }
  });
  // Picture-in-Picture ウインドウのインスタンスをrequestWindow()の返り値として取得
  const pipWindow = await documentPictureInPicture.requestWindow({
    width: player.clientWidth,
    height: player.clientHeight + 80,
    });

// Copy style sheets over from the initial document
  // so that the player looks the same.
  const allCSS = [...document.styleSheets]
    .map((styleSheet) => {
      try {
        return [...styleSheet.cssRules].map((r) => r.cssText).join("");
      } catch (e) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.type = styleSheet.type;
        link.media = styleSheet.media;
        link.href = styleSheet.href;
        pipWindow.document.head.appendChild(link);
      }
    })
    .filter(Boolean)
    .join("\n");
  const style = document.createElement("style");
  style.textContent = allCSS;
  pipWindow.document.head.appendChild(style);


  const myStyle = document.createElement("style");
  myStyle.textContent = "body { background-color: #000000;}";
  pipWindow.document.head.appendChild(myStyle);

  // Move the player to the Picture-in-Picture window.
  pipWindow.document.body.append(header);
  pipWindow.document.body.append(player);
  pipWindow.document.body.append(commentBox);

  // Move the player back when the Picture-in-Picture window closes.
  pipWindow.addEventListener("unload", (event) => {
    console.log(event);
    const playerContainer = document.querySelector("[class^=___player-display___]");
    const pipPlayer = event.target.querySelector("[class^=___player-display-screen___]");
    const pipHeader = event.target.querySelector("[class^=___player-display-header___]");
    playerContainer.prepend(pipPlayer);
    playerContainer.prepend(pipHeader);
    display.classList.remove("pipMode");
  
  });

    return;
*/




    let menu = document.querySelector('.ext-setting-menu .ext-pip');

    // 拡張機能の設定メニューを閉じる
    document.querySelector('.ext-setting-menu').removeAttribute("ext-attr-show");
    
    if(menu.getAttribute("ext-attr-on")) {

        // PIPを終了
        if (document.pictureInPictureElement) {
            document.exitPictureInPicture();
        }

        // PIP終了時の処理はすべてonExitPip()内に記載する

    } else {

        // ON状態に
        menu.setAttribute("ext-attr-on", "ON");

        // ショートカットをアクティブ状態
        document.querySelector('#ext_shortcut .item.picture').setAttribute("active", "ON");


        // 統合canvas と 統合video を開始
        _canvasUpdate_forPip();
        _videoElementForPip.play();

        // PIP開始
        try {
            _pip_video.style.visibility = "hidden";
            await _videoElementForPip.requestPictureInPicture();
        }
        catch(error) {
          console.error(error);
        }
        finally {
            // DO ANYTHING
        }
    }

}

function _canvasUpdate() {


    // アニメーションの開始時刻を記録します。
    let startTime = null;

    // アニメーションループ関数を定義します。
    function animate(timestamp) {
    // アニメーションが初めて呼び出された場合、開始時刻を設定します。
    if (!startTime) {
        startTime = timestamp;
    }

    // 経過時間を計算します。
    const elapsedTime = timestamp - startTime;

    // 60fps（約16.67ミリ秒ごと）でアニメーションを更新します。
    if (elapsedTime >= 8.33) {
        // ここにアニメーションの描画コードを追加します。
        
        // 再描画処理
        _canvasCtx.drawImage(_pip_video, 0, 0, _pip_Canvas.width, _pip_Canvas.height);  
        
        // コメント用に透過
        _canvasCtx.globalAlpha = 0.6;
      
        // コメント貼り付け
        _canvasCtx.drawImage(_pip_comment, 0, 0, _pip_Canvas.width, _pip_Canvas.height);

        // コメント用の透過解除
        _canvasCtx.globalAlpha = 1.0;


        // アニメーションの開始時刻を更新します。
        startTime = timestamp;
    }

    // requestAnimationFrame()を再度呼び出して次のフレームを予約します。
    requestAnimationFrame(animate);
    }

    // アニメーションを開始します。
    _callbackId = requestAnimationFrame(animate);


    /*

    // 基準実行時間
    var basetime = Date.now();

    // FPS
    //var fps = 1000/60;
    var fps = getRecFps();


    function animate_handler() {
        var now   = Date.now();
        var check = now - basetime;
        if( check / fps >= 1 ) {
            basetime = now;

            draw();
        }

        _callbackId = requestAnimationFrame( animate_handler);
    }

    function draw() {
        // 再描画処理
        _canvasCtx.drawImage(_pip_video, 0, 0, _pip_Canvas.width, _pip_Canvas.height);  
        
        // コメント用に透過
        _canvasCtx.globalAlpha = 0.6;
      
        // コメント貼り付け
        _canvasCtx.drawImage(_pip_comment, 0, 0, _pip_Canvas.width, _pip_Canvas.height);

        // コメント用の透過解除
        _canvasCtx.globalAlpha = 1.0;
        
    }

    animate_handler();
    */
};

function _canvasUpdate_forPip() {

    _canvasCtx.drawImage(_pip_video, 0, 0, _pip_Canvas.width, _pip_Canvas.height);
    /*
    if(_pip_game){
        _canvasCtx.drawImage(_pip_game, 0, 0, _pip_Canvas.width, _pip_Canvas.height);
    }
    */
    // コメント用に透過
    _canvasCtx.globalAlpha = 0.6;
    
    _canvasCtx.drawImage(_pip_comment, 0, 0, _pip_Canvas.width, _pip_Canvas.height);
    
    // コメント用の透過解除
    _canvasCtx.globalAlpha = 1.0;
    
    _callbackId = requestAnimationFrame( _canvasUpdate_forPip );
    
}