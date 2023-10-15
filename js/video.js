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


function videoEffect() {
    
    let menu = document.querySelector('.ext-setting-menu .ext-video-effect');

    if(menu.getAttribute("ext-attr-on")) {
        /* ON →　OFF */

        videoeffect_aplly_defaults_withoutSave();// 映像加工のデフォルト値を反映

        document.querySelector('div[data-layer-name="videoLayer"] video').removeAttribute("ext-master-videoeffect");
       
        // ボタンをOFF状態に
        menu.removeAttribute("ext-attr-on");

        
        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_video_effect": "OFF"}, function() {
            //console.log('Value is set to ' + "OFF");
        });
        // ショートカットを非アクティブ状態
        document.querySelector('#ext_shortcut .item.video-effect').removeAttribute("active");

        document.querySelector('.ext-setting-menu .ext-video-effect .option.reverse input').setAttribute("disabled", "true");
        document.querySelector('.ext-setting-menu .ext-video-effect .option.rotate select').setAttribute("disabled", "true");
        document.querySelector('.ext-setting-menu .ext-video-effect .option.brightness input').setAttribute("disabled", "true");
        document.querySelector('.ext-setting-menu .ext-video-effect .option.grayscale input').setAttribute("disabled", "true");
        document.querySelector('.ext-setting-menu .ext-video-effect .option.contrast input').setAttribute("disabled", "true");
        document.querySelector('.ext-setting-menu .ext-video-effect .option.opacity input').setAttribute("disabled", "true");
        document.querySelector('.ext-setting-menu .ext-video-effect .option.reset input').setAttribute("disabled", "true");

    } else {
        /* OFF →　ON */

        videoeffect_aplly_options();// 映像加工の現在値を反映

        document.querySelector('div[data-layer-name="videoLayer"] video').setAttribute("ext-master-videoeffect", "ON");

        // ON状態に
        menu.setAttribute("ext-attr-on", "ON");        
        
        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_video_effect": "ON"}, function() {
            //console.log('Value is set to ' + "ON");
        });    
        // ショートカットをアクティブ状態
        document.querySelector('#ext_shortcut .item.video-effect').setAttribute("active", "ON");


        document.querySelector('.ext-setting-menu .ext-video-effect .option.reverse input').removeAttribute("disabled");
        document.querySelector('.ext-setting-menu .ext-video-effect .option.rotate select').removeAttribute("disabled");
        document.querySelector('.ext-setting-menu .ext-video-effect .option.brightness input').removeAttribute("disabled");
        document.querySelector('.ext-setting-menu .ext-video-effect .option.grayscale input').removeAttribute("disabled");
        document.querySelector('.ext-setting-menu .ext-video-effect .option.contrast input').removeAttribute("disabled");
        document.querySelector('.ext-setting-menu .ext-video-effect .option.opacity input').removeAttribute("disabled");
        document.querySelector('.ext-setting-menu .ext-video-effect .option.reset input').removeAttribute("disabled");
    }
}


let _video_reverse = "scale(1, 1)";
let _video_rotate = "rotate(0deg)";

function videoeffect_option_reverse(){
    let input = document.querySelector('.ext-setting-menu .ext-video-effect .option.reverse input');
    
    // トグル
    if(input.checked) {  // 注意　クリックされて変化後の値が入っている
      chrome.storage.local.set({"ext_videoeffect_opt_reverse": "ON"}, function() {});
      //document.querySelector('div[data-layer-name="videoLayer"] video').setAttribute("ext-opt-reverse", "ON");
      _video_reverse = "scale(-1, 1)";
    } else {
      chrome.storage.local.set({"ext_videoeffect_opt_reverse": "OFF"}, function() {});
      //document.querySelector('div[data-layer-name="videoLayer"] video').removeAttribute("ext-opt-reverse");
      _video_reverse = "scale(1, 1)";
    }
    if(document.querySelector('.ext-setting-menu .ext-video-effect').getAttribute("ext-attr-on")) {
        videoeffect_aplly_options();
    }
}

function videoeffect_option_rotate(value){

    switch(value) {
        case "default":
            _video_rotate = "rotate(0deg)";
            break;
        case "plus90":
            _video_rotate = "rotate(90deg)";
            break;
        case "minus90":
            _video_rotate = "rotate(-90deg)";
            break;
    }
    if(document.querySelector('.ext-setting-menu .ext-video-effect').getAttribute("ext-attr-on")) {
        videoeffect_aplly_options();
    }
}



let _video_brightness = 1;
let _video_grayscale = 0;
let _video_contrast = 1;
let _video_opacity = 1;

function videoeffect_set_brightness(value) {
    _video_brightness = value;

    if(document.querySelector('.ext-setting-menu .ext-video-effect').getAttribute("ext-attr-on")) {
        videoeffect_aplly_options();
    }
}
function videoeffect_set_grayscale(value) {
    _video_grayscale = value;
    
    if(document.querySelector('.ext-setting-menu .ext-video-effect').getAttribute("ext-attr-on")) {
        videoeffect_aplly_options();
    }
}
function videoeffect_set_contrast(value) {
    _video_contrast = value;
    
    if(document.querySelector('.ext-setting-menu .ext-video-effect').getAttribute("ext-attr-on")) {
        videoeffect_aplly_options();
    }
}
function videoeffect_set_opacity(value) {
    _video_opacity = value;
    
    if(document.querySelector('.ext-setting-menu .ext-video-effect').getAttribute("ext-attr-on")) {
        videoeffect_aplly_options();
    }
}
function videoeffect_set_default(){
    
    _video_reverse = "scale(1, 1)";
    _video_rotate = "rotate(0deg)";

    _video_brightness = 1;
    _video_grayscale = 0;
    _video_contrast = 1;
    _video_opacity = 1;
}
function videoeffect_aplly_options(){
    let video = document.querySelector('div[data-layer-name="videoLayer"] video');
    video.style.filter = 'brightness('+ _video_brightness +')  grayscale('+ _video_grayscale +') contrast(' + _video_contrast + ') opacity(' + _video_opacity + ')';
    
    if(_video_rotate !== "rotate(0deg)"){
        if(document.querySelector('.ext-setting-menu .ext-video-effect .option.reverse input').checked){
            video.style.transform = "scale(0.55, -0.55)" + " " + _video_rotate;
        } else {
            video.style.transform = "scale(0.55)" + " " + _video_rotate;
        }
    } else {
        video.style.transform = _video_reverse;
    }

}
function videoeffect_aplly_defaults_withoutSave(){
    let video = document.querySelector('div[data-layer-name="videoLayer"] video');
    video.style.filter = 'brightness('+ 1 +')  grayscale('+ 0 +') contrast(' + 1 + ') opacity(' + 1 + ')';
    video.style.transform = "scale(1, 1) rotate(0deg)";
}