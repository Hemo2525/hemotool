
let _callbackId;
let _canvasCtx;
let _pip_comment;
let _pip_video;
let _pip_game;
var _pip_Canvas;
let _videoElementForPip;

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

        let playerArea =  document.querySelector('[class^=___player-display-screen]');
        if(playerArea){
            /*
            _pip_Canvas.width  = playerArea.clientWidth;
            _pip_Canvas.height = playerArea.clientHeight;
            */
           /*
            _pip_Canvas.width  = 1920;
            _pip_Canvas.height = 1080;
            */
           
            _pip_Canvas.width  = 1280;
            _pip_Canvas.height = 720;
           
            /*
            1080p：1920×1080（フルHD）
            720p：1280×720（HD）
            480p：854×480（SD）
            */
        }

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

    // ニコ生の映像を表示
    _pip_video.style.visibility = "visible";
    
    // 統合video を停止
    _videoElementForPip.pause();

    // 統合canvas を停止
    cancelAnimationFrame(_callbackId);

    document.querySelector('.ext-setting-menu .ext-pip').removeAttribute("ext-attr-on");
}








let _recorder;
let _videoBlob;

function getSeekableBlob(inputBlob, callback) {
    // EBML.js copyrights goes to: https://github.com/legokichi/ts-ebml
    if (typeof EBML === 'undefined') {
        throw new Error('Please link: https://cdn.webrtc-experiment.com/EBML.js');
    }
    var reader = new EBML.Reader();
    var decoder = new EBML.Decoder();
    var tools = EBML.tools;
    var fileReader = new FileReader();
    fileReader.onload = function(e) {
        var ebmlElms = decoder.decode(this.result);
        ebmlElms.forEach(function(element) {
            reader.read(element);
        });
        reader.stop();
        var refinedMetadataBuf = tools.makeMetadataSeekable(reader.metadatas, reader.duration, reader.cues);
        var body = this.result.slice(reader.metadataSize);
        var newBlob = new Blob([refinedMetadataBuf, body], {
            type: 'video/webm'
        });
        callback(newBlob);
    };
    fileReader.readAsArrayBuffer(inputBlob);
}


function pipRec() {
    let menu = document.querySelector('.ext-setting-menu .ext-rec');
    
    if(menu.getAttribute("ext-attr-on")) {
                
        // OFF状態に
        menu.removeAttribute("ext-attr-on");

        _recorder.stop();

        cancelAnimationFrame(_callbackId);

    } else {

        // ON状態に
        menu.setAttribute("ext-attr-on", "ON");

        _canvasUpdate();

        var video = document.querySelector('div[data-layer-name="videoLayer"] video');
        video.setAttribute("crossorigin", "anonymous");

        var videoOutputStream = _pip_Canvas.captureStream(60);

        var ctx = new AudioContext();
        
        let stream = video.captureStream();  
        let audioTrack = new MediaStream(stream.getAudioTracks());
        var source = ctx.createMediaStreamSource(audioTrack);


        // now a MediaStream destination node
        var stream_dest = ctx.createMediaStreamDestination();
        // connect the source to the MediaStream
        source.connect(stream_dest);
        // grab the real MediaStream
        audioStream = stream_dest.stream;


        var outputStream = new MediaStream();
        [audioStream, videoOutputStream].forEach(function(s) {
            s.getTracks().forEach(function(t) {
                videoOutputStream.addTrack(t);
            });
        });


        _recorder = new MediaRecorder(videoOutputStream, {mimeType:'video/webm;codecs=vp9'});
        //_recorder = new MediaRecorder(videoOutputStream, { mimeType: 'video/webm;codecs=h264,opus' });



        //ダウンロード用のリンクを準備
        var anchor = document.getElementById('downloadlink');

        _recorder.ondataavailable = function(e) {
            _videoBlob = new Blob([e.data], { type: e.data.type });
        }

        //録画終了時に動画ファイルのダウンロードリンクを生成する処理
        _recorder.onstop = function (){

            getSeekableBlob(_videoBlob, function(newBlob){
                let blobUrl = window.URL.createObjectURL(newBlob);
                anchor.download = 'movie.mp4';
                anchor.href = blobUrl;
                anchor.style.display = 'block';
                anchor.click();    
            })

        }

        //録画開始
        _recorder.start();

    }
}

async function pip() {

    let menu = document.querySelector('.ext-setting-menu .ext-pip');

    // 拡張機能の設定メニューを閉じる
    document.querySelector('.ext-setting-menu').removeAttribute("ext-attr-show");
    
    if(menu.getAttribute("ext-attr-on")) {

        // PIPを終了
        if (document.pictureInPictureElement) {
            document.exitPictureInPicture();
        }

        // ショートカットを非アクティブ状態
        document.querySelector('#ext_shortcut .item.picture').removeAttribute("active");

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

    // 基準実行時間
    var basetime = Date.now();

    // FPS
    var fps = 1000/60;

    // setTimeoutを利用した場合は最初から30FPSで実行される
    function animate_handler() {
        var now   = Date.now();
        var check = now - basetime;
        if( check / fps >= 1 ) {
            basetime = now;

            draw();
        }

        _callbackId = requestAnimationFrame( animate_handler, fps );
    }

    function draw() {
        // 再描画処理
        _canvasCtx.drawImage(_pip_video, 0, 0, _pip_Canvas.width, _pip_Canvas.height);        
        _canvasCtx.drawImage(_pip_comment, 0, 0, _pip_Canvas.width, _pip_Canvas.height);
        
    }

    animate_handler();
};

function _canvasUpdate_forPip() {

    _canvasCtx.drawImage(_pip_video, 0, 0, _pip_Canvas.width, _pip_Canvas.height);
    /*
    if(_pip_game){
        _canvasCtx.drawImage(_pip_game, 0, 0, _pip_Canvas.width, _pip_Canvas.height);
    }
    */
    _canvasCtx.drawImage(_pip_comment, 0, 0, _pip_Canvas.width, _pip_Canvas.height);        
    _callbackId = requestAnimationFrame( _canvasUpdate_forPip );
    
}