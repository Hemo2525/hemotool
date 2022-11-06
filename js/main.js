
let _obsLogBox;


window.addEventListener('load', function () {

    let currentURL = location.href;
    if (currentURL.startsWith("https://live.nicovideo.jp/")) {
        if(document.querySelector('[class^=___player-area___]')) {

            // ニコ生URLであり、かつニコ生プレイヤーがあれば。

            // 拡張機能の初期化処理
            initialize(function(ret){

                if(ret) {

                    const promise = fetch(chrome.runtime.getURL("/html/parts-menu.html"));

                    //fetch() のレスポンス（リクエストの結果）を then() メソッドで処理
                    promise.then((response) => {
                        return response.text();
                    })
                    .then((data) => {

                        // GUIを設定
                        insertBtnToPlayer(data);

                        // 設定を読み込む
                        setSettingValue();

                    });                    


                } else {
                    /*
                    // メッセージを表示
                    var bodyDom = document.querySelector("body");
                    var messageDom = document.createElement('div');
                    messageDom.id = "ext_dom_message";
                    messageDom.innerHTML = "ニコ生拡張機能(へもツール)の初期化に失敗しました。<br>ニコ生がアップデートされた可能性があります。拡張機能をOFFにしてください。<br>修正版がリリースされるまでお待ち下さい。by へも";
                    bodyDom.prepend(messageDom);
                    document.scrollingElement.scrollTop = 0;
                    */
                }

            }, 6000 * 10 * 5); // 5分
        }
    }

    if (location.href.startsWith("https://ak.cdn.nimg.jp/")) {
        //console.log("ここくる？-------------------------------------");
        setAkashicParentFrameEvent();
    }

    
    window.addEventListener('beforeunload', function(e) {
        chrome.runtime.sendMessage({stop: "stop"});
    }, false);


});


// へもツールで使用するニコ生のDOMがちゃんと存在しているか確認
function initialize(callback, timeoutMiliSec) {

    let domList = [
        "[class^=___comment-button___]",
        "[class^=___player-display-screen]",
        "[class^=___player-display-footer___]",
        "[class^=___slider___]",
        "[class^=___setting-popup-control___]",
        "[class^=___forward-button___]",
        "[class^=___time-text-box___]",
        "[class^=___back-button___]",
        "[class^=___head-button___]",
        // "[class^=___play-button___]", // 一般・未ログインだとDOMがないので対象外とする
        "[class^=___control-area___]",
        "[class^=___seek-information___]",
        "[class^=___controller___]",
        "[class^=___table___]",
        //"[class^=___comment-number___]", // ゼロコメ放送だとDOMないので対象外とする
        //"[class^=___comment-text___]",// ゼロコメ放送だとDOMないので対象外とする
        "[class^=___player-area___]",
        "div[data-layer-name='commentLayer'] canvas",
        "div[data-layer-name='videoLayer'] video",
        //"div[data-layer-name='akashicGameViewLayer'] canvas",
        "div[data-layer-name='akashicGameViewLayer']",
        "#akashic-gameview",
        
    ];

    const startMiliSec= Date.now();
    searchDoms();

    function searchDoms() {

        let bFindAllDom = true;
        for(const selector of domList) {
            if(!document.querySelector(selector)){
                console.log(selector + " が存在しません");
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


// ニコニコプレイヤーにボタンのDOMを挿入
function insertBtnToPlayer(parts_data) {

    // 拡張機能ボタンの挿入
    let settingMenu = document.querySelector("[class^=___comment-button___]");

    let p1 = document.createElement('div');
    p1.innerHTML = parts_data;
    settingMenu.parentNode.prepend(p1);
    /*
    '<div class="item ext-pip-rec">' +
    '<div class="name">録画開始<span class="mini">(ニコ生ゲーム非対応)</span></div>' +
    '<div class="value">ON</div>' +
    */


    let overlay = document.createElement('div');
    overlay.id = "ext_overlay";
    document.querySelector('[class^=___player-display-screen]').prepend(overlay);


    // 拡張機能ボタンのメニュー表示
    let button = document.querySelector('.ext-setting-btn');
    button.addEventListener('click', function () {
        let menu = document.querySelector('.ext-setting-menu');
        //menu.toggleAttribute("ext-attr-show");

        if(menu.getAttribute("ext-attr-show")) {
            document.querySelector("#ext_overlay").style.display = "none";
            menu.removeAttribute("ext-attr-show");

        } else {

            document.querySelector("#ext_overlay").style.display = "block";
            menu.setAttribute("ext-attr-show", "ON");
        }
    });

    //let overlay = document.querySelector('#ext_overlay');
    overlay.addEventListener('click', function () {
        document.querySelector("#ext_overlay").style.display = "none";
        document.querySelector('.ext-setting-menu').removeAttribute("ext-attr-show");
    });
    let settingBtn = document.querySelector("[class^=___setting-popup-control___]");
    settingBtn.addEventListener('click', function(){
        document.querySelector("#ext_overlay").style.display = "none";
        document.querySelector('.ext-setting-menu').removeAttribute("ext-attr-show");
    });


    // 各種ショートカット用のDOMを作成しておく
    let shortcut = document.createElement('div');
    shortcut.id = "ext_shortcut";
    shortcut.innerHTML = 
        '<div class="item comeview" aria-label="コメントビューアー機能をONにします">コメビュ</div>'+
        '<div class="item yomiage" aria-label="読み上げ機能をONにします">読み上げ</div>'+
        '<div class="item click" aria-label="ブラウザの右クリックメニューを無効化します">右クリックメニューOFF</div>'+
        '<div class="item seek" aria-label="シークバーを無効化します">シークバーOFF</div>'+
        '<div class="item video" aria-label="配信映像を非表示にします">配信映像OFF</div>'+
        '<div class="item video-mute" aria-label="配信音をミュートにします">配信音ミュート</div>'+
        '<div class="item game" aria-label="ニコ生ゲームの映像を非表示にします">ニコ生ゲーム画面OFF</div>'+
        '<div class="item game-mute" aria-label="ニコ生ゲームの音をミュートします">ニコ生ゲーム音ミュート</div>'+
        '<div class="item picture" aria-label="映像＋コメントを小窓で表示します">小窓表示</div>';
    document.querySelector('[class^=___player-controller___]').append(shortcut);
    

    // コメビュ
    let comeviewBtn = document.querySelector('.ext-setting-menu .ext-comeview .item .value');
    comeviewBtn.addEventListener('click', comeview);
    let comeviewPin = document.querySelector('.ext-setting-menu .ext-comeview .item .pin');
    comeviewPin.addEventListener('click', function() {
        if(comeviewPin.getAttribute("ext-pin-on")){
            // 設定画面のピンのアイコンをOFF表示
            comeviewPin.removeAttribute("ext-pin-on");
            // ショートカットを非表示
            document.querySelector('#ext_shortcut .item.comeview').removeAttribute("ext-pin-on");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_comeview_pin": "OFF"}, function() {});
        } else {
            // 設定画面のピンのアイコンをON表示
            comeviewPin.setAttribute("ext-pin-on", "ON");
            // ショートカットを表示
            document.querySelector('#ext_shortcut .item.comeview').setAttribute("ext-pin-on", "ON");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_comeview_pin": "ON"}, function() {});
        }
    });
    document.querySelector('#ext_shortcut .comeview').addEventListener('click', function() {
        comeview();
    });



    // 読み上げ
    let yomiageBtn = document.querySelector('.ext-setting-menu .ext-yomiage .item .value');
    yomiageBtn.addEventListener('click', yomiage);
    let yomiagePin = document.querySelector('.ext-setting-menu .ext-yomiage .item .pin');
    yomiagePin.addEventListener('click', function() {
        if(yomiagePin.getAttribute("ext-pin-on")){
            // 設定画面のピンのアイコンをOFF表示
            yomiagePin.removeAttribute("ext-pin-on");
            // ショートカットを非表示
            document.querySelector('#ext_shortcut .item.yomiage').removeAttribute("ext-pin-on");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_yomiage_pin": "OFF"}, function() {});
        } else {
            // 設定画面のピンのアイコンをON表示
            yomiagePin.setAttribute("ext-pin-on", "ON");
            // ショートカットを表示
            document.querySelector('#ext_shortcut .item.yomiage').setAttribute("ext-pin-on", "ON");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_yomiage_pin": "ON"}, function() {});
        }
    });
    document.querySelector('#ext_shortcut .yomiage').addEventListener('click', function() {
        yomiage();
    });



    // 右クリックOFF
    let righClickBtn = document.querySelector('.ext-setting-menu .ext-rightClick .value');
    righClickBtn.addEventListener('click', rightClick);
    let rightClickPin = document.querySelector('.ext-setting-menu .ext-rightClick .pin');
    rightClickPin.addEventListener('click', function() {
        if(rightClickPin.getAttribute("ext-pin-on")){
            // 設定画面のピンのアイコンをOFF表示
            rightClickPin.removeAttribute("ext-pin-on");
            // ショートカットを非表示
            document.querySelector('#ext_shortcut .item.click').removeAttribute("ext-pin-on");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_click_pin": "OFF"}, function() {});
        } else {
            // 設定画面のピンのアイコンをON表示
            rightClickPin.setAttribute("ext-pin-on", "ON");
            // ショートカットを表示
            document.querySelector('#ext_shortcut .item.click').setAttribute("ext-pin-on", "ON");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_click_pin": "ON"}, function() {});
        }
    });
    document.querySelector('#ext_shortcut .click').addEventListener('click', function() {
        rightClick();
    });

    // シークバーOFF機能
    let seekBtn = document.querySelector('.ext-setting-menu .ext-seekbar .value');
    seekBtn.addEventListener('click', seekbar);
    let seekPin = document.querySelector('.ext-setting-menu .ext-seekbar .pin');
    seekPin.addEventListener('click', function() {
        if(seekPin.getAttribute("ext-pin-on")){
            // 設定画面のピンのアイコンをOFF表示
            seekPin.removeAttribute("ext-pin-on");
            // ショートカットを非表示
            document.querySelector('#ext_shortcut .item.seek').removeAttribute("ext-pin-on");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_seek_pin": "OFF"}, function() {});
        } else {
            // 設定画面のピンのアイコンをON表示
            seekPin.setAttribute("ext-pin-on", "ON");
            // ショートカットを表示
            document.querySelector('#ext_shortcut .item.seek').setAttribute("ext-pin-on", "ON");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_seek_pin": "ON"}, function() {});
        }
    });
    document.querySelector('#ext_shortcut .seek').addEventListener('click', function() {
        seekbar();
    });

    // 配信映像OFF
    let videoBtn = document.querySelector('.ext-setting-menu .ext-video .value');
    videoBtn.addEventListener('click', videoOff);
    let videoPin = document.querySelector('.ext-setting-menu .ext-video .pin');
    videoPin.addEventListener('click', function() {
        if(videoPin.getAttribute("ext-pin-on")){
            // 設定画面のピンのアイコンをOFF表示
            videoPin.removeAttribute("ext-pin-on");
            // ショートカットを非表示
            document.querySelector('#ext_shortcut .item.video').removeAttribute("ext-pin-on");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_video_pin": "OFF"}, function() {});
        } else {
            // 設定画面のピンのアイコンをON表示
            videoPin.setAttribute("ext-pin-on", "ON");
            // ショートカットを表示
            document.querySelector('#ext_shortcut .item.video').setAttribute("ext-pin-on", "ON");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_video_pin": "ON"}, function() {});
        }
    });
    document.querySelector('#ext_shortcut .video').addEventListener('click', function() {
        videoOff();
    });

    // 配信映像ミュート
    let videoMuteBtn = document.querySelector('.ext-setting-menu .ext-video-mute .value');
    videoMuteBtn.addEventListener('click', videoMute);
    let videoMutePin = document.querySelector('.ext-setting-menu .ext-video-mute .pin');
    videoMutePin.addEventListener('click', function() {
        if(videoMutePin.getAttribute("ext-pin-on")){
            // 設定画面のピンのアイコンをOFF表示
            videoMutePin.removeAttribute("ext-pin-on");
            // ショートカットを非表示
            document.querySelector('#ext_shortcut .item.video-mute').removeAttribute("ext-pin-on");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_video_mute_pin": "OFF"}, function() {});
        } else {
            // 設定画面のピンのアイコンをON表示
            videoMutePin.setAttribute("ext-pin-on", "ON");
            // ショートカットを表示
            document.querySelector('#ext_shortcut .item.video-mute').setAttribute("ext-pin-on", "ON");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_video_mute_pin": "ON"}, function() {});
        }
    });
    document.querySelector('#ext_shortcut .video-mute').addEventListener('click', function() {
        videoMute();
    });

    // ゲームOFF
    let gameBtn = document.querySelector('.ext-setting-menu .ext-game .value');
    gameBtn.addEventListener('click', gameOff);
    let gamePin = document.querySelector('.ext-setting-menu .ext-game .pin');
    gamePin.addEventListener('click', function() {
        if(gamePin.getAttribute("ext-pin-on")){
            // 設定画面のピンのアイコンをOFF表示
            gamePin.removeAttribute("ext-pin-on");
            // ショートカットを非表示
            document.querySelector('#ext_shortcut .item.game').removeAttribute("ext-pin-on");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_game_pin": "OFF"}, function() {});
        } else {
            // 設定画面のピンのアイコンをON表示
            gamePin.setAttribute("ext-pin-on", "ON");
            // ショートカットを表示
            document.querySelector('#ext_shortcut .item.game').setAttribute("ext-pin-on", "ON");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_game_pin": "ON"}, function() {});
        }
    });
    document.querySelector('#ext_shortcut .game').addEventListener('click', function() {
        gameOff();
    });

    // ゲームミュート
    let gameMuteBtn = document.querySelector('.ext-setting-menu .ext-game-mute .value');
    gameMuteBtn.addEventListener('click', gameMute);
    let gameMutePin = document.querySelector('.ext-setting-menu .ext-game-mute .pin');
    gameMutePin.addEventListener('click', function() {
        if(gameMutePin.getAttribute("ext-pin-on")){
            // 設定画面のピンのアイコンをOFF表示
            gameMutePin.removeAttribute("ext-pin-on");
            // ショートカットを非表示
            document.querySelector('#ext_shortcut .item.game-mute').removeAttribute("ext-pin-on");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_game_mute_pin": "OFF"}, function() {});
        } else {
            // 設定画面のピンのアイコンをON表示
            gameMutePin.setAttribute("ext-pin-on", "ON");
            // ショートカットを表示
            document.querySelector('#ext_shortcut .item.game-mute').setAttribute("ext-pin-on", "ON");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_game_mute_pin": "ON"}, function() {});
        }
    });
    document.querySelector('#ext_shortcut .game-mute').addEventListener('click', function() {

        gameMute();
    });
    // ニコ生プレイヤーのミュートボタンを操作できないようにする用のDOMを作成しておく
    let nicoMuteBtn = document.querySelector('[class^=___mute-button___]');
    let overlayMute = document.createElement('div');
    overlayMute.id = "ext_volume_overlay";
    overlayMute.textContent = "配信の音量→";
    overlayMute.style.cssText = "width: " + nicoMuteBtn.clientWidth + "px;" + "height: " + nicoMuteBtn.clientHeight + "px;";
    document.querySelector('[class^=___volume-setting___]').insertBefore(overlayMute, nicoMuteBtn);

    let overlayVideoMute = document.createElement('div');
    overlayVideoMute.id = "ext_video_volume_overlay";
    overlayVideoMute.textContent = "配信音停止中";
    overlayVideoMute.style.cssText = "width: " + nicoMuteBtn.clientWidth + "px;" + "height: " + nicoMuteBtn.clientHeight + "px;";
    document.querySelector('[class^=___volume-setting___]').insertBefore(overlayVideoMute, nicoMuteBtn);


    // ニコ生プレイヤーのボリュームスライダーの代わりを作成しておく
    let extSlider = document.createElement('input');
    extSlider.id = "ext_videoVolumeSlider";
    extSlider.type = "range";
    extSlider.name= "volumeSize";
    extSlider.min = "0";
    extSlider.max = "100";
    extSlider.step = "1";
    extSlider.value = document.querySelector('div[data-layer-name="videoLayer"] video').volume;
    document.querySelector('[class^=___volume-size-control___]').insertBefore(extSlider, 
        document.querySelector('[class^=___volume-size-control___] span[class^=___slider___]'));

    document.querySelector('#ext_videoVolumeSlider').addEventListener('input', function(e){
        // changeイベントではなくinputイベントにすることでつまみを移動させているあいだも発火してくれる

        // ストレージにビデオ音量を保存
        chrome.storage.local.set({"ext_game_volume": e.target.value}, function() {});        

        document.querySelector('div[data-layer-name="videoLayer"] video').volume =  e.target.value / 100;
        document.querySelector('div[data-layer-name="videoLayer"] video').muted = false;

        /* 下記動作しなかった
        document.querySelector('[class^=___volume-size-control___] input[class^=___slider___]').value = e.target.value / 100;
        document.querySelector('[class^=___volume-size-control___] input[class^=___slider___]').dispatchEvent(new Event('change'));
        */
    });

    /*
        // 録画開始
        let recBtn = document.querySelector('.ext-setting-menu .ext-pip-rec');
        recBtn.addEventListener('click', pipRec);
    */


    // ピクチャーインピクチャー
    let pictureBtn = document.querySelector('.ext-setting-menu .ext-pip .value');
    pictureBtn.addEventListener('click', pip);
    let picturePin = document.querySelector('.ext-setting-menu .ext-pip .pin');
    picturePin.addEventListener('click', function() {
        if(picturePin.getAttribute("ext-pin-on")){
            // 設定画面のピンのアイコンをOFF表示
            picturePin.removeAttribute("ext-pin-on");
            // ショートカットを非表示
            document.querySelector('#ext_shortcut .item.picture').removeAttribute("ext-pin-on");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_picture_pin": "OFF"}, function() {});
        } else {
            // 設定画面のピンのアイコンをON表示
            picturePin.setAttribute("ext-pin-on", "ON");
            // ショートカットを表示
            document.querySelector('#ext_shortcut .item.picture').setAttribute("ext-pin-on", "ON");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_picture_pin": "ON"}, function() {});
        }
    });
    document.querySelector('#ext_shortcut .picture').addEventListener('click', function() {
        pip();
    });




    // 設定画面のイベントリスナ

    //styleのdisplayを変更する関数
    let changeElement = (el) => {
        el.classList.toggle('show');
    }

    document.querySelector('.ext-setting-menu .ext-comeview .setting').addEventListener('click', (e) => {
        changeElement(document.querySelector('.ext-setting-menu .ext-comeview .option-box'));
        document.querySelector('.ext-setting-menu .ext-comeview .setting').classList.toggle('active')
    }, false);

    document.querySelector('.ext-setting-menu .ext-yomiage .setting').addEventListener('click', (e) => {
        changeElement(document.querySelector('.ext-setting-menu .ext-yomiage .option-box'));
        document.querySelector('.ext-setting-menu .ext-yomiage .setting').classList.toggle('active')
    }, false);

    let settingsBtn = document.querySelectorAll('.ext-setting-menu .option-box');
    settingsBtn.forEach((el, index) => {

        let items = el.querySelectorAll('.option');
        let borders = el.querySelectorAll('.border');
        
        const height = (items.length * 41) + (borders.length * 10) + 10;
        el.style.setProperty("--max-height", height + "px");
        
    });

    // [コメント] 名前の表示
    document.querySelector('.ext-setting-menu .ext-comeview .option.name input').addEventListener('change', () => {
        comeview_option_name();
    });
    // [コメント] 長いコメント折り返し
    document.querySelector('.ext-setting-menu .ext-comeview .option.orikaeshi input').addEventListener('change', () => {
        comeview_option_orikaeshi();
    });
    // [コメント] プレミアム表示
    document.querySelector('.ext-setting-menu .ext-comeview .option.premium input').addEventListener('change', () => {
        comeview_option_premium();
    });
    // [コメント] コテハン表示
    document.querySelector('.ext-setting-menu .ext-comeview .option.kotehan input').addEventListener('change', () => {
        comeview_option_kotehan();
    });

    // [読み上げ] 音声の種類
    document.querySelector('.ext-setting-menu .ext-yomiage .option.voices select').addEventListener('change', (e) => {
        if(e.isTrusted){
            chrome.runtime.sendMessage({setVoiceName: document.querySelector('.ext-setting-menu .ext-yomiage .option.voices select').value});
            chrome.storage.local.set({"ext_yomiage_opt_voices": document.querySelector('.ext-setting-menu .ext-yomiage .option.voices select').value}, function() {});
        }
    });
    // [読み上げ] 音量
    document.querySelector('.ext-setting-menu .ext-yomiage .option.volume input').addEventListener('change', (e) => {
        if(e.isTrusted){
            chrome.runtime.sendMessage({setVolume: document.querySelector('.ext-setting-menu .ext-yomiage .option.volume input').value});
            chrome.storage.local.set({"ext_yomiage_opt_volume": document.querySelector('.ext-setting-menu .ext-yomiage .option.volume input').value}, function() {});
        }
    });
    // [読み上げ] 速度
    document.querySelector('.ext-setting-menu .ext-yomiage .option.rate input').addEventListener('change', (e) => {
        if(e.isTrusted){
            chrome.runtime.sendMessage({setRate: document.querySelector('.ext-setting-menu .ext-yomiage .option.rate input').value});
            chrome.storage.local.set({"ext_yomiage_opt_rate": document.querySelector('.ext-setting-menu .ext-yomiage .option.rate input').value}, function() {});
        }
    });
    // [読み上げ] ピッチ
    document.querySelector('.ext-setting-menu .ext-yomiage .option.pitch input').addEventListener('change', (e) => {
        if(e.isTrusted){
            chrome.runtime.sendMessage({setPitch: document.querySelector('.ext-setting-menu .ext-yomiage .option.pitch input').value});
            chrome.storage.local.set({"ext_yomiage_opt_pitch": document.querySelector('.ext-setting-menu .ext-yomiage .option.pitch input').value}, function() {});
        }
    });

    // [読み上げ] ギフトの読み上げ
    document.querySelector('.ext-setting-menu .ext-yomiage .option.gift input').addEventListener('change', (e) => {
        if(document.querySelector('.ext-setting-menu .ext-yomiage .option.gift input').checked){
            chrome.storage.local.set({"ext_yomiage_opt_gift": "ON"}, function() {});
        } else {
            chrome.storage.local.set({"ext_yomiage_opt_gift": "OFF"}, function() {});
        }
    });
    // [読み上げ] 広告の読み上げ
    document.querySelector('.ext-setting-menu .ext-yomiage .option.koukoku input').addEventListener('change', (e) => {
        if(document.querySelector('.ext-setting-menu .ext-yomiage .option.koukoku input').checked){
            chrome.storage.local.set({"ext_yomiage_opt_koukoku": "ON"}, function() {});
        } else {
            chrome.storage.local.set({"ext_yomiage_opt_koukoku": "OFF"}, function() {});
        }
    });
    // [読み上げ] 来場者の読み上げ
    document.querySelector('.ext-setting-menu .ext-yomiage .option.raijosya input').addEventListener('change', (e) => {
        if(document.querySelector('.ext-setting-menu .ext-yomiage .option.raijosya input').checked){
            chrome.storage.local.set({"ext_yomiage_opt_raijosya": "ON"}, function() {});
        } else {
            chrome.storage.local.set({"ext_yomiage_opt_raijosya": "OFF"}, function() {});
        }
    });
    // [読み上げ] リクエストの読み上げ
    document.querySelector('.ext-setting-menu .ext-yomiage .option.request input').addEventListener('change', (e) => {
        if(document.querySelector('.ext-setting-menu .ext-yomiage .option.request input').checked){
            chrome.storage.local.set({"ext_yomiage_opt_request": "ON"}, function() {});
        } else {
            chrome.storage.local.set({"ext_yomiage_opt_request": "OFF"}, function() {});
        }
    });
    // [読み上げ] エモーションの読み上げ
    document.querySelector('.ext-setting-menu .ext-yomiage .option.emotion input').addEventListener('change', (e) => {
        if(document.querySelector('.ext-setting-menu .ext-yomiage .option.emotion input').checked){
            chrome.storage.local.set({"ext_yomiage_opt_emotion": "ON"}, function() {});
        } else {
            chrome.storage.local.set({"ext_yomiage_opt_emotion": "OFF"}, function() {});
        }
    });
    // [読み上げ] 長いコメントの省略
    document.querySelector('.ext-setting-menu .ext-yomiage .option.syoryaku input').addEventListener('change', (e) => {
        let syoryakuValue = document.querySelector('.ext-setting-menu .ext-yomiage .option.syoryaku input').value;
        if(syoryakuValue && !isNaN(syoryakuValue)) {
            chrome.storage.local.set({"ext_yomiage_opt_syoryaku": syoryakuValue}, function() {});            
        }
    });
    // [読み上げ] 名前の読み上げ
    document.querySelector('.ext-setting-menu .ext-yomiage .option.nameyomiage input').addEventListener('change', (e) => {
        if(document.querySelector('.ext-setting-menu .ext-yomiage .option.nameyomiage input').checked){
            chrome.storage.local.set({"ext_yomiage_opt_nameyomiage": "ON"}, function() {});
        } else {
            chrome.storage.local.set({"ext_yomiage_opt_nameyomiage": "OFF"}, function() {});
        }
    });
    // [読み上げ] 教育機能の有効
    document.querySelector('.ext-setting-menu .ext-yomiage .option.kyoiku input').addEventListener('change', (e) => {
        if(document.querySelector('.ext-setting-menu .ext-yomiage .option.kyoiku input').checked){
            chrome.storage.local.set({"ext_yomiage_opt_kyoiku": "ON"}, function() {});
        } else {
            chrome.storage.local.set({"ext_yomiage_opt_kyoiku": "OFF"}, function() {});
        }
    });

    let s = setSpeech();
    s.then((voices) => {

        chrome.storage.local.get("ext_yomiage_opt_voices", function (value) {

            voices.forEach(function (voice, i) {
                //console.debug(voice.name + " (" + voice.lang + ")");
                let item = document.createElement('option');
                
                item.text = voice.name + " (" + voice.lang + ")";
                item.value = voice.name;

                if (value.ext_yomiage_opt_voices
                    && value.ext_yomiage_opt_voices === item.value) {
                    item.selected = true;
                }
        
                let select = document.querySelector('.ext-setting-menu .ext-yomiage .option.voices select');
                select.appendChild(item);



            });


        });


        
        //chrome.runtime.sendMessage({init: "AAA"});
    });

    // id属性で要素を取得
    var targeteElement = document.querySelector("[class^=___player-area___]");

    // 新しいHTML要素を作成
    var logElement = document.createElement('div');
    logElement.id = "ext_logBox";

    // 指定した要素の中の末尾に挿入
    targeteElement.appendChild(logElement);


    const logOption = {
        childList:  true,  //直接の子の変更を監視
    };
    let targetLogDom = document.querySelector('#ext_logBox');

    _obsLogBox = new MutationObserver(wathLogBox);
    _obsLogBox.observe(targetLogDom, logOption);



    // 新しいHTML要素を作成
    var kotehanElement = document.createElement('div');
    kotehanElement.id = "ext_kotehanBox";

    // 指定した要素の中の末尾に挿入
    targeteElement.appendChild(kotehanElement);


    // 新しいHTML要素を作成
    var kotehanToInject = document.createElement('div');
    kotehanToInject.id = "ext_kotehanToInjectBox";

    // 指定した要素の中の末尾に挿入
    targeteElement.appendChild(kotehanToInject);

    kotehanInitialize();
    getKotehan();
}


let ___first_run = true; // ★拡張機能の更新後にブラウザを更新すると動かなくなる不具合の暫定対処★

function wathLogBox(mutationRecords, observer){
    if(mutationRecords && mutationRecords.length > 0 && mutationRecords[0].addedNodes && mutationRecords[0].addedNodes.length > 0){
        
        // 一度に2つ以上のDOM追加にも対応
        mutationRecords.forEach(item => {
            //console.debug(item.addedNodes[0].outerText);
            let yomiage_text = item.addedNodes[0].outerText;

            // 教育機能が有効ならば
            if(document.querySelector('.ext-setting-menu .ext-yomiage .option.kyoiku input').checked){
                let kyoikuRet = kyoiku(yomiage_text, false);
                if(kyoikuRet.bIsSuccess) {
                    yomiage_text = kyoikuRet.leftWord + "、は、" + kyoikuRet.rightWord + "、を覚えました";
                    setKyoiku(kyoikuRet.leftWord, kyoikuRet.rightWord);
                }
    
                let boukyakuRet = boukyaku(yomiage_text, false);
                if(boukyakuRet.bIsSuccess) {
                    yomiage_text = boukyakuRet.word + "、を忘れました";
                    deleteKyoiku(boukyakuRet.word);
                }
    
                // 教育コマンドや忘却コマンドではないときに限り置換
                if(kyoikuRet.bIsSuccess === false && boukyakuRet.bIsSuccess === false) {
                    yomiage_text = replaceKyoiku(yomiage_text);
                }
            }


/*
            let kotehanAt = yomiage_text.indexOf('@');
            if(kotehanAt === -1){
              kotehanAt = yomiage_text.indexOf('＠');
            }
            if(kotehanAt !== -1){
              let kotehan = yomiage_text.substring(kotehanAt + 1); // ＠の次の文字から後ろを抽出
              if(kotehan && kotehan.length > 0) {
                kotehan = kotehan.substr( 0, 16 ); // 最大16文字(公式の仕様にあわせる)
              }
            }
*/            
            


            if(___first_run) {
                ___first_run = false;
                chrome.runtime.sendMessage({setVoiceName: document.querySelector('.ext-setting-menu .ext-yomiage .option.voices select').value});
            }

            chrome.runtime.sendMessage({toSay: yomiage_text });
        
            /** DOM変化の監視を一時停止 */
            _obsLogBox.disconnect();
    
            /* pタグの削除 */
            document.querySelector('#ext_logBox').innerHTML = "";
    
            /** DOM変化の監視を再開 */
            let targetLogDom = document.querySelector('#ext_logBox');
            const logOption = {
                childList:  true,  //直接の子の変更を監視
            };
            _obsLogBox.observe(targetLogDom, logOption);

        });

    }
}

function setSpeech() {
    return new Promise(
        function (resolve, reject) {
            let synth = window.speechSynthesis;
            let id;

            id = setInterval(() => {
                if (synth.getVoices().length !== 0) {
                    resolve(synth.getVoices());
                    clearInterval(id);
                }
            }, 10);
        }
    )
}



function setSettingValue() {

    if (chrome.storage.local) {

        // コメビュ機能
        chrome.storage.local.get("ext_comeview", function (value) {
            if (value.ext_comeview == "ON") {
                comeview();

                // ショートカットをアクティブ状態
                document.querySelector('#ext_shortcut .item.comeview').setAttribute("active", "ON");   
            }
        });
        // コメビュ機能のピン状態
        chrome.storage.local.get("ext_comeview_pin", function (value) {
            if (value.ext_comeview_pin == "ON") {
                // 設定画面のピンのアイコンをON表示
                document.querySelector('.ext-setting-menu .ext-comeview .pin').setAttribute("ext-pin-on", "ON");
                // ショートカットを表示
                document.querySelector('#ext_shortcut .item.comeview').setAttribute("ext-pin-on", "ON");                
            }
        });
        // コメビュ機能の名前表示オプション
        chrome.storage.local.get("ext_comeview_opt_name", function (value) {
            if (value.ext_comeview_opt_name == "ON") {
                document.querySelector('.ext-setting-menu .ext-comeview .option.name input').checked = true;
                comeview_option_name();
            }
        });
        // コメビュ機能の折り返しオプション
        chrome.storage.local.get("ext_comeview_opt_orikaeshi", function (value) {
            if (value.ext_comeview_opt_orikaeshi == "ON") {
                document.querySelector('.ext-setting-menu .ext-comeview .option.orikaeshi input').checked = true;
                comeview_option_orikaeshi();
            }
        });
        // コメビュ機能のプレミアム表示オプション
        chrome.storage.local.get("ext_comeview_opt_premium", function (value) {
            if (value.ext_comeview_opt_premium == "ON") {
                document.querySelector('.ext-setting-menu .ext-comeview .option.premium input').checked = true;
                comeview_option_premium();
            }
        });
        // コメビュ機能のコテハン表示オプション
        chrome.storage.local.get("ext_comeview_opt_kotehan", function (value) {
            if (value.ext_comeview_opt_kotehan == "ON") {
                document.querySelector('.ext-setting-menu .ext-comeview .option.kotehan input').checked = true;
                comeview_option_kotehan();
            }
        });
        // 読み上げ機能
        chrome.storage.local.get("ext_yomiage", function (value) {
            if (value.ext_yomiage == "ON") {
                yomiage();
            }
        });
        // 読み上げ機能のピン状態
        chrome.storage.local.get("ext_yomiage_pin", function (value) {
            if (value.ext_yomiage_pin == "ON") {
                // 設定画面のピンのアイコンをON表示
                document.querySelector('.ext-setting-menu .ext-yomiage .pin').setAttribute("ext-pin-on", "ON");
                // ショートカットを表示
                document.querySelector('#ext_shortcut .item.yomiage').setAttribute("ext-pin-on", "ON");                
            }
        });
        // 読み上げ機能の音声の種類
        /*
        chrome.storage.local.get("ext_yomiage_opt_voices", function (value) {
            if (value.ext_yomiage_opt_voices) {
                document.querySelector('.ext-setting-menu .ext-yomiage .option.voices select').value = value.ext_yomiage_opt_voices;
            }
        });
        */
        // 読み上げ機能の音量
        chrome.storage.local.get("ext_yomiage_opt_volume", function (value) {
            if (value.ext_yomiage_opt_volume) {
                document.querySelector('.ext-setting-menu .ext-yomiage .option.volume input').value = value.ext_yomiage_opt_volume;
            }
        });
        // 読み上げ機能の速度
        chrome.storage.local.get("ext_yomiage_opt_rate", function (value) {
            if (value.ext_yomiage_opt_rate) {
                document.querySelector('.ext-setting-menu .ext-yomiage .option.rate input').value = value.ext_yomiage_opt_rate;
            }
        });
         // 読み上げ機能のピッチ
        chrome.storage.local.get("ext_yomiage_opt_pitch", function (value) {
            if (value.ext_yomiage_opt_pitch) {
                document.querySelector('.ext-setting-menu .ext-yomiage .option.pitch input').value = value.ext_yomiage_opt_pitch;
            }
        });
        // 読み上げ機能のギフト読み上げ
        chrome.storage.local.get("ext_yomiage_opt_gift", function (value) {
            if (value.ext_yomiage_opt_gift == "ON") {
                document.querySelector('.ext-setting-menu .ext-yomiage .option.gift input').checked = true;
            }
        });
        // 読み上げ機能の広告読み上げ
        chrome.storage.local.get("ext_yomiage_opt_koukoku", function (value) {
            if (value.ext_yomiage_opt_koukoku == "ON") {
                document.querySelector('.ext-setting-menu .ext-yomiage .option.koukoku input').checked = true;
            }
        });
        // 読み上げ機能の来場者読み上げ
        chrome.storage.local.get("ext_yomiage_opt_raijosya", function (value) {
            if (value.ext_yomiage_opt_raijosya == "ON") {
                document.querySelector('.ext-setting-menu .ext-yomiage .option.raijosya input').checked = true;
            }
        });
        // 読み上げ機能のリクエスト読み上げ
        chrome.storage.local.get("ext_yomiage_opt_request", function (value) {
            if (value.ext_yomiage_opt_request == "ON") {
                document.querySelector('.ext-setting-menu .ext-yomiage .option.request input').checked = true;
            }
        });
        // 読み上げ機能のエモーション読み上げ
        chrome.storage.local.get("ext_yomiage_opt_emotion", function (value) {
            if (value.ext_yomiage_opt_emotion == "ON") {
                document.querySelector('.ext-setting-menu .ext-yomiage .option.emotion input').checked = true;
            }
        });
        // 読み上げ機能の長いコメントを省略
        chrome.storage.local.get("ext_yomiage_opt_syoryaku", function (value) {
            if (value.ext_yomiage_opt_syoryaku && !isNaN(value.ext_yomiage_opt_syoryaku)) {
                document.querySelector('.ext-setting-menu .ext-yomiage .option.syoryaku input').value = value.ext_yomiage_opt_syoryaku;
            }
        });
        // 読み上げ機能の名前の読み上げ
        chrome.storage.local.get("ext_yomiage_opt_nameyomiage", function (value) {
            if (value.ext_yomiage_opt_nameyomiage == "ON") {
                document.querySelector('.ext-setting-menu .ext-yomiage .option.nameyomiage input').checked = true;
            }
        });
        // 読み上げ機能の教育機能
        chrome.storage.local.get("ext_yomiage_opt_kyoiku", function (value) {
            if (value.ext_yomiage_opt_kyoiku == "ON") {
                document.querySelector('.ext-setting-menu .ext-yomiage .option.kyoiku input').checked = true;
            }
        });
        // 右クリックOFF
        chrome.storage.local.get("ext_rightClick", function (value) {
            if (value.ext_rightClick == "ON") {
                rightClick();

                // ショートカットをアクティブ状態
                document.querySelector('#ext_shortcut .item.click').setAttribute("active", "ON");   
            }
        });
        // 右クリックOFF機能のピン状態
        chrome.storage.local.get("ext_click_pin", function (value) {
            if (value.ext_click_pin == "ON") {
                // 設定画面のピンのアイコンをON表示
                document.querySelector('.ext-setting-menu .ext-rightClick .pin').setAttribute("ext-pin-on", "ON");
                // ショートカットを表示
                document.querySelector('#ext_shortcut .item.click').setAttribute("ext-pin-on", "ON");                
            }
        });


        // シークバーOFF
        chrome.storage.local.get("ext_seekbar", function (value) {
            initSeekbar();
            if (value.ext_seekbar == "ON") {
                seekbar();

                // ショートカットをアクティブ状態
                document.querySelector('#ext_shortcut .item.seek').setAttribute("active", "ON");
            }
        });
        // シークバーOFF機能のピン状態
        chrome.storage.local.get("ext_seek_pin", function (value) {
            if (value.ext_seek_pin == "ON") {
                // 設定画面のピンのアイコンをON表示
                document.querySelector('.ext-setting-menu .ext-seekbar .pin').setAttribute("ext-pin-on", "ON");
                // ショートカットを表示
                document.querySelector('#ext_shortcut .item.seek').setAttribute("ext-pin-on", "ON");                
            }
        });


        // 配信映像OFF
        chrome.storage.local.get("ext_video", function (value) {
            if (value.ext_video == "ON") {
                videoOff();
                // ショートカットをアクティブ状態
                document.querySelector('#ext_shortcut .item.video').setAttribute("active", "ON");   
            }
        });
        // 配信映像OFF機能のピン状態
        chrome.storage.local.get("ext_video_pin", function (value) {
            if (value.ext_video_pin == "ON") {
                // 設定画面のピンのアイコンをON表示
                document.querySelector('.ext-setting-menu .ext-video .pin').setAttribute("ext-pin-on", "ON");
                // ショートカットを表示
                document.querySelector('#ext_shortcut .item.video').setAttribute("ext-pin-on", "ON");                
            }
        });


        // 配信映像ミュート
        chrome.storage.local.get("ext_video_mute", function (value) {
            if (value.ext_video_mute == "ON") {
                videoMute();
                // ショートカットをアクティブ状態
                document.querySelector('#ext_shortcut .item.video-mute').setAttribute("active", "ON");  
            }
        });
        // 配信映像ミュート機能のピン状態
        chrome.storage.local.get("ext_video_mute_pin", function (value) {
            if (value.ext_video_mute_pin == "ON") {
                // 設定画面のピンのアイコンをON表示
                document.querySelector('.ext-setting-menu .ext-video-mute .pin').setAttribute("ext-pin-on", "ON");
                // ショートカットを表示
                document.querySelector('#ext_shortcut .item.video-mute').setAttribute("ext-pin-on", "ON");                
            }
        });

        // ゲーム画面OFF
        chrome.storage.local.get("ext_game", function (value) {
            if (value.ext_game == "ON") {
                gameOff();
            }
        });
        // ゲーム画面OFF機能のピン状態
        chrome.storage.local.get("ext_game_pin", function (value) {
            if (value.ext_game_pin == "ON") {
                // 設定画面のピンのアイコンをON表示
                document.querySelector('.ext-setting-menu .ext-game .pin').setAttribute("ext-pin-on", "ON");
                // ショートカットを表示
                document.querySelector('#ext_shortcut .item.game').setAttribute("ext-pin-on", "ON");                
            }
        });

        // ゲーム音楽ミュート
        chrome.storage.local.get("ext_game_mute", function (value) {
            initGame();
            if (value.ext_game_mute == "ON") {
                console.log("前回ゲーム音ミュートが有効でした");
                //document.querySelector('.ext-setting-menu .ext-game-mute').setAttribute("ext-attr-on", "true"); 
                chrome.storage.local.get("ext_game_volume", function (value) {
                    
                    console.log(value);
                    if (value.ext_game_volume) {
                        
                        // 前回のビデオボリュームを設定
                        document.querySelector('div[data-layer-name="videoLayer"] video').volume =  value.ext_game_volume / 100;
                        document.querySelector('#ext_videoVolumeSlider').value = value.ext_game_volume;
                    } else {
                        /*
                        console.log("ボリュームはストレージに保存されていません");
                        let videoVolume = document.querySelector('div[data-layer-name="videoLayer"] video').volume;
                        document.querySelector('#ext_videoVolumeSlider').value = videoVolume * 100;
                        */
                    }

                    // ゲーム音ミュートが有効の場合は必ずニコ生のミュートは解除しておく
                    if(document.querySelector('[class^=___mute-button___]').getAttribute("data-toggle-state") == 'true'){
                        document.querySelector('[class^=___mute-button___]').click();
                    } else {
                        console.log("ニコ生のボタンが非ミュート状態22");
                    }

                    gameMute();
                });

                
            }
        });
        // ゲーム音楽ミュート機能のピン状態
        chrome.storage.local.get("ext_game_mute_pin", function (value) {
            if (value.ext_game_mute_pin == "ON") {
                // 設定画面のピンのアイコンをON表示
                document.querySelector('.ext-setting-menu .ext-game-mute .pin').setAttribute("ext-pin-on", "ON");
                // ショートカットを表示
                document.querySelector('#ext_shortcut .item.game-mute').setAttribute("ext-pin-on", "ON");                
            }
        });

        // PIP機能のピン状態
        chrome.storage.local.get("ext_picture_pin", function (value) {
            if (value.ext_picture_pin == "ON") {
                // 設定画面のピンのアイコンをON表示
                document.querySelector('.ext-setting-menu .ext-pip .pin').setAttribute("ext-pin-on", "ON");
                // ショートカットを表示
                document.querySelector('#ext_shortcut .item.picture').setAttribute("ext-pin-on", "ON");       
                
            }
        });



    }
}