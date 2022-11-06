let _kyoiku_yomiage = [];

function getKyoiku() {
    //chrome.storage.local.remove('kyoikus');
    chrome.storage.local.get("kyoikus", function (value) {
        //console.log(value.kyoikus);
        //console.log("-----------------");
        //console.log(_kyoiku_yomiage);
        if(value && value.kyoikus && Array.isArray(value.kyoikus)) {
            _kyoiku_yomiage = value.kyoikus;
        }
        //console.log(_kyoiku_yomiage);
    });

}

function setKyoiku(left, right) {

    // 既に同じ単語が登録されていれば削除しておく
    _kyoiku_yomiage = _kyoiku_yomiage.filter(function (x) { return x.word !== left });

    let item = { word : left, yomi: right };
    _kyoiku_yomiage.push(item);
    chrome.storage.local.set({ "kyoikus": _kyoiku_yomiage }, function () { });
}


function deleteKyoiku(left) {
    _kyoiku_yomiage = _kyoiku_yomiage.filter(function (x) { return x.word !== left });
    //console.log(_kyoiku_yomiage);
    chrome.storage.local.set({ "kyoikus": _kyoiku_yomiage }, function () { });
}


function replaceKyoiku(text) {
    _kyoiku_yomiage.forEach(item => {

        text = text.replace(new RegExp(item.word, 'g'), item.yomi);
    
    });
    return text;
}

function yomiage() {

    // 教育情報を読み込む
    getKyoiku();

    let menu = document.querySelector('.ext-setting-menu .ext-yomiage');

    // トグル
    if (menu.getAttribute("ext-attr-on")) {

        chrome.storage.local.set({ "ext_yomiage": "OFF" }, function () { });
        menu.removeAttribute("ext-attr-on");
        // ショートカットを非アクティブ状態
        document.querySelector('#ext_shortcut .item.yomiage').removeAttribute("active");

        // 読み上げを即停止
        chrome.runtime.sendMessage({ stop: "stop" });

    } else {

        chrome.storage.local.set({ "ext_yomiage": "ON" }, function () { });
        menu.setAttribute("ext-attr-on", "ON");
        // ショートカットをアクティブ状態
        document.querySelector('#ext_shortcut .item.yomiage').setAttribute("active", "ON");

    }
}


function kyoiku(content, isDebug = false) {

    if (isDebug) console.log("入力値 →　" + content);
    if (content === undefined || content.length == 0) {
        if (isDebug) console.log("文字列が未定義か長さが0です。");
        return { bIsSuccess: false };
    }

    // 全角スペース/半角スペースを除去
    content = content.replace(/\s+/g, "");
    if (content === undefined || content.length == 0) {
        if (isDebug) console.log("スペースを除去しました。文字列が未定義か長さが0です。");
        return { bIsSuccess: false };
    }

    // 全角を半角にしておく
    content = content.replace(/（/g, '(');
    content = content.replace(/）/g, ')');
    content = content.replace(/＝/g, '=');


    // (, =, ), などの文字が1個ずつだけあるか
    if ((content.match(/\(/g) || []).length !== 1) {
        if (isDebug) console.log("半角カッコ ( が1個ではありません");
        return { bIsSuccess: false };
    }
    if ((content.match(/\)/g) || []).length !== 1) {
        if (isDebug) console.log("半角カッコ ) が1個ではありません");
        return { bIsSuccess: false };
    }
    if ((content.match(/=/g) || []).length !== 1) {
        if (isDebug) console.log("半角イコール = が1個ではありません");
        return { bIsSuccess: false };
    }

    // 教育コマンドから始まるか
    let bIsPass = false;
    let left = "";
    let right = "";
    if (content.startsWith('教育(', 0)) {

        let start = content.indexOf('(');
        let equal = content.indexOf('=', start);
        let end = content.indexOf(')', equal);

        if (start && end && equal && (start < equal < end)) {
            left = content.substring(start + 1, equal);
            right = content.substring(equal + 1, end);
            if (left && left.length > 1 && right && right.length) {
                if (isDebug) console.log("[" + left + "] は [" + right + "] で学習しました。");
                bIsPass = true;
            }
        }
    }
    if (isDebug) console.log("----------------終了します----------------");

    return { bIsSuccess: bIsPass, leftWord: left, rightWord: right };
}

function kyoikuTest() {

    // 正常系テスト
    kyoiku("教育(天秤=てんびん)", true).bIsSuccess ? console.log("テスト合格") : console.log("★テスト不合格★");
    kyoiku("教育　(　天秤=てんびん)", true).bIsSuccess ? console.log("テスト合格") : console.log("★テスト不合格★");
    kyoiku(" 教育　(　天秤=てんびん)", true).bIsSuccess ? console.log("テスト合格") : console.log("★テスト不合格★");
    kyoiku("教育（天　 秤　=　てんび　ん）", true).bIsSuccess ? console.log("テスト合格") : console.log("★テスト不合格★");
    kyoiku("教育(天秤＝てんびん)", true).bIsSuccess ? console.log("テスト合格") : console.log("★テスト不合格★");

    // 失敗系テスト
    kyoiku("こうやるといいよ。教育(天秤=てんびん)", true).bIsSuccess === false ? console.log("テスト合格") : console.log("★テスト不合格★");
    kyoiku("教育(=てんびん)", true).bIsSuccess === false ? console.log("テスト合格") : console.log("★テスト不合格★");
    kyoiku("教育(天秤=)", true).bIsSuccess === false ? console.log("テスト合格") : console.log("★テスト不合格★");
    kyoiku("教育(あ=い)", true).bIsSuccess === false ? console.log("テスト合格") : console.log("★テスト不合格★");
    kyoiku("教育(あ=)", true).bIsSuccess === false ? console.log("テスト合格") : console.log("★テスト不合格★");
    kyoiku("教育(=い)", true).bIsSuccess === false ? console.log("テスト合格") : console.log("★テスト不合格★");
    kyoiku("教育(=)", true).bIsSuccess === false ? console.log("テスト合格") : console.log("★テスト不合格★");
    kyoiku("教育(　=　)", true).bIsSuccess === false ? console.log("テスト合格") : console.log("★テスト不合格★");
    kyoiku("教育(　　=　　)", true).bIsSuccess === false ? console.log("テスト合格") : console.log("★テスト不合格★");
    kyoiku("教育(天秤=てん=びん)", true).bIsSuccess === false ? console.log("テスト合格") : console.log("★テスト不合格★");
    kyoiku("教育(天秤=てん)びん)", true).bIsSuccess === false ? console.log("テスト合格") : console.log("★テスト不合格★");
    kyoiku("教育(天(秤=てんびん)", true).bIsSuccess === false ? console.log("テスト合格") : console.log("★テスト不合格★");
    kyoiku("教育((天秤=てんびん))", true).bIsSuccess === false ? console.log("テスト合格") : console.log("★テスト不合格★");
    kyoiku("教育(天秤==てんびん)", true).bIsSuccess === false ? console.log("テスト合格") : console.log("★テスト不合格★");
}



function boukyaku(content, isDebug = false) {

    if (isDebug) console.log("入力値 →　" + content);
    if (content === undefined || content.length == 0) {
        if (isDebug) console.log("文字列が未定義か長さが0です。");
        return { bIsSuccess: false };
    }

    // 全角スペース/半角スペースを除去
    content = content.replace(/\s+/g, "");
    if (content === undefined || content.length == 0) {
        if (isDebug) console.log("スペースを除去しました。文字列が未定義か長さが0です。");
        return { bIsSuccess: false };
    }

    // 全角を半角にしておく
    content = content.replace(/（/g, '(');
    content = content.replace(/）/g, ')');


    // (, =, ), などの文字が1個ずつだけあるか
    if ((content.match(/\(/g) || []).length !== 1) {
        if (isDebug) console.log("半角カッコ ( が1個ではありません");
        return { bIsSuccess: false };
    }
    if ((content.match(/\)/g) || []).length !== 1) {
        if (isDebug) console.log("半角カッコ ) が1個ではありません");
        return { bIsSuccess: false };
    }

    // 忘却コマンドから始まるか
    let bIsPass = false;
    let targetWord = "";

    if (content.startsWith('忘却(', 0)) {

        let start = content.indexOf('(');
        let end = content.indexOf(')', start);

        if (start && end && (start < end)) {
            targetWord = content.substring(start + 1, end);
            if (targetWord && targetWord.length > 1 ) {
                if (isDebug) console.log("[" + targetWord + "] を忘れました。");



                bIsPass = true;
            }
        }
    }
    if (isDebug) console.log("----------------終了します----------------");

    return { bIsSuccess: bIsPass, word : targetWord };
}
