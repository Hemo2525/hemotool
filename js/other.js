function addTimeToEpoch(uploadDate, offsetTime) {
    // 現在の時刻をエポック時間に変換
    const currentEpoch = new Date(uploadDate).getTime();

    // オフセット時間をパースしてミリ秒単位で取得
    const parts = offsetTime.split(':').map(Number);
    let offsetMilliseconds = 0;
    if (parts.length === 3) {
        // HH:MM:SS 形式の場合
        const [hours, minutes, seconds] = parts;
        offsetMilliseconds = ((hours * 60 + minutes) * 60 + seconds) * 1000;
    } else if (parts.length === 2) {
        // MM:SS 形式の場合
        const [minutes, seconds] = parts;
        offsetMilliseconds = (minutes * 60 + seconds) * 1000;
    }

    // 時刻を足し合わせてエポック時間を計算
    const resultEpoch = currentEpoch + offsetMilliseconds;

    return resultEpoch;
}


let _thumUrl = "";
let _uploadTime = "";
function initOthers() {
    

    const json = document.querySelector('[type="application/ld+json"]').outerText;
    if(json) {
        let dataJson = JSON.parse(json);
        console.log(dataJson);

        _thumUrl = dataJson.thumbnailUrl;
        _uploadTime = dataJson.uploadDate;
        
    }


    //監視オプション
    const optionsForSeekTime = {
        childList: true,  //直接の子の変更を監視
        characterData: false,  //文字の変化を監視
        characterDataOldValue: false, //属性の変化前を記録
        attributes: false,  //属性の変化を監視
        subtree: true, //全ての子要素を監視
    }

    const target = document.querySelector("[class^=___seek-information___]");

    if(target){

        let thumbDom = document.createElement("img");
        thumbDom.id = "ext_thumb";

        target.appendChild(thumbDom);


        const obs = new MutationObserver(function(mutationsList, observer){
            for (const mutation of mutationsList) {

                if(mutation.type === "childList" &&  mutation.target.childNodes[0]){

                    console.log(mutation.target.childNodes[0].textContent);

                    let epochTime = addTimeToEpoch(_uploadTime, mutation.target.childNodes[0].textContent);

                    console.log(_thumUrl + "?t=" + epochTime);

                    thumbDom.src = _thumUrl + "?t=" + epochTime;

                }
            }

        });
        obs.observe(target, optionsForSeekTime);
        console.log("シークバーの時刻表示を監視します");
    } else {
        console.error("シークバーが見つかりません");
    }
    

}
