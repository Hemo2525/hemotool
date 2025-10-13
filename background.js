// ブラウザ環境を判定します。
// Firefoxのバックグラウンドスクリプトは'window'オブジェクトを持ちますが、
// ChromeのManifest V3バックグラウンド(Service Worker)は持ちません。
const isSpeechSynthesisSupported = typeof window !== 'undefined' && window.speechSynthesis;

// グローバル変数
var _tts_voices;
var _tts_volume = 1;
var _tts_pitch = 1;
var _tts_rate = 1;
var _queCount = 0;
var _tts_voiceName = "Google 日本語"; // デフォルトの音声名

/**
 * 利用可能な音声リストを取得・設定する関数（ブラウザ互換）
 */
function initializeVoices() {
    if (isSpeechSynthesisSupported) {
        // Firefoxの場合
        const setVoices = () => {
            _tts_voices = window.speechSynthesis.getVoices();
            for (var i = 0; i < _tts_voices.length; i++) {
                console.log('Available SpeechSynthesis Voice: ' + _tts_voices[i].name);
            }
        };
        setVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = setVoices;
        }
    } else {
        // Chromeの場合
        chrome.tts.getVoices(function (availableVoices) {
            _tts_voices = availableVoices;
            for (var i = 0; i < _tts_voices.length; i++) {
                console.log('Available chrome.tts Voice: ' + _tts_voices[i].voiceName);
            }
        });
    }
}

// 拡張機能の起動時に一度だけ音声リストを初期化
initializeVoices();

/**
 * 読み上げを停止する関数（ブラウザ互換）
 */
function stopVoice() {
    if (isSpeechSynthesisSupported) {
        // Firefoxの場合
        window.speechSynthesis.cancel();
    } else {
        // Chromeの場合
        chrome.tts.stop();
    }
    _queCount = 0;
}

// --- メッセージリスナー ---

chrome.runtime.onMessage.addListener(async (request, sender) => {

    // 棒読みちゃん連携
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

            // --- ここでブラウザごとに処理を分岐 ---
            if (isSpeechSynthesisSupported) {
                // 【Firefox】window.speechSynthesis を使用
                const utterance = new SpeechSynthesisUtterance(request.toSay);
                const selectedVoice = _tts_voices && _tts_voices.find(v => v.name === _tts_voiceName);
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }
                utterance.volume = _tts_volume;
                utterance.pitch = _tts_pitch;
                utterance.rate = _tts_rate;

                utterance.onstart = function () {
                    console.log("読み上げが開始されました");
                };
                utterance.onend = function () {
                    console.log("読み上げが終了しました");
                    if (_queCount > 0) _queCount--;
                };
                utterance.onerror = function (event) {
                    console.log("読み上げ中にエラーが発生しました: " + event.error);
                    if (_queCount > 0) _queCount--;
                };

                window.speechSynthesis.speak(utterance);
            } else {
                // 【Chrome】chrome.tts を使用 (ユーザーの元のコードを復元)
                chrome.tts.speak(request.toSay, {
                    rate: _tts_rate,
                    pitch: _tts_pitch,
                    volume: _tts_volume,
                    'enqueue': true,
                    'voiceName': _tts_voiceName,
                    onEvent: function (event) {
                        console.log(event);
                        if (event.type === "start") {
                            console.log("読み上げが開始されました");
                        }
                        if (event.type === "end") {
                            console.log("読み上げが終了しました");
                            if (_queCount > 0) _queCount--;
                        }
                        if (event.type === "cancelled") {
                            console.log("読み上げがキャンセルされました");
                            if (_queCount > 0) _queCount--;
                        }
                        // エラーイベントもハンドリング
                        if (event.type === "error") {
                            console.log("読み上げ中にエラーが発生しました: " + event.errorMessage);
                            if (_queCount > 0) _queCount--;
                        }
                    }
                });
            }
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
