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

let _savedVideVolume = 0;

function videoMute() {
    
    let menu = document.querySelector('.ext-setting-menu .ext-video-mute');
    menu.getAttribute("ext-attr-on");

    // ニコ生独自のDOM系
    let nicoMuteBtn =       document.querySelector('[class^=___mute-button___]');
    let nicoSpanSlider =    document.querySelector('[class^=___volume-size-control___] > [class^=___slider___]');
    
    let extOverlayVideoVol = document.querySelector('#ext_video_volume_overlay');

    if(menu.getAttribute("ext-attr-on")) {

        extOverlayVideoVol.classList.remove('show');


        // videoのミュート属性を解除
        document.querySelector('div[data-layer-name="videoLayer"] video').muted = false;

        document.querySelector('div[data-layer-name="videoLayer"] video').volume = _savedVideVolume;
        
       
        //
        document.querySelector('#ext_videoVolumeSlider').disabled = false;
        document.querySelector('[class^=___volume-size-control___] input[class^=___slider___]').disabled = false;
        //document.querySelector('[class^=___volume-size-control___] span[class^=___slider___]').style.cssText = "";
        //nicoMuteBtn.disabled = false;

        // ボタンをOFF状態に
        menu.removeAttribute("ext-attr-on");

        
        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_video_mute": "OFF"}, function() {
            //console.log('Value is set to ' + "OFF");
        });            
        
        // ショートカットを非アクティブ状態
        document.querySelector('#ext_shortcut .item.video-mute').removeAttribute("active");

    } else {

        extOverlayVideoVol.classList.add('show');

        // videoにミュート属性付与
        document.querySelector('div[data-layer-name="videoLayer"] video').muted = true;

        _savedVideVolume = document.querySelector('div[data-layer-name="videoLayer"] video').volume;
        
        //
        document.querySelector('#ext_videoVolumeSlider').disabled = true;
        document.querySelector('[class^=___volume-size-control___] input[class^=___slider___]').disabled = true;
        //document.querySelector('[class^=___volume-size-control___] span[class^=___slider___]').style.cssText = "opacity:0.5;";
        //nicoMuteBtn.disabled = true;

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