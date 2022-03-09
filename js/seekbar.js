function initSeekbar() {

    let menu = document.querySelector('.ext-setting-menu .ext-seekbar');
    let seekbarInput = document.querySelector('[class^=___slider___]');
    let forwardBtn = document.querySelector('[class^=___forward-button___]');  // [10秒進む]ボタン
    let timeInput = document.querySelector('[class^=___time-text-box___]');    // LIVEボタンとなりの時間入力欄
    let backBtn = document.querySelector('[class^=___back-button___]');        // [10秒戻る]ボタン
    let headBtn = document.querySelector('[class^=___head-button___]');        // [最初から見る]ボタン
    let pauseBtn = document.querySelector('[class^=___play-button___]');       // [一時停止]ボタン
    let controlArea = document.querySelector('[class^=___control-area___]');
    

    function wrapDom(target) {
        let wrap = document.createElement('div');
        wrap.setAttribute('class', "extWrap");
        target.before(wrap);
        wrap.append(target);
    
        let cover = document.createElement('div');
        cover.setAttribute('class', "extBtnCover");
        cover.style.width = target.getBoundingClientRect().width;
        cover.style.height = target.getBoundingClientRect().height;
        wrap.prepend(cover);
    }

    wrapDom(forwardBtn);
    wrapDom(backBtn);
    wrapDom(headBtn);
    wrapDom(pauseBtn);
    //wrapDom(timeInput);
    

}



function seekbar() {
    
    let menu = document.querySelector('.ext-setting-menu .ext-seekbar');
    let seekbarInput = document.querySelector('[class^=___slider___]');
    let forwardBtn = document.querySelector('[class^=___forward-button___]');  // 10秒進むボタン
    let timeInput = document.querySelector('[class^=___time-text-box___]'); // LIVEボタンとなりの時間入力欄
    let backBtn = document.querySelector('[class^=___back-button___]');  // 10秒戻るボタン
    let headBtn = document.querySelector('[class^=___head-button___]');  // 最初から見るボタン
    let pauseBtn = document.querySelector('[class^=___play-button___]');  // 一時停止ボタン

    if(menu.getAttribute("ext-attr-on")) {

        
        if (seekbarInput) {
            seekbarInput.disabled = false;
        }


        // ボタンをOFF状態に
        menu.removeAttribute("ext-attr-on");

        // シークバーにマウスカーソルをホバーしたときの時刻表示を表示に
        document.querySelector("[class^=___seek-information___]").style.display ="block";
        document.querySelector("[class^=___controller___]").style.opacity ="1";

        forwardBtn.disabled = false;
        timeInput.disabled = false;
        backBtn.disabled = false;
        headBtn.disabled = false;
        pauseBtn.disabled = false;

        var list = document.querySelectorAll(".extBtnCover");
        for(let dom of list){
            dom.style.display = "none";
        }

        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_seekbar": "OFF"}, function() {});
        
    } else {

        if (seekbarInput) {
            seekbarInput.disabled = true;
        }

        // ON状態に
        menu.setAttribute("ext-attr-on", "ON");

        // シークバーにマウスカーソルをホバーしたときの時刻表示を非表示に
        document.querySelector("[class^=___seek-information___]").style.display ="none";
        document.querySelector("[class^=___controller___]").style.opacity ="0.3";


        forwardBtn.disabled = true;
        timeInput.disabled = true;
        backBtn.disabled = true;
        headBtn.disabled = true;
        pauseBtn.disabled = true;

        
        var list = document.querySelectorAll(".extBtnCover");
        for(let dom of list){
            dom.style.display = "block";
        }

        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_seekbar": "ON"}, function() {});
    }
}