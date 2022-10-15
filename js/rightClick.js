function rightClick() {
    let menu = document.querySelector('.ext-setting-menu .ext-rightClick');
    let frame = document.querySelector('#akashic-gameview iframe');

    if (menu.getAttribute("ext-attr-on")) {
        chrome.storage.local.set({ "ext_rightClick": "OFF" }, function () {
        });
        menu.removeAttribute("ext-attr-on");
        
        // iframeに右クリック禁止解除命令を送信
        document.oncontextmenu = function () {return true;}
        if(frame){
            frame.contentWindow.postMessage("EXT-RIGHTCLICK-OFF", "https://ak.cdn.nimg.jp/");
        }
        var list = document.querySelectorAll("canvas");
        for(let dom of list){
            dom.oncontextmenu = function () {return true;}
        }    
        // ショートカットを非アクティブ状態
        document.querySelector('#ext_shortcut .item.click').removeAttribute("active");

    } else {
        chrome.storage.local.set({ "ext_rightClick": "ON" }, function () {
        });
        menu.setAttribute("ext-attr-on", "ON");

        // iframeに右クリック禁止命令を送信
        document.oncontextmenu = function () {return false;}
        if(frame){
            frame.contentWindow.postMessage("EXT-RIGHTCLICK-ON", "https://ak.cdn.nimg.jp/");
        }
        var list = document.querySelectorAll("canvas");
        for(let dom of list){
            dom.oncontextmenu = function () {return false;}
        }
        // ショートカットをアクティブ状態
        document.querySelector('#ext_shortcut .item.click').setAttribute("active", "ON");
    }
}
