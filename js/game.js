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
/*
function gameMute() {
    console.log("gameMuteが押されました");

    let menu = document.querySelector('.ext-setting-menu .ext-game-mute');

    if(menu.getAttribute("ext-attr-on")) {
        console.log("ミュート機能をONからOFFに切り替えます");


        // ボタンをOFF状態に
        menu.removeAttribute("ext-attr-on");

        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_game_mute": "OFF"}, function() {});            
        
        // ショートカットを非アクティブ状態
        document.querySelector('#ext_shortcut .item.game-mute').removeAttribute("active");

        let nicoMuteBtn = document.querySelector('[class^=___mute-button___]');
        if(nicoMuteBtn.getAttribute("data-toggle-state") == 'true') {
            // ミュート状態ならばそのまま
            // ミュートを解除状態だとopacityで親DOMが半透明になっているので見た目だけ解除
            console.log("aaa");
            document.querySelector('[class^=___mute-button___]').click();
            //document.querySelector('[class^=___volume-size-control___]').setAttribute("data-isolated", "true");   
        } else {
            console.log("bbb");
            // ビデオ、ゲームの両方をミュートにする


        }
        
        // プレイヤーのミュートボタンを押せるように戻しておく
        document.querySelector('#ext_volume_overlay').classList.remove('show');

        document.querySelector('#ext_videoVolumeSlider').classList.remove('show');
        
        // ボリュームコントローラーは見た目を初期化
        document.querySelector('[class^=___volume-size-control___]').style.cssText = "";

        document.querySelector('[class^=___volume-size-control___] [class^=___slider___]').style.cssText = "";

    } else {

        console.log("ミュート機能をOFFからONに切り替えます");


        // ON状態に
        menu.setAttribute("ext-attr-on", "ON");

        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_game_mute": "ON"}, function() {});

        // ショートカットをアクティブ状態
        document.querySelector('#ext_shortcut .item.game-mute').setAttribute("active", "ON");

        let nicoMuteBtn = document.querySelector('[class^=___mute-button___]');
        let videoVolume = document.querySelector('div[data-layer-name="videoLayer"] video').volume;

        // ストレージにビデオ音量を保存
        //chrome.storage.local.set({"ext_game_volume": videoVolume * 100}, function() {});  

        const hemo_videoMuteBtn = document.querySelector('.ext-setting-menu .ext-video-mute');
        hemo_videoMuteBtn.getAttribute("ext-attr-on");
        
        if(nicoMuteBtn.getAttribute("data-toggle-state") == 'false'
            && hemo_videoMuteBtn.getAttribute("ext-attr-on") !== "ON") {

            console.log("ミュート機能はONの状態で、ニコ生のミュートボタンは通常通りです");

            // プレイヤーが非ミュート状態

            // 現在のビデオのボリューム設定を取得
            

            // プレイヤーのミュートボタンを押せないようにしておく
            document.querySelector('#ext_volume_overlay').classList.add('show');

            // ボリュームコントローラーは見た目を有効化
            document.querySelector('[class^=___volume-size-control___]').style.cssText = "opacity: 1;";
            
            document.querySelector('#ext_videoVolumeSlider').classList.add('show');

            // ビデオ、ゲームの両方をミュートにする
            document.querySelector('[class^=___mute-button___]').click();

            // ビデオだけミュートを解除する（結果的にゲームだけミュートになる）
            chrome.storage.local.get("ext_game_volume", function (value) {
                if (value.ext_game_volume) {
                    // 前回のビデオボリュームを設定
                    document.querySelector('div[data-layer-name="videoLayer"] video').volume =  value.ext_game_volume / 100;
                    document.querySelector('#ext_videoVolumeSlider').value = value.ext_game_volume;
                } else {   
                    document.querySelector('div[data-layer-name="videoLayer"] video').volume = videoVolume;         
                    document.querySelector('#ext_videoVolumeSlider').value = videoVolume * 100;
                }
            });
            
            document.querySelector('div[data-layer-name="videoLayer"] video').muted = false;

            document.querySelector('[class^=___volume-size-control___] [class^=___slider___]').style.cssText = "display:none;"
            

        } else {
            // プレイヤーがミュート状態
            console.log("ミュート機能はONの状態で、ニコ生のミュートボタンはミュート状態です");

            // ミュートを解除状態だとopacityで親DOMが半透明になっているので見た目だけ解除
            document.querySelector('[class^=___volume-size-control___]').setAttribute("data-isolated", "false");      

            if(hemo_videoMuteBtn.getAttribute("ext-attr-on") !== "ON") {
                document.querySelector('div[data-layer-name="videoLayer"] video').muted = false;
            }
            
            chrome.storage.local.get("ext_game_volume", function (value) {
                if (value.ext_game_volume) {
                    // 前回のビデオボリュームを設定
                    console.log("A" + value.ext_game_volume);
                    document.querySelector('div[data-layer-name="videoLayer"] video').volume =  value.ext_game_volume / 100;
                    document.querySelector('#ext_videoVolumeSlider').value = value.ext_game_volume;
                } else {
                    console.log("B" + value.ext_game_volume);
                    document.querySelector('#ext_videoVolumeSlider').value = videoVolume * 100;
                }
            });



            // プレイヤーのミュートボタンを押せないようにしておく
            document.querySelector('#ext_volume_overlay').classList.add('show');

            document.querySelector('#ext_videoVolumeSlider').classList.add('show');
            document.querySelector('[class^=___volume-size-control___] [class^=___slider___]').style.cssText = "display:none;"
        }






    }
}
*/
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

}