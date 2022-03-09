
window.addEventListener('load', function () {

    let currentURL = location.href;
    if (currentURL.startsWith("https://live.nicovideo.jp/")) {
        if(document.querySelector('[class^=___player-area___]')) {

            // ニコ生URLであり、かつニコ生プレイヤーがあれば。

            // 拡張機能の初期化処理
            initialize(function(ret){

                if(ret) {
                
                    // GUIを設定
                    insertBtnToPlayer();
    
                    // 設定を読み込む
                    setSettingValue();
    
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

        setAkashicParentFrameEvent();
    }

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
        "[class^=___play-button___]",
        "[class^=___control-area___]",
        "[class^=___seek-information___]",
        "[class^=___controller___]",
        "[class^=___table___]",
        //"[class^=___comment-number___]", // ゼロコメ放送だとDOMないので対象外とする
        //"[class^=___comment-text___]",// ゼロコメ放送だとDOMないので対象外とする
        "[class^=___player-area___]",
        "div[data-layer-name='commentLayer'] canvas",
        "div[data-layer-name='videoLayer'] video",
        "div[data-layer-name='akashicGameViewLayer'] canvas",
        "#akashic-gameview"
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

function setSettingValue() {

    if (chrome.storage.local) {
        // コメビュ機能
        chrome.storage.local.get("ext_comeview", function (value) {
            if (value.ext_comeview == "ON") {
                //let menu = document.querySelector('.ext-setting-menu .ext-comeview');
                //menu.setAttribute("ext-attr-on", "ON");
                comeview();
            }
        });

        // シークバーOFF
        chrome.storage.local.get("ext_seekbar", function (value) {
            initSeekbar();
            if (value.ext_seekbar == "ON") {
                seekbar();
            }
        });

        // 右クリックOFF
        chrome.storage.local.get("ext_rightClick", function (value) {
            if (value.ext_rightClick == "ON") {
                rightClick();
            }
        });


        // 配信映像OFF
        chrome.storage.local.get("ext_video", function (value) {
            if (value.ext_video == "ON") {
                //let menu = document.querySelector('.ext-setting-menu .ext-video');
                //menu.setAttribute("ext-attr-on", "ON");
                videoOff();
            }
        });

        // 配信映像ミュート
        chrome.storage.local.get("ext_video_mute", function (value) {
            if (value.ext_video_mute == "ON") {
                //let menu = document.querySelector('.ext-setting-menu .ext-video-mute');
                //menu.setAttribute("ext-attr-on", "ON");
                videoMute();
            }
        });

        // ゲーム画面OFF
        chrome.storage.local.get("ext_game", function (value) {
            if (value.ext_game == "ON") {
                gameOff();
            }
        });

        // ゲーム音楽ミュート
        chrome.storage.local.get("ext_game_mute", function (value) {
            initGame();
            if (value.ext_game_mute == "ON") {
                gameMute();
            } else {

            }
        });

    }
}

// ニコニコプレイヤーにボタンのDOMを挿入
function insertBtnToPlayer() {

    // 拡張機能ボタンの挿入
    //let settingMenu = document.querySelector('.___comment-button___FCHFf');
    let settingMenu = document.querySelector("[class^=___comment-button___]");
    
    let p1 = document.createElement('div');
    p1.innerHTML = '<button class="ext-setting-btn" aria-label="拡張機能" type="button" data-toggle-mode="state" data-toggle-state="true">' +
        '<svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve"><g><path class="st0" d="M496.446,420.572h-62.161v36.571h62.161c8.59,0,15.554-6.964,15.554-15.554v-5.464C512,427.536,505.036,420.572,496.446,420.572z"></path><path class="st0" d="M0,436.125v5.464c0,8.59,6.964,15.554,15.554,15.554h290.732v-36.571H15.554C6.964,420.572,0,427.536,0,436.125z"></path><path class="st0" d="M375.759,365.714h-10.946c-17.179,0-31.098,13.928-31.098,31.098v84.089c0,17.17,13.919,31.098,31.098,31.098h10.946c17.178,0,31.098-13.928,31.098-31.098v-84.089C406.857,379.642,392.937,365.714,375.759,365.714z"></path><path class="st0" d="M496.446,237.696H214.125v36.572h282.322c8.59,0,15.554-6.964,15.554-15.553v-5.464C512,244.661,505.036,237.696,496.446,237.696z" ></path><path class="st0" d="M15.554,274.268h70.571v-36.572H15.554C6.964,237.696,0,244.661,0,253.25v5.464C0,267.303,6.964,274.268,15.554,274.268z" ></path><path class="st0" d="M144.652,182.839c-17.178,0-31.098,13.929-31.098,31.098v84.09c0,17.17,13.92,31.098,31.098,31.098h10.946c17.179,0,31.098-13.928,31.098-31.098v-84.09c0-17.169-13.92-31.098-31.098-31.098H144.652z" ></path><path class="st0" d="M15.554,91.428H236.91V54.857H15.554C6.964,54.857,0,61.821,0,70.411v5.464C0,84.464,6.964,91.428,15.554,91.428z"></path><path class="st0" d="M496.446,54.857H364.911v36.571h131.536c8.59,0,15.554-6.964,15.554-15.554v-5.464C512,61.821,505.036,54.857,496.446,54.857z"></path><path class="st0" d="M295.438,146.286h10.946c17.178,0,31.098-13.928,31.098-31.098V31.098c0-17.17-13.92-31.098-31.098-31.098h-10.946c-17.179,0-31.098,13.928-31.098,31.098v84.089C264.339,132.358,278.259,146.286,295.438,146.286z"></path></g></svg>' +
        '</button>' +
        '<div class="ext-setting-menu">' +
            '<div class="item ext-comeview">' +
                '<div class="name">コメビュ<span class="mini">(要ブラウザ更新)</span></div>' +
                '<div class="value">ON</div>' +
            '</div>' +
            '<div class="item ext-rightClick" title="ニコ生ゲーム『魔道士vsゾンビ?』で役立つかも？">' +
                '<div class="name">右クリックメニューOFF</div>' +
                '<div class="value">ON</div>' +
            '</div>' +
            '<div class="item ext-seekbar">' +
                '<div class="name">シークバーOFF</div>' +
                '<div class="value">ON</div>' +
            '</div>' +
            '<div class="item ext-video">' +
                '<div class="name">配信映像OFF</div>' +
                '<div class="value">ON</div>' +
            '</div>' +
            '<div class="item ext-video-mute">' +
                '<div class="name">配信音ミュート</div>' +
                '<div class="value">ON</div>' +
            '</div>' +
            '<div class="item ext-game">' +
                '<div class="name">ニコ生ゲーム画面OFF</div>' +
                '<div class="value">ON</div>' +
            '</div>' +
            '<div class="item ext-game-mute">' +
                '<div class="name">ニコ生ゲーム音ミュート<span class="mini">※一部は非対応</span></div>' +
                '<div class="value">ON</div>' +
            '</div>' +
            '<div class="item ext-pip">' +
                '<div class="name">小窓表示<span class="mini">※高負荷 & ニコ生ゲーム非対応</span></div>' +
                '<div class="value">ON</div>' +
            '</div>' +            
        '</div>';

            /*
            '<div class="item ext-pip-rec">' +
            '<div class="name">録画開始<span class="mini">(ニコ生ゲーム非対応)</span></div>' +
            '<div class="value">ON</div>' +
            */


    // ボタンの挿入
    settingMenu.parentNode.prepend(p1);


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
    

    // コメビュ
    let comeviewBtn = document.querySelector('.ext-setting-menu .ext-comeview');
    comeviewBtn.addEventListener('click', comeview);


    // シークバーOFF
    let seekBtn = document.querySelector('.ext-setting-menu .ext-seekbar');
    seekBtn.addEventListener('click', seekbar);


    // 右クリックOFF
    let righClickBtn = document.querySelector('.ext-setting-menu .ext-rightClick');
    righClickBtn.addEventListener('click', rightClick);


    // 配信映像OFF
    let videoBtn = document.querySelector('.ext-setting-menu .ext-video');
    videoBtn.addEventListener('click', videoOff);

    // 配信映像ミュート
    let videoMuteBtn = document.querySelector('.ext-setting-menu .ext-video-mute');
    videoMuteBtn.addEventListener('click', videoMute);

    // ゲームOFF
    let gameBtn = document.querySelector('.ext-setting-menu .ext-game');
    gameBtn.addEventListener('click', gameOff);

    // ゲームミュート
    let gameMuteBtn = document.querySelector('.ext-setting-menu .ext-game-mute');
    gameMuteBtn.addEventListener('click', gameMute);    
/*
    // 録画開始
    let recBtn = document.querySelector('.ext-setting-menu .ext-pip-rec');
    recBtn.addEventListener('click', pipRec);
*/
    // ピクチャーインピクチャー
    let pictureBtn = document.querySelector('.ext-setting-menu .ext-pip');
    pictureBtn.addEventListener('click', pip);

}
