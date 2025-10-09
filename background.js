var _tts_voices;
var _tts_volume = 1;
var _tts_pitch = 1;
var _tts_rate = 1; 
var _queCount = 0;

var _tts_voiceName = "Google 日本語";

function stopVoice(){
    chrome.tts.stop();
    _queCount = 0;
}


chrome.runtime.onMessage.addListener(function (request) {


    if (request.bouyomiRequest) {
        
        fetch(request.bouyomiRequest)
            .then(function (res) {
                return res.json(); // フェッチしたデータを JSON 形式に変換
            })
            .then(function (jsonData) {
                console.log(jsonData); // JSON へ変換されたデータをコンソールに表示
            });
    }


    if(request.init){
        chrome.tts.getVoices(function (availableVoices) {
            _tts_voices = availableVoices;
            for (var i = 0; i < _tts_voices.length; i++) {
                console.log(_tts_voices[i].voiceName);
                //voicesSelect.add(new Option(voices[i].voiceName, voices[i].voiceName));
            }
        });
    }
    if(request.stop){
        console.log("読み上げ停止を受信しました");
        stopVoice();
    }
    if(request.setVolume){
        stopVoice();
        console.log("音量を設定：" + request.setVolume);
        _tts_volume = parseFloat(request.setVolume);
    }
    if(request.setPitch){
        stopVoice();
        console.log("ピッチを設定：" + request.setPitch);
        _tts_pitch = parseFloat(request.setPitch);
    }
    if(request.setRate){
        stopVoice();
        console.log("速度を設定：" + request.setRate);
        _tts_rate = parseFloat(request.setRate);
    }
    if(request.setVoiceName){
        stopVoice();
        console.log("音声を設定：" + request.setVoiceName);
        _tts_voiceName = request.setVoiceName;
    }
    if(request.toSay){
        // 一定の数だけキューが溜まったらリセット
        if(_queCount > 50) {

            console.log("キューが溜まったのでリセットします");
            stopVoice();

        } else {

            console.log("キューの数：" +_queCount);
            _queCount++;
            chrome.tts.speak(request.toSay,
                {
                    rate: _tts_rate,
                    pitch: _tts_pitch,
                    volume: _tts_volume,
                    'enqueue': true,
                    'voiceName': _tts_voiceName,

                    onEvent: function (event) {
                        console.log(event);
                        if(event.type === "start"){
                            console.log("読み上げが開始されました");
                        }
                        if(event.type === "end"){
                            console.log("読み上げが終了しました");
                            if(_queCount > 0) _queCount--;
                        }
                        if(event.type === "cancelled"){
                            console.log("読み上げがキャンセルされました");
                            if(_queCount > 0) _queCount--;
                        }
                    }
                },
                function () {
        
                }
            );
        }

    }

});






// --- User-Agentを動的に設定する処理 ---

// ルールの一意なID
const USER_AGENT_RULE_ID = 1;

// User-Agentを書き換える関数
const updateUserAgentRule = async () => {
    // 1. ブラウザ自身の正しいUser-Agentを取得
    const currentUserAgent = navigator.userAgent;

    // 2. 拡張機能の情報を末尾に追加した新しいUser-Agent文字列を作成
    const newUaString = `${currentUserAgent} HemoTool_ChromeExtension/${chrome.runtime.getManifest().version}`;

    console.log('Applying new User-Agent:', newUaString);

    // 3. declarativeNetRequest APIを使って動的にルールを更新
    await chrome.declarativeNetRequest.updateDynamicRules({
    // 最初に古いルールを削除（IDを指定）
    removeRuleIds: [USER_AGENT_RULE_ID],
    // 新しいルールを追加
    addRules: [
        {
        id: USER_AGENT_RULE_ID,
        priority: 1,
        action: {
            type: 'modifyHeaders',
            requestHeaders: [
            {
                header: 'User-Agent',
                operation: 'set',
                value: newUaString, // 動的に生成した文字列をここに設定
            },
            ],
        },
        condition: {
            //requestDomains: ['eapi.spi.nicovideo.jp'],
            urlFilter: '||spi.nicovideo.jp',
            resourceTypes: ['xmlhttprequest'],
        },
        },
    ],
    });
};

// 拡張機能がインストールされた時、またはブラウザが起動した時にルールを適用
chrome.runtime.onInstalled.addListener(updateUserAgentRule);
chrome.runtime.onStartup.addListener(updateUserAgentRule);
