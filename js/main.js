/*

▼▼▼▼ 利用させていただいているMITライセンスの著作権表示 ▼▼▼▼



< mp4-muxer >---------------------------------------------------------------------

MIT License

Copyright (c) 2023 Vanilagy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.



*/

let _obsLogBox;
let _embeddedDataJson;

window.addEventListener('load', function () {






    let currentURL = location.href;
    if (currentURL.startsWith("https://live.nicovideo.jp/")) {
        if(document.querySelector('[class^=___player-area___]')) {

            // ニコ生URLであり、かつニコ生プレイヤーがあれば。

            // 拡張機能の初期化処理
            initialize(function(ret){

                if(ret) {

                    const promise = fetch(chrome.runtime.getURL("/html/parts-menu.html"));
                    const promise_info = fetch(chrome.runtime.getURL("/html/info.html"));

                    //fetch() のレスポンス（リクエストの結果）を then() メソッドで処理
                    Promise.all([promise, promise_info])
                    .then((responses) => {
                        return Promise.all(responses.map(response => response.text()));
                    })
                    .then(([partsHtml, infoHtml]) => {

                        // ニコ生の埋込データを取得
                        getEmbeddedDataJson();

                        // 自身が配信者かどうかのチェック
                        ownerCheck();

                        // GUIを設定
                        insertBtnToPlayer(partsHtml, infoHtml);

                        // 設定を読み込む
                        setSettingValue();

                        // イベント設定
                        setEvents();

                    });                    


                } else {
                    console.error("へもツールの初期化に失敗しました。ニコ生がアップデートされた可能性があります。");
                }

            }, 6000 * 10 * 5); // 5分
        }
    }

    if (location.href.startsWith("https://ak.cdn.nimg.jp/")) {
        //console.log("ここくる？-------------------------------------");
        setAkashicParentFrameEvent();
    }

    
    window.addEventListener('beforeunload', function(e) {
        chrome.runtime.postMessage({stop: "stop"});
    }, false);
    
    setInterval(() => {
        console.log("サービスワーカーを活かすためのメッセージ送信");
        chrome.runtime.sendMessage("何でも良いメッセージ");
    }, 25 * 1000);


});

function getEmbeddedDataJson(){

    const nicoData = document.querySelector('#embedded-data');
    if(nicoData){
        const jsonString = nicoData.getAttribute("data-props");
        if(jsonString){
            try {
                _embeddedDataJson = JSON.parse(jsonString);
            } catch (err) {
                console.error("ニコ生の埋込データを取得できませんでした", err);
            }
        }
    }
}


function ownerCheck(){
    const broadvastTool = document.querySelector('[class^=___broadcaster-tool___]');
    if(broadvastTool) {
        // 自分が配信者であることを示す属性を設定
        document.querySelector('body').setAttribute("ext-attr-IamOwner", "true");
    } else {
        document.querySelector('body').setAttribute("ext-attr-IamOwner", "false");
    }
}



window.addEventListener('resize', function(e){

    // console.log("リサイズイベント発生");

    /* メニューの高さを調整 */
    setExtSettingMenuHeight();

    /* ポップアップ画面の高さ調整 */
    setExtPopupHeight();

    /* 画面幅を調整 */
    setSplitterSize();

});

function setSplitterSize(bGetLocalSetting = false) {

    // console.log("setSplitterSize");

    chrome.storage.local.get(["ext_comeview", "ext_comeview_opt_wide", "ext_comeview_opt_wide_panelWidth", "ext_comeview_opt_wide_displayWidth"], function (value) {
        if (value.ext_comeview === "ON" && value.ext_comeview_opt_wide === "ON") {
            if(bGetLocalSetting) {

                /* 保存してある幅から設定 */
                        
                if (value.ext_comeview_opt_wide_panelWidth && value.ext_comeview_opt_wide_displayWidth) {
    
                    const getPanelWidth = Number(value.ext_comeview_opt_wide_panelWidth.replace("px", ""));
    
                    /* 画面幅を調整 */
                    const displayElement = document.querySelector('[class^=___player-display___]');
                    const panelElement = document.querySelector("[class^=___player-status-panel___]");
                    const playerSection = document.querySelector('[class^=___player-section___]');
                    const parentWidth = playerSection.clientWidth;
    
                    displayElement.style.width = parentWidth - getPanelWidth + "px";
                    panelElement.style.width = getPanelWidth + "px";
    
                }
        
            } else {
        
                /* 現在の幅から画面幅を調整 */
        
                const displayElement = document.querySelector('[class^=___player-display___]');
                const panelElement = document.querySelector("[class^=___player-status-panel___]");
                const playerSection = document.querySelector('[class^=___player-section___]');
                const parentWidth = playerSection.clientWidth;
        
                displayElement.style.width = parentWidth - panelElement.clientWidth + "px";
        
                chrome.storage.local.set({"ext_comeview_opt_wide_panelWidth": panelElement.clientWidth + "px"}, function() {});
                chrome.storage.local.set({"ext_comeview_opt_wide_displayWidth": displayElement.style.width}, function() {});
            }

        } else {
            removeSplitterSize();
        }
    });
    
}

function removeSplitterSize() {

    console.log("removeSplitterSize");

    const displayElement = document.querySelector('[class^=___player-display___]'); // プレイヤーDOM
    const panelElement = document.querySelector("[class^=___player-status-panel___]"); // コメント欄DOM
    displayElement.style.width = "";
    panelElement.style.width = "";
}

function setEvents() {

    // コメビュ幅の調整バーを挿入
    var splitElement = document.createElement("div");
    splitElement.id = "split_by_extention";
    var playerElement = document.querySelector("[class^=___player-status-panel___]");
    playerElement.parentNode.insertBefore(splitElement, playerElement);



    /* コメビュ幅の調整バーの設定 */
    const displayElement = document.querySelector('[class^=___player-display___]');
    const splitter = document.getElementById("split_by_extention");

    let bActive = false;

    splitter.addEventListener("mousedown", (event) => {
        bActive = true;
        document.body.style.userSelect = 'none'; // テキスト選択を禁止するCSSを適用

        // アクティブ表示ツールやニコ生ゲームなどが起動しているとマウス移動のイベントが取れないので、オーバーレイを表示
        document.querySelector("#ext_overlay").style.display = "block";
    });

    const panelElement = document.querySelector("[class^=___player-status-panel___]"); // コメント欄DOM
    const parent = document.querySelector('[class^=___player-section___]');             // プレイヤーDOMとコメント欄DOMの親DOM
    parent.addEventListener("mousemove", (event) => {
        if(bActive) {
            // プレイヤー画面の左端からの距離を取得
            const parentRect = document.querySelector('[class^=___player-display___]').getClientRects();                
            const size = event.clientX - parentRect[0].x;
            // プレイヤーDOMとコメント欄DOMの親DOMのサイズからコメント欄DOMのサイズを引いたサイズをコメント欄DOMに設定
            const parentWidth = parent.clientWidth;
    
            panelElement.style.width = parentWidth - size + "px";
            displayElement.style.width = size + "px";
        };
    }, false);

    document.addEventListener("mouseup", (event) => {
        if(bActive) {
            bActive = false;
            document.body.style.userSelect = ''; // テキスト選択を許可するCSSを解除
            chrome.storage.local.set({"ext_comeview_opt_wide_panelWidth": panelElement.style.width}, function() {});
            chrome.storage.local.set({"ext_comeview_opt_wide_displayWidth": displayElement.style.width}, function() {});
        
            // アクティブ表示ツールやニコ生ゲームなどが起動しているとマウス移動のイベントが取れないので、オーバーレイを表示したので解除しとく
            if(!document.querySelector('.ext-setting-menu').getAttribute("ext-attr-show")){
                // メニューもオーバーレイを利用するので、メニューが表示されているならオーバーレイを消さない
                document.querySelector("#ext_overlay").style.display = "none";
            }
        }
    }, false);


    
    //監視オプション
    const optionsForParent = {
        childList:              true,    //直接の子の変更を監視
        characterData:          true,    //文字の変化を監視
        characterDataOldValue:  false,   //属性の変化前を記録
        attributes:             false,   //属性の変化を監視
        subtree:                false,   //全ての子要素を監視
    }

    // コメントDOMの親DOMの監視を開始(フルスクリーン解除時、放送ネタ画面(ギフト画面)の表示時に対応するため)
    const contentsArea = document.querySelector("[class^=___contents-area___]"); // コメントDOMの大元の親DOMを指定
    if (contentsArea) {
        const obs = new MutationObserver(setSplitterSize);
        obs.observe(contentsArea, optionsForParent);
    }

    //監視オプション
    const optionsForTheaterBtn = {
        childList:              false,   //直接の子の変更を監視
        characterData:          false,   //文字の変化を監視
        characterDataOldValue:  false,   //属性の変化前を記録
        attributes:             true,    //属性の変化を監視
        subtree:                false,   //全ての子要素を監視
    }

    // leo-playerの監視を開始(シアターモード時に対応するため。シアターモードのときはleo-playerの属性値が変化する)
    const theaterBtn = document.querySelector("[class^=___leo-player___]");
    if (theaterBtn) {
        const obs = new MutationObserver(setSplitterSize);
        obs.observe(theaterBtn, optionsForTheaterBtn);
    }

    setSplitterSize();


    //監視オプション
    const ichibaOption = {
        childList:              true,    //直接の子の変更を監視
        characterData:          false,    //文字の変化を監視
        characterDataOldValue:  false,   //属性の変化前を記録
        attributes:             true,   //属性の変化を監視
        subtree:                false,   //全ての子要素を監視
    }

    // イチバのバルーンDOMの監視を開始
    const ichibaBaloonArea = document.querySelector("[class^=___ichiba-balloon___]"); // コメントDOMの大元の親DOMを指定
    if (ichibaBaloonArea) {
        const obs = new MutationObserver(watchIchibaBaloon);
        obs.observe(ichibaBaloonArea, ichibaOption);
    }

}

function setExtSettingMenuHeight() {

    let height = document.querySelector('[class^=___player-display-screen___]').clientHeight * 0.9;
    if(document.querySelector('.ext-setting-menu'))
        document.querySelector('.ext-setting-menu').style.height = height + "px";

    const ITEM_HEIGHT = 34;
    const MENU_HEIGHT = 28; //  表示前だから取得できないdocument.querySelector('.ext-setting-menu .item.info').clientHeight の高さ
    const BORDER_HEIGHT = 3; // ボーダーの高さ
    
    // 表示状態のアイテム数を取得
    let maxHeight = document.querySelectorAll('.ext-setting-menu .ext-item:not([ext-view-item-off])').length * ITEM_HEIGHT;
    maxHeight += MENU_HEIGHT;

    maxHeight += document.querySelectorAll('.ext-setting-menu .ext-item.border-bottom').length * BORDER_HEIGHT;
    
    console.log("ボーダーの数：" + document.querySelectorAll('.ext-setting-menu .ext-item.border-bottom').length);
    console.log("アイテムの数：" + document.querySelectorAll('.ext-setting-menu .ext-item:not([ext-view-item-off])').length);
    console.log("メニューの高さ：" + document.querySelector('.ext-setting-menu .item.info')?.clientHeight);
    console.log("メニューの高さ：" + maxHeight);

    //let maxHeight = document.querySelectorAll('.ext-setting-menu > div').length * ITEM_HEIGHT;
    if(document.querySelector('.ext-setting-menu'))
        document.querySelector('.ext-setting-menu').style.maxHeight  = maxHeight + "px";

}

function setExtPopupHeight() {
    let height = document.querySelector('[class^=___player-display-screen___]').clientHeight * 0.8;
    
    if(height > 400) {
        height = 400;
    }
    if(document.querySelector('.ext-popup')){
        document.querySelector('.ext-popup').style.height = height + "px";
        document.querySelector('.ext-popup').style.top = -height - 60 + "px";    
    }
}


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
function insertBtnToPlayer(partsHtml, infoHtml) {

    // 拡張機能ボタンの挿入
    let settingMenu = document.querySelector("[class^=___comment-button___]");

    let p1 = document.createElement('div');


    // "sample.jpg" を "/拡張機能PATH/img/sample.jpg" に置換
    partsHtml = partsHtml.replace(/src="([^"]+)"/g, 'src="' + chrome.runtime.getURL("/img/$1") + '"');

    //partsHtml = partsHtml.replace("sample.jpg", chrome.runtime.getURL("/img/sample.jpg"));

    p1.innerHTML = partsHtml;
    settingMenu.parentNode.prepend(p1);

    let overlay = document.createElement('div');
    overlay.id = "ext_overlay";
    document.querySelector('[class^=___player-display-screen]').prepend(overlay);



    //スタイル エレメントを作成
    let style = document.createElement("style");
    style.id = "extension_style";
    //<style>を<head>に入れる
    document.head.appendChild(style);

    //スタイル エレメントを作成(Pアイコン、主アイコン用)
    let style_comment_for_icon = document.createElement("style");
    style_comment_for_icon.id = "extension_style_for_icon";
    //<style>を<head>に入れる
    document.head.appendChild(style_comment_for_icon);
    style_comment_for_icon.sheet.insertRule('.premium_by_extention { background-image: url("' + chrome.runtime.getURL("/img/icon-premium.png") + '"); }');
    style_comment_for_icon.sheet.insertRule('.noPremium_by_extention { background-image: url("' + chrome.runtime.getURL("/img/icon-normal.png") + '"); }');
    style_comment_for_icon.sheet.insertRule('.owner_by_extention { background-image: url("' + chrome.runtime.getURL("/img/icon-owner.png") + '"); }');
    


    // 拡張機能ボタンのメニュー表示
    document.querySelector('.ext-setting-btn').addEventListener('click', function () {
        let menu = document.querySelector('.ext-setting-menu');
        //menu.toggleAttribute("ext-attr-show");

        if(menu.getAttribute("ext-attr-show")) {
            document.querySelector("#ext_overlay").style.display = "none";
            menu.removeAttribute("ext-attr-show");

        } else {
            setExtSettingMenuHeight();
            document.querySelector("#ext_overlay").style.display = "block";
            menu.setAttribute("ext-attr-show", "ON");
        }

        // お知らせポップアップを非表示
        document.querySelector('.ext-popup').classList.remove('show');
        // ストレージに現在のマニフェストのバージョン情報を保存
        var manifestData = chrome.runtime.getManifest();
        chrome.storage.local.set({"ext_current_version": manifestData.version});        
    });

    //let overlay = document.querySelector('#ext_overlay');
    overlay.addEventListener('click', function () {
        document.querySelector("#ext_overlay").style.display = "none";
        document.querySelector('.ext-setting-menu').removeAttribute("ext-attr-show");

        // 表示設定をOFFにする
        document.querySelector('.ext-setting-menu').removeAttribute('ext-view-on');
        //setExtSettingMenuHeight();// メニューの高さを調整
        
        // お知らせポップアップを非表示
        document.querySelector('.ext-popup').classList.remove('show');

        // ストレージに現在のマニフェストのバージョン情報を保存
        var manifestData = chrome.runtime.getManifest();
        chrome.storage.local.set({"ext_current_version": manifestData.version});             
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
        '<div class="item bouyomi" aria-label="棒読みちゃん連携をONにします">棒読み</div>'+
        '<div class="item click" aria-label="ブラウザの右クリックメニューを無効化します">右クリックメニューOFF</div>'+
        '<div class="item seek" aria-label="シークバーを無効化します">シークバーOFF</div>'+
        '<div class="item video" aria-label="配信映像を非表示にします">配信映像OFF</div>'+
        '<div class="item video-mute" aria-label="配信音をミュートにします">配信音ミュート</div>'+
        '<div class="item game" aria-label="ニコ生ゲームの映像を非表示にします">ニコ生ゲーム画面OFF</div>'+
        '<div class="item game-mute" aria-label="ニコ生ゲームの音をミュートします">ニコ生ゲーム音ミュート</div>'+
        '<div class="item ichiba" aria-label="ニコ生ゲームのショートカットを起動します">ニコ生ゲームショートカット</div>'+
        '<div class="item video-wipe" aria-label="ニコ生ゲーム起動時に配信映像をワイプします">ワイプ</div>'+
        '<div class="item video-effect" aria-label="配信映像を加工します">映像加工</div>'+
        '<div class="item picture" aria-label="映像＋コメントを小窓で表示します">小窓表示</div>'+
        '<div class="item rec" aria-label="録画を開始します"><span class="status">●</span><span class="recBtn">録画開始</span></div>';
    document.querySelector('[class^=___player-controller___]').append(shortcut);


    // 市場ショートカット用のDOMを作成しておく
    // <div id="ext_ichiba_shortcut">
    //     <div class="time"></div>
    //     <div class="item-box"></div>
    // </div>
    const ichibaShortcut = document.createElement('div');
    ichibaShortcut.id = "ext_ichiba_shortcut";
    ichibaShortcut.innerHTML = '<div class="time-box"></div><div class="item-box"></div>';
    document.querySelector('[class^=___player-controller___]').append(ichibaShortcut);
    // 市場ショートカット用のDOMに各ショートカットを追加する
    addIchibaShortcut();
    

    chrome.storage.local.get("ext_viewoff_array", function (value) {
        if(value && value.ext_viewoff_array && Array.isArray(value.ext_viewoff_array)) {

            value.ext_viewoff_array.forEach(function(item){
                document.querySelector(item).setAttribute("ext-view-item-off", "on");
                document.querySelector(item).querySelector('.view').setAttribute("view-off", "on");
            });

        }
    });

    
    document.getElementById('ext-view').addEventListener('click', function(){
        const viewOn = document.querySelector('.ext-setting-menu').getAttribute('ext-view-on');
        if(viewOn) {
            document.querySelector('.ext-setting-menu').removeAttribute('ext-view-on');
            setExtSettingMenuHeight();// メニューの高さを調整     

        } else {
            document.querySelector('.ext-setting-menu').setAttribute('ext-view-on','on');

            // 歯車ボタンは全て非アクティブ
            document.querySelectorAll('.ext-setting-menu .setting').forEach(function(item){
                item.classList.remove('active');
            });
            // 歯車のオプションメニューを全て非表示
            document.querySelectorAll('.ext-setting-menu .option-box').forEach(function(item){
                item.classList.remove('show');
            });            
        }
    });
    const menuViewButtons = document.querySelectorAll('.ext-setting-menu .btn-group .view');
    menuViewButtons.forEach(function(btn){
        
        btn.addEventListener('click', function(e){
            
            if(this.getAttribute('view-off')) {
                this.removeAttribute('view-off')
                this.closest('.ext-item').removeAttribute('ext-view-item-off');


                const classes = Array.from(this.closest('.ext-item').classList);
                let classStr = "";
                classes.forEach(className => {
                    classStr += "." + className;
                });
                chrome.storage.local.get("ext_viewoff_array", function (value) {
                    if(value && value.ext_viewoff_array && Array.isArray(value.ext_viewoff_array)) {
                        let viewOffArray = value.ext_viewoff_array;
                        if (viewOffArray.includes(classStr)) {
                            viewOffArray = viewOffArray.filter(item => item !== classStr);
                            chrome.storage.local.set({"ext_viewoff_array": viewOffArray});                                
                        }
                        console.log("OFFクラス：" + viewOffArray);
                    }
                });

            } else {
                this.setAttribute('view-off', 'on');
                this.closest('.ext-item').setAttribute('ext-view-item-off','on');
                
                const classes = Array.from(this.closest('.ext-item').classList);
                let classStr = "";
                classes.forEach(className => {
                    classStr += "." + className;
                });
                chrome.storage.local.get("ext_viewoff_array", function (value) {
                    if(value && value.ext_viewoff_array && Array.isArray(value.ext_viewoff_array)) {
                        // 追加保存
                        let viewOffArray = value.ext_viewoff_array;
                        if (!viewOffArray.includes(classStr)) {
                            viewOffArray.push(classStr);
                            chrome.storage.local.set({"ext_viewoff_array": viewOffArray});
                            console.log("OFFクラスリストの保存：" + viewOffArray);
                        }
                    } else {
                        // 初回保存
                        let viewOffArray = [];
                        viewOffArray.push(classStr);
                        chrome.storage.local.set({"ext_viewoff_array": viewOffArray});
                        console.log("OFFクラスリストの保存：" + viewOffArray);
                    } 
                });   
            }
        });
    });



    // 簡易録画機能
    document.querySelector('.ext-setting-menu .ext-rec .item .value').addEventListener('click', function(){
        
        if(document.querySelector('#ext_shortcut .item.rec').getAttribute("ext-pin-on")) {
            // ON → OFF
            document.querySelector('.ext-setting-menu .ext-rec').removeAttribute("ext-attr-on");
            document.querySelector('#ext_shortcut .item.rec').removeAttribute("ext-pin-on");
            chrome.storage.local.set({"ext_rec_pin": "OFF"}, function() {});
        } else {
            // OFF → ON
            document.querySelector('.ext-setting-menu .ext-rec').setAttribute("ext-attr-on", "on");
            document.querySelector('#ext_shortcut .item.rec').setAttribute("ext-pin-on", "ON");
            chrome.storage.local.set({"ext_rec_pin": "ON"}, function() {});
        }
        //pipRec();
    });

    // 録画開始、録画停止
    document.querySelector('#ext_shortcut .item.rec').addEventListener('click', function(){
        let status = document.querySelector('#ext_shortcut .item.rec').getAttribute("recording");
        if(status) {

            if(status === "ON") {
                // ON → OFF
                recStop();
            }

        } else {
            // OFF → ON
            recStart();
           
            // オプション操作を無効化しておく
            
            document.querySelector('.option.videoBitrato select').setAttribute("disabled", 'on');

        }
    });





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
    

    // 棒読みちゃん連携
    let bouyomiBtn = document.querySelector('.ext-setting-menu .ext-bouyomi .item .value');
    bouyomiBtn.addEventListener('click', bouyomi);
    let bouyomiPin = document.querySelector('.ext-setting-menu .ext-bouyomi .item .pin');
    bouyomiPin.addEventListener('click', function() {
        if(bouyomiPin.getAttribute("ext-pin-on")){
            // 設定画面のピンのアイコンをOFF表示
            bouyomiPin.removeAttribute("ext-pin-on");
            // ショートカットを非表示
            document.querySelector('#ext_shortcut .item.bouyomi').removeAttribute("ext-pin-on");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_bouyomi_pin": "OFF"}, function() {});
        } else {
            // 設定画面のピンのアイコンをON表示
            bouyomiPin.setAttribute("ext-pin-on", "ON");
            // ショートカットを表示
            document.querySelector('#ext_shortcut .item.bouyomi').setAttribute("ext-pin-on", "ON");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_bouyomi_pin": "ON"}, function() {});
        }
    });
    document.querySelector('#ext_shortcut .bouyomi').addEventListener('click', function() {
        bouyomi();
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

    // ニコ生ゲーム自動ワイプ
    document.querySelector('.ext-setting-menu .ext-video-wipe .value').addEventListener('click', autoWipe);
    let gameWipePin = document.querySelector('.ext-setting-menu .ext-video-wipe .pin');
    gameWipePin.addEventListener('click', function() {
        if(gameWipePin.getAttribute("ext-pin-on")){
            // 設定画面のピンのアイコンをOFF表示
            gameWipePin.removeAttribute("ext-pin-on");
            // ショートカットを非表示
            document.querySelector('#ext_shortcut .item.video-wipe').removeAttribute("ext-pin-on");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_wipe_pin": "OFF"}, function() {});
        } else {
            // 設定画面のピンのアイコンをON表示
            gameWipePin.setAttribute("ext-pin-on", "ON");
            // ショートカットを表示
            document.querySelector('#ext_shortcut .item.video-wipe').setAttribute("ext-pin-on", "ON");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_wipe_pin": "ON"}, function() {});
        }
    });
    document.querySelector('#ext_shortcut .video-wipe').addEventListener('click', function() {
        autoWipe();
    });

    // ニコ生プレイヤーのミュートボタンを操作できないようにする用のDOMを作成しておく
    let nicoMuteBtn = document.querySelector('[class^=___mute-button___]');
    let overlayMute = document.createElement('div');
    overlayMute.id = "ext_volume_overlay";
    //overlayMute.textContent = "配信の音量→";
    //overlayMute.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 100 100" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="fill-rule: evenodd; clip-rule: evenodd; stroke-linejoin: round; stroke-miterlimit: 1.41421;"><path d="M24.122,24l21.106,-22.748c1.155,-1.246 2.863,-1.598 4.339,-0.894c1.475,0.705 2.433,2.328 2.433,4.126c0,21.38 0,69.652 0,91.032c0,1.798 -0.958,3.421 -2.433,4.126c-1.476,0.704 -3.184,0.352 -4.339,-0.894l-21.106,-22.748l-16.122,0c-2.122,0 -4.157,-0.843 -5.657,-2.343c-1.5,-1.5 -2.343,-3.535 -2.343,-5.657c0,-9.777 0,-26.223 0,-36c0,-2.122 0.843,-4.157 2.343,-5.657c1.5,-1.5 3.535,-2.343 5.657,-2.343l16.122,0ZM75.486,14.675c0.155,-0.244 0.338,-0.473 0.546,-0.681c0.468,-0.494 0.959,-0.985 1.425,-1.451c1.48,-1.481 3.853,-1.569 5.439,-0.202c10.477,9.178 17.104,22.651 17.104,37.659c0,0 0,0 0,0c0,15.008 -6.627,28.481 -17.112,37.649c-1.582,1.363 -3.946,1.275 -5.422,-0.201c-0.299,-0.288 -0.604,-0.589 -0.909,-0.893c-0.18,-0.178 -0.36,-0.358 -0.538,-0.536c-0.787,-0.787 -1.21,-1.866 -1.169,-2.978c0.042,-1.112 0.545,-2.156 1.388,-2.882c2.768,-2.402 5.201,-5.179 7.221,-8.252c0.137,-0.208 0.271,-0.417 0.404,-0.628c0.148,-0.234 0.293,-0.469 0.436,-0.706c0.115,-0.192 0.229,-0.384 0.34,-0.577c0.065,-0.11 0.128,-0.221 0.191,-0.333c0.11,-0.192 0.217,-0.386 0.323,-0.581l0.061,-0.11l0.113,-0.212c0.095,-0.179 0.189,-0.358 0.281,-0.538c0.256,-0.497 0.502,-1.001 0.737,-1.511c0.13,-0.282 0.257,-0.566 0.381,-0.851c0.511,-1.179 0.966,-2.388 1.363,-3.623c0.198,-0.613 0.38,-1.232 0.548,-1.857c0.062,-0.231 0.122,-0.463 0.18,-0.696c0.04,-0.158 0.078,-0.316 0.115,-0.475c0.059,-0.249 0.116,-0.499 0.17,-0.751c0.264,-1.224 0.472,-2.47 0.621,-3.733l0.032,-0.274c0.162,-1.461 0.245,-2.946 0.245,-4.451c0,0 0,0 0,0c0,-10.566 -4.106,-20.181 -10.808,-27.335l-0.112,-0.12l-0.064,-0.067c-0.289,-0.304 -0.583,-0.604 -0.881,-0.9l-0.155,-0.153l-0.119,-0.115c-0.173,-0.168 -0.346,-0.334 -0.522,-0.498c-0.357,-0.335 -0.72,-0.663 -1.09,-0.985c-0.104,-0.09 -0.204,-0.185 -0.298,-0.285c-0.207,-0.219 -0.386,-0.459 -0.537,-0.715c-0.025,-0.043 -0.05,-0.087 -0.073,-0.131l-0.013,-0.023l-0.01,-0.019l-0.013,-0.026l-0.004,-0.007c-0.03,-0.059 -0.058,-0.119 -0.086,-0.179c-0.208,-0.463 -0.328,-0.966 -0.347,-1.484c-0.029,-0.772 0.168,-1.528 0.555,-2.181c0.012,-0.02 0.024,-0.039 0.036,-0.059l0.027,-0.043ZM62.189,27.828c0.363,-0.38 0.73,-0.747 1.079,-1.096c1.427,-1.427 3.693,-1.568 5.286,-0.329c0.879,0.697 1.719,1.441 2.516,2.229c5.508,5.453 8.93,13.014 8.93,21.368c0,0 0,0 0,0c0,9.562 -4.483,18.084 -11.46,23.579c-0.049,0.039 -0.099,0.076 -0.15,0.112l-0.077,0.053c-0.642,0.431 -1.375,0.654 -2.11,0.673l-0.089,0.001c-1.029,0.005 -2.055,-0.389 -2.831,-1.165c-0.307,-0.288 -0.621,-0.595 -0.938,-0.909c-0.178,-0.177 -0.357,-0.356 -0.536,-0.535c-0.184,-0.184 -0.347,-0.383 -0.49,-0.595c-0.036,-0.053 -0.07,-0.107 -0.103,-0.161c-0.02,-0.034 -0.039,-0.067 -0.058,-0.101l-0.018,-0.031l-0.006,-0.01c-0.022,-0.04 -0.043,-0.081 -0.064,-0.122c-0.319,-0.628 -0.469,-1.337 -0.424,-2.055c0.07,-1.144 0.628,-2.203 1.533,-2.908c3.013,-2.301 5.345,-5.445 6.651,-9.077c0.176,-0.489 0.333,-0.987 0.471,-1.493c0.456,-1.675 0.699,-3.437 0.699,-5.256c0,0 0,0 0,0c0,-6.449 -3.059,-12.19 -7.804,-15.848c-0.898,-0.7 -1.453,-1.752 -1.523,-2.888c-0.07,-1.136 0.351,-2.248 1.156,-3.053c0.059,-0.064 0.119,-0.128 0.179,-0.192l0.181,-0.191Z"></path></svg>`;
    //overlayMute.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 100 100" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="fill-rule: evenodd; clip-rule: evenodd; stroke-linejoin: round; stroke-miterlimit: 1.41421;"><path d="M24.122,24l21.106,-22.748c1.155,-1.246 2.863,-1.598 4.339,-0.894c1.475,0.705 2.433,2.328 2.433,4.126c0,21.38 0,69.652 0,91.032c0,1.798 -0.958,3.421 -2.433,4.126c-1.476,0.704 -3.184,0.352 -4.339,-0.894l-21.106,-22.748l-16.122,0c-2.122,0 -4.157,-0.843 -5.657,-2.343c-1.5,-1.5 -2.343,-3.535 -2.343,-5.657c0,-9.777 0,-26.223 0,-36c0,-2.122 0.843,-4.157 2.343,-5.657c1.5,-1.5 3.535,-2.343 5.657,-2.343l16.122,0ZM80,42.731c0,0 7.186,-7.186 11.454,-11.454c1.703,-1.703 4.464,-1.703 6.168,0c0.364,0.365 0.736,0.737 1.101,1.101c1.703,1.704 1.703,4.465 0,6.168c-4.268,4.268 -11.454,11.454 -11.454,11.454c0,0 7.186,7.186 11.454,11.454c1.703,1.703 1.703,4.464 0,6.168c-0.365,0.364 -0.737,0.736 -1.101,1.101c-1.704,1.703 -4.465,1.703 -6.168,0c-4.268,-4.268 -11.454,-11.454 -11.454,-11.454c0,0 -7.186,7.186 -11.454,11.454c-1.703,1.703 -4.464,1.703 -6.168,0c-0.364,-0.365 -0.736,-0.737 -1.101,-1.101c-1.703,-1.704 -1.703,-4.465 0,-6.168c4.268,-4.268 11.454,-11.454 11.454,-11.454c0,0 -7.186,-7.186 -11.454,-11.454c-1.703,-1.703 -1.703,-4.464 0,-6.168c0.365,-0.364 0.737,-0.736 1.101,-1.101c1.704,-1.703 4.465,-1.703 6.168,0c4.268,4.268 11.454,11.454 11.454,11.454Z"></path></svg>`;
    overlayMute.style.cssText = "width: " + nicoMuteBtn.clientWidth + "px;" + "height: " + nicoMuteBtn.clientHeight + "px;";
    document.querySelector('[class^=___volume-setting___]').insertBefore(overlayMute, nicoMuteBtn);

    document.querySelector('#ext_volume_overlay').addEventListener("click", (event) => {
        
        let video = document.querySelector('div[data-layer-name="videoLayer"] video');
        if(video.muted) {

            video.muted = false;
            chrome.storage.local.set({"ext_game_volume_mute": "OFF"}, function() {});
            // スピーカーのアイコン表示
            document.querySelector('#ext_volume_overlay').innerHTML = `<svg width="100%" height="100%" viewBox="0 0 100 100" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="fill-rule: evenodd; clip-rule: evenodd; stroke-linejoin: round; stroke-miterlimit: 1.41421;"><path d="M24.122,24l21.106,-22.748c1.155,-1.246 2.863,-1.598 4.339,-0.894c1.475,0.705 2.433,2.328 2.433,4.126c0,21.38 0,69.652 0,91.032c0,1.798 -0.958,3.421 -2.433,4.126c-1.476,0.704 -3.184,0.352 -4.339,-0.894l-21.106,-22.748l-16.122,0c-2.122,0 -4.157,-0.843 -5.657,-2.343c-1.5,-1.5 -2.343,-3.535 -2.343,-5.657c0,-9.777 0,-26.223 0,-36c0,-2.122 0.843,-4.157 2.343,-5.657c1.5,-1.5 3.535,-2.343 5.657,-2.343l16.122,0ZM75.486,14.675c0.155,-0.244 0.338,-0.473 0.546,-0.681c0.468,-0.494 0.959,-0.985 1.425,-1.451c1.48,-1.481 3.853,-1.569 5.439,-0.202c10.477,9.178 17.104,22.651 17.104,37.659c0,0 0,0 0,0c0,15.008 -6.627,28.481 -17.112,37.649c-1.582,1.363 -3.946,1.275 -5.422,-0.201c-0.299,-0.288 -0.604,-0.589 -0.909,-0.893c-0.18,-0.178 -0.36,-0.358 -0.538,-0.536c-0.787,-0.787 -1.21,-1.866 -1.169,-2.978c0.042,-1.112 0.545,-2.156 1.388,-2.882c2.768,-2.402 5.201,-5.179 7.221,-8.252c0.137,-0.208 0.271,-0.417 0.404,-0.628c0.148,-0.234 0.293,-0.469 0.436,-0.706c0.115,-0.192 0.229,-0.384 0.34,-0.577c0.065,-0.11 0.128,-0.221 0.191,-0.333c0.11,-0.192 0.217,-0.386 0.323,-0.581l0.061,-0.11l0.113,-0.212c0.095,-0.179 0.189,-0.358 0.281,-0.538c0.256,-0.497 0.502,-1.001 0.737,-1.511c0.13,-0.282 0.257,-0.566 0.381,-0.851c0.511,-1.179 0.966,-2.388 1.363,-3.623c0.198,-0.613 0.38,-1.232 0.548,-1.857c0.062,-0.231 0.122,-0.463 0.18,-0.696c0.04,-0.158 0.078,-0.316 0.115,-0.475c0.059,-0.249 0.116,-0.499 0.17,-0.751c0.264,-1.224 0.472,-2.47 0.621,-3.733l0.032,-0.274c0.162,-1.461 0.245,-2.946 0.245,-4.451c0,0 0,0 0,0c0,-10.566 -4.106,-20.181 -10.808,-27.335l-0.112,-0.12l-0.064,-0.067c-0.289,-0.304 -0.583,-0.604 -0.881,-0.9l-0.155,-0.153l-0.119,-0.115c-0.173,-0.168 -0.346,-0.334 -0.522,-0.498c-0.357,-0.335 -0.72,-0.663 -1.09,-0.985c-0.104,-0.09 -0.204,-0.185 -0.298,-0.285c-0.207,-0.219 -0.386,-0.459 -0.537,-0.715c-0.025,-0.043 -0.05,-0.087 -0.073,-0.131l-0.013,-0.023l-0.01,-0.019l-0.013,-0.026l-0.004,-0.007c-0.03,-0.059 -0.058,-0.119 -0.086,-0.179c-0.208,-0.463 -0.328,-0.966 -0.347,-1.484c-0.029,-0.772 0.168,-1.528 0.555,-2.181c0.012,-0.02 0.024,-0.039 0.036,-0.059l0.027,-0.043ZM62.189,27.828c0.363,-0.38 0.73,-0.747 1.079,-1.096c1.427,-1.427 3.693,-1.568 5.286,-0.329c0.879,0.697 1.719,1.441 2.516,2.229c5.508,5.453 8.93,13.014 8.93,21.368c0,0 0,0 0,0c0,9.562 -4.483,18.084 -11.46,23.579c-0.049,0.039 -0.099,0.076 -0.15,0.112l-0.077,0.053c-0.642,0.431 -1.375,0.654 -2.11,0.673l-0.089,0.001c-1.029,0.005 -2.055,-0.389 -2.831,-1.165c-0.307,-0.288 -0.621,-0.595 -0.938,-0.909c-0.178,-0.177 -0.357,-0.356 -0.536,-0.535c-0.184,-0.184 -0.347,-0.383 -0.49,-0.595c-0.036,-0.053 -0.07,-0.107 -0.103,-0.161c-0.02,-0.034 -0.039,-0.067 -0.058,-0.101l-0.018,-0.031l-0.006,-0.01c-0.022,-0.04 -0.043,-0.081 -0.064,-0.122c-0.319,-0.628 -0.469,-1.337 -0.424,-2.055c0.07,-1.144 0.628,-2.203 1.533,-2.908c3.013,-2.301 5.345,-5.445 6.651,-9.077c0.176,-0.489 0.333,-0.987 0.471,-1.493c0.456,-1.675 0.699,-3.437 0.699,-5.256c0,0 0,0 0,0c0,-6.449 -3.059,-12.19 -7.804,-15.848c-0.898,-0.7 -1.453,-1.752 -1.523,-2.888c-0.07,-1.136 0.351,-2.248 1.156,-3.053c0.059,-0.064 0.119,-0.128 0.179,-0.192l0.181,-0.191Z"></path></svg>`;
            document.querySelector('#ext_volume_overlay').setAttribute('muted', 'OFF');  
        } else {
            video.muted = true;
            chrome.storage.local.set({"ext_game_volume_mute": "ON"}, function() {});
            // ミュートスピーカーのアイコン表示
            document.querySelector('#ext_volume_overlay').innerHTML = `<svg width="100%" height="100%" viewBox="0 0 100 100" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="fill-rule: evenodd; clip-rule: evenodd; stroke-linejoin: round; stroke-miterlimit: 1.41421;"><path d="M24.122,24l21.106,-22.748c1.155,-1.246 2.863,-1.598 4.339,-0.894c1.475,0.705 2.433,2.328 2.433,4.126c0,21.38 0,69.652 0,91.032c0,1.798 -0.958,3.421 -2.433,4.126c-1.476,0.704 -3.184,0.352 -4.339,-0.894l-21.106,-22.748l-16.122,0c-2.122,0 -4.157,-0.843 -5.657,-2.343c-1.5,-1.5 -2.343,-3.535 -2.343,-5.657c0,-9.777 0,-26.223 0,-36c0,-2.122 0.843,-4.157 2.343,-5.657c1.5,-1.5 3.535,-2.343 5.657,-2.343l16.122,0ZM80,42.731c0,0 7.186,-7.186 11.454,-11.454c1.703,-1.703 4.464,-1.703 6.168,0c0.364,0.365 0.736,0.737 1.101,1.101c1.703,1.704 1.703,4.465 0,6.168c-4.268,4.268 -11.454,11.454 -11.454,11.454c0,0 7.186,7.186 11.454,11.454c1.703,1.703 1.703,4.464 0,6.168c-0.365,0.364 -0.737,0.736 -1.101,1.101c-1.704,1.703 -4.465,1.703 -6.168,0c-4.268,-4.268 -11.454,-11.454 -11.454,-11.454c0,0 -7.186,7.186 -11.454,11.454c-1.703,1.703 -4.464,1.703 -6.168,0c-0.364,-0.365 -0.736,-0.737 -1.101,-1.101c-1.703,-1.704 -1.703,-4.465 0,-6.168c4.268,-4.268 11.454,-11.454 11.454,-11.454c0,0 -7.186,-7.186 -11.454,-11.454c-1.703,-1.703 -1.703,-4.464 0,-6.168c0.365,-0.364 0.737,-0.736 1.101,-1.101c1.704,-1.703 4.465,-1.703 6.168,0c4.268,4.268 11.454,11.454 11.454,11.454Z"></path></svg>`;            
            document.querySelector('#ext_volume_overlay').setAttribute('muted', 'ON');
        }
    });


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

        document.querySelector('#ext_videoVolumeSlider').setAttribute('aria-label', '音量:' + e.target.value);

        // 拡張機能用のミュートボタンを制御
        document.querySelector('#ext_volume_overlay').innerHTML = `<svg width="100%" height="100%" viewBox="0 0 100 100" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="fill-rule: evenodd; clip-rule: evenodd; stroke-linejoin: round; stroke-miterlimit: 1.41421;"><path d="M24.122,24l21.106,-22.748c1.155,-1.246 2.863,-1.598 4.339,-0.894c1.475,0.705 2.433,2.328 2.433,4.126c0,21.38 0,69.652 0,91.032c0,1.798 -0.958,3.421 -2.433,4.126c-1.476,0.704 -3.184,0.352 -4.339,-0.894l-21.106,-22.748l-16.122,0c-2.122,0 -4.157,-0.843 -5.657,-2.343c-1.5,-1.5 -2.343,-3.535 -2.343,-5.657c0,-9.777 0,-26.223 0,-36c0,-2.122 0.843,-4.157 2.343,-5.657c1.5,-1.5 3.535,-2.343 5.657,-2.343l16.122,0ZM75.486,14.675c0.155,-0.244 0.338,-0.473 0.546,-0.681c0.468,-0.494 0.959,-0.985 1.425,-1.451c1.48,-1.481 3.853,-1.569 5.439,-0.202c10.477,9.178 17.104,22.651 17.104,37.659c0,0 0,0 0,0c0,15.008 -6.627,28.481 -17.112,37.649c-1.582,1.363 -3.946,1.275 -5.422,-0.201c-0.299,-0.288 -0.604,-0.589 -0.909,-0.893c-0.18,-0.178 -0.36,-0.358 -0.538,-0.536c-0.787,-0.787 -1.21,-1.866 -1.169,-2.978c0.042,-1.112 0.545,-2.156 1.388,-2.882c2.768,-2.402 5.201,-5.179 7.221,-8.252c0.137,-0.208 0.271,-0.417 0.404,-0.628c0.148,-0.234 0.293,-0.469 0.436,-0.706c0.115,-0.192 0.229,-0.384 0.34,-0.577c0.065,-0.11 0.128,-0.221 0.191,-0.333c0.11,-0.192 0.217,-0.386 0.323,-0.581l0.061,-0.11l0.113,-0.212c0.095,-0.179 0.189,-0.358 0.281,-0.538c0.256,-0.497 0.502,-1.001 0.737,-1.511c0.13,-0.282 0.257,-0.566 0.381,-0.851c0.511,-1.179 0.966,-2.388 1.363,-3.623c0.198,-0.613 0.38,-1.232 0.548,-1.857c0.062,-0.231 0.122,-0.463 0.18,-0.696c0.04,-0.158 0.078,-0.316 0.115,-0.475c0.059,-0.249 0.116,-0.499 0.17,-0.751c0.264,-1.224 0.472,-2.47 0.621,-3.733l0.032,-0.274c0.162,-1.461 0.245,-2.946 0.245,-4.451c0,0 0,0 0,0c0,-10.566 -4.106,-20.181 -10.808,-27.335l-0.112,-0.12l-0.064,-0.067c-0.289,-0.304 -0.583,-0.604 -0.881,-0.9l-0.155,-0.153l-0.119,-0.115c-0.173,-0.168 -0.346,-0.334 -0.522,-0.498c-0.357,-0.335 -0.72,-0.663 -1.09,-0.985c-0.104,-0.09 -0.204,-0.185 -0.298,-0.285c-0.207,-0.219 -0.386,-0.459 -0.537,-0.715c-0.025,-0.043 -0.05,-0.087 -0.073,-0.131l-0.013,-0.023l-0.01,-0.019l-0.013,-0.026l-0.004,-0.007c-0.03,-0.059 -0.058,-0.119 -0.086,-0.179c-0.208,-0.463 -0.328,-0.966 -0.347,-1.484c-0.029,-0.772 0.168,-1.528 0.555,-2.181c0.012,-0.02 0.024,-0.039 0.036,-0.059l0.027,-0.043ZM62.189,27.828c0.363,-0.38 0.73,-0.747 1.079,-1.096c1.427,-1.427 3.693,-1.568 5.286,-0.329c0.879,0.697 1.719,1.441 2.516,2.229c5.508,5.453 8.93,13.014 8.93,21.368c0,0 0,0 0,0c0,9.562 -4.483,18.084 -11.46,23.579c-0.049,0.039 -0.099,0.076 -0.15,0.112l-0.077,0.053c-0.642,0.431 -1.375,0.654 -2.11,0.673l-0.089,0.001c-1.029,0.005 -2.055,-0.389 -2.831,-1.165c-0.307,-0.288 -0.621,-0.595 -0.938,-0.909c-0.178,-0.177 -0.357,-0.356 -0.536,-0.535c-0.184,-0.184 -0.347,-0.383 -0.49,-0.595c-0.036,-0.053 -0.07,-0.107 -0.103,-0.161c-0.02,-0.034 -0.039,-0.067 -0.058,-0.101l-0.018,-0.031l-0.006,-0.01c-0.022,-0.04 -0.043,-0.081 -0.064,-0.122c-0.319,-0.628 -0.469,-1.337 -0.424,-2.055c0.07,-1.144 0.628,-2.203 1.533,-2.908c3.013,-2.301 5.345,-5.445 6.651,-9.077c0.176,-0.489 0.333,-0.987 0.471,-1.493c0.456,-1.675 0.699,-3.437 0.699,-5.256c0,0 0,0 0,0c0,-6.449 -3.059,-12.19 -7.804,-15.848c-0.898,-0.7 -1.453,-1.752 -1.523,-2.888c-0.07,-1.136 0.351,-2.248 1.156,-3.053c0.059,-0.064 0.119,-0.128 0.179,-0.192l0.181,-0.191Z"></path></svg>`;
        chrome.storage.local.set({"ext_game_volume_mute": "OFF"}, function() {});

    });
    document.querySelector('#ext_videoVolumeSlider').addEventListener('mousewheel', function(e){
        var volumeSlider = document.getElementById('ext_videoVolumeSlider');
        e.preventDefault(); // Prevent default scrolling behavior

        var delta = Math.sign(-e.deltaY); // Get the direction of the wheel scroll
        var currentValue = parseInt(volumeSlider.value);
        var newValue = currentValue + delta;
    
        // Ensure the new value stays within the range of min and max
        newValue = Math.max(parseInt(volumeSlider.min), Math.min(newValue, parseInt(volumeSlider.max)));
    
        volumeSlider.value = newValue; // Update the value of the volume slider

        // ストレージにビデオ音量を保存
        chrome.storage.local.set({"ext_game_volume": newValue}, function() {});        

        document.querySelector('div[data-layer-name="videoLayer"] video').volume =  newValue / 100;
        document.querySelector('div[data-layer-name="videoLayer"] video').muted = false;

        document.querySelector('#ext_videoVolumeSlider').setAttribute('aria-label', '音量:' + newValue);
        

        // 拡張機能用のミュートボタンを制御
        document.querySelector('#ext_volume_overlay').innerHTML = `<svg width="100%" height="100%" viewBox="0 0 100 100" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="fill-rule: evenodd; clip-rule: evenodd; stroke-linejoin: round; stroke-miterlimit: 1.41421;"><path d="M24.122,24l21.106,-22.748c1.155,-1.246 2.863,-1.598 4.339,-0.894c1.475,0.705 2.433,2.328 2.433,4.126c0,21.38 0,69.652 0,91.032c0,1.798 -0.958,3.421 -2.433,4.126c-1.476,0.704 -3.184,0.352 -4.339,-0.894l-21.106,-22.748l-16.122,0c-2.122,0 -4.157,-0.843 -5.657,-2.343c-1.5,-1.5 -2.343,-3.535 -2.343,-5.657c0,-9.777 0,-26.223 0,-36c0,-2.122 0.843,-4.157 2.343,-5.657c1.5,-1.5 3.535,-2.343 5.657,-2.343l16.122,0ZM75.486,14.675c0.155,-0.244 0.338,-0.473 0.546,-0.681c0.468,-0.494 0.959,-0.985 1.425,-1.451c1.48,-1.481 3.853,-1.569 5.439,-0.202c10.477,9.178 17.104,22.651 17.104,37.659c0,0 0,0 0,0c0,15.008 -6.627,28.481 -17.112,37.649c-1.582,1.363 -3.946,1.275 -5.422,-0.201c-0.299,-0.288 -0.604,-0.589 -0.909,-0.893c-0.18,-0.178 -0.36,-0.358 -0.538,-0.536c-0.787,-0.787 -1.21,-1.866 -1.169,-2.978c0.042,-1.112 0.545,-2.156 1.388,-2.882c2.768,-2.402 5.201,-5.179 7.221,-8.252c0.137,-0.208 0.271,-0.417 0.404,-0.628c0.148,-0.234 0.293,-0.469 0.436,-0.706c0.115,-0.192 0.229,-0.384 0.34,-0.577c0.065,-0.11 0.128,-0.221 0.191,-0.333c0.11,-0.192 0.217,-0.386 0.323,-0.581l0.061,-0.11l0.113,-0.212c0.095,-0.179 0.189,-0.358 0.281,-0.538c0.256,-0.497 0.502,-1.001 0.737,-1.511c0.13,-0.282 0.257,-0.566 0.381,-0.851c0.511,-1.179 0.966,-2.388 1.363,-3.623c0.198,-0.613 0.38,-1.232 0.548,-1.857c0.062,-0.231 0.122,-0.463 0.18,-0.696c0.04,-0.158 0.078,-0.316 0.115,-0.475c0.059,-0.249 0.116,-0.499 0.17,-0.751c0.264,-1.224 0.472,-2.47 0.621,-3.733l0.032,-0.274c0.162,-1.461 0.245,-2.946 0.245,-4.451c0,0 0,0 0,0c0,-10.566 -4.106,-20.181 -10.808,-27.335l-0.112,-0.12l-0.064,-0.067c-0.289,-0.304 -0.583,-0.604 -0.881,-0.9l-0.155,-0.153l-0.119,-0.115c-0.173,-0.168 -0.346,-0.334 -0.522,-0.498c-0.357,-0.335 -0.72,-0.663 -1.09,-0.985c-0.104,-0.09 -0.204,-0.185 -0.298,-0.285c-0.207,-0.219 -0.386,-0.459 -0.537,-0.715c-0.025,-0.043 -0.05,-0.087 -0.073,-0.131l-0.013,-0.023l-0.01,-0.019l-0.013,-0.026l-0.004,-0.007c-0.03,-0.059 -0.058,-0.119 -0.086,-0.179c-0.208,-0.463 -0.328,-0.966 -0.347,-1.484c-0.029,-0.772 0.168,-1.528 0.555,-2.181c0.012,-0.02 0.024,-0.039 0.036,-0.059l0.027,-0.043ZM62.189,27.828c0.363,-0.38 0.73,-0.747 1.079,-1.096c1.427,-1.427 3.693,-1.568 5.286,-0.329c0.879,0.697 1.719,1.441 2.516,2.229c5.508,5.453 8.93,13.014 8.93,21.368c0,0 0,0 0,0c0,9.562 -4.483,18.084 -11.46,23.579c-0.049,0.039 -0.099,0.076 -0.15,0.112l-0.077,0.053c-0.642,0.431 -1.375,0.654 -2.11,0.673l-0.089,0.001c-1.029,0.005 -2.055,-0.389 -2.831,-1.165c-0.307,-0.288 -0.621,-0.595 -0.938,-0.909c-0.178,-0.177 -0.357,-0.356 -0.536,-0.535c-0.184,-0.184 -0.347,-0.383 -0.49,-0.595c-0.036,-0.053 -0.07,-0.107 -0.103,-0.161c-0.02,-0.034 -0.039,-0.067 -0.058,-0.101l-0.018,-0.031l-0.006,-0.01c-0.022,-0.04 -0.043,-0.081 -0.064,-0.122c-0.319,-0.628 -0.469,-1.337 -0.424,-2.055c0.07,-1.144 0.628,-2.203 1.533,-2.908c3.013,-2.301 5.345,-5.445 6.651,-9.077c0.176,-0.489 0.333,-0.987 0.471,-1.493c0.456,-1.675 0.699,-3.437 0.699,-5.256c0,0 0,0 0,0c0,-6.449 -3.059,-12.19 -7.804,-15.848c-0.898,-0.7 -1.453,-1.752 -1.523,-2.888c-0.07,-1.136 0.351,-2.248 1.156,-3.053c0.059,-0.064 0.119,-0.128 0.179,-0.192l0.181,-0.191Z"></path></svg>`;
        chrome.storage.local.set({"ext_game_volume_mute": "OFF"}, function() {});
        
    });
    document.querySelector('#ext_videoVolumeSlider').addEventListener('mouseenter', function(event) {
        // console.log('マウスが乗りました');
        document.querySelector('#ext_videoVolumeSlider').classList.add('mouseOver');
    });
    
    document.querySelector('#ext_videoVolumeSlider').addEventListener('mouseleave', function(event) {
        // console.log('マウスが離れました');
        document.querySelector('#ext_videoVolumeSlider').classList.remove('mouseOver');
    });


    // ニコ生ゲームショートカット
    document.querySelector('.ext-setting-menu .ext-ichiba .item .value').addEventListener('click', ichibaShortcutToggle);
    const ichibaPin = document.querySelector('.ext-setting-menu .ext-ichiba .item .pin');
    ichibaPin.addEventListener('click', function() {
        if(ichibaPin.getAttribute("ext-pin-on")){

            // 設定画面のピンのアイコンをOFF表示
            ichibaPin.removeAttribute("ext-pin-on");
            // ショートカットを非表示
            document.querySelector('#ext_shortcut .item.ichiba').removeAttribute("ext-pin-on");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_ichiba_pin": "OFF"}, function() {});
        } else {
            // 設定画面のピンのアイコンをON表示
            ichibaPin.setAttribute("ext-pin-on", "ON");
            // ショートカットを表示
            document.querySelector('#ext_shortcut .item.ichiba').setAttribute("ext-pin-on", "ON");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_ichiba_pin": "ON"}, function() {});
        }
    });
    document.querySelector('#ext_shortcut .ichiba').addEventListener('click', function() {
        ichibaShortcutToggle();
    });


    // 映像加工
    document.querySelector('.ext-setting-menu .ext-video-effect .item .value').addEventListener('click', videoEffect);
    let effectPin = document.querySelector('.ext-setting-menu .ext-video-effect .item .pin');
    effectPin.addEventListener('click', function() {
        if(effectPin.getAttribute("ext-pin-on")){

            // 設定画面のピンのアイコンをOFF表示
            effectPin.removeAttribute("ext-pin-on");
            // ショートカットを非表示
            document.querySelector('#ext_shortcut .item.video-effect').removeAttribute("ext-pin-on");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_video_effect_pin": "OFF"}, function() {});
        } else {
            // 設定画面のピンのアイコンをON表示
            effectPin.setAttribute("ext-pin-on", "ON");
            // ショートカットを表示
            document.querySelector('#ext_shortcut .item.video-effect').setAttribute("ext-pin-on", "ON");
            // 拡張機能の設定に保存
            chrome.storage.local.set({"ext_video_effect_pin": "ON"}, function() {});
        }
    });
    document.querySelector('#ext_shortcut .video-effect').addEventListener('click', function() {
        videoEffect();
    });


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

    // お知らせ表示
    document.querySelector('.ext-setting-menu #ext-info').addEventListener('click', function() {
        setExtPopupHeight()
        document.querySelector('.ext-setting-menu').removeAttribute("ext-attr-show");
        document.querySelector('.ext-popup #ext-info-box').classList.add('show');
        document.querySelector('.ext-popup #ext-info-box-title').classList.add('show');
        document.querySelector('.ext-popup #ext-info-gift').classList.remove('show');
        document.querySelector('.ext-popup #ext-info-gift-title').classList.remove('show');
        document.querySelector('.ext-popup').classList.add('show');
        document.querySelector("#ext_overlay").style.display = "block";
    });
    // 開発を応援を表示
    document.querySelector('.ext-setting-menu #ext-gift').addEventListener('click', function() {
        setExtPopupHeight()
        document.querySelector('.ext-setting-menu').removeAttribute("ext-attr-show");
        document.querySelector('.ext-popup #ext-info-box').classList.remove('show');
        document.querySelector('.ext-popup #ext-info-box-title').classList.remove('show');
        document.querySelector('.ext-popup #ext-info-gift').classList.add('show');
        document.querySelector('.ext-popup #ext-info-gift-title').classList.add('show');
        document.querySelector('.ext-popup').classList.add('show');
        document.querySelector("#ext_overlay").style.display = "block";
    });

    // 設定画面のイベントリスナ

    //styleのdisplayを変更する関数
    let changeElement = (el) => {
        el.classList.toggle('show');
    }

    // [録画機能]の詳細設定ボタン
    document.querySelector('.ext-setting-menu .ext-rec .setting').addEventListener('click', (e) => {
        changeElement(document.querySelector('.ext-setting-menu .ext-rec .option-box'));
        document.querySelector('.ext-setting-menu .ext-rec .setting').classList.toggle('active')
    }, false);

    // [コメビュ]の詳細設定ボタン
    document.querySelector('.ext-setting-menu .ext-comeview .setting').addEventListener('click', (e) => {
        changeElement(document.querySelector('.ext-setting-menu .ext-comeview .option-box'));
        document.querySelector('.ext-setting-menu .ext-comeview .setting').classList.toggle('active')
    }, false);

    // [読み上げ]の詳細設定ボタン
    document.querySelector('.ext-setting-menu .ext-yomiage .setting').addEventListener('click', (e) => {
        changeElement(document.querySelector('.ext-setting-menu .ext-yomiage .option-box'));
        document.querySelector('.ext-setting-menu .ext-yomiage .setting').classList.toggle('active')
    }, false);

    // [棒読みちゃん連携]の詳細設定ボタン
    document.querySelector('.ext-setting-menu .ext-bouyomi .setting').addEventListener('click', (e) => {
        changeElement(document.querySelector('.ext-setting-menu .ext-bouyomi .option-box'));
        document.querySelector('.ext-setting-menu .ext-bouyomi .setting').classList.toggle('active')
    }, false);

    // [ニコ生ゲームショートカット]の詳細設定ボタン
    document.querySelector('.ext-setting-menu .ext-ichiba .setting').addEventListener('click', (e) => {
        changeElement(document.querySelector('.ext-setting-menu .ext-ichiba .option-box'));
        document.querySelector('.ext-setting-menu .ext-ichiba .setting').classList.toggle('active')
    }, false);

    // [映像加工]の詳細設定ボタン
    document.querySelector('.ext-setting-menu .ext-video-effect .setting').addEventListener('click', (e) => {
        changeElement(document.querySelector('.ext-setting-menu .ext-video-effect .option-box'));
        document.querySelector('.ext-setting-menu .ext-video-effect .setting').classList.toggle('active')
    }, false);

    let settingsBtn = document.querySelectorAll('.ext-setting-menu .option-box');
    settingsBtn.forEach((el, index) => {

        let items = el.querySelectorAll('.option');
        let borders = el.querySelectorAll('.border');
        
        const height = (items.length * 43) + (borders.length * 10) + 10;
        el.style.setProperty("--max-height", height + "px");
        console.log(items.length);
    });




    
    // [録画機能] 映像ビットレート
    document.querySelector('.ext-setting-menu .ext-rec .option.videoBitrato select').addEventListener('change', (e) => {
        if(e.isTrusted){

            setRecBitrato(document.querySelector('.ext-setting-menu .ext-rec .option.videoBitrato select').value);
            
            chrome.storage.local.set({"ext_rec_opt_videoBitrato": document.querySelector('.ext-setting-menu .ext-rec .option.videoBitrato select').value}, function() {});

        }
    });
    /*
    // [録画機能] 画質
    document.querySelector('.ext-setting-menu .ext-rec .option.size select').addEventListener('change', (e) => {
        if(e.isTrusted){

            apllyRecSize(document.querySelector('.ext-setting-menu .ext-rec .option.size select').value);
            
            chrome.storage.local.set({"ext_rec_opt_size": document.querySelector('.ext-setting-menu .ext-rec .option.size select').value}, function() {});

        }
    });

    // [録画機能] 拡張子
    document.querySelector('.ext-setting-menu .ext-rec .option.kaku select').addEventListener('change', (e) => {
        if(e.isTrusted){

            setRecKaku(document.querySelector('.ext-setting-menu .ext-rec .option.kaku select').value);
            
            chrome.storage.local.set({"ext_rec_opt_kaku": document.querySelector('.ext-setting-menu .ext-rec .option.kaku select').value}, function() {});

        }
    });
    */

    // [コメント] アイコンの表示
    document.querySelector('.ext-setting-menu .ext-comeview .option.icon input').addEventListener('change', () => {
        comeview_option_icon();
    });
    // [コメント] コメビュ幅の調整バー表示
    document.querySelector('.ext-setting-menu .ext-comeview .option.wide input').addEventListener('change', () => {
        comeview_option_wide();
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
    // [コメント] コメ色変更
    document.querySelector('.ext-setting-menu .ext-comeview .option.color input').addEventListener('change', () => {
        comeview_option_color();
    });
    // [コメント] コテハン表示
    document.querySelector('.ext-setting-menu .ext-comeview .option.kotehan input').addEventListener('change', () => {
        comeview_option_kotehan();
    });
    // [コメント] コメント番号非表示
    document.querySelector('.ext-setting-menu .ext-comeview .option.commentnum input').addEventListener('change', () => {
        comeview_option_commentnum();
    });
    // [コメント] コメント履歴の表示
    document.querySelector('.ext-setting-menu .ext-comeview .option.tooltip input').addEventListener('change', () => {
        comeview_option_tooltip();
    });

    //-------------------------------------------------------

    // [映像加工] 左右反転
    document.querySelector('.ext-setting-menu .ext-video-effect .option.reverse input').addEventListener('change', () => {
        videoeffect_option_reverse();
    });
    // [映像加工] 回転
    document.querySelector('.ext-setting-menu .ext-video-effect .option.rotate select').addEventListener('change', (e) => {
        if(e.isTrusted){

            videoeffect_option_rotate(document.querySelector('.ext-setting-menu .ext-video-effect .option.rotate select').value);
            
            chrome.storage.local.set({"ext_videoeffect_opt_rotate": document.querySelector('.ext-setting-menu .ext-video-effect .option.rotate select').value}, function() {});
        }
    });
    // [映像加工] 明るさ
    document.querySelector('.ext-setting-menu .ext-video-effect .option.brightness input').addEventListener('change', (e) => {
        if(e.isTrusted){
            let value = document.querySelector('.ext-setting-menu .ext-video-effect .option.brightness input').value;
            videoeffect_set_brightness(value);
            chrome.storage.local.set({"ext_videoeffect_opt_brightness": document.querySelector('.ext-setting-menu .ext-video-effect .option.brightness input').value}, function() {});
        }
    });
    // [映像加工] グレースケール
    document.querySelector('.ext-setting-menu .ext-video-effect .option.grayscale input').addEventListener('change', (e) => {
        if(e.isTrusted){
            let value = document.querySelector('.ext-setting-menu .ext-video-effect .option.grayscale input').value;
            videoeffect_set_grayscale(value);
            chrome.storage.local.set({"ext_videoeffect_opt_grayscale": document.querySelector('.ext-setting-menu .ext-video-effect .option.grayscale input').value}, function() {});
        }
    });
    // [映像加工] コントラスト
    document.querySelector('.ext-setting-menu .ext-video-effect .option.contrast input').addEventListener('change', (e) => {
        if(e.isTrusted){
            let value = document.querySelector('.ext-setting-menu .ext-video-effect .option.contrast input').value;
            videoeffect_set_contrast(value);
            chrome.storage.local.set({"ext_videoeffect_opt_contrast": document.querySelector('.ext-setting-menu .ext-video-effect .option.contrast input').value}, function() {});
        }
    });
    // [映像加工] 不透明度
    document.querySelector('.ext-setting-menu .ext-video-effect .option.opacity input').addEventListener('change', (e) => {
        if(e.isTrusted){
            let value = document.querySelector('.ext-setting-menu .ext-video-effect .option.opacity input').value;
            videoeffect_set_opacity(value);
            chrome.storage.local.set({"ext_videoeffect_opt_opacity": document.querySelector('.ext-setting-menu .ext-video-effect .option.opacity input').value}, function() {});
        }
    });
    // [映像加工] リセット
    document.querySelector('.ext-setting-menu .ext-video-effect .option.reset input').addEventListener('click', (e) => {
        if(e.isTrusted){
            document.querySelector('.ext-setting-menu .ext-video-effect .option.reverse input').checked = false;
            document.querySelector('.ext-setting-menu .ext-video-effect .option.reverse input').value = "OFF";
            document.querySelector('.ext-setting-menu .ext-video-effect .option.rotate select').value = "default";
            document.querySelector('.ext-setting-menu .ext-video-effect .option.brightness input').value = 1;
            document.querySelector('.ext-setting-menu .ext-video-effect .option.grayscale input').value = 0;
            document.querySelector('.ext-setting-menu .ext-video-effect .option.contrast input').value = 1;
            document.querySelector('.ext-setting-menu .ext-video-effect .option.opacity input').value = 1;
            videoeffect_set_default();
            videoeffect_aplly_options();
            chrome.storage.local.set({"ext_videoeffect_opt_reverse": document.querySelector('.ext-setting-menu .ext-video-effect .option.reverse input').value}, function() {});
            chrome.storage.local.set({"ext_videoeffect_opt_rotate": document.querySelector('.ext-setting-menu .ext-video-effect .option.rotate select').value}, function() {});

            chrome.storage.local.set({"ext_videoeffect_opt_brightness": document.querySelector('.ext-setting-menu .ext-video-effect .option.brightness input').value}, function() {});
            chrome.storage.local.set({"ext_videoeffect_opt_grayscale": document.querySelector('.ext-setting-menu .ext-video-effect .option.grayscale input').value}, function() {});
            chrome.storage.local.set({"ext_videoeffect_opt_contrast": document.querySelector('.ext-setting-menu .ext-video-effect .option.contrast input').value}, function() {});
            chrome.storage.local.set({"ext_videoeffect_opt_opacity": document.querySelector('.ext-setting-menu .ext-video-effect .option.opacity input').value}, function() {});
        }
    });

    //-------------------------------------------------------

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

    // 読み上げ機能の音声の種類を取得
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
    });

    // [棒読み] ホスト
    document.querySelector('.ext-setting-menu .ext-bouyomi .option.host input').addEventListener('change', (e) => {
        if(e.isTrusted){
            const host = document.querySelector('.ext-setting-menu .ext-bouyomi .option.host input').value;
            _bouyomi_host = host;
            chrome.storage.local.set({"ext_bouyomi_opt_host": host}, function() {});
        }
    });

    // [棒読み] ポート番号
    document.querySelector('.ext-setting-menu .ext-bouyomi .option.port input').addEventListener('change', (e) => {
        if(e.isTrusted){
            const port = document.querySelector('.ext-setting-menu .ext-bouyomi .option.port input').value;
            _bouyomi_port = port;
            chrome.storage.local.set({"ext_bouyomi_opt_port": port}, function() {});
        }
    });


    // [棒読み] 接続ボタン
    document.querySelector('.ext-setting-menu .ext-bouyomi .option.tryconnect input').addEventListener('click', (e) => {
        if(e.isTrusted){
            // [棒読み] 音質
            chrome.storage.local.get("ext_bouyomi_opt_voices", function (value) {
                initBouyomiChan(value.ext_bouyomi_opt_voices); // 棒読みちゃんの音質一覧を取得してドロップダウンリストを生成
            });
        }
    });

    // [棒読み] 音質
    document.querySelector('.ext-setting-menu .ext-bouyomi .option.voices select').addEventListener('change', (e) => {
        if(e.isTrusted){
            const voideId = document.querySelector('.ext-setting-menu .ext-bouyomi .option.voices select').value;
            _bouyomi_voideId = voideId;
            chrome.storage.local.set({"ext_bouyomi_opt_voices": voideId}, function() {});

            // 棒読みを停止（自動再開）
            clearBouyomiTask();

            console.log("棒読みちゃんの音質を変更しました", _bouyomi_voideId);
        }
    });
    // [棒読み] 音量
    document.querySelector('.ext-setting-menu .ext-bouyomi .option.volume input').addEventListener('change', (e) => {
        if(e.isTrusted){
            const volume = document.querySelector('.ext-setting-menu .ext-bouyomi .option.volume input').value;
            _bouyomi_volume = volume;
            chrome.storage.local.set({"ext_bouyomi_opt_volume": volume}, function() {});

            // 棒読みを停止（自動再開）
            clearBouyomiTask();

            console.log("棒読みちゃんの音量を変更しました", _bouyomi_volume);
        }
    });
    // [棒読み] 速度
    document.querySelector('.ext-setting-menu .ext-bouyomi .option.rate input').addEventListener('change', (e) => {
        if(e.isTrusted){
            const rate = document.querySelector('.ext-setting-menu .ext-bouyomi .option.rate input').value;
            _bouyomi_speed = rate;
            chrome.storage.local.set({"ext_bouyomi_opt_rate": rate}, function() {});

            // 棒読みを停止（自動再開）
            clearBouyomiTask();

            console.log("棒読みちゃんの速度を変更しました", _bouyomi_speed);
        }
    });
    // [棒読み] ピッチ
    document.querySelector('.ext-setting-menu .ext-bouyomi .option.pitch input').addEventListener('change', (e) => {
        if(e.isTrusted){
            const pitch = document.querySelector('.ext-setting-menu .ext-bouyomi .option.pitch input').value;
            _bouyomi_tone = pitch;
            chrome.storage.local.set({"ext_bouyomi_opt_pitch": pitch}, function() {});

            // 棒読みを停止（自動再開）
            clearBouyomiTask();

            console.log("棒読みちゃんのピッチを変更しました", _bouyomi_tone);
        }
    });

    // [棒読み] デフォルトに戻す
    document.querySelector('.ext-setting-menu .ext-bouyomi .option.reset input').addEventListener('click', (e) => {
        if(e.isTrusted){

            const default_voideId = 1;
            document.querySelector('.ext-setting-menu .ext-bouyomi .option.voices select').value = default_voideId;
            _bouyomi_voideId = default_voideId;
            chrome.storage.local.set({"ext_bouyomi_opt_voices": default_voideId}, function() {});
            
            const default_volume = 10;
            document.querySelector('.ext-setting-menu .ext-bouyomi .option.volume input').value = default_volume;
            _bouyomi_volume = default_volume;
            chrome.storage.local.set({"ext_bouyomi_opt_volume": default_volume}, function() {});
            
            const default_rate = 90;
            document.querySelector('.ext-setting-menu .ext-bouyomi .option.rate input').value = default_rate;
            _bouyomi_speed = default_rate;
            chrome.storage.local.set({"ext_bouyomi_opt_rate": default_rate}, function() {});

            const default_pitch = 130;
            document.querySelector('.ext-setting-menu .ext-bouyomi .option.pitch input').value = default_pitch;
            _bouyomi_tone = default_pitch;
            chrome.storage.local.set({"ext_bouyomi_opt_pitch": default_pitch}, function() {});

            // 棒読みを停止（自動再開）
            clearBouyomiTask();
            
        }
    });

    // [棒読み] 長いコメントの省略
    // document.querySelector('.ext-setting-menu .ext-bouyomi .option.syoryaku input').addEventListener('change', (e) => {
    //     let syoryakuValue = document.querySelector('.ext-setting-menu .ext-bouyomi .option.syoryaku input').value;
    //     if(syoryakuValue && !isNaN(syoryakuValue)) {
    //         chrome.storage.local.set({"ext_bouyomi_opt_syoryaku": syoryakuValue}, function() {});
            
    //         // 現在の棒読みを停止（自動再開）
    //         clearBouyomiNowTask();
    //     }
    // });
    
    // [棒読み] 名前の読み上げ
    document.querySelector('.ext-setting-menu .ext-bouyomi .option.nameyomiage input').addEventListener('change', (e) => {
        if(document.querySelector('.ext-setting-menu .ext-bouyomi .option.nameyomiage input').checked){
            chrome.storage.local.set({"ext_bouyomi_opt_nameyomiage": "ON"}, function() {});
        } else {
            chrome.storage.local.set({"ext_bouyomi_opt_nameyomiage": "OFF"}, function() {});
        }
        // 現在の棒読みを停止（自動再開）
        clearBouyomiNowTask();
    });
    // [棒読み] プレビュー実行
    document.querySelector('.ext-setting-menu .ext-bouyomi .option.bouyomitest input').addEventListener('click', (e) => {
        if(e.isTrusted){

            // 現在の棒読みを停止（自動再開）
            clearBouyomiNowTask();

            sendTextToBouyomiChan("棒読みテストです");
        }
    });


    //-------------------------------------------------------
    // 読み上げ情報の受け渡し用DOMを作成
    //-------------------------------------------------------

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
    let targetLogDom = document.getElementById('ext_logBox');

    _obsLogBox = new MutationObserver(watchLogBox);
    _obsLogBox.observe(targetLogDom, logOption);


    //-------------------------------------------------------
    // 棒読みちゃん用の読み上げ情報の受け渡し用DOMを作成
    //-------------------------------------------------------

    // 新しいHTML要素を作成
    var bouyomiElement = document.createElement('div');
    bouyomiElement.id = "ext_bouyomiBox";

    // 指定した要素の中の末尾に挿入
    targeteElement.appendChild(bouyomiElement);

    const bouyomiOption = {
        childList:  true,  //直接の子の変更を監視
    };
    const targetBouyomiDom = document.getElementById('ext_bouyomiBox');

    const bouyomiObserver = new MutationObserver(watchBouyomiBox);
    bouyomiObserver.observe(targetBouyomiDom, bouyomiOption);    


    //-------------------------------------------------------
    // コテハン情報の受け渡し用DOMを作成
    //-------------------------------------------------------

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



    //-------------------------------------------------------
    // カラー情報の受け渡し用DOMを作成
    //-------------------------------------------------------

    // 新しいHTML要素を作成
    var colorElement = document.createElement('div');
    colorElement.id = "ext_colorBox";

    // 指定した要素の中の末尾に挿入
    targeteElement.appendChild(colorElement);


    // 新しいHTML要素を作成
    var colorToInject = document.createElement('div');
    colorToInject.id = "ext_colorToInjectBox";

    // 指定した要素の中の末尾に挿入
    targeteElement.appendChild(colorToInject);

    colorInitialize();
    getColor();


    // へもツールのバージョン情報を取得
    var manifestData = chrome.runtime.getManifest();
    //document.querySelector('.ext-setting-menu .item.info .hemotool .ver').textContent = manifestData.version;


    // 「へもツールが更新されました」のポップアップ表示判定
    chrome.storage.local.get("ext_current_version", function (value) {

        if(!value.ext_current_version) {
            console.log("初期インストールです");
            
            comeview();
            
            document.querySelector('.ext-setting-menu .ext-comeview .option.name input').checked = true;
            comeview_option_name();
            
            document.querySelector('.ext-setting-menu .ext-comeview .option.icon input').checked = true;
            comeview_option_icon();
            
            document.querySelector('.ext-setting-menu .ext-comeview .option.wide input').checked = true;
            // 5秒後にコメビュ幅の調整バーを表示（起動直後にバーを表示するとコメント欄のスクロールバーが発生するため）
            setTimeout(comeview_option_wide, 3000);
            
            document.querySelector('.ext-setting-menu .ext-comeview .option.orikaeshi input').checked = true;
            comeview_option_orikaeshi();

            document.querySelector('.ext-setting-menu .ext-comeview .option.premium input').checked = true;
            comeview_option_premium();

            document.querySelector('.ext-setting-menu .ext-comeview .option.color input').checked = true;
            comeview_option_color();

            document.querySelector('.ext-setting-menu .ext-comeview .option.kotehan input').checked = true;
            comeview_option_kotehan();

            // document.querySelector('.ext-setting-menu .ext-comeview .option.commentnum input').checked = true;
            // comeview_option_commentnum();

            document.querySelector('.ext-setting-menu .ext-comeview .option.tooltip input').checked = true;
            comeview_option_tooltip();
        }

        // ストレージに保存されたバージョン情報とマニフェストのバージョン情報が異なる場合にポップアップを表示
        if(value && value.ext_current_version !== manifestData.version) {

            setExtPopupHeight();

        
           //---------------------------------------------------------------------

            // ポップアップを表示
            document.querySelector('.ext-popup #ext-info-box-title').classList.add('show');
            document.querySelector('.ext-popup #ext-info-box').classList.add('show');
            document.querySelector('.ext-popup').classList.add('show');
           
            // 画面クリックでポップアップを消せるようにオーバーレイを表示
            document.querySelector("#ext_overlay").style.display = "block";

            //---------------------------------------------------------------------
            

        }
    });
    document.querySelector('.ext-popup .close').addEventListener('click', function () {
        // ポップアップを非表示
        document.querySelector('.ext-popup').classList.remove('show');
        // ストレージに現在のマニフェストのバージョン情報を保存
        var manifestData = chrome.runtime.getManifest();
        chrome.storage.local.set({"ext_current_version": manifestData.version});
        
        document.querySelector("#ext_overlay").style.display = "none";
    });


    // 右クリックOFF機能のピン状態
    chrome.storage.local.get("ext_dev_mode", function (value) {
        if (value.ext_dev_mode == "ON") {
            document.querySelector('.ext-setting-menu .dev-mode').classList.add('show');
        }
    });


    // メニューの高さを設定
    setExtSettingMenuHeight();


    //監視オプション
    const optionsTools = {
        childList: true,  //直接の子の変更を監視
        characterData: false,  //文字の変化を監視
        characterDataOldValue: false, //属性の変化前を記録
        attributes: false,  //属性の変化を監視
        subtree: false, //全ての子要素を監視
    }
    const commandToolDom = document.querySelector("[class^=___command-tool___]");
  
    if (commandToolDom) {
        // コマンドのツールのDOMは、クリックされないと生成されないので、生成されることを監視する
        const obs = new MutationObserver(function(mutationsList, observer){
            
            for (const mutation of mutationsList) {
                if(mutation.addedNodes){
                    // コマンドツールのDOMの「匿名で投稿する」のボタンのクリックイベントを監視する
                    const commandPalleteDom = document.querySelector('[class^=___anonymous-comment-post-toggle-button-field___] button');
                    if(commandPalleteDom){
                        commandPalleteDom.addEventListener('click', function(){
                            
                            if(commandPalleteDom.getAttribute('data-toggle-state') === "false"){
                                //console.log("匿名コメントモード B");
                                setCommentMode(false); // 生IDコメントモード 　→　なふだOFF（匿名）コメント
                            } else if(commandPalleteDom.getAttribute('data-toggle-state') === "true"){
                                //console.log("なふだコメントモード B");
                                setCommentMode(true);  // 匿名コメントモード　→　なふだON（生ID）コメント
                            } else {
                                // ニコ生起動時は下記にくる
                                //console.log("匿名コメントモード B");
                                setCommentMode(false); // 生IDコメントモード 　→　なふだOFF（匿名）コメント
                            }
                        });
                    }
                }
            }
        });
        // 監視を開始
        obs.observe(commandToolDom, optionsTools);
    }

    function setCommentMode(bIsRowIDMode) {
        
        const sendBtn = document.querySelector('[class^=___submit-button___]');
        const textBox = document.querySelector('[class^=___comment-text-box___]');
        if(bIsRowIDMode === true) {
            
            // なふだON（生ID）コメント
            textBox.style.backgroundImage = 'none';
            sendBtn.textContent = 'なふだコメント';

            /*
            textBox.setAttribute('placeholder', '匿名でコメントする');
            sendBtn.textContent = '匿名コメント';
            
            // デフォルトアイコンを設定
            textBox.style.backgroundImage = 'url("https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank.jpg")';
            console.log('なふだON（生ID）コメント');
            */
        } else if(bIsRowIDMode === false) {
            // なふだOFF（匿名）コメント
            textBox.setAttribute('placeholder', '匿名でコメントする');
            sendBtn.textContent = '匿名コメント';
            // 自分のユーザーアイコンを設定
            textBox.style.backgroundImage = 'url("https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank.jpg")';

            /*
            const userIcon = document.querySelector('[class^=common-header-] img');
            if(userIcon) {
                textBox.style.backgroundImage = 'url("'+ userIcon.getAttribute('src')  +'")';    
            }
            */
            //console.log('なふだOFF（匿名）コメント');
        } 
    }

    // 放送者とリスナーでコメントモードを切り替える
    const broadvastTool = document.querySelector('[class^=___broadcaster-tool___]');
    if(broadvastTool) {
        // 放送者 -----------------------------
        const textBox = document.querySelector('[class^=___comment-text-box___]');
        const userIcon = document.querySelector('[class^=common-header-] img');
        if(userIcon) {
            textBox.style.backgroundImage = 'url("'+ userIcon.getAttribute('src')  +'")';    
        }
    } else {
        // リスナー ---------------------------
        const nafudaAttr = document.querySelector('[data-nafuda-comment-post-enabled]');
        if(nafudaAttr) {
            //console.log("なふだコメントモード A");
            setCommentMode(true);  // 匿名コメントモード　→　なふだON（生ID）コメント

        } else {
            //console.log("匿名コメントモード A");
            setCommentMode(false); // 生IDコメントモード 　→　なふだOFF（匿名）コメント

        }
    }

}


let ___first_run = true; // ★拡張機能の更新後にブラウザを更新すると動かなくなる不具合の暫定対処★

function watchLogBox(mutationRecords, observer){

    mutationRecords.forEach((mutation)=> {

        // 子ノードの増減
        if (mutation.type === "childList") {

            // ADD ----------------------------------------------------------------
            mutation.addedNodes.forEach((addNode) => {

                let logBox = document.getElementById('ext_logBox');

                let yomiage_text = addNode.outerText;

                // 教育機能が有効ならば
                if (document.querySelector('.ext-setting-menu .ext-yomiage .option.kyoiku input').checked) {
                    let kyoikuRet = kyoiku(yomiage_text, false);
                    if (kyoikuRet.bIsSuccess) {
                        yomiage_text = kyoikuRet.leftWord + "、は、" + kyoikuRet.rightWord + "、を覚えました";
                        setKyoiku(kyoikuRet.leftWord, kyoikuRet.rightWord);
                    }

                    let boukyakuRet = boukyaku(yomiage_text, false);
                    if (boukyakuRet.bIsSuccess) {
                        yomiage_text = boukyakuRet.word + "、を忘れました";
                        deleteKyoiku(boukyakuRet.word);
                    }

                    // 教育コマンドや忘却コマンドではないときに限り置換
                    if (kyoikuRet.bIsSuccess === false && boukyakuRet.bIsSuccess === false) {
                        yomiage_text = replaceKyoiku(yomiage_text);
                    }
                }

                // 音声の種類を送信
                if(___first_run) {
                    ___first_run = false;
                    chrome.runtime.sendMessage({setVoiceName: document.querySelector('.ext-setting-menu .ext-yomiage .option.voices select').value});
                }
    
                // 読み上げ
                chrome.runtime.sendMessage({toSay: yomiage_text });
                console.log("読み上げ : " + yomiage_text)
                
                logBox.removeChild( logBox.firstChild );
                        
            });

        }
    });
}

function watchBouyomiBox(mutationRecords, observer){

    mutationRecords.forEach((mutation)=> {

        // 子ノードの増減
        if (mutation.type === "childList") {

            // ADD ----------------------------------------------------------------
            mutation.addedNodes.forEach((addNode) => {

                let logBox = document.getElementById('ext_bouyomiBox');

                let yomiage_text = addNode.outerText;
                
                console.log("棒読み : " + yomiage_text);
                sendTextToBouyomiChan(yomiage_text);
                
                logBox.removeChild( logBox.firstChild );                        
            });
        }
    });
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

        // 録画機能
        chrome.storage.local.get("ext_rec_pin", function (value) {
            if (value.ext_rec_pin == "ON") {

                // ONマークをアクティブ状態
                document.querySelector('.ext-setting-menu .ext-rec').setAttribute("ext-attr-on", "on");
  
                // ショートカットエリアにプレイヤーを表示
                document.querySelector('#ext_shortcut .item.rec').setAttribute("ext-pin-on", "ON");
            }
        });
        
        // 録画機能の映像ビットレート
        chrome.storage.local.get("ext_rec_opt_videoBitrato", function (value) {
            if (value.ext_rec_opt_videoBitrato) {
                document.querySelector('.ext-setting-menu .ext-rec .option.videoBitrato select').value = value.ext_rec_opt_videoBitrato;
                setRecBitrato(value.ext_rec_opt_videoBitrato);
            } else {
                document.querySelector('.ext-setting-menu .ext-rec .option.videoBitrato select').value = "10_000_000";
                setRecBitrato("10_000_000");
            }

        });
        /*
        // 録画機能の画質
         chrome.storage.local.get("ext_rec_opt_size", function (value) {
            if (value.ext_rec_opt_size) {
                document.querySelector('.ext-setting-menu .ext-rec .option.size select').value = value.ext_rec_opt_size;
                apllyRecSize(value.ext_rec_opt_size);
            } else {
                document.querySelector('.ext-setting-menu .ext-rec .option.size select').value = "HD";
                apllyRecSize("HD");
            }
        });
        // 録画機能の拡張子
        chrome.storage.local.get("ext_rec_opt_kaku", function (value) {
            if (value.ext_rec_opt_kaku) {
                document.querySelector('.ext-setting-menu .ext-rec .option.kaku select').value = value.ext_rec_opt_kaku;
                setRecKaku(value.ext_rec_opt_kaku);
            } else {
                document.querySelector('.ext-setting-menu .ext-rec .option.kaku select').value = "webm";
                setRecKaku("webm");
            }
        });
        */
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
        // コメビュ機能のアイコン表示オプション
        chrome.storage.local.get("ext_comeview_opt_icon", function (value) {
            if (value.ext_comeview_opt_icon == "ON") {
                document.querySelector('.ext-setting-menu .ext-comeview .option.icon input').checked = true;
                comeview_option_icon();
            }
        });
        // コメビュ機能の『コメビュ幅の調整バー表示』オプション
        chrome.storage.local.get(["ext_comeview", "ext_comeview_opt_wide", "ext_comeview_opt_wide_panelWidth", "ext_comeview_opt_wide_displayWidth"], function (value) {
            if (value.ext_comeview === "ON" && value.ext_comeview_opt_wide === "ON") {
                document.querySelector('.ext-setting-menu .ext-comeview .option.wide input').checked = true;

                if (value.ext_comeview_opt_wide_panelWidth && value.ext_comeview_opt_wide_displayWidth) {
                    
                    const getPanelWidth = Number(value.ext_comeview_opt_wide_panelWidth.replace("px", ""));
    
                    /* 画面幅を調整 */
                    const displayElement = document.querySelector('[class^=___player-display___]');
                    const panelElement = document.querySelector("[class^=___player-status-panel___]");
                    const playerSection = document.querySelector('[class^=___player-section___]');
                    const parentWidth = playerSection.clientWidth;
    
                    displayElement.style.width = parentWidth - getPanelWidth + "px";
                    panelElement.style.width = getPanelWidth + "px";
    
                }
                
                // 5秒後にコメビュ幅の調整バーを表示（起動直後にバーを表示するとコメント欄のスクロールバーが発生するため）
                setTimeout(comeview_option_wide, 3000);
                //comeview_option_wide();
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
        // コメビュ機能のコメ色変更オプション
        chrome.storage.local.get("ext_comeview_opt_color", function (value) {
            if (value.ext_comeview_opt_color == "ON") {
                document.querySelector('.ext-setting-menu .ext-comeview .option.color input').checked = true;
                comeview_option_color();
            }
        });
        // コメビュ機能のコテハン表示オプション
        chrome.storage.local.get("ext_comeview_opt_kotehan", function (value) {
            if (value.ext_comeview_opt_kotehan == "ON") {
                document.querySelector('.ext-setting-menu .ext-comeview .option.kotehan input').checked = true;
                comeview_option_kotehan();
            }
        });
        // コメビュ機能のコメント番号非表示オプション
        chrome.storage.local.get("ext_comeview_opt_commentnum", function (value) {
            if (value.ext_comeview_opt_commentnum == "ON") {
                document.querySelector('.ext-setting-menu .ext-comeview .option.commentnum input').checked = true;
                comeview_option_commentnum();
            }
        });
        // コメビュ機能のコメント履歴機能オプション
        chrome.storage.local.get("ext_comeview_opt_tooltip", function (value) {
            if (value.ext_comeview_opt_tooltip == "ON") {
                document.querySelector('.ext-setting-menu .ext-comeview .option.tooltip input').checked = true;
                comeview_option_tooltip();
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
        
        
        // 棒読みちゃん連携機能
        chrome.storage.local.get("ext_bouyomi", function (value) {
            if (value.ext_bouyomi == "ON") {
                bouyomi();
            }
        });
        // 棒読みちゃん連携機能のピン状態
        chrome.storage.local.get("ext_bouyomi_pin", function (value) {
            if (value.ext_bouyomi_pin == "ON") {
                // 設定画面のピンのアイコンをON表示
                document.querySelector('.ext-setting-menu .ext-bouyomi .pin').setAttribute("ext-pin-on", "ON");
                // ショートカットを表示
                document.querySelector('#ext_shortcut .item.bouyomi').setAttribute("ext-pin-on", "ON");                
            }
        });
        // [棒読み] ホスト
        chrome.storage.local.get("ext_bouyomi_opt_host", function (value) {
            if (value.ext_bouyomi_opt_host) {
                document.querySelector('.ext-setting-menu .ext-bouyomi .option.host input').value = value.ext_bouyomi_opt_host;
            } else {
                // デフォルト値
                document.querySelector('.ext-setting-menu .ext-bouyomi .option.host input').value = "localhost";
            }
        });
        // [棒読み] ポート番号
        chrome.storage.local.get("ext_bouyomi_opt_port", function (value) {
            if (value.ext_bouyomi_opt_port && !isNaN(value.ext_bouyomi_opt_port)) {
                document.querySelector('.ext-setting-menu .ext-bouyomi .option.port input').value = value.ext_bouyomi_opt_port;
            } else {
                // デフォルト値
                document.querySelector('.ext-setting-menu .ext-bouyomi .option.port input').value = "50080";
            }
        });
        // [棒読み] 音質
        chrome.storage.local.get("ext_bouyomi_opt_voices", function (value) {
            if (value.ext_bouyomi_opt_voices) {
                initBouyomiChan(value.ext_bouyomi_opt_voices); // 棒読みちゃんの音質一覧を取得してドロップダウンリストを生成
                _bouyomi_voideId = value.ext_bouyomi_opt_voices;
            } else {
                // デフォルト値
                initBouyomiChan("1");
                _bouyomi_voideId = "1";
            }
        });   
        // [棒読み] 音量
        chrome.storage.local.get("ext_bouyomi_opt_volume", function (value) {
            if (value.ext_bouyomi_opt_volume) {
                document.querySelector('.ext-setting-menu .ext-bouyomi .option.volume input').value = value.ext_bouyomi_opt_volume;
                _bouyomi_volume = value.ext_bouyomi_opt_volume;
            } else {
                // デフォルト値
                document.querySelector('.ext-setting-menu .ext-bouyomi .option.volume input').value = "10";
                _bouyomi_volume = "10";
            }
        });
        // [棒読み] 速度
        chrome.storage.local.get("ext_bouyomi_opt_rate", function (value) {
            if (value.ext_bouyomi_opt_rate) {
                document.querySelector('.ext-setting-menu .ext-bouyomi .option.rate input').value = value.ext_bouyomi_opt_rate;
                _bouyomi_speed = value.ext_bouyomi_opt_rate;
            } else {
                // デフォルト値
                document.querySelector('.ext-setting-menu .ext-bouyomi .option.rate input').value = "90";
                _bouyomi_speed = "90";
            }
        });
         // [棒読み] ピッチ
        chrome.storage.local.get("ext_bouyomi_opt_pitch", function (value) {
            if (value.ext_bouyomi_opt_pitch) {
                document.querySelector('.ext-setting-menu .ext-bouyomi .option.pitch input').value = value.ext_bouyomi_opt_pitch;
                _bouyomi_tone = value.ext_bouyomi_opt_pitch;
            } else {
                // デフォルト値
                document.querySelector('.ext-setting-menu .ext-bouyomi .option.pitch input').value = "130";
                _bouyomi_tone = "130";
            }
        });
        // [棒読み] 長いコメントを省略
        // chrome.storage.local.get("ext_bouyomi_opt_syoryaku", function (value) {
        //     if (value.ext_bouyomi_opt_syoryaku && !isNaN(value.ext_bouyomi_opt_syoryaku)) {
        //         document.querySelector('.ext-setting-menu .ext-bouyomi .option.syoryaku input').value = value.ext_bouyomi_opt_syoryaku;
        //     }
        // });
        // [棒読み] 名前の読み上げ
        chrome.storage.local.get("ext_bouyomi_opt_nameyomiage", function (value) {
            if (value.ext_bouyomi_opt_nameyomiage == "ON") {
                document.querySelector('.ext-setting-menu .ext-bouyomi .option.nameyomiage input').checked = true;
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

        // ニコ生ゲームショートカット
        chrome.storage.local.get("ext_ichiba", function (value) {
            if (value.ext_ichiba == "ON") {
                ichibaShortcutToggle();
                // ショートカットをアクティブ状態
                document.querySelector('#ext_shortcut .item.ichiba').setAttribute("active", "ON");   
            }
        });
        // ニコ生ゲームショートカットのピン状態
        chrome.storage.local.get("ext_ichiba_pin", function (value) {
            if (value.ext_ichiba_pin == "ON") {
                // 設定画面のピンのアイコンをON表示
                document.querySelector('.ext-setting-menu .ext-ichiba .pin').setAttribute("ext-pin-on", "ON");
                // ショートカットを表示
                document.querySelector('#ext_shortcut .item.ichiba').setAttribute("ext-pin-on", "ON");                
            }
        });



        // [映像加工] 反転
        chrome.storage.local.get("ext_videoeffect_opt_reverse", function (value) {
            if (value.ext_videoeffect_opt_reverse == "ON") {
                document.querySelector('.ext-setting-menu .ext-video-effect .option.reverse input').checked = true;
                videoeffect_option_reverse();
            }
        });
        // [映像加工] 回転
        chrome.storage.local.get("ext_videoeffect_opt_rotate", function (value) {
            if (value.ext_videoeffect_opt_rotate) {
                document.querySelector('.ext-setting-menu .ext-video-effect .option.rotate select').value = value.ext_videoeffect_opt_rotate;
                videoeffect_option_rotate(value.ext_videoeffect_opt_rotate);
            } else {
                // default
                document.querySelector('.ext-setting-menu .ext-video-effect .option.rotate select').value = "default";
                videoeffect_option_rotate("default");
            }
        });
        // [映像加工] 明るさ
        chrome.storage.local.get("ext_videoeffect_opt_brightness", function (value) {
            if (value.ext_videoeffect_opt_brightness) {
                document.querySelector('.ext-setting-menu .ext-video-effect .option.brightness input').value = value.ext_videoeffect_opt_brightness;
                videoeffect_set_brightness(value.ext_videoeffect_opt_brightness);
            }
        });
        // [映像加工] グレースケール
        chrome.storage.local.get("ext_videoeffect_opt_grayscale", function (value) {
            if (value.ext_videoeffect_opt_grayscale) {
                document.querySelector('.ext-setting-menu .ext-video-effect .option.grayscale input').value = value.ext_videoeffect_opt_grayscale;
                videoeffect_set_grayscale(value.ext_videoeffect_opt_grayscale);
            }
        });
        // [映像加工] コントラスト
        chrome.storage.local.get("ext_videoeffect_opt_contrast", function (value) {
            if (value.ext_videoeffect_opt_contrast) {
                document.querySelector('.ext-setting-menu .ext-video-effect .option.contrast input').value = value.ext_videoeffect_opt_contrast;
                videoeffect_set_contrast(value.ext_videoeffect_opt_contrast);
            }
        });
        // [映像加工] 不透明度
        chrome.storage.local.get("ext_videoeffect_opt_opacity", function (value) {
            if (value.ext_videoeffect_opt_opacity) {
                document.querySelector('.ext-setting-menu .ext-video-effect .option.opacity input').value = value.ext_videoeffect_opt_opacity;
                videoeffect_set_opacity(value.ext_videoeffect_opt_opacity);
            }
        });
        // 映像加工 ※必ずオプションを設定したあとで実行
        chrome.storage.local.get("ext_video_effect", function (value) {
            if (value.ext_video_effect == "ON") {
                videoEffect();
                // ショートカットをアクティブ状態
                document.querySelector('#ext_shortcut .item.video-effect').setAttribute("active", "ON");   
            } else {
                document.querySelector('.ext-setting-menu .ext-video-effect .option.reverse input').setAttribute("disabled", "true");
                document.querySelector('.ext-setting-menu .ext-video-effect .option.rotate select').setAttribute("disabled", "true");
                document.querySelector('.ext-setting-menu .ext-video-effect .option.brightness input').setAttribute("disabled", "true");
                document.querySelector('.ext-setting-menu .ext-video-effect .option.grayscale input').setAttribute("disabled", "true");
                document.querySelector('.ext-setting-menu .ext-video-effect .option.contrast input').setAttribute("disabled", "true");
                document.querySelector('.ext-setting-menu .ext-video-effect .option.opacity input').setAttribute("disabled", "true");
                document.querySelector('.ext-setting-menu .ext-video-effect .option.reset input').setAttribute("disabled", "true");
            }
        });
        // 映像加工のピン状態
        chrome.storage.local.get("ext_video_effect_pin", function (value) {
            if (value.ext_video_effect_pin == "ON") {
                // 設定画面のピンのアイコンをON表示
                document.querySelector('.ext-setting-menu .ext-video-effect .pin').setAttribute("ext-pin-on", "ON");
                // ショートカットを表示
                document.querySelector('#ext_shortcut .item.video-effect').setAttribute("ext-pin-on", "ON");                
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

        initGame();

        // ゲーム音楽ミュート
        chrome.storage.local.get("ext_game_mute", function (value) {

            if (value.ext_game_mute == "ON") {
                console.log("前回ゲーム音ミュートが有効でした");
                //document.querySelector('.ext-setting-menu .ext-game-mute').setAttribute("ext-attr-on", "true"); 
                chrome.storage.local.get("ext_game_volume", function (value) {
                    
                    //console.log(value);
                    if (value.ext_game_volume) {
                        
                        // 前回のビデオボリュームを設定
                        document.querySelector('div[data-layer-name="videoLayer"] video').volume =  value.ext_game_volume / 100;
                        document.querySelector('#ext_videoVolumeSlider').value = value.ext_game_volume;
                        document.querySelector('#ext_videoVolumeSlider').setAttribute('aria-label', '音量:' + value.ext_game_volume);
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
                        //console.log("ニコ生のボタンが非ミュート状態22");
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

        // ワイプ機能
        chrome.storage.local.get("ext_wipe", function (value) {
            if (value.ext_wipe == "ON") {
                autoWipe();
            }
        });        
        // ワイプ機能のピン状態
        chrome.storage.local.get("ext_wipe_pin", function (value) {
            if (value.ext_wipe_pin == "ON") {
                // 設定画面のピンのアイコンをON表示
                document.querySelector('.ext-setting-menu .ext-video-wipe .pin').setAttribute("ext-pin-on", "ON");
                // ショートカットを表示
                document.querySelector('#ext_shortcut .item.video-wipe').setAttribute("ext-pin-on", "ON");                
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




