// --- Web Speech API (speechSynthesis) を使用するための設定 ---

let _tts_voices;
let _tts_volume = 1;
let _tts_pitch = 1;
let _tts_rate = 1;
let _queCount = 0;
// デフォルトの音声名は、利用可能な音声リストから動的に設定する
let _tts_voiceName = null; 

// 利用可能な音声リストを取得して _tts_voices に格納し、デフォルト音声を設定する関数
function populateVoiceList() {
    if (typeof speechSynthesis === 'undefined') {
        console.log('speechSynthesis is not supported.');
        return;
    }
    _tts_voices = speechSynthesis.getVoices();

    // まだデフォルト音声が設定されておらず、音声リストが取得できたら実行
    if (!_tts_voiceName && _tts_voices.length > 0) {
        // 日本語の音声を探す (langプロパティが 'ja' または 'ja-JP' で始まるもの)
        const japaneseVoice = _tts_voices.find(voice => voice.lang.startsWith('ja'));
        
        if (japaneseVoice) {
            // 見つかった最初の日本語音声をデフォルトに設定
            _tts_voiceName = japaneseVoice.name;
            console.log(`デフォルトの日本語音声を「${_tts_voiceName}」に設定しました。`);
        } else {
            // 日本語音声がない場合は、リストの最初の音声をフォールバックとして設定
            _tts_voiceName = _tts_voices[0].name;
            console.log(`日本語音声が見つかりません。デフォルト音声を「${_tts_voiceName}」に設定しました。`);
        }
    }
    console.log("利用可能な音声リスト:", _tts_voices.map(v => `${v.name} (${v.lang})`));
}

// スクリプト読み込み時に音声リストを取得
populateVoiceList();
// 音声リストが非同期で読み込まれる場合に対応
if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
}

// 読み上げを停止する関数
function stopVoice() {
    if (typeof speechSynthesis !== 'undefined') {
        speechSynthesis.cancel();
    }
    _queCount = 0;
}

// --- メッセージリスナー ---

browser.runtime.onMessage.addListener(async (request, sender) => {

    // 棒読みちゃん連携（変更なし）
    if (request.type === "RUN_BOUYOMI_TEXT") {
        try {
            console.log("RUN_BOUYOMI_TEXT", request.bouyomiRequest);
            const res = await fetch(request.bouyomiRequest);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const jsonData = await res.json();
            console.log(jsonData);
            return { status: 'success' }; // 結果を直接returnする
        } catch (error) {
            console.error('Fetch error for bouyomiRequest:', error);
            return { status: 'error', details: error.message }; // エラーを直接returnする
        }
    }

    if (request.type === "GET_BOUYOMI_VOICE_LIST") {
        try {
            console.log("GET_BOUYOMI_VOICE_LIST", request.bouyomiRequest);
            const res = await fetch(request.bouyomiRequest);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const jsonData = await res.json();
            console.log('Voice list fetched:', jsonData);
            // 取得したデータを直接returnするだけで、自動的に送信側に伝わる
            return { status: 'success', data: jsonData }; 
        } catch (error) {
            console.error('Fetch error for getBouyomiVoiceList:', error);
            return { status: 'error', details: error.message };
        }
    }

    // 初期化（音声リストを再取得）
    if (request.init) {
        populateVoiceList();
    }

    // 読み上げ停止
    if (request.stop) {
        console.log("読み上げ停止を受信しました");
        stopVoice();
    }

    // 音量設定
    if (request.setVolume) {
        stopVoice();
        console.log("音量を設定：" + request.setVolume);
        _tts_volume = parseFloat(request.setVolume);
    }

    // ピッチ設定
    if (request.setPitch) {
        stopVoice();
        console.log("ピッチを設定：" + request.setPitch);
        _tts_pitch = parseFloat(request.setPitch);
    }

    // 速度設定
    if (request.setRate) {
        stopVoice();
        console.log("速度を設定：" + request.setRate);
        _tts_rate = parseFloat(request.setRate);
    }
    
    // 音声設定
    if (request.setVoiceName) {
        stopVoice();
        console.log("音声を設定：" + request.setVoiceName);
        _tts_voiceName = request.setVoiceName;
    }

    // 読み上げ実行
    if (request.toSay) {
        if (_queCount > 50) {
            console.log("キューが溜まったのでリセットします");
            stopVoice();
        } else {
            console.log("キューの数：" + _queCount);
            _queCount++;

            const utterance = new SpeechSynthesisUtterance(request.toSay);

            utterance.volume = _tts_volume;
            utterance.pitch = _tts_pitch;
            utterance.rate = _tts_rate;

            if (_tts_voiceName && _tts_voices) {
                const selectedVoice = _tts_voices.find(voice => voice.name === _tts_voiceName);
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                } else {
                    console.warn(`音声 "${_tts_voiceName}" が見つかりません。デフォルトの音声を使用します。`);
                }
            }

            utterance.onstart = function (event) {
                console.log("読み上げが開始されました");
            };
            utterance.onend = function (event) {
                console.log("読み上げが終了しました");
                if (_queCount > 0) _queCount--;
            };
            utterance.onerror = function (event) {
                console.error("読み上げでエラーが発生しました: ", event.error);
                if (_queCount > 0) _queCount--;
            };

            speechSynthesis.speak(utterance);
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
