//var _tts_voices;

var _tts_voiceName;
var _tts_volume;
var _tts_pitch;
var _tts_rate; 
var _queCount = 0;
let _yomiage_opts;

const DEFAULT_TTS_VOLUME = 1;
const DEFAULT_TTS_PITCH = 1;
const DEFAULT_TTS_RATE = 1;


function getYomiageOpts() {

    // サービスワーカー初回起動 or サービスワーカー再起動
    if(_yomiage_opts) {
        let opts = { 
            voiceName : "Google 日本語",
            volume : DEFAULT_TTS_VOLUME,
            pitch: DEFAULT_TTS_PITCH,
            rate: DEFAULT_TTS_RATE
        };
        _yomiage_opts = opts;
    }


    chrome.storage.local.get("yomiage", function (value) {
        if(value && value.yomiage) {

          _yomiage_opts = value.yomiage;
    
          console.log(_yomiage_opts);
    
          if(_yomiage_opts > 0) {

          } else {

          }
    
        }
        
    });
}




let item = { id : kotehan_id, kotehan : kotehan_kotehan };
_Kotehan_comeview.push(item);
chrome.storage.local.set({ "kotehan": _Kotehan_comeview }, function () { });


chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    if (tabId) {
        chrome.tabs.query({ windowId: removeInfo.windowId, tabId: tabId }, function (tabs) {
            if (tabs && tabs.length > 0) {
                const url = new URL(tabs[0].url);
                const domain = url.hostname;
                if (domain === "live.nicovideo.jp") {
                    console.log('ニコ生のタブが閉じられたことを検知');
                    stopVoice();
                }
            }
        });
    }
});


function stopVoice(){
    chrome.tts.stop();
    _queCount = 0;
}

chrome.runtime.onMessage.addListener(function (request) {

    /*
    if(request.init){
        chrome.tts.getVoices(function (availableVoices) {
            _tts_voices = availableVoices;
            for (var i = 0; i < _tts_voices.length; i++) {
                console.log(_tts_voices[i].voiceName);
            }
        });
    }
    */

    if(request.stop){
        console.log("読み上げ停止を受信しました");
        stopVoice();
    }
    if(request.setVolume){
        stopVoice();
        console.log("音量を設定：" + request.setVolume);
        _tts_volume = parseFloat(request.setVolume);
        chrome.storage.local.set({"tts_volume": _tts_volume}, function() {
            console.log("音量を設定：" + _tts_volume);
        });
    }
    if(request.setPitch){
        stopVoice();
        console.log("ピッチを設定：" + request.setPitch);
        _tts_pitch = parseFloat(request.setPitch);
        chrome.storage.local.set({"tts_pitch": _tts_pitch}, function() {
            console.log("ピッチを設定：" + _tts_pitch);
        });
    }
    if(request.setRate){
        stopVoice();
        console.log("速度を設定：" + request.setRate);
        _tts_rate = parseFloat(request.setRate);
        chrome.storage.local.set({"tts_rate": _tts_rate}, function() {
            console.log("速度を設定：" + _tts_rate);
        });
    }
    if(request.setVoiceName){
        stopVoice();
        console.log("音声を設定：" + request.setVoiceName);
        _tts_voiceName = request.setVoiceName;
        chrome.storage.local.set({"tts_voiceName": _tts_voiceName}, function() {
            console.log("音声を設定：" + _tts_voiceName);
        });
    }
    if(request.toSay){

        console.log("読み上げ： " + request.toSay);

        // 一定の数だけキューが溜まったらリセット
        if(_queCount > 50) {

            console.log("キューが溜まったのでリセットします");
            stopVoice();

        } else {


            if(_tts_volume === "") {

            }



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

