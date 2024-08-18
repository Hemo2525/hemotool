let _bouyomi_host = "localhost";
let _bouyomi_port = 50080;
let _bouyomi_voideId = 1;
let _bouyomi_speed = 100;
let _bouyomi_tone = 100;
let _bouyomi_volume = 20;


// 棒読みちゃんを一時停止する
function pauseBouyomiTask() {
    console.log("clearBouyomiTask");
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `http://${_bouyomi_host}:${_bouyomi_port}/pause`, true);
    xhr.send();
}

// 棒読みちゃんを一時停止を解除する
function resumeBouyomiTask() {
    console.log("clearBouyomiTask");
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `http://${_bouyomi_host}:${_bouyomi_port}/resume`, true);
    xhr.send();
}

// 棒読みちゃんの現在のタスクも含めて全タスクを全てクリアする
function clearBouyomiTask() {

    // 現在のタスクをキャンセル
    clearBouyomiNowTask();

    // 全体のタスクをクリア
    console.log("clearBouyomiTask");
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `http://${_bouyomi_host}:${_bouyomi_port}/clear`, true);
    xhr.send();
}

// 棒読みちゃんの現在のタスクをクリアする
function clearBouyomiNowTask() {
    console.log("clearBouyomiNowTaskを実行");
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `http://${_bouyomi_host}:${_bouyomi_port}/skip`, true);
    xhr.send();
}


// 棒読みちゃんの音質一覧を取得する関数
function getBouyomiVoiceList(host, port) {
    return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `http://${host}:${port}/GetVoiceList`, true);
    xhr.onload = function() {
        if (xhr.status === 200) {
        try {
            const data = JSON.parse(xhr.responseText);
            resolve(data.voiceList);
        } catch (e) {
            reject('JSONのパースに失敗しました: ' + e.message);
        }
        } else {
        reject('棒読みちゃんからのレスポンスエラー: ' + xhr.status);
        }
    };
    xhr.onerror = function() {
        reject('棒読みちゃんへの接続に失敗しました');
    };
    xhr.send();
    });
}

// 音質一覧を取得してドロップダウンリストを生成する関数
function initBouyomiChan(selectedVoiceId) {

    _bouyomi_host = document.querySelector('.ext-setting-menu .ext-bouyomi .option.host input').value;
    _bouyomi_port = document.querySelector('.ext-setting-menu .ext-bouyomi .option.port input').value;

    getBouyomiVoiceList(_bouyomi_host, _bouyomi_port)
        .then(voiceList => {
            const selectElement = document.querySelector('.ext-setting-menu .ext-bouyomi .option.voices select');
            
            // 一旦リストをクリア
            selectElement.replaceChildren();

            // ドロップダウンリストを生成
            voiceList.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.id;
                if(voice.id == selectedVoiceId){
                    option.selected = true;
                }
                option.textContent = voice.alias || voice.name;
                option.style.color = voice.kind.includes('AquesTalk') ? '#080' : 
                                    voice.kind.includes('SAPI5') ? '#00f' : '#f0f';
                selectElement.appendChild(option);
            });            
        })
        .catch(error => {
            console.error('エラー:', error);
        });
}

// 棒読みちゃんにテキストを送信する関数
function sendTextToBouyomiChan(text) {

    const yomiage_request = `http://${_bouyomi_host}:${_bouyomi_port}/Talk?text=${encodeURIComponent(text)}&voice=${_bouyomi_voideId}&speed=${_bouyomi_speed}&tone=${_bouyomi_tone}&volume=${_bouyomi_volume}`;
    chrome.runtime.sendMessage({bouyomiRequest: yomiage_request });

    console.log("sendTextToBouyomiChanを実行", yomiage_request);

    // 下記は棒読みちゃんに２回リクエストを送信してしまうのでやめたー
    // const xhr = new XMLHttpRequest();
    // xhr.open('GET', `http://${_bouyomi_host}:${_bouyomi_port}/Talk?text=${encodeURIComponent(text)}&voice=${_bouyomi_voideId}&speed=${_bouyomi_speed}&tone=${_bouyomi_tone}&volume=${_bouyomi_volume}`, true);
    // xhr.send();
}
