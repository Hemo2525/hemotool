
//----------------------------------------------
// 拡張機能の[ニコ生ゲーム音楽ミュート]ボタンを監視

const watchGameMuteBtn_option = {
    attributes:true  //属性の変化を監視
};
let watchGameMuteBtn_btn = document.querySelector('.ext-setting-menu .ext-game-mute');
const obs_ext_muteBtn_obj = new MutationObserver(watchGameMuteBtn);
obs_ext_muteBtn_obj.observe(watchGameMuteBtn_btn, watchGameMuteBtn_option);  

function watchGameMuteBtn(){
    /*
    console.log("変化を検知。。。");
    let btn = document.querySelector('.ext-setting-menu .ext-game-mute');
    if(btn.getAttribute("ext-attr-on")) {

        let nicoMuteBtn = document.querySelector('[class^=___mute-button___]');
        let videoVolume = document.querySelector('div[data-layer-name="videoLayer"] video').volume;
        
        if(nicoMuteBtn.getAttribute("data-toggle-state") == 'false'){
            // プレイヤーが非ミュート状態

            // 現在のビデオのボリューム設定を取得
            

            // プレイヤーのミュートボタンを押せないようにしておく
            document.querySelector('#ext_volume_overlay').classList.add('show');

            // ボリュームコントローラーは見た目を有効化
            document.querySelector('[class^=___volume-size-control___]').style.cssText = "opacity: 1;";
            
            document.querySelector('#ext_videoVolumeSlider').classList.add('show');
            document.querySelector('#ext_videoVolumeSlider').value = videoVolume * 100;

            // ビデオ、ゲームの両方をミュートにする
            document.querySelector('[class^=___mute-button___]').click();

            // ビデオだけミュートを解除する（結果的にゲームだけミュートになる）
            document.querySelector('div[data-layer-name="videoLayer"] video').volume = videoVolume;
            document.querySelector('div[data-layer-name="videoLayer"] video').muted = false;

            document.querySelector('[class^=___volume-size-control___] [class^=___slider___]').style.cssText = "display:none;"
            

        } else {
            // プレイヤーがミュート状態

            // プレイヤーのミュートボタンを押せないようにしておく
            document.querySelector('#ext_volume_overlay').classList.add('show');

            document.querySelector('#ext_videoVolumeSlider').classList.add('show');
            document.querySelector('#ext_videoVolumeSlider').value = videoVolume * 100;
            document.querySelector('[class^=___volume-size-control___] [class^=___slider___]').style.cssText = "display:none;"
        }
       

        //window.__akashic__.audioContext.suspend(); // Mute
    } else {
        //window.__akashic__.audioContext.resume(); // Un Mute

        // ビデオ、ゲームの両方をミュートにする
        document.querySelector('[class^=___mute-button___]').click();
        
        // プレイヤーのミュートボタンを押せるように戻しておく
        document.querySelector('#ext_volume_overlay').classList.remove('show');

        document.querySelector('#ext_videoVolumeSlider').classList.remove('show');
        
        // ボリュームコントローラーは見た目を初期化
        document.querySelector('[class^=___volume-size-control___]').style.cssText = "";

        document.querySelector('[class^=___volume-size-control___] [class^=___slider___]').style.cssText = "";
    }
    */
}

/*
window.__akashic__.audioContext.onstatechange = function(e){ 
    let btn = document.querySelector('.ext-setting-menu .ext-game-mute');
    if(btn.getAttribute("ext-attr-on")) {
        //console.log("onstatechangeによるMUTE");
        window.__akashic__.audioContext.suspend();
    }
}
*/

//----------------------------------------------
// ボリュームのスライダーのDOMを監視
/*
const watchMuteSlider_for_Mute_option = {
    childList:  true,  //直接の子の変更を監視
    attributes: true,  //属性の変化を監視
    subtree:    true,  //全ての子要素を監視
};
let wathTargetSlider = document.querySelector('#ext_videoVolumeSlider');

const obs_watchSlider = new MutationObserver(watchMuteSlider);
obs_watchSlider.observe(wathTargetSlider, watchMuteSlider_for_Mute_option);  

function watchMuteSlider(mutationsList){

    console.log(mutationsList);

    if(mutationsList.length > 3 && mutationsList[2].target) {
        if(document.querySelector('.ext-setting-menu .ext-game-mute').getAttribute("ext-attr-on")) {
            // ビデオだけミュートを解除する（結果的にゲームだけミュートになる）
            document.querySelector('[class^=___mute-button___]').click();
            document.querySelector('[class^=___mute-button___]').click();
            document.querySelector('div[data-layer-name="videoLayer"] video').volume = mutationsList[2].target.dataset.value / 100;
            document.querySelector('div[data-layer-name="videoLayer"] video').muted = false;
        }
    
    }

}
*/

//----------------------------------------------
// ニコ生ゲームのDOMを監視

const watchAkashicGame_for_Mute_option = {
    childList:  true,  //直接の子の変更を監視
    attributes: true,  //属性の変化を監視
    subtree:    true,  //全ての子要素を監視
};
let akashic_gameview_forMute = document.querySelector('#akashic-gameview');

const obs_akachic_mute = new MutationObserver(watchAkashicGame_for_Mute);
obs_akachic_mute.observe(akashic_gameview_forMute, watchAkashicGame_for_Mute_option);  

function watchAkashicGame_for_Mute(){
/*
    let btn = document.querySelector('.ext-setting-menu .ext-game-mute');
    if(btn.getAttribute("ext-attr-on")) {
        
        console.log("自動MUTE");
        
        // nicovideo側のゲームをミュート
        window.__akashic__.audioContext.suspend();

        window.__akashic__.audioContext.onstatechange = function(e){ 
            window.__akashic__.audioContext.suspend();
        }

        // akachicのiframe側のゲームをミュート
        let frame = document.querySelector('#akashic-gameview iframe');
        if(frame){
            //console.log("------------------------------------------------");
            //console.log(frame);
            // iframeの準備ができるとstyle属性にheight等が設定されるようなのでそれから送信する
            if(frame.getAttribute("style").indexOf("height") >= 0){
                var volume = {type:"loader:setMasterVolume", data:0}; // MAX 0.4っぽい
                frame.contentWindow.postMessage(volume, "https://ak.cdn.nimg.jp/");
                //frame.contentWindow.postMessage(volume, "*"); // 右記のエラーが出る現象を回避　→　Failed to execute 'postMessage' on 'DOMWindow': The target origin provided
            }
        } else {
            //console.log("iframeいませんね");
        }

    }
*/
}   
