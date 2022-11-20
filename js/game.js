function gameOff() {
    
    let menu = document.querySelector('.ext-setting-menu .ext-game');
    menu.getAttribute("ext-attr-on");

    let game = document.querySelector("div[data-layer-name='akashicGameViewLayer']");

    if(menu.getAttribute("ext-attr-on")) {

        game.style.opacity = 1;
       
        // ボタンをOFF状態に
        menu.removeAttribute("ext-attr-on");

        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_game": "OFF"}, function() {});
        // ショートカットを非アクティブ状態
        document.querySelector('#ext_shortcut .item.game').removeAttribute("active");

    } else {

        // videoタグを非表示に
        game.style.opacity = 0;

        // ON状態に
        menu.setAttribute("ext-attr-on", "ON");

        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_game": "ON"}, function() {});
        // ショートカットをアクティブ状態
        document.querySelector('#ext_shortcut .item.game').setAttribute("active", "ON");
    }
    
}

// ニコニコのミュートボタンがONならture, OFFならfalse を返す。
function isNicoBtnMuted(){
    let bIsMuted = false;
    const nicoMuteBtn = document.querySelector('[class^=___mute-button___]');
    if(nicoMuteBtn.getAttribute("data-toggle-state") == 'true'){
        bIsMuted = true;
    } else {
        bIsMuted = false;
    }
    return bIsMuted;
}

// OFF→ONのときにニコ生ボタンをミュート状態にする必要があるか（true=あり)
let _REQUIRE_MUTE = false;


function gameMute() {
    console.log("gameMuteが押されました");

    let menu = document.querySelector('.ext-setting-menu .ext-game-mute');

    // ニコ生独自のDOM系
    let nicoMuteBtn =       document.querySelector('[class^=___mute-button___]');
    let nicoVideo =         document.querySelector('div[data-layer-name="videoLayer"] video');
    let nicoSliderParent =  document.querySelector('[class^=___volume-size-control___]');
    let nicoSpanSlider =    document.querySelector('[class^=___volume-size-control___] > [class^=___slider___]');

    // へもツール独自のDOM系
    let extSlider =  document.querySelector('#ext_videoVolumeSlider');
    let extOverlay = document.querySelector('#ext_volume_overlay');
    let extMuteBtn = document.querySelector('.ext-setting-menu .ext-video-mute');
    

    if(menu.getAttribute("ext-attr-on")) {
        console.log("----------------------------------");
        console.log("ニコ生ゲームのミュート機能をONからOFFに切り替えます");

        //--------------------------------------------
        //　拡張機能のボタンの状態を制御
        //--------------------------------------------

        // ボタンをOFF状態に
        menu.removeAttribute("ext-attr-on");

        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_game_mute": "OFF"}, function() {});            
        
        // ショートカットを非アクティブ状態
        document.querySelector('#ext_shortcut .item.game-mute').removeAttribute("active");

        //--------------------------------------------
        //　各音量を制御
        //--------------------------------------------

        //if(isNicoBtnMuted()) {
        if(_REQUIRE_MUTE) {
            nicoVideo.volume = 0;
            nicoVideo.muted = true;
            nicoSliderParent.setAttribute("data-isolated", "true"); // 見た目をミュート状態に
        } else {
            // ビデオ、ゲームの両方をミュート解除
            nicoMuteBtn.click();
        }

        if(extMuteBtn.getAttribute("ext-attr-on") === "ON"){
            nicoMuteBtn.click();
            nicoVideo.volume = 0;
            nicoVideo.muted = true;
            //nicoSliderParent.setAttribute("data-isolated", "false"); // 見た目を非ミュート状態に
        }
        
        // プレイヤーのミュートボタンを押せるように戻しておく
        extOverlay.classList.remove('show');
        extSlider.classList.remove('show');
        nicoSpanSlider.style.cssText = "";

    } else {
        console.log("----------------------------------");
        console.log("ニコ生ゲームのミュート機能をOFFからONに切り替えます");

        //--------------------------------------------
        //　拡張機能のボタンの状態を制御
        //--------------------------------------------

        // ON状態に
        menu.setAttribute("ext-attr-on", "ON");

        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_game_mute": "ON"}, function() {});

        // ショートカットをアクティブ状態
        document.querySelector('#ext_shortcut .item.game-mute').setAttribute("active", "ON");


        //--------------------------------------------
        //　各音量を制御
        //--------------------------------------------

        // プレイヤーのミュートボタンを押せないようにしておく
        extOverlay.classList.add('show');
        extSlider.classList.add('show');
        nicoSpanSlider.style.cssText = "display:none;";

        if(isNicoBtnMuted()) {

            // プレイヤーがミュート状態
            console.log("ニコ生のミュートボタンはミュート状態です");

            // ミュートを解除状態だとopacityで親DOMが半透明になっているので見た目だけ解除
            nicoSliderParent.setAttribute("data-isolated", "false");  // opacity: 1 になる       

            // OFF→ONのときにニコ生ボタンをミュート状態にする必要があるか
            _REQUIRE_MUTE = true;

        } else {

            console.log("ニコ生のミュートボタンは通常通りです");

            // ビデオ、ゲームの両方をミュートにする
            nicoMuteBtn.click();

            // 拡張機能のボリュームスライダーの親の見た目を有効状態に
            nicoSliderParent.setAttribute("data-isolated", "false");  // opacity: 1 になる       

            // OFF→ONのときにニコ生ボタンをミュート状態にする必要があるか
            _REQUIRE_MUTE = false;
        }




        // ビデオだけミュートを解除する（結果的にゲームだけミュートになる）
        nicoVideo.muted = false;
        chrome.storage.local.get("ext_game_volume", function (value) {
            if (value.ext_game_volume) {
                // 前回のビデオボリュームを設定
                nicoVideo.volume =  value.ext_game_volume / 100;
                extSlider.value = value.ext_game_volume;
            } else {   
                nicoVideo.volume = nicoVideo.volume;         
                extSlider.value = nicoVideo.volume * 100;
            }
        });

        if(extMuteBtn.getAttribute("ext-attr-on") === "ON"){
            // OFF→ONのときにニコ生ボタンをミュート状態にする必要があるか
            nicoVideo.muted = true;
            _REQUIRE_MUTE = true;
        }


    }
}


function initGame() {
    console.log("initGame()");
    function injectScript(file, node) {
        var th = document.getElementsByTagName(node)[0];
        var s = document.createElement('script');
        s.setAttribute('type', 'text/javascript');
        s.setAttribute('src', file);
        th.appendChild(s);
    }
    injectScript( chrome.runtime.getURL('/js/nicovideo-inject.js'), 'body');


    
    //監視オプション
    const options = {
        childList: true,  //直接の子の変更を監視
        characterData: true,  //文字の変化を監視
        attributes: true,  //属性の変化を監視
        subtree: true, //全ての子要素を監視
    }
    let videoDom = document.querySelector('div[data-layer-name="videoLayer"] video');
    if(videoDom){
        let watchVideo = new MutationObserver(observeVideo);
        watchVideo.observe(videoDom, options);    
    } else {
        console.error("videoがありません");
    }
}

function observeVideo(mutationRecords, observer) {
    // ニコ生ゲーム音ミュート時に、ニコ生プレイヤーのリロードボタン押下時や、画質が切り替わったとき、ビデオの音声が消える不具合の対処
    chrome.storage.local.get("ext_game_volume", function (value) {
        if (value.ext_game_volume) {
            document.querySelector('div[data-layer-name="videoLayer"] video').volume =  value.ext_game_volume / 100;
        }
    });
}