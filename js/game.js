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

function gameMute() {

    let menu = document.querySelector('.ext-setting-menu .ext-game-mute');
    menu.getAttribute("ext-attr-on");
    let frame = document.querySelector('#akashic-gameview iframe');

    if(menu.getAttribute("ext-attr-on")) {

        var volume = {type:"loader:setMasterVolume", data:0.4}; // MAX 0.4っぽい
        if(frame){
            frame.contentWindow.postMessage(volume, "https://ak.cdn.nimg.jp/");
        } else {
            console.log("iframeがいません");
        }

        // ボタンをOFF状態に
        menu.removeAttribute("ext-attr-on");

        
        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_game_mute": "OFF"}, function() {});            
        
        // ショートカットを非アクティブ状態
        document.querySelector('#ext_shortcut .item.game-mute').removeAttribute("active");

    } else {


        var volume = {type:"loader:setMasterVolume", data:0}; // MAX 0.4っぽい
        if(frame){
            frame.contentWindow.postMessage(volume, "https://ak.cdn.nimg.jp/");
        } else {
            console.log("iframeがいません");
        }


        // ON状態に
        menu.setAttribute("ext-attr-on", "ON");


        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_game_mute": "ON"}, function() {});


        // ショートカットをアクティブ状態
        document.querySelector('#ext_shortcut .item.game-mute').setAttribute("active", "ON");

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

}