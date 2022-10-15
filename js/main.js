
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
        console.log("ここくる？-------------------------------------");
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
                gameMute();
            } else {

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

// ニコニコプレイヤーにボタンのDOMを挿入
function insertBtnToPlayer() {

    // 拡張機能ボタンの挿入
    let settingMenu = document.querySelector("[class^=___comment-button___]");

    let p1 = document.createElement('div');
    p1.innerHTML = '<button class="ext-setting-btn" aria-label="拡張機能" type="button" data-toggle-mode="state" data-toggle-state="true">' +
                    '<svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve"><g><path class="st0" d="M496.446,420.572h-62.161v36.571h62.161c8.59,0,15.554-6.964,15.554-15.554v-5.464C512,427.536,505.036,420.572,496.446,420.572z"></path><path class="st0" d="M0,436.125v5.464c0,8.59,6.964,15.554,15.554,15.554h290.732v-36.571H15.554C6.964,420.572,0,427.536,0,436.125z"></path><path class="st0" d="M375.759,365.714h-10.946c-17.179,0-31.098,13.928-31.098,31.098v84.089c0,17.17,13.919,31.098,31.098,31.098h10.946c17.178,0,31.098-13.928,31.098-31.098v-84.089C406.857,379.642,392.937,365.714,375.759,365.714z"></path><path class="st0" d="M496.446,237.696H214.125v36.572h282.322c8.59,0,15.554-6.964,15.554-15.553v-5.464C512,244.661,505.036,237.696,496.446,237.696z" ></path><path class="st0" d="M15.554,274.268h70.571v-36.572H15.554C6.964,237.696,0,244.661,0,253.25v5.464C0,267.303,6.964,274.268,15.554,274.268z" ></path><path class="st0" d="M144.652,182.839c-17.178,0-31.098,13.929-31.098,31.098v84.09c0,17.17,13.92,31.098,31.098,31.098h10.946c17.179,0,31.098-13.928,31.098-31.098v-84.09c0-17.169-13.92-31.098-31.098-31.098H144.652z" ></path><path class="st0" d="M15.554,91.428H236.91V54.857H15.554C6.964,54.857,0,61.821,0,70.411v5.464C0,84.464,6.964,91.428,15.554,91.428z"></path><path class="st0" d="M496.446,54.857H364.911v36.571h131.536c8.59,0,15.554-6.964,15.554-15.554v-5.464C512,61.821,505.036,54.857,496.446,54.857z"></path><path class="st0" d="M295.438,146.286h10.946c17.178,0,31.098-13.928,31.098-31.098V31.098c0-17.17-13.92-31.098-31.098-31.098h-10.946c-17.179,0-31.098,13.928-31.098,31.098v84.089C264.339,132.358,278.259,146.286,295.438,146.286z"></path></g></svg>' +
                    '</button>' +
                    '<div class="ext-setting-menu">' +
                        '<div class="item ext-comeview">' +
                            '<div class="name">コメビュ<span class="mini">(要ブラウザ更新)</span></div>' +
                            '<div class="btn-group">' +
                                '<div class="value">ON</div>' +
                                '<div class="pin">'+
                                    '<svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><path class="st0" d="M98.715,369.376l-97.028,97.02L0,512l45.603-1.688l97.02-97.02c-7.614-6.725-15.196-13.783-22.665-21.252 C112.49,384.572,105.425,376.991,98.715,369.376z" ></path><path class="st0" d="M446.021,65.979C387.878,7.853,317.914-16.443,289.735,11.744c-15.688,15.672-15.074,44.312-1.477,76.625 l-88.3,76.56c-55.728-31.15-107.774-37.642-133.911-11.506c-39.168,39.168-5.426,136.398,75.349,217.18 c80.782,80.775,178.013,114.517,217.173,75.357c26.144-26.144,19.653-78.19-11.498-133.911l76.576-88.3 c32.305,13.589,60.936,14.194,76.608-1.478C528.442,194.085,504.155,124.121,446.021,65.979z"></path></g></svg>'+
                                '</div>'+
                                '<div class="setting">'+
                                    '<svg width="100%" height="100%" viewBox="0 0 100 100" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve"><path d="M56.511,3.161c-0.4,-1.721 -1.882,-2.976 -3.645,-3.087c-1.909,-0.101 -3.823,-0.101 -5.731,0.008c-1.76,0.111 -3.239,1.363 -3.638,3.081c-0.722,3.07 -1.85,7.923 -2.503,10.734c-0.312,1.343 -1.294,2.43 -2.598,2.877c-1.259,0.432 -2.49,0.941 -3.688,1.519c-1.236,0.605 -2.696,0.53 -3.864,-0.197c-2.454,-1.519 -6.683,-4.153 -9.361,-5.82c-1.499,-0.934 -3.435,-0.774 -4.76,0.394c-1.421,1.279 -2.774,2.632 -4.046,4.059c-1.166,1.322 -1.327,3.253 -0.394,4.75c1.66,2.682 4.294,6.911 5.82,9.36c0.729,1.171 0.803,2.634 0.198,3.872c-0.586,1.195 -1.095,2.426 -1.534,3.682c-0.447,1.302 -1.532,2.281 -2.872,2.593c-2.809,0.661 -7.662,1.789 -10.734,2.503c-1.721,0.4 -2.976,1.882 -3.087,3.645c-0.101,1.909 -0.101,3.823 0.008,5.731c0.111,1.76 1.363,3.239 3.081,3.638c3.07,0.722 7.923,1.85 10.734,2.503c1.343,0.312 2.43,1.294 2.877,2.598c0.432,1.259 0.941,2.49 1.519,3.688c0.605,1.236 0.53,2.696 -0.197,3.864c-1.519,2.454 -4.153,6.683 -5.82,9.361c-0.934,1.499 -0.774,3.435 0.394,4.76c1.279,1.421 2.632,2.774 4.059,4.046c1.322,1.166 3.253,1.327 4.75,0.394c2.682,-1.66 6.911,-4.294 9.36,-5.82c1.171,-0.729 2.634,-0.803 3.872,-0.198c1.195,0.586 2.426,1.095 3.682,1.534c1.302,0.447 2.281,1.532 2.593,2.872c0.661,2.809 1.789,7.662 2.503,10.734c0.4,1.721 1.882,2.976 3.645,3.087c1.909,0.101 3.823,0.101 5.731,-0.008c1.76,-0.111 3.239,-1.363 3.638,-3.081c0.722,-3.07 1.85,-7.923 2.503,-10.734c0.312,-1.343 1.294,-2.43 2.598,-2.877c1.259,-0.432 2.49,-0.941 3.688,-1.519c1.236,-0.605 2.696,-0.53 3.864,0.197c2.454,1.519 6.683,4.153 9.361,5.82c1.499,0.934 3.435,0.774 4.76,-0.394c1.421,-1.279 2.774,-2.632 4.046,-4.059c1.166,-1.322 1.327,-3.253 0.394,-4.75c-1.66,-2.682 -4.294,-6.911 -5.82,-9.36c-0.729,-1.171 -0.803,-2.634 -0.198,-3.872c0.586,-1.195 1.095,-2.426 1.534,-3.682c0.447,-1.302 1.532,-2.281 2.872,-2.593c2.809,-0.661 7.662,-1.789 10.734,-2.503c1.721,-0.4 2.976,-1.882 3.087,-3.645c0.101,-1.909 0.101,-3.823 -0.008,-5.731c-0.111,-1.76 -1.363,-3.239 -3.081,-3.638c-3.07,-0.722 -7.923,-1.85 -10.734,-2.503c-1.343,-0.312 -2.43,-1.294 -2.877,-2.598c-0.432,-1.259 -0.941,-2.49 -1.519,-3.688c-0.605,-1.236 -0.53,-2.696 0.197,-3.864c1.519,-2.454 4.153,-6.683 5.82,-9.361c0.934,-1.499 0.774,-3.435 -0.394,-4.76c-1.279,-1.421 -2.632,-2.774 -4.059,-4.046c-1.322,-1.166 -3.253,-1.327 -4.75,-0.394c-2.682,1.66 -6.911,4.294 -9.36,5.82c-1.171,0.729 -2.634,0.803 -3.872,0.198c-1.195,-0.586 -2.426,-1.095 -3.682,-1.534c-1.302,-0.447 -2.281,-1.532 -2.593,-2.872c-0.661,-2.809 -1.789,-7.662 -2.503,-10.734ZM50,30.158c0,0 0,0 0,0c10.951,0 19.842,8.891 19.842,19.842c0,0 0,0 0,0c0,10.951 -8.891,19.842 -19.842,19.842c0,0 0,0 0,0c-10.951,0 -19.842,-8.891 -19.842,-19.842c0,0 0,0 0,0c0,-10.951 8.891,-19.842 19.842,-19.842Z"></path></svg>'+
                                '</div>'+
                            '</div>'+
                        '</div>' +
                        '<div class="item ext-bouyomi">' +
                            '<div class="name">コメント読み上げ</div>' +
                            '<div class="btn-group">' +
                                '<div class="value">ON</div>' +
                                '<div class="pin">'+
                                    '<svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><path class="st0" d="M98.715,369.376l-97.028,97.02L0,512l45.603-1.688l97.02-97.02c-7.614-6.725-15.196-13.783-22.665-21.252 C112.49,384.572,105.425,376.991,98.715,369.376z" ></path><path class="st0" d="M446.021,65.979C387.878,7.853,317.914-16.443,289.735,11.744c-15.688,15.672-15.074,44.312-1.477,76.625 l-88.3,76.56c-55.728-31.15-107.774-37.642-133.911-11.506c-39.168,39.168-5.426,136.398,75.349,217.18 c80.782,80.775,178.013,114.517,217.173,75.357c26.144-26.144,19.653-78.19-11.498-133.911l76.576-88.3 c32.305,13.589,60.936,14.194,76.608-1.478C528.442,194.085,504.155,124.121,446.021,65.979z"></path></g></svg>'+
                                '</div>'+
                                '<div class="setting">'+
                                    '<svg width="100%" height="100%" viewBox="0 0 100 100" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve"><path d="M56.511,3.161c-0.4,-1.721 -1.882,-2.976 -3.645,-3.087c-1.909,-0.101 -3.823,-0.101 -5.731,0.008c-1.76,0.111 -3.239,1.363 -3.638,3.081c-0.722,3.07 -1.85,7.923 -2.503,10.734c-0.312,1.343 -1.294,2.43 -2.598,2.877c-1.259,0.432 -2.49,0.941 -3.688,1.519c-1.236,0.605 -2.696,0.53 -3.864,-0.197c-2.454,-1.519 -6.683,-4.153 -9.361,-5.82c-1.499,-0.934 -3.435,-0.774 -4.76,0.394c-1.421,1.279 -2.774,2.632 -4.046,4.059c-1.166,1.322 -1.327,3.253 -0.394,4.75c1.66,2.682 4.294,6.911 5.82,9.36c0.729,1.171 0.803,2.634 0.198,3.872c-0.586,1.195 -1.095,2.426 -1.534,3.682c-0.447,1.302 -1.532,2.281 -2.872,2.593c-2.809,0.661 -7.662,1.789 -10.734,2.503c-1.721,0.4 -2.976,1.882 -3.087,3.645c-0.101,1.909 -0.101,3.823 0.008,5.731c0.111,1.76 1.363,3.239 3.081,3.638c3.07,0.722 7.923,1.85 10.734,2.503c1.343,0.312 2.43,1.294 2.877,2.598c0.432,1.259 0.941,2.49 1.519,3.688c0.605,1.236 0.53,2.696 -0.197,3.864c-1.519,2.454 -4.153,6.683 -5.82,9.361c-0.934,1.499 -0.774,3.435 0.394,4.76c1.279,1.421 2.632,2.774 4.059,4.046c1.322,1.166 3.253,1.327 4.75,0.394c2.682,-1.66 6.911,-4.294 9.36,-5.82c1.171,-0.729 2.634,-0.803 3.872,-0.198c1.195,0.586 2.426,1.095 3.682,1.534c1.302,0.447 2.281,1.532 2.593,2.872c0.661,2.809 1.789,7.662 2.503,10.734c0.4,1.721 1.882,2.976 3.645,3.087c1.909,0.101 3.823,0.101 5.731,-0.008c1.76,-0.111 3.239,-1.363 3.638,-3.081c0.722,-3.07 1.85,-7.923 2.503,-10.734c0.312,-1.343 1.294,-2.43 2.598,-2.877c1.259,-0.432 2.49,-0.941 3.688,-1.519c1.236,-0.605 2.696,-0.53 3.864,0.197c2.454,1.519 6.683,4.153 9.361,5.82c1.499,0.934 3.435,0.774 4.76,-0.394c1.421,-1.279 2.774,-2.632 4.046,-4.059c1.166,-1.322 1.327,-3.253 0.394,-4.75c-1.66,-2.682 -4.294,-6.911 -5.82,-9.36c-0.729,-1.171 -0.803,-2.634 -0.198,-3.872c0.586,-1.195 1.095,-2.426 1.534,-3.682c0.447,-1.302 1.532,-2.281 2.872,-2.593c2.809,-0.661 7.662,-1.789 10.734,-2.503c1.721,-0.4 2.976,-1.882 3.087,-3.645c0.101,-1.909 0.101,-3.823 -0.008,-5.731c-0.111,-1.76 -1.363,-3.239 -3.081,-3.638c-3.07,-0.722 -7.923,-1.85 -10.734,-2.503c-1.343,-0.312 -2.43,-1.294 -2.877,-2.598c-0.432,-1.259 -0.941,-2.49 -1.519,-3.688c-0.605,-1.236 -0.53,-2.696 0.197,-3.864c1.519,-2.454 4.153,-6.683 5.82,-9.361c0.934,-1.499 0.774,-3.435 -0.394,-4.76c-1.279,-1.421 -2.632,-2.774 -4.059,-4.046c-1.322,-1.166 -3.253,-1.327 -4.75,-0.394c-2.682,1.66 -6.911,4.294 -9.36,5.82c-1.171,0.729 -2.634,0.803 -3.872,0.198c-1.195,-0.586 -2.426,-1.095 -3.682,-1.534c-1.302,-0.447 -2.281,-1.532 -2.593,-2.872c-0.661,-2.809 -1.789,-7.662 -2.503,-10.734ZM50,30.158c0,0 0,0 0,0c10.951,0 19.842,8.891 19.842,19.842c0,0 0,0 0,0c0,10.951 -8.891,19.842 -19.842,19.842c0,0 0,0 0,0c-10.951,0 -19.842,-8.891 -19.842,-19.842c0,0 0,0 0,0c0,-10.951 8.891,-19.842 19.842,-19.842Z"></path></svg>'+
                                '</div>'+
                            '</div>'+
                        '</div>' +
                        '<div class="item ext-rightClick" title="ニコ生ゲーム『魔道士vsゾンビ?』で役立つかも？">' +
                            '<div class="name">右クリックメニューOFF</div>' +
                            '<div class="btn-group">' +
                                '<div class="value">ON</div>' +
                                '<div class="pin">'+
                                    '<svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><path class="st0" d="M98.715,369.376l-97.028,97.02L0,512l45.603-1.688l97.02-97.02c-7.614-6.725-15.196-13.783-22.665-21.252 C112.49,384.572,105.425,376.991,98.715,369.376z" ></path><path class="st0" d="M446.021,65.979C387.878,7.853,317.914-16.443,289.735,11.744c-15.688,15.672-15.074,44.312-1.477,76.625 l-88.3,76.56c-55.728-31.15-107.774-37.642-133.911-11.506c-39.168,39.168-5.426,136.398,75.349,217.18 c80.782,80.775,178.013,114.517,217.173,75.357c26.144-26.144,19.653-78.19-11.498-133.911l76.576-88.3 c32.305,13.589,60.936,14.194,76.608-1.478C528.442,194.085,504.155,124.121,446.021,65.979z"></path></g></svg>'+
                                '</div>'+
                            '</div>'+
                        '</div>' +
                        '<div class="item ext-seekbar">' +
                            '<div class="name">シークバーOFF</div>' +
                            '<div class="btn-group">' +
                                '<div class="value">ON</div>' +
                                '<div class="pin">'+
                                    '<svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><path class="st0" d="M98.715,369.376l-97.028,97.02L0,512l45.603-1.688l97.02-97.02c-7.614-6.725-15.196-13.783-22.665-21.252 C112.49,384.572,105.425,376.991,98.715,369.376z" ></path><path class="st0" d="M446.021,65.979C387.878,7.853,317.914-16.443,289.735,11.744c-15.688,15.672-15.074,44.312-1.477,76.625 l-88.3,76.56c-55.728-31.15-107.774-37.642-133.911-11.506c-39.168,39.168-5.426,136.398,75.349,217.18 c80.782,80.775,178.013,114.517,217.173,75.357c26.144-26.144,19.653-78.19-11.498-133.911l76.576-88.3 c32.305,13.589,60.936,14.194,76.608-1.478C528.442,194.085,504.155,124.121,446.021,65.979z"></path></g></svg>'+
                                '</div>'+
                            '</div>'+
                        '</div>' +
                        '<div class="item ext-video">' +
                            '<div class="name">配信映像OFF</div>' +
                            '<div class="btn-group">' +
                                '<div class="value">ON</div>' +
                                '<div class="pin">'+
                                    '<svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><path class="st0" d="M98.715,369.376l-97.028,97.02L0,512l45.603-1.688l97.02-97.02c-7.614-6.725-15.196-13.783-22.665-21.252 C112.49,384.572,105.425,376.991,98.715,369.376z" ></path><path class="st0" d="M446.021,65.979C387.878,7.853,317.914-16.443,289.735,11.744c-15.688,15.672-15.074,44.312-1.477,76.625 l-88.3,76.56c-55.728-31.15-107.774-37.642-133.911-11.506c-39.168,39.168-5.426,136.398,75.349,217.18 c80.782,80.775,178.013,114.517,217.173,75.357c26.144-26.144,19.653-78.19-11.498-133.911l76.576-88.3 c32.305,13.589,60.936,14.194,76.608-1.478C528.442,194.085,504.155,124.121,446.021,65.979z"></path></g></svg>'+
                                '</div>'+
                            '</div>'+
                        '</div>' +
                        '<div class="item ext-video-mute">' +
                            '<div class="name">配信音ミュート</div>' +
                            '<div class="btn-group">' +
                                '<div class="value">ON</div>' +
                                '<div class="pin">'+
                                    '<svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><path class="st0" d="M98.715,369.376l-97.028,97.02L0,512l45.603-1.688l97.02-97.02c-7.614-6.725-15.196-13.783-22.665-21.252 C112.49,384.572,105.425,376.991,98.715,369.376z" ></path><path class="st0" d="M446.021,65.979C387.878,7.853,317.914-16.443,289.735,11.744c-15.688,15.672-15.074,44.312-1.477,76.625 l-88.3,76.56c-55.728-31.15-107.774-37.642-133.911-11.506c-39.168,39.168-5.426,136.398,75.349,217.18 c80.782,80.775,178.013,114.517,217.173,75.357c26.144-26.144,19.653-78.19-11.498-133.911l76.576-88.3 c32.305,13.589,60.936,14.194,76.608-1.478C528.442,194.085,504.155,124.121,446.021,65.979z"></path></g></svg>'+
                                '</div>'+
                            '</div>'+
                        '</div>' +
                        '<div class="item ext-game">' +
                            '<div class="name">ニコ生ゲーム画面OFF</div>' +
                            '<div class="btn-group">' +
                                '<div class="value">ON</div>' +
                                '<div class="pin">'+
                                    '<svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><path class="st0" d="M98.715,369.376l-97.028,97.02L0,512l45.603-1.688l97.02-97.02c-7.614-6.725-15.196-13.783-22.665-21.252 C112.49,384.572,105.425,376.991,98.715,369.376z" ></path><path class="st0" d="M446.021,65.979C387.878,7.853,317.914-16.443,289.735,11.744c-15.688,15.672-15.074,44.312-1.477,76.625 l-88.3,76.56c-55.728-31.15-107.774-37.642-133.911-11.506c-39.168,39.168-5.426,136.398,75.349,217.18 c80.782,80.775,178.013,114.517,217.173,75.357c26.144-26.144,19.653-78.19-11.498-133.911l76.576-88.3 c32.305,13.589,60.936,14.194,76.608-1.478C528.442,194.085,504.155,124.121,446.021,65.979z"></path></g></svg>'+
                                '</div>'+
                            '</div>'+
                        '</div>' +
                        '<div class="item ext-game-mute">' +
                            '<div class="name">ニコ生ゲーム音ミュート<span class="mini">※一部非対応</span></div>' +
                            '<div class="btn-group">' +
                                '<div class="value">ON</div>' +
                                '<div class="pin">'+
                                    '<svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><path class="st0" d="M98.715,369.376l-97.028,97.02L0,512l45.603-1.688l97.02-97.02c-7.614-6.725-15.196-13.783-22.665-21.252 C112.49,384.572,105.425,376.991,98.715,369.376z" ></path><path class="st0" d="M446.021,65.979C387.878,7.853,317.914-16.443,289.735,11.744c-15.688,15.672-15.074,44.312-1.477,76.625 l-88.3,76.56c-55.728-31.15-107.774-37.642-133.911-11.506c-39.168,39.168-5.426,136.398,75.349,217.18 c80.782,80.775,178.013,114.517,217.173,75.357c26.144-26.144,19.653-78.19-11.498-133.911l76.576-88.3 c32.305,13.589,60.936,14.194,76.608-1.478C528.442,194.085,504.155,124.121,446.021,65.979z"></path></g></svg>'+
                                '</div>'+
                            '</div>'+
                        '</div>' +
                        '<div class="item ext-pip">' +
                            '<div class="name">小窓表示<span class="mini">※高負荷 & ゲーム非対応</span></div>' +
                            '<div class="btn-group">' +
                                '<div class="value">ON</div>' +
                                '<div class="pin">'+
                                    '<svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" xml:space="preserve"><g><path class="st0" d="M98.715,369.376l-97.028,97.02L0,512l45.603-1.688l97.02-97.02c-7.614-6.725-15.196-13.783-22.665-21.252 C112.49,384.572,105.425,376.991,98.715,369.376z" ></path><path class="st0" d="M446.021,65.979C387.878,7.853,317.914-16.443,289.735,11.744c-15.688,15.672-15.074,44.312-1.477,76.625 l-88.3,76.56c-55.728-31.15-107.774-37.642-133.911-11.506c-39.168,39.168-5.426,136.398,75.349,217.18 c80.782,80.775,178.013,114.517,217.173,75.357c26.144-26.144,19.653-78.19-11.498-133.911l76.576-88.3 c32.305,13.589,60.936,14.194,76.608-1.478C528.442,194.085,504.155,124.121,446.021,65.979z"></path></g></svg>'+
                                '</div>'+
                            '</div>'+
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



















    let shortcut = document.createElement('div');
    shortcut.id = "ext_shortcut";
    shortcut.innerHTML = 
        '<div class="item comeview" aria-label="コメントビューアー機能をONにします">コメビュ</div>'+
        '<div class="item click" aria-label="ブラウザの右クリックメニューを無効化します">右クリックメニューOFF</div>'+
        '<div class="item seek" aria-label="シークバーを無効化します">シークバーOFF</div>'+
        '<div class="item video" aria-label="配信映像を非表示にします">配信映像OFF</div>'+
        '<div class="item video-mute" aria-label="配信音をミュートにします">配信音ミュート</div>'+
        '<div class="item game" aria-label="ニコ生ゲームの映像を非表示にします">ニコ生ゲーム画面OFF</div>'+
        '<div class="item game-mute" aria-label="ニコ生ゲームの音をミュートします">ニコ生ゲーム音ミュート</div>'+
        '<div class="item picture" aria-label="映像＋コメントを小窓で表示します">小窓表示</div>';
    document.querySelector('[class^=___player-controller___]').append(shortcut);
    






    // コメビュ
    let comeviewBtn = document.querySelector('.ext-setting-menu .ext-comeview .value');
    comeviewBtn.addEventListener('click', comeview);
    let comeviewPin = document.querySelector('.ext-setting-menu .ext-comeview .pin');
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
        //pip();
    });


}
