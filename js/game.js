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

//let _MUTE_CHECK_TIMER_ID;

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

        /*
        if(_MUTE_CHECK_TIMER_ID) {
            clearInterval(_MUTE_CHECK_TIMER_ID);
        }
        */
        nicoVideo.removeEventListener('volumechange', checkVideoMute);



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
        //nicoVideo.muted = false;
        chrome.storage.local.get("ext_game_volume_mute", function (value) {
            let extMuteBtn = document.querySelector('#ext_volume_overlay');
            if(value.ext_game_volume_mute === "ON") {
                nicoVideo.muted = true;
                // ミュートスピーカーアイコン
                extMuteBtn.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 100 100" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="fill-rule: evenodd; clip-rule: evenodd; stroke-linejoin: round; stroke-miterlimit: 1.41421;"><path d="M24.122,24l21.106,-22.748c1.155,-1.246 2.863,-1.598 4.339,-0.894c1.475,0.705 2.433,2.328 2.433,4.126c0,21.38 0,69.652 0,91.032c0,1.798 -0.958,3.421 -2.433,4.126c-1.476,0.704 -3.184,0.352 -4.339,-0.894l-21.106,-22.748l-16.122,0c-2.122,0 -4.157,-0.843 -5.657,-2.343c-1.5,-1.5 -2.343,-3.535 -2.343,-5.657c0,-9.777 0,-26.223 0,-36c0,-2.122 0.843,-4.157 2.343,-5.657c1.5,-1.5 3.535,-2.343 5.657,-2.343l16.122,0ZM80,42.731c0,0 7.186,-7.186 11.454,-11.454c1.703,-1.703 4.464,-1.703 6.168,0c0.364,0.365 0.736,0.737 1.101,1.101c1.703,1.704 1.703,4.465 0,6.168c-4.268,4.268 -11.454,11.454 -11.454,11.454c0,0 7.186,7.186 11.454,11.454c1.703,1.703 1.703,4.464 0,6.168c-0.365,0.364 -0.737,0.736 -1.101,1.101c-1.704,1.703 -4.465,1.703 -6.168,0c-4.268,-4.268 -11.454,-11.454 -11.454,-11.454c0,0 -7.186,7.186 -11.454,11.454c-1.703,1.703 -4.464,1.703 -6.168,0c-0.364,-0.365 -0.736,-0.737 -1.101,-1.101c-1.703,-1.704 -1.703,-4.465 0,-6.168c4.268,-4.268 11.454,-11.454 11.454,-11.454c0,0 -7.186,-7.186 -11.454,-11.454c-1.703,-1.703 -1.703,-4.464 0,-6.168c0.365,-0.364 0.737,-0.736 1.101,-1.101c1.704,-1.703 4.465,-1.703 6.168,0c4.268,4.268 11.454,11.454 11.454,11.454Z"></path></svg>`;
                
                extMuteBtn.setAttribute('muted', 'ON');
            } else {
                nicoVideo.muted = false;
                // スピーカーアイコン
                extMuteBtn.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 100 100" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="fill-rule: evenodd; clip-rule: evenodd; stroke-linejoin: round; stroke-miterlimit: 1.41421;"><path d="M24.122,24l21.106,-22.748c1.155,-1.246 2.863,-1.598 4.339,-0.894c1.475,0.705 2.433,2.328 2.433,4.126c0,21.38 0,69.652 0,91.032c0,1.798 -0.958,3.421 -2.433,4.126c-1.476,0.704 -3.184,0.352 -4.339,-0.894l-21.106,-22.748l-16.122,0c-2.122,0 -4.157,-0.843 -5.657,-2.343c-1.5,-1.5 -2.343,-3.535 -2.343,-5.657c0,-9.777 0,-26.223 0,-36c0,-2.122 0.843,-4.157 2.343,-5.657c1.5,-1.5 3.535,-2.343 5.657,-2.343l16.122,0ZM75.486,14.675c0.155,-0.244 0.338,-0.473 0.546,-0.681c0.468,-0.494 0.959,-0.985 1.425,-1.451c1.48,-1.481 3.853,-1.569 5.439,-0.202c10.477,9.178 17.104,22.651 17.104,37.659c0,0 0,0 0,0c0,15.008 -6.627,28.481 -17.112,37.649c-1.582,1.363 -3.946,1.275 -5.422,-0.201c-0.299,-0.288 -0.604,-0.589 -0.909,-0.893c-0.18,-0.178 -0.36,-0.358 -0.538,-0.536c-0.787,-0.787 -1.21,-1.866 -1.169,-2.978c0.042,-1.112 0.545,-2.156 1.388,-2.882c2.768,-2.402 5.201,-5.179 7.221,-8.252c0.137,-0.208 0.271,-0.417 0.404,-0.628c0.148,-0.234 0.293,-0.469 0.436,-0.706c0.115,-0.192 0.229,-0.384 0.34,-0.577c0.065,-0.11 0.128,-0.221 0.191,-0.333c0.11,-0.192 0.217,-0.386 0.323,-0.581l0.061,-0.11l0.113,-0.212c0.095,-0.179 0.189,-0.358 0.281,-0.538c0.256,-0.497 0.502,-1.001 0.737,-1.511c0.13,-0.282 0.257,-0.566 0.381,-0.851c0.511,-1.179 0.966,-2.388 1.363,-3.623c0.198,-0.613 0.38,-1.232 0.548,-1.857c0.062,-0.231 0.122,-0.463 0.18,-0.696c0.04,-0.158 0.078,-0.316 0.115,-0.475c0.059,-0.249 0.116,-0.499 0.17,-0.751c0.264,-1.224 0.472,-2.47 0.621,-3.733l0.032,-0.274c0.162,-1.461 0.245,-2.946 0.245,-4.451c0,0 0,0 0,0c0,-10.566 -4.106,-20.181 -10.808,-27.335l-0.112,-0.12l-0.064,-0.067c-0.289,-0.304 -0.583,-0.604 -0.881,-0.9l-0.155,-0.153l-0.119,-0.115c-0.173,-0.168 -0.346,-0.334 -0.522,-0.498c-0.357,-0.335 -0.72,-0.663 -1.09,-0.985c-0.104,-0.09 -0.204,-0.185 -0.298,-0.285c-0.207,-0.219 -0.386,-0.459 -0.537,-0.715c-0.025,-0.043 -0.05,-0.087 -0.073,-0.131l-0.013,-0.023l-0.01,-0.019l-0.013,-0.026l-0.004,-0.007c-0.03,-0.059 -0.058,-0.119 -0.086,-0.179c-0.208,-0.463 -0.328,-0.966 -0.347,-1.484c-0.029,-0.772 0.168,-1.528 0.555,-2.181c0.012,-0.02 0.024,-0.039 0.036,-0.059l0.027,-0.043ZM62.189,27.828c0.363,-0.38 0.73,-0.747 1.079,-1.096c1.427,-1.427 3.693,-1.568 5.286,-0.329c0.879,0.697 1.719,1.441 2.516,2.229c5.508,5.453 8.93,13.014 8.93,21.368c0,0 0,0 0,0c0,9.562 -4.483,18.084 -11.46,23.579c-0.049,0.039 -0.099,0.076 -0.15,0.112l-0.077,0.053c-0.642,0.431 -1.375,0.654 -2.11,0.673l-0.089,0.001c-1.029,0.005 -2.055,-0.389 -2.831,-1.165c-0.307,-0.288 -0.621,-0.595 -0.938,-0.909c-0.178,-0.177 -0.357,-0.356 -0.536,-0.535c-0.184,-0.184 -0.347,-0.383 -0.49,-0.595c-0.036,-0.053 -0.07,-0.107 -0.103,-0.161c-0.02,-0.034 -0.039,-0.067 -0.058,-0.101l-0.018,-0.031l-0.006,-0.01c-0.022,-0.04 -0.043,-0.081 -0.064,-0.122c-0.319,-0.628 -0.469,-1.337 -0.424,-2.055c0.07,-1.144 0.628,-2.203 1.533,-2.908c3.013,-2.301 5.345,-5.445 6.651,-9.077c0.176,-0.489 0.333,-0.987 0.471,-1.493c0.456,-1.675 0.699,-3.437 0.699,-5.256c0,0 0,0 0,0c0,-6.449 -3.059,-12.19 -7.804,-15.848c-0.898,-0.7 -1.453,-1.752 -1.523,-2.888c-0.07,-1.136 0.351,-2.248 1.156,-3.053c0.059,-0.064 0.119,-0.128 0.179,-0.192l0.181,-0.191Z"></path></svg>`;                        
                
                extMuteBtn.setAttribute('muted', 'OFF');
            }
        });
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

        /*
        _MUTE_CHECK_TIMER_ID = setInterval(() => {

            console.log("音量チェック中 : " + document.querySelector('div[data-layer-name="videoLayer"] video').volume);

            // ニコ生ゲーム音ミュート時に、ニコ生プレイヤーのリロードボタン押下時や、画質が切り替わったとき、ビデオの音声が消える不具合の対処
            chrome.storage.local.get("ext_game_volume", function (value) {
                if (value.ext_game_volume) {
                    document.querySelector('div[data-layer-name="videoLayer"] video').volume =  value.ext_game_volume / 100;
                }
            });
        }, 500);
        */

        nicoVideo.addEventListener('volumechange', checkVideoMute);

    }
}

function checkVideoMute() {
    /*
    
    console.log("音量変化を検知");

    let nicoVideo = document.querySelector('div[data-layer-name="videoLayer"] video');

    if(nicoVideo.muted == false) {

        if(nicoVideo.volume == 0 && document.querySelector('#ext_videoVolumeSlider').value > 0) {
            // ニコ生ゲーム音ミュート時に、ニコ生プレイヤーのリロードボタン押下時や、画質が切り替わったとき、ビデオの音声が消える不具合の対処
            chrome.storage.local.get("ext_game_volume", function (value) {
                if (value.ext_game_volume) {
                    nicoVideo.volume =  value.ext_game_volume / 100;
                    //console.log("音量変化を補正");
                }
            });
        }

    }
    */    
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


    
    // ニコ生プレイヤーの更新ボタンをクリックを押したときにvideoの音量がゼロになるのを監視
    //監視オプション
    const options = {
        childList: false,        //直接の子の変更を監視
        characterData: false,    //文字の変化を監視
        attributes: true,       //属性の変化を監視
        subtree: false,          //全ての子要素を監視
    }
   
    let seekDom = document.querySelector('[class^=___progress-bar___]');
    if(seekDom){
        let watchSeek = new MutationObserver(observeSeekbar);
        watchSeek.observe(seekDom, options);    
    } else {
        console.error("videoがありません");
    }



    // プレイヤー下の起動中アイテムのエリアを監視
    //監視オプション
    const optionsLockItem = {
        childList: true,        //直接の子の変更を監視
    }

    let lockItemArea = document.querySelector('[class^=___lock-item-area___]');
    if(lockItemArea){
        let watchLockItem = new MutationObserver(observeLockItemArea);
        watchLockItem.observe(lockItemArea, optionsLockItem);

        // 起動時にすでにニコ生ゲームが起動している場合はワイプをONにする
        CheckAndWipe(document.querySelector('[class^=___launch-item-area___] button'));

    } else {
        console.error("lock-item-area がありません");
    }
}

function observeSeekbar(mutationRecords, observer) {

    console.log("シークバー操作を検知");

    let nicoVideo = document.querySelector('div[data-layer-name="videoLayer"] video');

    // ニコ生ゲーム音ミュート時に、ニコ生プレイヤーのリロードボタン押下時や、画質が切り替わったとき、ビデオの音声が消える不具合の対処
    chrome.storage.local.get("ext_game_mute", function (value) {
        if (value.ext_game_mute == "ON") {
            chrome.storage.local.get("ext_game_volume", function (value) {
                if (value.ext_game_volume) {
                    const extMuteBtn = document.getElementById('ext_volume_overlay');
                    if(extMuteBtn) {
                        const isMuted = extMuteBtn.getAttribute('muted');
                        if(isMuted && isMuted === "OFF") {
                            nicoVideo.muted = false;
                        }
                    }
                    nicoVideo.volume =  value.ext_game_volume / 100;
                }
            });
        }
    });

    if(chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({stop: "stop"});
    }    
}




function autoWipe() {
    
    let menu = document.querySelector('.ext-setting-menu .ext-video-wipe');
    
    if(menu.getAttribute("ext-attr-on")) {
       
        // ボタンをOFF状態に
        menu.removeAttribute("ext-attr-on");

        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_wipe": "OFF"}, function() {});
        // ショートカットを非アクティブ状態
        document.querySelector('#ext_shortcut .item.video-wipe').removeAttribute("active");

        document.querySelector('body').removeAttribute('ext-master-wipe');

    } else {

        // ON状態に
        menu.setAttribute("ext-attr-on", "ON");

        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_wipe": "ON"}, function() {});
        // ショートカットをアクティブ状態
        document.querySelector('#ext_shortcut .item.video-wipe').setAttribute("active", "ON");

        // ON時にすでにニコ生ゲームが起動している場合はワイプをONにする
        CheckAndWipe(document.querySelector('[class^=___launch-item-area___] button'));        
    }
    
}
function CheckAndWipe(launchItem) {
    //let launchItem = currentNode.querySelector('[class^=___launch-item-area___] button');
    if(launchItem) {
        let gameName = launchItem.getAttribute('aria-label');
        console.log(gameName);

        if(gameName.startsWith('美白フィルター') == false
        && gameName.startsWith('部分コピー') == false
        && gameName.startsWith('Twitterユーザー名表示ツール') == false
        && gameName.startsWith('放送者フォローボタン') == false
        && gameName.startsWith('岩時計') == false
        && gameName.startsWith('【放送者用】岩時計') == false
        && gameName.startsWith('【ツール系】') == false
        && gameName.startsWith('公式生放送実況') == false
        && gameName.startsWith('アクティブユーザー') == false
        && gameName.startsWith('マルチカメラ') == false
        ) {
            // ワイプ機能がONかどうか
            if(document.querySelector('.ext-setting-menu .ext-video-wipe').getAttribute("ext-attr-on"))
            {
                // 起動中のアイテムが"引用(quotation)"ではないか？
                let dataContentType = launchItem.getAttribute('data-content-type');
                if(dataContentType !== "quotation") {
                    document.querySelector('body').setAttribute('ext-master-wipe', "ON");
                }
            }
        }                    
    }
}
function observeLockItemArea(mutationRecords, observer) {

    console.log("ロックアイテムエリアの変化を検知");
    for (const mutation of mutationRecords) {

        if(mutation.addedNodes){
            //console.log("追加ノードがあります");
            mutation.addedNodes.forEach((currentNode) => {
        
                //console.log(currentNode);

                CheckAndWipe(currentNode.querySelector('[class^=___launch-item-area___] button'));
                
            
            });
        }

        if(mutation.removedNodes){
            //console.log("削除ノードがあります");
            //console.log(mutation.removedNodes);
            mutation.removedNodes.forEach((currentNode) => {

                // (querySelectorはDOMが削除されているので使えないのでclassNameで判定)
                if(currentNode.className.startsWith('___launch-item-area___')){
                    document.querySelector('body').removeAttribute('ext-master-wipe');   
                }
            });
        }
    }
}