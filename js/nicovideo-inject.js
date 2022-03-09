/*
    「つりっくま」(「みんなでつりっくま」はOK) や、「早く人間になりたい」などはミュートできない

*/



//----------------------------------------------
// 拡張機能の[ニコ生ゲーム音楽ミュート]ボタンを監視

const watchGameMuteBtn_option = {
    attributes:true  //属性の変化を監視
};
let watchGameMuteBtn_btn = document.querySelector('.ext-setting-menu .ext-game-mute');
const obs_ext_muteBtn_obj = new MutationObserver(watchGameMuteBtn);
obs_ext_muteBtn_obj.observe(watchGameMuteBtn_btn, watchGameMuteBtn_option);  

function watchGameMuteBtn(){
    //console.log("変化を検知。。。");
    let btn = document.querySelector('.ext-setting-menu .ext-game-mute');
    if(btn.getAttribute("ext-attr-on")) {
        //console.log("MUTE");
        window.__akashic__.audioContext.suspend();
    } else {
        //console.log("UNMUTE");
        window.__akashic__.audioContext.resume();
    }

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

    let btn = document.querySelector('.ext-setting-menu .ext-game-mute');
    if(btn.getAttribute("ext-attr-on")) {
        //console.log("自動MUTE");
        
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
            }
        }

    }

}   
