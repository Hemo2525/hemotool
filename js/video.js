function videoOff() {
    
    let menu = document.querySelector('.ext-setting-menu .ext-video');
    menu.getAttribute("ext-attr-on");

    if(menu.getAttribute("ext-attr-on")) {

        let video = document.querySelector('div[data-layer-name="videoLayer"] video');
        video.style.opacity = 1;
       
        // ボタンをOFF状態に
        menu.removeAttribute("ext-attr-on");

        
        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_video": "OFF"}, function() {
            //console.log('Value is set to ' + "OFF");
        });
        // ショートカットを非アクティブ状態
        document.querySelector('#ext_shortcut .item.video').removeAttribute("active");

    } else {

        // videoタグを非表示に
        let video = document.querySelector('div[data-layer-name="videoLayer"] video');
        video.style.opacity = 0;

        // ON状態に
        menu.setAttribute("ext-attr-on", "ON");

        
        
        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_video": "ON"}, function() {
            //console.log('Value is set to ' + "ON");
        });    
        // ショートカットをアクティブ状態
        document.querySelector('#ext_shortcut .item.video').setAttribute("active", "ON");
    }
}

function videoMute() {
    
    let menu = document.querySelector('.ext-setting-menu .ext-video-mute');
    menu.getAttribute("ext-attr-on");

    if(menu.getAttribute("ext-attr-on")) {

        let video = document.querySelector('div[data-layer-name="videoLayer"] video');
        //video.setAttribute("muted", "");
        video.muted = false;
       
        // ボタンをOFF状態に
        menu.removeAttribute("ext-attr-on");

        
        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_video_mute": "OFF"}, function() {
            //console.log('Value is set to ' + "OFF");
        });            
        
        // ショートカットを非アクティブ状態
        document.querySelector('#ext_shortcut .item.video-mute').removeAttribute("active");
    } else {

        // videoタグを非表示に
        let video = document.querySelector('div[data-layer-name="videoLayer"] video');
        //video.removeAttribute("muted");
        video.muted = true;


        // ON状態に
        menu.setAttribute("ext-attr-on", "ON");


        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_video_mute": "ON"}, function() {
            //console.log('Value is set to ' + "ON");
        });

        // ショートカットをアクティブ状態
        document.querySelector('#ext_shortcut .item.video-mute').setAttribute("active", "ON");        
    }
}