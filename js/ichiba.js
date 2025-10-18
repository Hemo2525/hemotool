// TextEncoderを使って、検索したい文字列をバイナリ（Uint8Array）に変換しておく
const SCORE_PACKET_SIGNATURE = new TextEncoder().encode('aggregating_send_score');

/**
 * Uint8Array（haystack）内に、別のUint8Array（needle）が含まれているかを確認するヘルパー関数
 * @param {Uint8Array} haystack - 検索対象の大きなバイナリデータ
 * @param {Uint8Array} needle - 検索したいシグネチャ（目印）となるバイナリデータ
 * @returns {boolean} - 含まれていればtrue
 */
function includesSequence(haystack, needle) {
    if (needle.length === 0) return true;
    if (haystack.length < needle.length) return false;

    for (let i = 0; i <= haystack.length - needle.length; i++) {
        let found = true;
        for (let j = 0; j < needle.length; j++) {
            if (haystack[i + j] !== needle[j]) {
                found = false;
                break;
            }
        }
        if (found) return true;
    }
    return false;
}


/**
 * 'item'というキーのプロパティ値で、かつ'entityId'を持つオブジェクトを再帰的に探し出す
 * @param {any} data - 検索対象のオブジェクトまたは配列
 * @returns {Array<object>} - 見つかったオブジェクトの配列
 */
function findItemsWithEntityId(data) {
    const result = [];
  
    function recurse(current) {
      // nullやundefined、またはオブジェクト/配列でない場合は処理を中断
      if (current === null || typeof current !== 'object') {
        return;
      }
  
      // もし現在の要素が配列なら、各要素に対して再帰処理を行う
      if (Array.isArray(current)) {
        for (const item of current) {
          recurse(item);
        }
        return;
      }
  
      // ★ここからがメインのロジック★
      // 現在のオブジェクトが持つプロパティを一つずつチェック
      for (const key in current) {
        if (Object.prototype.hasOwnProperty.call(current, key)) {
          const value = current[key];
  
          // 【条件】キーが 'item' であり、その値が 'entityId' を持つオブジェクトか？
          if (
            key === 'item' &&
            value !== null &&
            typeof value === 'object' &&
            !Array.isArray(value) && // 配列は除外
            Object.prototype.hasOwnProperty.call(value, 'entityId')
          ) {
            // 条件に一致したら、その値（itemオブジェクト）を結果に追加
            result.push(value);
          }
  
          // さらに深い階層を探索するため、プロパティの値に対して再帰処理を行う
          recurse(value);
        }
      }
    }
  
    recurse(data);
    return result;
  }

 /**
 * status.running が true であるオブジェクトを探し、その兄弟であるentityIdを取得する関数
 * @param {any} data - 検索対象のオブジェクトまたは配列
 * @returns {Array<string>} - 見つかったentityIdの配列
*/
function findEntityIdsByRunningStatus(data) {
    const results = [];

    function recurse(current) {
        // nullやundefined、またはオブジェクト/配列でない場合は処理を中断
        if (current === null || typeof current !== 'object') {
        return;
        }

        // もし現在の要素が配列なら、各要素に対して再帰処理を行う
        if (Array.isArray(current)) {
        for (const item of current) {
            recurse(item);
        }
        return;
        }

        // ★ここがメインのロジック★
        // 条件：entityId があり、かつ status.running が true か？
        // 安全にアクセスするために、各プロパティの存在を順番にチェックする
        if (
        Object.prototype.hasOwnProperty.call(current, 'entityId') &&
        Object.prototype.hasOwnProperty.call(current, 'status') &&
        current.status && // statusがnullやundefinedでないことを確認
        typeof current.status === 'object' &&
        Object.prototype.hasOwnProperty.call(current.status, 'running') &&
        current.status.running === true
        ) {
        // 条件に一致した場合、entityIdの値を結果に追加
        results.push(current.entityId);
        }

        // さらに深い階層を探索するため、現在のオブジェクトの各プロパティの値に対して再帰処理を行う
        for (const key in current) {
        if (Object.prototype.hasOwnProperty.call(current, key)) {
            recurse(current[key]);
        }
        }
    }

    recurse(data);
    return results;
}


/**
 * 1回のデータ探索で、2種類の条件に合うオブジェクトをそれぞれ分類して取得する関数
 * @param {any} data - 検索対象のオブジェクトまたは配列
 * @returns {{items: Array<object>, runningItems: Array<object>}} - 分類されたオブジェクトリストを持つオブジェクト
 */
function findCategorizedItems(data) {
    // 2種類のリストをプロパティに持つ、結果格納用のオブジェクトを用意
    const results = {
        items: [],
        runningItems: [],
    };

    function recurse(current) {
        // 基本的な再帰処理（nullチェック、配列処理）
        if (current === null || typeof current !== 'object') {
        return;
        }
        if (Array.isArray(current)) {
        for (const item of current) {
            recurse(item);
        }
        return;
        }

        // --- ここからオブジェクトに対する条件チェック ---

        // 【条件1】'status.running' === true のオブジェクトか？
        if (current.status?.running === true && current.entityId) {
        // runningItemsリストに、オブジェクトそのものを追加
        results.runningItems.push(current);
        }

        // 【条件2】キーが 'item' で、その値が 'entityId' を持つオブジェクトか？
        if (current.item?.entityId) {
        // itemsリストに、「itemの値であるオブジェクト」を追加
        results.items.push(current.item);
        }

        // --- チェック終わり ---

        // さらに深い階層を探索するため、すべてのプロパティに対して再帰呼び出し
        for (const key in current) {
        if (Object.prototype.hasOwnProperty.call(current, key)) {
            recurse(current[key]);
        }
        }
    }

    recurse(data);

    // 最終的に、2つのリストが格納されたオブジェクトを返す
    return results;
}


let _allIchibaGameArray = [];
let _lastRunningEntityId = "";
let _lastFindEntityId = "";

window.addEventListener('message', (event) => {

    // console.log("イベントきたよ", event);

    // 自分自身（拡張機能）からのメッセージや、不正な形式のメッセージは無視
    if (event.source !== window || !event.data || event.data.direction !== 'from-page') {
        return;
    }

    // ページから送られてきた解析リクエストか確認
    if (event.data.type === 'DECODE_MSGPACK_REQUEST') {
        //console.log("DECODE_MSGPACK_REQUEST");
        try {
            let binaryData = event.data.binaryData;
            // console.log("binaryData", binaryData);

            // postMessageでデータが変換された場合に備え、確実にUint8Arrayに変換します
            if (!(binaryData instanceof Uint8Array)) {
                binaryData = new Uint8Array(Object.values(binaryData));
            }

            // データの長さがヘッダー長（8バイト）より短い場合は、処理対象外
            if (binaryData.length <= 8) {
                return;
            }

            // 1. 先頭8バイトの独自ヘッダーを無視し、それ以降のデータを切り出す
            const msgpackStream = binaryData.subarray(8);

            const header = binaryData.subarray(0, 8);
            // console.log(`[${event.data.from}] ヘッダー`, header);

            // Uint8Arrayとして渡されたデータをデコードします。
            // decodeMultiはジェネレータを返すので、Array.from()で配列に変換します。
            const decodedObjects = Array.from(MessagePack.decodeMulti(msgpackStream));

            // console.log(`[${event.data.from}] デコードデータ`, decodedObjects);
            //console.log(`[${event.data.from}] デコードデータ前の長さ`, binaryData.length);


            
            //console.time(`[${event.data.from}] デコードデータからentityIdを持つオブジェクト`);
            if(event.data.from === "recv"){
                const ret = findCategorizedItems(decodedObjects);
                if(ret.items.length > 0){
                    // _allIchibaGameArrayの末尾に追加
                    _allIchibaGameArray = [..._allIchibaGameArray, ...ret.items];
                    // console.log("_allIchibaGameArray:", _allIchibaGameArray);

                    //console.log("runningItems:", ret.runningItems);
                    if(ret.runningItems.length > 0){
                        // 最後にrunning: true であるオブジェクトのentityIdを取得
                        _lastRunningEntityId = ret.runningItems[ret.runningItems.length - 1].entityId;
                        // console.log("[1] lastRunningEntityId:", _lastRunningEntityId);
                    }

                } else {
                    // status.running が true であるオブジェクトを探し、そのentityIdを取得
                    const runningEntityIds = findEntityIdsByRunningStatus(decodedObjects);
                    if(runningEntityIds.length > 0){
                        if(runningEntityIds[0]) {
                            _lastRunningEntityId = runningEntityIds[0];
                            // console.log("[2] lastRunningEntityId:", _lastRunningEntityId);
                        }
                    }
                }

                //console.log(`[${event.data.from}] デコードデータからentityIdを持つオブジェクト`, items);
            }

            //console.timeEnd(`[${event.data.from}] デコードデータからentityIdを持つオブジェクト`);


            // 2番目の要素（メインのオブジェクト）を取得
            const mainObject = decodedObjects[1];
            //console.log("メインオブジェクト:", mainObject);
            const type = mainObject?.type;
            if(type === "aggregating_send_score"){
                // console.log("aggregating_send_score", mainObject);
                // aggregating_send_scoreは2回送信されることがあるので2回目は弾く
                if(_lastFindEntityId !== _lastRunningEntityId){
                    _lastFindEntityId = _lastRunningEntityId;

                    const score = mainObject?.score;
                    const point = score?.point;
                    // console.log("得点：point:", point);

                    // スコアリストに追加
                    addScoreList(_lastRunningEntityId, point);
                }
                
            }

        } catch (error) {
            //console.error("デコードエラー", error);
        }
    }
});

// MARK: スコアリストに追加
/**
 * 現在時刻を日本時間（JST）に基づいた 'YYYY-MM-DDTHH:mm:ss' 形式の文字列で返す
 * @returns {string} フォーマットされた日付文字列
 */
function getJSTISOString() {
    const now = new Date();

    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// MARK: スコアリストに追加 (新しいデータ構造バージョン)
async function addScoreList(entityId, itemScore) {

    const item = _allIchibaGameArray.find(item => item.entityId === entityId);
    if(!item) {
        console.error(`スコアリストに追加するためのデータが不足しています entityId: ${entityId}`);
        return;
    }

    // console.log(`${item.categoryName}-${item.id} ${item.title}　の得点は ${itemScore} でした`);

    if(itemScore === 0) {
        return;
    }

    const category = item.categoryName === "game" ? "official" : "user";
    const id = item.id;
    
    const scoreListKey = `scoreList`;
    const getScoreList = await chrome.storage.local.get([scoreListKey]);
    let scoreList = getScoreList[scoreListKey] || [];


    // 今回プレイしたゲームがリストに既に存在するか探す
    const gameIndex = scoreList.findIndex(game => game.category === category && game.id === id);

    if (gameIndex !== -1) {
        // --- 存在した場合：そのゲームのスコア履歴を更新 ---
        const game = scoreList[gameIndex];
        
        // 新しいスコアを追加
        game.scores.push({
            point: itemScore,
            date: getJSTISOString()
        });
        
        // スコア履歴を点数の高い順にソート
        game.scores.sort((a, b) => b.point - a.point);
        
        // スコア履歴を最大10件に絞る
        game.scores = game.scores.slice(0, 10);
        
        // console.log(`「${game.title}」のスコア履歴を更新しました。`);

    } else {
        // --- 存在しなかった場合：新しいゲーム情報として追加 ---
        // console.log(`「${item.title}」を新しいゲームとしてスコアリストに追加します。`);

        const newGame = {
            category: category, 
            thumbnailUrl: item.thumbnailUrl, 
            title: DOMPurify.sanitize(item.title),
            id: id,
            scores: [ // 新しいスコア履歴を作成
                {
                    point: itemScore,
                    date: getJSTISOString()
                }
            ]
        };

        // 作者情報など、追加の情報を取得して結合する
        if (category === "official") {
            const product = await getIchibaProductInfo("game", id, _embeddedDataJson.program.nicoliveProgramId);
            if (product?.meta.status === 200) {
                newGame.author = product.data.author;
                newGame.authorUserID = null;
                newGame.serviceProductId = product.data.serviceProductId;
                newGame.originContentID = null;
            } else {
                console.error("productを取得できませんでした"); return;
            }
        }
        
        if (category === "user") {
            const service = await getIchibaServiceInfo("akasha", id, _embeddedDataJson.program.nicoliveProgramId);
            const product = await getIchibaProductInfo("akasha", id, _embeddedDataJson.program.nicoliveProgramId);
            const owner = await getOwner(product.data.id);

            if (service?.meta.status === 200 && owner?.meta.status === 200) {
                newGame.authorName = DOMPurify.sanitize(owner.data.displayName);
                newGame.authorUserID = owner.data.niconicoUserInfo.id;
                newGame.originContentID = service.data.content.originContentId;
            } else {
                console.error("新規追加情報の取得に失敗しました", { service, owner }); return;
            }
        }
        
        // 完成した新しいゲーム情報をリストに追加
        scoreList.push(newGame);
    }
    
    // 最終的なリストを保存
    // console.log("スコアリスト全体を保存します", scoreList);
    await chrome.storage.local.set({[scoreListKey]: scoreList});
}




































/*
const _fetchOptions = {
    "headers": {
        "accept": "application/json",
        "accept-language": "ja,en-US;q=0.9,en;q=0.8,yi;q=0.7,zh-TW;q=0.6,zh;q=0.5",
        "content-type": "application/json",
        "sec-ch-ua": "\"Google Chrome\";v=\"137\", \"Chromium\";v=\"137\", \"Not/A)Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site"
    },
    "referrer": "https://spi.nicovideo.jp/",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "method": "GET",
    "mode": "cors",
    "credentials": "include"
};
*/

/**
 * User-Agent Client Hintsを含む、動的なfetchオプションを生成します。
 * @returns {Promise<Object>} fetchで使用するオプションオブジェクト
 */
async function getDynamicFetchOptions() {
    // 基本となるオプション
    const options = {
      headers: {
        'accept': 'application/json',
        'accept-language': 'ja,en-US;q=0.9,en;q=0.8,yi;q=0.7,zh-TW;q=0.6,zh;q=0.5',
        'content-type': 'application/json',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
      },
      referrer: 'https://spi.nicovideo.jp/',
      referrerPolicy: 'strict-origin-when-cross-origin',
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
    };
  
    // User Agent Client Hints API が利用可能かチェック
    if (navigator.userAgentData) {
      try {
        // ブラウザからプラットフォーム、ブランド（ブラウザ名とバージョン）、モバイルかどうかの情報を非同期で取得
        const uaData = await navigator.userAgentData.getHighEntropyValues([
          'platform',
          'brands',
          'mobile',
        ]);
  
        // 1. sec-ch-ua ヘッダーを組み立てる
        // 例: `"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"`
        const uaBrands = uaData.brands
          .map(brand => `"${brand.brand}";v="${brand.version}"`)
          .join(', ');
        options.headers['sec-ch-ua'] = uaBrands;
  
        // 2. sec-ch-ua-mobile ヘッダー
        options.headers['sec-ch-ua-mobile'] = uaData.mobile ? '?1' : '?0';
  
        // 3. sec-ch-ua-platform ヘッダー
        // 例: `"Windows"` や `"macOS"`
        options.headers['sec-ch-ua-platform'] = `"${uaData.platform}"`;
  
      } catch (error) {
        console.error('User Agent Client Hintsの取得に失敗しました:', error);
        // 万が一APIが失敗した場合のフォールバックとして、古い値を設定することも可能
        // options.headers['sec-ch-ua'] = '"Google Chrome";v="137", ...';
        // options.headers['sec-ch-ua-mobile'] = '?0';
        // options.headers['sec-ch-ua-platform'] = '"Windows"';
      }
    }
  
    return options;
  }

function ichibaShortcutToggle() {

    const ichibaShortcut = document.querySelector('#ext_ichiba_shortcut');    
    let menu = document.querySelector('.ext-setting-menu .ext-ichiba');

    if(menu.getAttribute("ext-attr-on")) {
        /* ON →　OFF */
    
        ichibaShortcut.classList.remove("show");

        // ボタンをOFF状態に
        menu.removeAttribute("ext-attr-on");
        
        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_ichiba": "OFF"}, function() {});

        // ショートカットを非アクティブ状態
        document.querySelector('#ext_shortcut .item.ichiba').removeAttribute("active");

    } else {
        /* OFF →　ON */

        ichibaShortcut.classList.add("show");

        // ON状態に
        menu.setAttribute("ext-attr-on", "ON");        
        
        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_ichiba": "ON"}, function() {});

        // ショートカットをアクティブ状態
        document.querySelector('#ext_shortcut .item.ichiba').setAttribute("active", "ON");

    }
}

function gameLauncherToggle() {

    const gameLauncherBtn = document.querySelector('#ext_game_launcher_btn');    
    let menu = document.querySelector('.ext-setting-menu .ext-gamelauncher');

    if(menu.getAttribute("ext-attr-on")) {
        /* ON →　OFF */
    
        gameLauncherBtn.classList.remove("show");

        // ボタンをOFF状態に
        menu.removeAttribute("ext-attr-on");
        
        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_game_launcher": "OFF"}, function() {});

        // ショートカットを非アクティブ状態
        document.querySelector('#ext_shortcut .item.gamelauncher').removeAttribute("active");


    } else {
        /* OFF →　ON */

        gameLauncherBtn.classList.add("show");

        // ON状態に
        menu.setAttribute("ext-attr-on", "ON");        
        
        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_game_launcher": "ON"}, function() {});

        // ショートカットをアクティブ状態
        document.querySelector('#ext_shortcut .item.gamelauncher').setAttribute("active", "ON");
    }
}

function watchIchibaBaloon(mutationsList, observer) {

    //監視オプション
    const ichibaOption = {
        childList:              true,    //直接の子の変更を監視
        characterData:          false,    //文字の変化を監視
        characterDataOldValue:  false,   //属性の変化前を記録
        attributes:             true,   //属性の変化を監視
        subtree:                false,   //全ての子要素を監視
    }
    
    // console.log(mutationsList);
    for (const mutation of mutationsList) {
        if(mutation.type === "childList"){
            // console.log(mutation);

            // バルーンが表示されたことを確認
            mutation.addedNodes.forEach((currentNode) => {
                if(currentNode.id === "BALLOON-IFRAME"){

                    // へもツールの他のウインドウを非表示
                    document.querySelector("#ext_overlay").style.display = "none";
                    document.querySelector('.ext-setting-menu').removeAttribute("ext-attr-show");
                    document.querySelector('.ext-popup').classList.remove('show');

                    // イチバのバルーンDOMのiframeの監視を開始
                    const ichibaBaloonAreaIFrame = document.querySelector("#BALLOON-IFRAME"); // コメントDOMの大元の親DOMを指定
                    if (ichibaBaloonAreaIFrame) {
                        const obsIFrame = new MutationObserver(function(mutationsList, observer){
                            addHemoToolToIchibaBaloon(currentNode);
                        });
                        obsIFrame.observe(ichibaBaloonAreaIFrame, ichibaOption);
                    }
                    addHemoToolToIchibaBaloon(currentNode);
                }
            });

            // バルーンが消えたことを確認
            mutation.removedNodes.forEach((currentNode) => {
                if(currentNode.id === "BALLOON-IFRAME"){
                    // console.log(currentNode);
                    const addHemoTool = document.querySelector("#addHemoTool");
                    if(addHemoTool){
                        addHemoTool.remove();
                    }
                    const infoBtn = document.querySelector("#infoHemoToolBtn");
                    if(infoBtn){
                        infoBtn.remove();
                    }
                }
            });
        }
    }
}

function addHemoToolToIchibaBaloon(currentNode) {

    // [へもツールに追加]を削除
    const existAddHemoTool = document.querySelector("#addHemoTool");
    if(existAddHemoTool){
        existAddHemoTool.remove();
    }

    // [説明]を削除
    const infoGameBtn = document.querySelector("#infoHemoToolBtn");
    if(infoGameBtn){
        infoGameBtn.remove();
    }




    /*
    以下のURLから、id=521 を取得する
    "https://services.spi.nicovideo.jp/game/index.html?id=521&content_id=lv00000000000&frontend_id=9&frontend_version=600.0.0&content_type=live"
    */
    const src = currentNode.getAttribute("src");
    const id = src.split("id=")[1].split("&")[0];
    // console.log(id);

    /*
    以下のURLから、１階層目のフォルダ名(以下の例ならgame）を取得する
    "https://services.spi.nicovideo.jp/game/index.html?id=521&content_id=lv00000000000&frontend_id=9&frontend_version=600.0.0&content_type=live"
    */
    const folderName = src.split('/')[3];
    // console.log('フォルダ名:', folderName);

    /*
    "[class^=___ichiba-balloon___]" の子要素に、id=521 のDOMを追加する
    例： <button id="addHemoTool" data-ichiba-id="521">へもツールに追加する</button>
    */
    const ichibaBaloon = document.querySelector("[class^=___ichiba-balloon___]");
    const addHemoTool = document.createElement("button");
    addHemoTool.id = "addHemoTool";
    addHemoTool.setAttribute("data-ichiba-id", id);
    addHemoTool.textContent = "へもツールに追加";
    ichibaBaloon.appendChild(addHemoTool);
    addHemoTool.addEventListener("click", async function(){
        // console.log(this.getAttribute("data-ichiba-id"));
        
        addHemoTool.disabled = true;
        addHemoTool.style.backgroundColor = "rgb(71, 71, 71)";

        const selectItem = document.querySelector("[class^=___ichiba-counter-section___] [data-is-selected='true'] img");
        if(selectItem){
            const itemName = selectItem.getAttribute("alt");
            const itemIcon = selectItem.getAttribute("src");

            const resultMessage = await addIchibaShortcutDataToStorage(id, folderName, itemName, itemIcon);

            // console.log("追加しました1");
            addHemoTool.textContent = resultMessage;

            // 追加したアイテムを含めてアイコンを再表示
            addIchibaShortcutIcon();

        } else {
            console.error("アイコンが選択されていません");
        }
    });

    const infoBtn = document.createElement("button");
    infoBtn.id = "infoHemoToolBtn";
    //infoBtn.setAttribute("data-ichiba-id", id);
    infoBtn.textContent = "説明";
    ichibaBaloon.appendChild(infoBtn);
    infoBtn.addEventListener("click", function() {showIchibaInfo(id, folderName)});
}

async function addIchibaShortcutDataToStorage(requestItemId, folderName, itemName, itemIcon) {
    
    const shortcutList = await chrome.storage.local.get(["ichibaList"]);
    const shortcutListData = shortcutList.ichibaList || [];

    // 0件から1件になった場合はショートカット機能を有効状態にする
    if(shortcutListData.length === 0){
        const ichibaShortcut = document.querySelector('#ext_ichiba_shortcut');
        ichibaShortcut.classList.add("show");
        
        // ON状態に
        const menu = document.querySelector('.ext-setting-menu .ext-ichiba');
        menu.setAttribute("ext-attr-on", "ON");        
        
        // ストレージにボタンの状態を保存
        chrome.storage.local.set({"ext_ichiba": "ON"});

        // ショートカットをアクティブ状態
        document.querySelector('#ext_shortcut .item.ichiba').setAttribute("active", "ON");
    }

    // 既に追加済みなら追加しない
    if(shortcutListData.find(item => item.itemId === requestItemId && item.folderName === folderName)){
        console.log("既に追加済みのアイテムです");
        return "追加済アイテム";
    }

    // 追加
    shortcutListData.push({
        "folderName": folderName,
        "itemId": requestItemId,
        "itemName": itemName,
        "itemIcon": itemIcon
    });

    await chrome.storage.local.set({"ichibaList": shortcutListData});

    return "追加しました";
}

function getFrontendId() {
    let frontendId = "9";
    if(_embeddedDataJson && _embeddedDataJson.site && _embeddedDataJson.site.frontendId){
        // console.log("frontendId:", _embeddedDataJson.site.frontendId);
        frontendId = _embeddedDataJson.site.frontendId;
    } else {
        console.error("frontendIdが取得できませんでした");
    }
    return frontendId;
}

function getFrontendVersion() {
    let frontendVersion = "600.0.0";
    if(_embeddedDataJson && _embeddedDataJson.site && _embeddedDataJson.site.frontendVersion){
        // console.log("frontendVersion:", _embeddedDataJson.site.frontendVersion);
        frontendVersion = _embeddedDataJson.site.frontendVersion;
    } else {
        console.error("frontendVersionが取得できませんでした");
    }
    return frontendVersion;
}

async function addIchibaShortcutIcon() {
    const ichibaItemBox = document.querySelector("#ext_ichiba_shortcut .item-box");
    ichibaItemBox.innerHTML = "";

    // タイムシフトなどで、ゲームを追加できない場合は、ショートカットを無効化
    const waitTime = document.querySelector('#ext_ichiba_shortcut .time-box');
    const watiTimeInLauncher = document.querySelector('#ext_nico_game_launcher .time-box');
    const ichibaAddBtn = document.querySelector("[class^=___ichiba-counter-section___] [class^=___add-button___]");
    const bIsDisableIchiba = ichibaAddBtn && ichibaAddBtn.hasAttribute("disabled");
    if(bIsDisableIchiba){
        const ichibaShortcut = document.querySelector("#ext_ichiba_shortcut");
        ichibaShortcut.classList.add("disabled");
        waitTime.innerText = "リクエストできません";
        watiTimeInLauncher.innerText = "リクエストできません";
    } else {

        const authority = await getSelfAuthority(_embeddedDataJson.program.nicoliveProgramId);
        if(authority.data.cooldownTime > 0) {
            // 秒数から、n分m秒を取得
            const minutes = Math.floor(authority.data.cooldownTime / 60);
            const seconds = authority.data.cooldownTime % 60;            
            setIchibaWaitTime(minutes, seconds);
        } else {
            waitTime.innerText = "リクエストが可能です";
            watiTimeInLauncher.innerText = "リクエストが可能です";
        }
    }

    /*
    chrome.storage.local.getして、#ext_ichiba_shortcutに、以下のようにDOMを追加する
    <div class="item ichiba" aria-label="アイテムタイトル"><img src="画像URL" alt="アイテムタイトル"><span class="delete-btn">×</span>/div>
    */
    chrome.storage.local.get("ichibaList", function (value) {
        if(value && value.ichibaList && Array.isArray(value.ichibaList)) {

            ichibaItemBox.textContent = "";

            // DOMに各アイテムを追加していく
            value.ichibaList.forEach(function(item){

                let dom = document.createElement('div');
                dom.className = "item ichiba";
                dom.setAttribute("aria-label", item.itemName);
                dom.setAttribute("data-item-id", item.itemId);
                dom.setAttribute("draggable", true); // ドラッグで並び替えできるようにする
                
                let img = document.createElement('img');
                img.src = item.itemIcon;
                img.alt = item.itemName;
                img.setAttribute("draggable", false); // 画像だけドラッグされることを防ぐ
                dom.appendChild(img);
                
                let deleteBtn = document.createElement('span');
                deleteBtn.className = "delete-btn";
                deleteBtn.textContent = "×";
                dom.appendChild(deleteBtn);

                deleteBtn.addEventListener('click', function(){

                    if(confirm("[" + item.itemName + "]" + "を削除しますか？")){
                        // 削除
                        const targetItemId = item.itemId;
                        const targetFolderName = item.folderName;
                        
                    
                        // LocalStorageから削除
                        chrome.storage.local.get(["ichibaList"], function(result) {
                            const updatedList = result.ichibaList.filter(listItem => 
                                !(listItem.itemId === targetItemId && listItem.folderName === targetFolderName)
                            );
                            
                            chrome.storage.local.set({"ichibaList": updatedList}, function() {
                                // console.log("削除しました - itemId:", targetItemId, "folderName:", targetFolderName);
                            });
                        });

                        // DOMからも削除
                        dom.remove();
                    }
                });

                let infoBtn = document.createElement('span');
                infoBtn.className = "info-btn";
                infoBtn.textContent = "i";
                dom.appendChild(infoBtn);
                infoBtn.addEventListener('click', function(){showIchibaInfo(item.itemId, item.folderName)});

                let balloon = document.createElement('div');
                balloon.classList.add("balloon");
                balloon.classList.add("item-" + item.folderName + "-" + item.itemId);
                dom.appendChild(balloon);
                
                ichibaItemBox.appendChild(dom);

                img.addEventListener('click', async function(){
                    if(bIsDisableIchiba){
                        return;
                    }

                    // 放送ネタが禁止になっている配信では、「動画・生」タブのリクエストは禁止
                    if(_embeddedDataJson.programSuperichiba.programIsPermittedToRequestSpecificNeta === false && item.folderName === "quotation"){
                        showBalloon(item.folderName, item.itemId, "放送ネタが許可されていません");
                        return
                    }

                    const itemIcon = document.querySelector(".item.ichiba:has(.item-" + item.folderName + "-" + item.itemId + ") img");
                    itemIcon.classList.add("loading");


                    /*
                    以下のDOMから、"lv000000000" の部分を番組IDとして取得する。
                    <meta property="og:url" content="https://live.nicovideo.jp/watch/lv000000000"></meta>
                    */
                    const programId = "lv" + document.querySelector('meta[property="og:url"]').getAttribute("content").split("lv")[1].split("/")[0];

                    // console.log("--------------------------------");
                    // console.log("クリックされました！");
                    // console.log("folderName:", item.folderName);
                    // console.log("itemId:", item.itemId);
                    // console.log("programId:", programId);

                    // アイテムをリクエスト
                    const bIsSuccess = await requestIchibaItem(programId, item.folderName, item.itemId);

                    if(bIsSuccess) {
                        addHistory(item);
                    }

                });
                
            });

            // 追加したアイテムはドラッグで並び替えできるようにする
            const items = document.querySelectorAll('#ext_ichiba_shortcut .item-box .item');
            // const dropbox = document.querySelector('#ext_ichiba_shortcut .item-box');
            let draggedElement = null;

            items.forEach(function(item){
                item.addEventListener('dragstart', function(event){
                    draggedElement = event.target;
                    event.target.classList.add('dragging');
                });
                
                item.addEventListener('dragend', function(event){
                    event.target.classList.remove('dragging');
                    draggedElement = null;
                });
            });

            ichibaItemBox.addEventListener('dragover', function(event){
                event.preventDefault();
                
                // ドロップ可能な位置を視覚的に示す
                const afterElement = getDragAfterElement(ichibaItemBox, event.clientX);
                const draggables = [...ichibaItemBox.querySelectorAll('.item:not(.dragging)')];
                
                // 既存のインジケーターを削除
                draggables.forEach(item => item.classList.remove('drag-after'));
                
                if (afterElement) {
                    afterElement.classList.add('drag-after');
                }
            });

            ichibaItemBox.addEventListener('drop', function(event){
                event.preventDefault();
                
                if (!draggedElement) return;
                
                // ドロップ位置を計算
                const afterElement = getDragAfterElement(ichibaItemBox, event.clientX);
                
                if (afterElement == null) {
                    // 末尾に挿入
                    ichibaItemBox.appendChild(draggedElement);
                } else {
                    // 指定した要素の前に挿入
                    ichibaItemBox.insertBefore(draggedElement, afterElement);
                }
                
                // 視覚的インジケーターをクリア
                [...ichibaItemBox.querySelectorAll('.item')].forEach(item => 
                    item.classList.remove('drag-after')
                );
                
                // 新しい順序をLocalStorageに保存
                saveNewOrder();
            });

            // ドロップ位置の後ろにある要素を取得
            function getDragAfterElement(container, x) {
                const draggableElements = [...container.querySelectorAll('.item:not(.dragging)')];
                
                return draggableElements.reduce((closest, child) => {
                    const box = child.getBoundingClientRect();
                    const offset = x - box.left - box.width / 2;
                    
                    if (offset < 0 && offset > closest.offset) {
                        return { offset: offset, element: child };
                    } else {
                        return closest;
                    }
                }, { offset: Number.NEGATIVE_INFINITY }).element;
            }

            // 新しい順序をLocalStorageに保存
            function saveNewOrder() {
                const currentOrder = [...document.querySelectorAll('#ext_ichiba_shortcut .item-box .item')].map(item => {
                    return {
                        itemId: item.getAttribute('data-item-id'),
                        folderName: item.getAttribute('data-folder-name') // 必要に応じて追加
                    };
                });
                
                chrome.storage.local.get("ichibaList", function(value) {
                    if (value && value.ichibaList) {
                        // 新しい順序に合わせて配列を並び替え
                        const reorderedList = currentOrder.map(orderItem => {
                            return value.ichibaList.find(item => 
                                item.itemId === orderItem.itemId
                            );
                        }).filter(Boolean);
                        
                        chrome.storage.local.set({"ichibaList": reorderedList}, function() {
                            // console.log("順序を保存しました");
                        });
                    }
                });
            }
        } else {
            ichibaItemBox.textContent = "ここにゲームが登録されます。リクエスト済みのゲームをクリックするとショートカットに登録できます。";
        }
    });
}




function extShowLoading() {
    const gameBox = document.querySelector("#ext_ichiba_info .game-box");
    gameBox.classList.add("hide");
    const gameInfoBox = document.querySelector("#ext_ichiba_info .game-info-box");
    gameInfoBox.classList.add("hide");
    const authorBox = document.querySelector("#ext_ichiba_info .author-box");
    authorBox.classList.add("hide");
    const descriptionBox = document.querySelector("#ext_ichiba_info .description-box");
    descriptionBox.classList.add("hide");
    const prPhotoBox = document.querySelector("#ext_ichiba_info .pr-photo-box");
    prPhotoBox.classList.add("hide");

    const loadingBox = document.querySelector("#ext_ichiba_info .loading-box");
    loadingBox.classList.add("show");
}

function extHideLoading() {
    const gameBox = document.querySelector("#ext_ichiba_info .game-box");
    gameBox.classList.remove("hide");
    const gameInfoBox = document.querySelector("#ext_ichiba_info .game-info-box");
    gameInfoBox.classList.remove("hide");
    const authorBox = document.querySelector("#ext_ichiba_info .author-box");
    authorBox.classList.remove("hide");
    const descriptionBox = document.querySelector("#ext_ichiba_info .description-box");
    descriptionBox.classList.remove("hide");
    //const prPhotoBox = document.querySelector("#ext_ichiba_info .pr-photo-box");
    //prPhotoBox.classList.remove("hide");

    const loadingBox = document.querySelector("#ext_ichiba_info .loading-box");
    loadingBox.classList.remove("show");
}

// ゲームの詳細情報を映像画面に表示
async function showIchibaInfo(itemId, folderName){

    const extIchibaInfo = document.querySelector("#ext_ichiba_info");

    // 既に同じアイテムが表示されている場合は、表示を解除
    if(extIchibaInfo.classList.contains("show")){
        if(extIchibaInfo.getAttribute("data-item-id") === folderName + "-" + itemId){
            extIchibaInfo.classList.remove("show");
            return;
        }
    }

    // ローディングを表示
    extShowLoading();

    // 情報ウインドウの位置と高さを設定
    const  playerHeight = document.querySelector('[class^=___player-display-screen___]').clientHeight * 0.9;
    const playerController = document.querySelector('[class^=___player-controller___]');
    extIchibaInfo.style.bottom = playerController.clientHeight + "px";
    extIchibaInfo.style.maxHeight = playerHeight + "px";


    // 表示する
    extIchibaInfo.classList.add("show");


    extIchibaInfo.setAttribute("data-item-id", folderName + "-" + itemId);

    // Product情報を取得
    // console.log("Product情報を取得します");
    const product = await getIchibaProductInfo(folderName, itemId, _embeddedDataJson.program.nicoliveProgramId);
    // console.log(product);


    
    let service;
    let game;
    let owner;

    // 投稿ゲームの場合
    if(product.data.categoryName == "akasha"){
        // Service情報を取得
        // console.log("Service情報を取得します");
        service = await getIchibaServiceInfo(folderName, itemId, _embeddedDataJson.program.nicoliveProgramId);
        // console.log(service);

        // 作者が非表示(HIDDEN)状態にしているゲームはゲームページが存在しないので、ゲーム情報を取得できない
        // "HIDDEN"...非公開状態（でも作者は起動できる）
        // "USABLE"...通常公開状態
        // "ONLY_PREMIUM_USER"...プレミアム会員のみ起動可能？
        // "DUPLICATED"...現在リクエスト済み？
        if(product.data.usableState !== "HIDDEN") {
            // Game情報を取得
            // console.log("Game情報を取得します");
            game = await getIchibaGameInfo(service.data.content.originContentId);
            // console.log(game);
        }

        // Owner情報を取得
        // console.log("Owner情報を取得します");
        owner = await getOwner(product.data.id);
        // console.log(owner);

    }


    /*--------------------------------
    // ゲーム情報
    --------------------------------*/

    const gameBox = document.querySelector("#ext_ichiba_info .game-box");
    gameBox.innerHTML = '<div class="left"></div><div class="right"></div></div>';

    const left = document.querySelector("#ext_ichiba_info .game-box .left");
    const leftImg = document.createElement('img');
    leftImg.src = product.data.thumbnailUrl;
    left.appendChild(leftImg);

    const right = document.querySelector("#ext_ichiba_info .game-box .right");
    const title = document.createElement('div');
    title.innerText = product.data.title;
    right.appendChild(title);

    
    if(game) {
        const count = document.querySelector("#ext_ichiba_info .game-info-box .count");
        count.innerText = "起動回数：" + game.playCount + "回";
        const refCount = document.querySelector("#ext_ichiba_info .game-info-box .refCount");

        // 参照カウントの数字を3桁区切りにして表示
        const refCountText = product.data.refCount.toLocaleString();
        refCount.innerText = "親作品登録：" + refCountText + "件";

        const updateDate = document.querySelector("#ext_ichiba_info .game-info-box .update-date");
        updateDate.innerText = "更新日時：" + game.updateDate;

        if(game.prPhotoUrl) {
            document.querySelector("#ext_ichiba_info .pr-photo-box").classList.remove("hide");
            const prPhoto = document.querySelector("#ext_ichiba_info .pr-photo-box img");
            prPhoto.src = game.prPhotoUrl;
        } else {
            const prPhoto = document.querySelector("#ext_ichiba_info .pr-photo-box");
            prPhoto.classList.add("hide");
        }
    }
    
    


    /*--------------------------------
    // 作者情報
    --------------------------------*/
    const authorBox = document.querySelector("#ext_ichiba_info .author-box");

    if(owner && owner.meta.status === 200) {
        authorBox.classList.remove("hide");

        // 作者のアイコン
        const authorIcon = document.querySelector("#ext_ichiba_info .author-box .left img");
        authorIcon.src = owner.data.niconicoUserInfo.icons.urls["150x150"] || owner.data.niconicoUserInfo.icons.urls["50x50"];
        authorIcon.alt = owner.data.niconicoUserInfo.nickName;

        // 作者の名前
        const authorName = document.querySelector("#ext_ichiba_info .author-box .author-name");
        authorName.href = "https://www.nicovideo.jp/user/" + owner.data.niconicoUserInfo.id;
        authorName.innerText = owner.data.displayName;

        // 作者のレベル
        const authorLevel = document.querySelector("#ext_ichiba_info .author-box .level");
        authorLevel.innerText = "Lv." + owner.data.niconicoUserInfo.level;

        // 作者の他のゲームを見る
        const moreInfo = document.querySelector("#ext_ichiba_info .author-box .more-info");
        moreInfo.href = "https://namagame.coe.nicovideo.jp/users/" + owner.data.niconicoUserInfo.id + "/games";
        moreInfo.innerText = "この作者の他のゲームを見る";

    }

    // console.log("説明" + product.data.description);
    const descriptionBox = document.querySelector("#ext_ichiba_info .description-box");
    descriptionBox.innerText = product.data.description;


    // ローディングを非表示
    extHideLoading();

    // 作者情報が取得できなかった場合は最後に非表示
    if(!owner || owner.meta.status != 200) {
        authorBox.classList.add("hide");
    }
    // ゲーム情報が取得できなかった場合は最後に非表示
    if(!game) {
        const gameInfoBox = document.querySelector("#ext_ichiba_info .game-info-box");
        gameInfoBox.classList.add("hide");
    }
}


// ゲームの詳細情報をゲームランチャーに表示
async function showIchibaInfoToGameLauncher(item, folderName){
    
    const category = item.getAttribute("data-category");
    const itemId = item.getAttribute("data-id");
    const serviceProductId = item.getAttribute("data-service-product-id");
    let authorId = item.getAttribute("data-author-id");
    const bIsTopTab = item.closest(".screen").getAttribute("data-hemo-game-tab") === "top";
    const bIsScoreTab = item.closest(".screen").getAttribute("data-hemo-game-tab") === "score";

    // 既に同じアイテムが表示されている場合は、表示を解除
    /*
    if(extIchibaInfo.classList.contains("show")){
        if(extIchibaInfo.getAttribute("data-item-id") === folderName + "-" + itemId){
            extIchibaInfo.classList.remove("show");
            return;
        }
    }
    */

    // ローディングを表示
    // extShowLoading();

    // Product情報を取得
    // console.log("Product情報を取得します");
    let product;
    if(category === "official") {
        product = await getIchibaProductInfo(folderName, serviceProductId, _embeddedDataJson.program.nicoliveProgramId);
    } else {
        product = await getIchibaProductInfo(folderName, itemId, _embeddedDataJson.program.nicoliveProgramId);
    }
    // console.log(product);



    let service;
    let game;
    let owner;

    // 投稿ゲームの場合
    if(product.data.categoryName == "akasha"){
        // Service情報を取得
        // console.log("Service情報を取得します");
        service = await getIchibaServiceInfo(folderName, itemId, _embeddedDataJson.program.nicoliveProgramId);
        // console.log(service);

        // 作者が非表示(HIDDEN)状態にしているゲームはゲームページが存在しないので、ゲーム情報を取得できない
        // "HIDDEN"...非公開状態（でも作者は起動できる）
        // "USABLE"...通常公開状態
        // "ONLY_PREMIUM_USER"...プレミアム会員のみ起動可能？
        // "DUPLICATED"...？
        if(product.data.usableState !== "HIDDEN") {
            // Game情報を取得
            // console.log("Game情報を取得します");
            game = await getIchibaGameInfo(service.data.content.originContentId);
            // console.log(game);
        }

        // Owner情報を取得
        // console.log("Owner情報を取得します");
        owner = await getOwner(product.data.id);
        // console.log(owner);

    }


    /*--------------------------------
    // ゲーム情報
    --------------------------------*/

    const thumbnailUrl = DOMPurify.sanitize(product.data.thumbnailUrl);
    const title = DOMPurify.sanitize(product.data.title);
    const description = DOMPurify.sanitize(product.data.description.replace(/\n/g, '<br>'));
    let playCount = "";
    let refCount = "";
    let updateDate = "";
    let prPhotoUrl = "";
    let authorIcon = "";
    let authorIconName = "";
    let authorName = "";
    let authorPageUrl = "";
    let authorGamePageUrl = "";
    let authorLevel = "";

    if(game) {
        playCount = game.playCount;
        refCount = product.data.refCount.toLocaleString();
        updateDate = game.updateDate;

        if(game.prPhotoUrl) {
            prPhotoUrl = game.prPhotoUrl;
        }
    }

    /*--------------------------------
    // 作者情報
    --------------------------------*/
    if(owner && owner.meta.status === 200) {
        //authorBox.classList.remove("hide");

        // アカウントによってはniconicoUserInfoが存在しない場合がある
        if(owner.data.niconicoUserInfo){

            // 作者のアイコン
            authorIcon = owner.data.niconicoUserInfo.icons.urls["150x150"] || owner.data.niconicoUserInfo.icons.urls["50x50"];
            authorIconName = DOMPurify.sanitize(owner.data.niconicoUserInfo.nickName);
        
            // 作者のレベル
            authorLevel = owner.data.niconicoUserInfo.level;

            // 作者のID
            authorId = owner.data.niconicoUserInfo.id;

        }

        // 作者の名前
        authorName = DOMPurify.sanitize(owner.data.displayName);
    }

    // 作者のユーザーページ
    authorPageUrl= "https://www.nicovideo.jp/user/" + authorId;

    // 作者の他のゲームを見る
    authorGamePageUrl = "https://namagame.coe.nicovideo.jp/users/" + authorId + "/games";

    let scoreHtml = "";
    if(bIsScoreTab) {
        // ストレージから該当のゲームのスコアを取得
        const scoreListKey = `scoreList`;
        const getScoreList = await chrome.storage.local.get([scoreListKey]);
        let scoreList = getScoreList[scoreListKey] || [];
        const scoreItem = scoreList.find(item => item.category === category && item.id === itemId);
        if(scoreItem) {
            scoreItem.scores.forEach(item => {
                scoreHtml += `
                <div class="score-item">
                    <div class="score">${item.point.toLocaleString()}<span>point</span></div>
                    <div class="date">${item.date.split("T")[0].replace(/-/g, "/")} ${item.date.split("T")[1].split(":")[0] + ":" + item.date.split("T")[1].split(":")[1]}</div>
                </div>
                `;
            });
        }
    }

    let insertHtml = "";
    if(folderName == "akasha") {
        insertHtml = `
            <div class="game-box">
                <div class="left">
                    <img src="${thumbnailUrl}">
                </div>
                <div class="right">
                    <div>${title}</div>
                </div>
            </div>
            <div class="score-box">
                ${scoreHtml}
            </div>
            <div class="game-info-box">
                <div class="count">起動回数：${playCount}回</div>
                <div class="refCount">親作品登録：${refCount}件</div>
                <div class="update-date">更新日時：${updateDate}</div>
            </div>
            <div class="author-box">
                <div class="left">
                    <img src="${authorIcon}" alt="${authorIconName}">
                </div>
                <div class="right">
                    <span class="level">Lv.${authorLevel}</span>
                    <a class="author-name" href="${authorPageUrl}" target="_blank">${authorName}</a>
                    <a class="more-info" href="${authorGamePageUrl}" target="_blank">作者の他のゲームを見る</a>
                    <div class="addShortcutBtn" data-itemId="${itemId}" data-folderName="${folderName}" data-itemIcon="${thumbnailUrl}" data-itemName="${title}">ショートカットに追加</div>
                    <div class="addNgBtn ${bIsTopTab ? " hide" : ""}" data-authorName="${authorName}" data-authorId="${authorId}">作者の作品を全てNG登録</div>
                    <div class="disableNgBtn ${bIsTopTab ? " show" : ""}">[トップ]タブではNG機能は利用できません</div>
                </div>
            </div>
            <div class="pr-photo-box">
                <img src="${prPhotoUrl}">
            </div>
            <div class="description-box">
                ${description}
            </div>
        `;
    } else {
        insertHtml = `
            <div class="game-box">
                <div class="left">
                    <img src="${thumbnailUrl}">
                </div>
                <div class="right">
                    <div>${title}</div>
                </div>
            </div>
            <div class="score-box">
                ${scoreHtml}
            </div>
            <div class="game-info-box">
                <div class="refCount">親作品登録：${product.data.refCount.toLocaleString()}件</div>
            </div>
            <div class="author-box">
                <div class="left">
                </div>
                <div class="right">
                    <div class="addShortcutBtn" data-itemId="${serviceProductId}" data-folderName="${folderName}" data-itemIcon="${thumbnailUrl}" data-itemName="${title}">ショートカットに追加</div>
                </div>
            </div>
            <div class="description-box">
                ${description}
            </div>
        `;
    }


    // 自作ゲーム画面、お気に入り画面など、ゲーム詳細情報を表示する画面のDOMを取得
    const parentElement = item.closest(".screen").querySelector(".content-right");

    // 現在表示している画面のゲーム詳細情報ペインを更新
    parentElement.innerHTML = insertHtml;

    return;

}


// MARK:通信：ゲームのリクエストを実行
async function requestIchibaItem(programId, folderName, itemId) {

    console.log("--------------------------------");
    console.log(_embeddedDataJson);
    
    const frontendId = getFrontendId();
    const frontendVersion = getFrontendVersion();

    const itemIcon = document.querySelector(".item.ichiba:has(.item-" + folderName + "-" + itemId + ") img");
    itemIcon?.classList.add("loading");

    // 番組グレードを取得するまえに自分の権限を取得（しとかないと番組グレードが正しく取得できないっぽい？）
    const authority = await getSelfAuthority(programId);

    // 番組グレードを取得
    const grade = await getGrade(programId);
    if(!grade || grade.meta.status != 200) {
        console.error("番組グレードを取得できませんでした");
        return false;
    }
    console.log("番組グレード:", grade.data.programGrade);


    const url = "https://eapi.spi.nicovideo.jp/v1/ichibas/" + programId + "/products";

    // POSTリクエストの場合は、メソッドをPOSTに、ボディを指定する（但し_fetchOptionsは修正しない）
    //const options = {..._fetchOptions};
    const options = await getDynamicFetchOptions();

    options.method = "POST";
    options.body = "{\"serviceName\":\"" + folderName 
    + "\",\"serviceProductId\":\"" + itemId 
    + "\",\"frontendId\":" + frontendId 
    + ",\"frontendVersion\":\"" + frontendVersion 
    + "\",\"expectedGrade\":" + grade.data.programGrade + "}";

    
    try {
        // fetchリクエストを送信し、サーバーからの応答を待つ
        const response = await fetch(url, options);

        // response.ok はステータスコードが200-299の範囲にあるかを示す
        // falseの場合、サーバーがエラーを返したことを意味する
        if (!response.ok) {
            console.error(`HTTPエラーが発生しました: ${response.status} ${response.statusText}`);
            
            let errorBody;
            try {
                // エラーレスポンスの本体をJSONとして解析試行
                errorBody = await response.json();
            } catch (e) {
                // JSONでなければテキストとして取得
                errorBody = await response.text();
            }
            
            // サーバーから返されたエラーの詳細をコンソールに表示
            console.error("サーバーからのエラー詳細:", errorBody);



            let errorMessage = "リクエストに失敗しました";
            // console.log("エラーコード: ", errorBody.meta.errorCode);
            switch(errorBody.meta.errorCode) {
                case "NO_REMAINING_USE_RIGHT":

                    const authority = await getSelfAuthority(programId);
                    // 秒数から、n分m秒を取得
                    const minutes = Math.floor(authority.data.cooldownTime / 60);
                    const seconds = authority.data.cooldownTime % 60;
                    errorMessage =  "残り " + minutes + "分" + seconds + "秒 待機が必要です";
                    
                    setIchibaWaitTime(minutes, seconds);
                    break;
                case "ITEM_ALREADY_EXISTS":
                    errorMessage = "既にリクエストされています";
                    break;
                case "BAD_REQUEST":
                    // タイムシフトの配信を見ているときにも発生するエラー
                    errorMessage = "リクエストに失敗しました";
                    break;
                case "NOT_PREMIUM_USER":
                    errorMessage = "プレミアム会員が必要です";
                    break;
                case "GRADE_HAS_CHANGED":
                    errorMessage = "グレードが変更されました";
                    break;
                case "NOT_FOUND":
                    errorMessage = "アイテムが見つかりません";
                    break;
                case "ITEM_NOT_FOUND":
                    errorMessage = "アイテムが見つかりません";
                    break;
            }

            // balloonにエラーメッセージを表示
            showBalloon(folderName, itemId, errorMessage);

            itemIcon?.classList.remove("loading");
            
            // エラーなのでここで処理を中断
            return false; 
        }

        // 通信が成功した場合、応答をJSONとして解析
        const data = await response.json();
        // console.log("成功:", data);

        // balloonに成功メッセージを表示
        showBalloon(folderName, itemId, "リクエストしました");

        itemIcon?.classList.remove("loading");

        // 番組グレードを取得し、次のリクエストまでの時間を取得して表示しておく
        const gradeData = await getGrade(programId);
        // 次のリクエストまでの時間を取得して表示しておく
        const minutes = Math.floor(gradeData.data.freezeTime / 60);
        const seconds = gradeData.data.freezeTime % 60;    
        setIchibaWaitTime(minutes, seconds);

        return true;

    } catch (networkError) {
        // ネットワーク接続の問題やCORSエラーなど、通信自体が失敗した場合
        console.error("通信エラー:", networkError);
        itemIcon?.classList.remove("loading");
        return false;
    }
}


// MARK: バルーンを表示
function showBalloon(folderName, itemId, message) {
    const balloons = document.querySelectorAll("#ext_ichiba_shortcut .balloon.item-" + folderName + "-" + itemId);
    const balloonsInLauncher = document.querySelectorAll("#ext_nico_game_launcher .balloon.item-" + folderName + "-" + itemId);
    
    if(balloons.length > 0) {
        balloons.forEach(balloon => {
            balloon.textContent = message;
            balloon.classList.add("show");
        });
    }
    if(balloonsInLauncher.length > 0) {
        balloonsInLauncher.forEach(balloon => {
            balloon.textContent = message;
            balloon.classList.add("show");
        });
    }

    // 数ミリ秒後に非表示
    setTimeout(function(){
        if(balloons.length > 0) {
            balloons.forEach(balloon => {
                balloon.classList.remove("show");
                balloon.style.pointerEvents = "none";
            });
        }
    }, 900);

    setTimeout(function(){
        if(balloonsInLauncher.length > 0) {
            balloonsInLauncher.forEach(balloon => {
                balloon.classList.remove("show");
                balloon.style.pointerEvents = "none";
            });
        }
    }, 1400);

}


// MARK: 通信：ゲームの詳細情報を取得
async function getIchibaGameInfo(lgId) {

    // 以下のURLからHTMLを取得して特定のタグのテキストを取得する
    // https://namagame.coe.nicovideo.jp/games/lg0000

    const url = "https://namagame.coe.nicovideo.jp/games/" + lgId;
    const response = await fetch(url);
    
    if (!response.ok) {
        console.error(`HTTPエラーが発生しました: ${response.status} ${response.statusText}`);
       return {};
    }

    // 通信が成功した場合、DOMを解析してデータを取得
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const playCount = doc.querySelectorAll(".latest-game-information-value")[0]; // 起動回数
    const updateDate = doc.querySelectorAll(".latest-game-information-value")[2]; // 更新日時

    let prPhotoUrl = "";
    const prPhoto =doc.querySelector(".promotion-photos-area img");
    if(prPhoto){
        prPhotoUrl = prPhoto.src;
    }

    let data = {
        playCount: playCount ? playCount.innerText : "",
        updateDate: updateDate ? updateDate.innerText : "",
        prPhotoUrl: prPhotoUrl || ""
    };

    if(!playCount) {
        // console.log("ゲームのネタ詳細ページが非公開か削除されたようです");
        data = null;
    }
    
    return data;
}

// MARK: 通信：トピックス情報を取得
async function getIchibaTopic() {
    const url = "https://eapi.spi.nicovideo.jp/v1/topics";
    return runCommonFetch(url, await getDynamicFetchOptions());
}

// MARK: 通信：公式ゲームの一覧を取得
async function getOfficalGameList(programId, section) {    
    const url = "https://eapi.spi.nicovideo.jp/v2/contents/" + programId + "/sections/" + section;
    //return runCommonFetch(url, _fetchOptions);
    return runCommonFetch(url, await getDynamicFetchOptions());
}


// MARK: 通信：配信における自分の権限を取得
async function getSelfAuthority(programId) {
    const url = "https://eapi.spi.nicovideo.jp/v1/users/self/authority?contentId=" + programId;
    return runCommonFetch(url, await getDynamicFetchOptions());
}


// MARK: 通信：番組グレード情報を取得
async function getGrade(programId) {
    const url = "https://eapi.spi.nicovideo.jp/v1/contents/" + programId + "/grade";
    return runCommonFetch(url, await getDynamicFetchOptions());
}


// MARK: 通信：サービス情報を取得
async function getIchibaServiceInfo(folderName, itemId, programId) {
    const url ="https://services-eapi.spi.nicovideo.jp/v1/services/" + folderName + "/services/program/programs/" + programId + "/contents/" + itemId;
    return runCommonFetch(url, await getDynamicFetchOptions());
}


// MARK: 通信：オーナー情報を取得
async function getOwner(ownerId) {
    const url = "https://eapi.spi.nicovideo.jp/v2/products/products/" + ownerId + "/owner";
    return runCommonFetch(url, await getDynamicFetchOptions());
}


// MARK: 通信：ゲームの詳細情報を取得
async function getIchibaProductInfo(folderName, itemId, programId) {
    const url =  "https://eapi.spi.nicovideo.jp/v2/services/" + folderName + "/products/" + itemId + "?exclude_registered=false&tmp_page_id=detail&contentId=" + programId;
    return runCommonFetch(url, await getDynamicFetchOptions());
}


// MARK: 通信：自作ゲームの一覧を取得
async function getUserGameList(nicoliveProgramId, keyword, sortKey, sortOrder, limit, offset, fixedTag){
    let url = "https://services-eapi.spi.nicovideo.jp/v1/services/akasha/services/content/contents?programID=" + nicoliveProgramId +"&sortKey=" + sortKey + "&sortOrder=" + sortOrder + "&limit=" + limit + "&offset=" + offset + "&fixedTag=" + fixedTag;
    if(keyword) {
        url += "&keyword=" + keyword;
    }
    return runCommonFetch(url, await getDynamicFetchOptions());
}


// MARK: 通信：履歴情報を取得
async function getIchibaUseHistory(itemId) {
    const url =  "https://eapi.spi.nicovideo.jp/v2/use_histories/self?contentId=" + itemId;
    return runCommonFetch(url, await getDynamicFetchOptions());
}


// MARK: 通信：トップセクションの情報を取得
async function getTopSection(programId) {
    const url = "https://eapi.spi.nicovideo.jp/v2/contents/" + programId + "/sections/top";
    return runCommonFetch(url, await getDynamicFetchOptions());
}


// MARK: 通信：共通処理
async function runCommonFetch(url, options){
    const response = await fetch(url, options);

    // response.ok はステータスコードが200-299の範囲にあるかを示す
    // falseの場合、サーバーがエラーを返したことを意味する
    if (!response.ok) {
        console.error(`HTTPエラーが発生しました: ${response.status} ${response.statusText}`);
        let errorBody;
        try {
            // エラーレスポンスの本体をJSONとして解析試行
            errorBody = await response.json();
        } catch (e) {
            // JSONでなければテキストとして取得
            errorBody = await response.text();
        }
        
        // サーバーから返されたエラーの詳細をコンソールに表示
        console.error("サーバーからのエラー詳細:", errorBody);
        return errorBody; 
    }

    // 通信が成功した場合、応答をJSONとして解析
    const data = await response.json();

    return data;
}


let _ichibaInterval = null;


function setIchibaWaitTime(minutes, seconds) {
    if(_ichibaInterval) {
        clearInterval(_ichibaInterval);
        _ichibaInterval = null;
    }

    const waitTime = document.querySelector('#ext_ichiba_shortcut .time-box');
    waitTime.innerText = "次のリクエストまで\n残り" + minutes + "分" + seconds + "秒";

    const watiTimeInLauncher = document.querySelector('#ext_nico_game_launcher .time-box');
    if(watiTimeInLauncher) { watiTimeInLauncher.innerText = "次のリクエストまで 残り" + minutes + "分" + seconds + "秒" };

    // 受け取った分と秒数を1秒毎にカウントダウンさせて表示する
    let count = minutes * 60 + seconds;
    _ichibaInterval = setInterval(function() {
        count--;
        waitTime.innerText = "次のリクエストまで\n残り" + Math.floor(count / 60) + "分" + count % 60 + "秒";
        if(watiTimeInLauncher) { watiTimeInLauncher.innerText = "次のリクエストまで 残り" + Math.floor(count / 60) + "分" + count % 60 + "秒" };
        if(count <= 0) {
            clearInterval(_ichibaInterval);
            _ichibaInterval = null;
            waitTime.innerText = "リクエストが可能です";
            if(watiTimeInLauncher) { watiTimeInLauncher.innerText = "リクエストが可能です" };
        }
    }, 1000);
}

let _bIsFirstShowGameLauncher = true;

// MARK: イベント設定
function setEventGameLauncher() {
    const overlay = document.querySelector("#ext_nico_game_launcher_overlay");
    const gameLauncher = document.querySelector("#ext_game_launcher_btn");

    // ランチャー起動ボタン
    gameLauncher.addEventListener("click", async function() {
        overlay.classList.toggle("show");
        document.querySelector("body").style.overflow = "hidden";

        // 最初の表示だったらトップセクションを表示
        if(_bIsFirstShowGameLauncher) {
            _bIsFirstShowGameLauncher = false;
            await viewTopSection();

            // トップの一覧のアイテムをクリック
            const topItemLists = document.querySelectorAll("#ext_nico_game_launcher .screen[data-hemo-game-tab='top'] .item-list");
            topItemLists.forEach(function(topItemList) {
                topItemList.addEventListener("click", itemClick);
            });
        }
    });

    // オーバーレイ
    overlay.addEventListener("click", function(e) {
        // クリックされた要素（event.target）が、
        // イベントリスナーを設定した要素（overlay）自身であった場合
        if (e.target === overlay) {
            // showクラスを削除する
            overlay.classList.remove('show');
            document.querySelector("body").style.overflow = "auto";
        }
    });


    // タブのリスト
    const tabList = document.querySelector("#ext_nico_game_launcher .tab-list");
    tabList.addEventListener("click", function(e) {
        
        // タブをクリックしたら、タブのアクティブクラスを追加する
        const tab = e.target;
        tabList.querySelectorAll(".tab-item").forEach(function(tab) {
            tab.classList.remove("active");
        });
        tab.classList.add("active");

        // 表示する画面を切り替える
        const screens = document.querySelectorAll("#ext_nico_game_launcher .screen");
        screens.forEach(function(screen) {
            screen.classList.remove("active");
        });
        const currentTabId = tab.getAttribute("data-hemo-game-tab");
        const screen = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='" + currentTabId + "']");
        screen?.classList?.add("active");

        // 画面が切り替わったら、データを取得
        switch(currentTabId) {
            case "top":
                viewTopSection();
                break;
            case "official":
                viewOfficalGameList();
                break;
            case "user":
                viewUserGameList(false);
                break;
            case "bookmark":
                viewBookmarkList();
                break;
            case "history":
                viewUseHistoryList();
                break;
            case "score":
                viewScoreList();
                break;    
            case "nglist":
                viewNgList();
                break;
        }
    });




    // タブのリスト
    const categoryLists = document.querySelectorAll("#HemoOfficialScreen .category-list");
    categoryLists.forEach(function(categoryList) {
        const categoryItems = categoryList.querySelectorAll(".category-item");
        categoryItems.forEach(function(categoryItem) {
            categoryItem.addEventListener("click", function(e) {
                categoryList.querySelectorAll(".category-item").forEach(function(categoryItem) {
                    categoryItem.classList.remove("active");
                });
                categoryItem.classList.add("active");

                const category = categoryItem.getAttribute("data-hemo-category");
                const parentBox = categoryItem.closest(".box");
                const itemLists = parentBox.querySelectorAll(".item-list");
                itemLists.forEach(function(itemList) {
                    itemList.classList.remove("active");
                });
                const itemList = parentBox.querySelector(".item-list[data-hemo-category='" + category + "']");
                itemList.classList.add("active");
                viewOfficalGameList();

            });
        });
    });

    // 自作ゲーム画面のフィルター（フリーワード）
    const keywordContainer = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .search-box #hemo-gamelauncher-keyword");
    keywordContainer.addEventListener("keydown", function(event) {
        // Enterキーが押されたら、フィルターを適用
        if (event.key === "Enter") {
            
            // 日本語入力変換中のEnterキー操作を無視する（推奨）
            if (event.isComposing) {
                return;
            }

            // デフォルトのEnterキーの動作（フォーム送信など）をキャンセル
            event.preventDefault();

            // フィルターを適用
            viewUserGameList(true);
        }
    });

    // 自作ゲーム画面のフィルター(並び順)
    const sortTypeContainer = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .search-box .radio-group.sort-type");
    sortTypeContainer.addEventListener("change", function(event) {

        // イベントの発生元が目的のラジオボタンかを確認
        if (event.target.name === 'sort_type') {            
            // フィルターを適用
            viewUserGameList(true);
        }
    });

    // 自作ゲーム画面のフィルター(ゲームタイプ)
    const gametypeContainer = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .search-box .radio-group.game-type");
    gametypeContainer.addEventListener("change", function(event) {

        // イベントの発生元が目的のラジオボタンかを確認
        if (event.target.name === 'fixedTag') {
            // フィルターを適用
            viewUserGameList(true);
        }
    });

    async function itemClick(e) {

        // .dummyの場合は何もしない
        if(e.target.classList.contains('dummy')) {
            return;
        }

        const tab = e.target.closest('.screen');
        const tabId = tab?.getAttribute("data-hemo-game-tab");
        const screen = e.target.closest('.screen');
        const itemElement = e.target.closest('.item');
        const serviceName = itemElement.getAttribute("data-service-name");
        const category = itemElement.getAttribute("data-category");
        const itemId = itemElement.getAttribute("data-id");
        const serviceProductId = itemElement.getAttribute("data-service-product-id");

        if(itemElement) {
            
            if(e.target.classList.contains('bookmarkAdd') || e.target.closest('.bookmarkAdd')) {

                // ブックマークボタンがクリックされた
                if(itemElement.classList.contains('bookmarked')) {
                    // console.log("ブックマークから削除");
                    await removeBookmark(itemElement);
                    
                    // お気に入りタブを開いている場合は一覧を更新
                    if(tabId === 'bookmark') {
                        viewBookmarkList();
                    }
                } else {
                    // console.log("ブックマークを追加");
                    addBookmark(itemElement);    
                }
                return;

            } else  if(e.target.classList.contains('requestBtn')) {

                // リクエストボタンがクリックされた
                let bIsSuccess = false;
                if(category === "official") {
                    bIsSuccess = await requestIchibaItem(_embeddedDataJson.program.nicoliveProgramId, serviceName, serviceProductId);
                } else {
                    bIsSuccess = await requestIchibaItem(_embeddedDataJson.program.nicoliveProgramId, serviceName, itemId);
                }

                if(bIsSuccess) {
                    addHistory(itemElement);
                }

                return;

            } else {            
                // アイテム本体がクリックされた
                showIchibaInfoToGameLauncher(itemElement, serviceName);
                screen.querySelectorAll(".item.active").forEach(function(item) {
                    item.classList.remove("active");
                });
                itemElement.classList.add("active");
            }
        }
    }



    // 自作ゲーム一覧のアイテムをクリック
    const officalItemLists = document.querySelectorAll("#ext_nico_game_launcher .screen[data-hemo-game-tab='official'] .item-list");
    officalItemLists.forEach(function(officalItemList) {
        officalItemList.addEventListener("click", itemClick);
    });

    // 自作ゲーム一覧のアイテムをクリック
    const itemList = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .item-list");
    itemList.addEventListener("click", itemClick);


    // お気に入りゲーム一覧のアイテムをクリック
    const itemListFromBookmarkListUser = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='bookmark'] .item-list[data-hemo-category='user']");
    itemListFromBookmarkListUser.addEventListener("click", itemClick);
    const itemListFromBookmarkListOfficial = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='bookmark'] .item-list[data-hemo-category='official']");
    itemListFromBookmarkListOfficial.addEventListener("click", itemClick);

    // 履歴のゲーム一覧のアイテムをクリック
    const itemListFromHistoryList = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='history'] .item-list");
    itemListFromHistoryList.addEventListener("click", itemClick);
    

    // スコアのゲーム一覧のアイテムをクリック
    const itemListFromScoreList = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='score'] .item-list");
    itemListFromScoreList.addEventListener("click", itemClick);
    

    async function infoBoxClick(e) {
        if(e.target.classList.contains('addShortcutBtn')) {

            const itemId = e.target.getAttribute("data-itemId");
            const folderName = e.target.getAttribute("data-folderName");
            const itemName = e.target.getAttribute("data-itemName");
            const itemIcon = e.target.getAttribute("data-itemIcon");

            if(!itemId || !folderName || !itemName || !itemIcon) {
                console.error("ショートカットに追加するためのデータが不足しています");
                return;
            }

            const resultMessage = await addIchibaShortcutDataToStorage(itemId, folderName, itemName, itemIcon);

            // 追加したアイテムを含めてアイコンを再表示
            addIchibaShortcutIcon();

            e.target.textContent = resultMessage;
            e.target.classList.add("disabled");
        }

        // .addNgBtnがクリックされたら、作者の作品を全てNG登録
        if(e.target.classList.contains('addNgBtn')) {

            const authorName = e.target.getAttribute("data-authorName");
            const authorId = e.target.getAttribute("data-authorId");

            if(!authorName || !authorId || authorId === "undefined") {
                alert("NG登録失敗！");
                console.error("NG登録するためのデータが不足しています");
                return;
            }

            //確認画面を表示
            if(confirm("NG登録を実行しますか？")){

                // 現在の日時
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth() + 1;
                const day = now.getDate();
                const hour = now.getHours();
                const minute = now.getMinutes();
                const second = now.getSeconds();
                const date = year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;

                // 拡張機能のストレージからNGリストを取得
                const getNgList = await chrome.storage.local.get(["ngList"]);

                // 拡張機能のストレージに保存する
                const ngList = getNgList.ngList || [];
                ngList.push({authorName: authorName, authorId: authorId, date: date});
                chrome.storage.local.set({"ngList": ngList}, function() {
                    
                    // 詳細情報を初期化
                    const itemInfo = e.target.closest(".content-right");
                    itemInfo.innerHTML = "";

                    // ゲーム一覧から作者の作品を全て非表示にする(.ngクラスを追加)
                    const ngItemList = document.querySelectorAll("#ext_nico_game_launcher .item-list .item[data-author-id='" + authorId + "']");
                    ngItemList.forEach(function(item) {
                        item.classList.add("ng");
                    });
                });
            }
        }
    }

    // トップ詳細情報内のクリック判定
    const itemInfoTop = document.querySelector("#HemoGameTopScreen .content-right");
    itemInfoTop.addEventListener("click", infoBoxClick);

    // 公式ゲーム詳細情報内のクリック判定
    const itemInfoOfficial = document.querySelector("#HemoOfficialScreen .content-right");
    itemInfoOfficial.addEventListener("click", infoBoxClick);

    // 自作ゲーム詳細情報内のクリック判定
    const itemInfoUser = document.querySelector("#HemoUserGameScreen .content-right");
    itemInfoUser.addEventListener("click", infoBoxClick);

    // お気に入り詳細情報内のクリック判定
    const itemInfoBookmark = document.querySelector("#HemoBookmarkScreen .content-right");
    itemInfoBookmark.addEventListener("click", infoBoxClick);

    // 履歴詳細情報内のクリック判定
    const itemInfoHistory = document.querySelector("#HemoUseHistoryScreen .content-right");
    itemInfoHistory.addEventListener("click", infoBoxClick);

    // スコア詳細情報内のクリック判定
    const itemInfoScore = document.querySelector("#HemoScoreScreen .content-right");
    itemInfoScore.addEventListener("click", infoBoxClick);

    // NGリストのクリック判定
    const ngList = document.querySelector("#HemoNgListScreen .ng-content table tbody");
    ngList.addEventListener("click", async function(e) {
        // .addNgBtnがクリックされたら、作者の作品を全てNG登録
        if(e.target.classList.contains('btn')) {

            // ダイアログで確認
            if(confirm("削除を実行しますか？")){

                const authorId = e.target.getAttribute("data-authorId");

                // 拡張機能のストレージからNGリストを取得
                const getNgList = await chrome.storage.local.get(["ngList"]);

                // 新しいNGリストを作成
                const newNgList = getNgList.ngList.filter(item => item.authorId !== authorId);

                // 拡張機能のストレージに保存する
                chrome.storage.local.set({"ngList": newNgList}, function() {
                    // NGリストを再表示
                    viewNgList();
                });
            }
        }        
    });
}


// MARK: ブックマークを追加
async function addBookmark(itemElement) {

    const category = itemElement.getAttribute("data-category");
    const bookmarkListKey = `bookmarkList-${category}`;

    const thumbnailUrl = itemElement.querySelector(".title-box img")?.src;
    const title = DOMPurify.sanitize(itemElement.querySelector(".title-box .title")?.innerText);
    const authorName = DOMPurify.sanitize(itemElement.querySelector(".author .author-name")?.innerText);
    let authorUserID = itemElement.getAttribute("data-author-id");
    const id = itemElement.getAttribute("data-id");
    let originContentID = itemElement.getAttribute("data-lg-id");
    const getBookmarkList = await chrome.storage.local.get([bookmarkListKey]);
    const bookmarkList = getBookmarkList[bookmarkListKey] || [];

    // 同じIDが既にブックマークされているかを確認
    const isBookmarked = bookmarkList.some(item => item.id === id);
    if(isBookmarked) {
        console.log("既にブックマークされています");
        return;
    }

    if(category === "official") {

        // 公式ゲームはserviceProductIdが有り
        const serviceProductId = itemElement.getAttribute("data-service-product-id");
        const author = itemElement.querySelector(".author .author-name")?.innerText; // 公式ゲームのAPIで取得するときと同じパラメーター名にしとく

        if(!category || !thumbnailUrl || !title || !author || !id || !serviceProductId) {
            console.error(`ブックマークに追加するためのデータが不足しています category: ${category}, thumbnailUrl: ${thumbnailUrl}, title: ${title}, author: ${author}, id: ${id}, serviceProductId: ${serviceProductId}`);
            return;
        }

        bookmarkList.push({category: category, thumbnailUrl: thumbnailUrl, title: title, author: author, id: id, serviceProductId: serviceProductId});
    }
    if(category === "user") {

        if(!originContentID) {
            const service = await getIchibaServiceInfo("akasha", id, _embeddedDataJson.program.nicoliveProgramId);
            // console.log(service);

            if(service && service.meta.status === 200) {
                originContentID = service.data.content.originContentId;
            } else {
                console.error("originContentIDを取得できませんでした");
            }
        }

        if(!authorUserID) {
            const product = await getIchibaProductInfo("akasha", id, _embeddedDataJson.program.nicoliveProgramId);
            const owner = await getOwner(product.data.id); // ProductIdを指定
            // console.log(owner);
            if(owner && owner.meta.status === 200) {
                authorUserID = owner.data.niconicoUserInfo.id;
            } else {
                console.error("authorUserIDを取得できませんでした");
            }
        }

        if(!category || !thumbnailUrl || !title || !authorName || !authorUserID || !id || !originContentID) {
            console.error(`ブックマークに追加するためのデータが不足しています category: ${category}, thumbnailUrl: ${thumbnailUrl}, title: ${title}, authorName: ${authorName}, authorUserID: ${authorUserID}, id: ${id}, originContentID: ${originContentID}`);
            return;
        }

        // serviceProductIdは無し
        bookmarkList.push({category: category, thumbnailUrl: thumbnailUrl, title: title, authorName: authorName, authorUserID: authorUserID, id: id, originContentID: originContentID});
    }
    await chrome.storage.local.set({[bookmarkListKey]: bookmarkList});
    itemElement.classList.add("bookmarked");
}

// MARK: ブックマークを削除
async function removeBookmark(itemElement) {
    const category = itemElement.getAttribute("data-category");
    const bookmarkListKey = `bookmarkList-${category}`;
    const id = itemElement.getAttribute("data-id");
    const getBookmarkList = await chrome.storage.local.get([bookmarkListKey]);
    const bookmarkList = getBookmarkList[bookmarkListKey] || [];
    const newBookmarkList = bookmarkList.filter(item => item.id !== id);
    await chrome.storage.local.set({[bookmarkListKey]: newBookmarkList});
    itemElement.classList.remove("bookmarked");
}


// MARK: 履歴に追加
async function addHistory(itemElement) {

    const category = itemElement.getAttribute("data-category");
    const historyListKey = `historyList`;

    const thumbnailUrl = itemElement.querySelector(".title-box img")?.src;
    const title = itemElement.querySelector(".title-box .title")?.innerText;
    const authorName = itemElement.querySelector(".author .author-name")?.innerText;
    const authorUserID = itemElement.getAttribute("data-author-id");
    const id = itemElement.getAttribute("data-id");
    const originContentID = itemElement.getAttribute("data-lg-id");
    const addDate = new Date().toISOString();
    const getHistoryList = await chrome.storage.local.get([historyListKey]);
    let historyList = getHistoryList[historyListKey] || [];

    // 同じカテゴリーと同じIDが既に履歴に追加されていれば古いのは削除する
    const isHistory = historyList.some(item => item.category === category && item.id === id);
    if(isHistory) {
        console.log("既に履歴に追加されています");
        historyList = historyList.filter(item => item.category !== category || item.id !== id);
    }

    // 履歴リストが30件を超えていればaddDateが古いものを1件削除する
    if(historyList.length >= 30) {
        historyList.sort(function(a, b) {
            return new Date(b.addDate) - new Date(a.addDate);
        });
        historyList.pop();
    }

    if(category === "official") {
        // 公式ゲームはserviceProductIdが有り
        const serviceProductId = itemElement.getAttribute("data-service-product-id");
        const author = itemElement.querySelector(".author .author-name")?.innerText; // 公式ゲームのAPIで取得するときと同じパラメーター名にしとく
        historyList.push({category: category, thumbnailUrl: thumbnailUrl, title: title,
            author: author, authorUserID: authorUserID, id: id,
            serviceProductId: serviceProductId, originContentID: originContentID, addDate: addDate});
    }
    if(category === "user") {
        // serviceProductIdは無し
        historyList.push({category: category, thumbnailUrl: thumbnailUrl, title: title,
            authorName: authorName, authorUserID: authorUserID, id: id, originContentID: originContentID, addDate: addDate});
    }

    await chrome.storage.local.set({[historyListKey]: historyList});
}


// MARK: トップセクションのデータを表示する
async function viewTopSection() {

    // ブックマーク状態を再チェックする（お気に入りタブでブックマークを解除したアイテムを反映させるため）
    const bookmarkedItemsList = document.querySelectorAll("#ext_nico_game_launcher .screen[data-hemo-game-tab='top'] .content-left .item-list .item.bookmarked");
    if(bookmarkedItemsList.length > 0) {
        // 一旦全てのブックマーク状態を解除
        bookmarkedItemsList.forEach(function(item) {
            item.classList.remove("bookmarked");
        });

        // [自作ゲーム]のブックマークリストを取得してブックマーク状態を反映
        const bookmarkListKeyUser = "bookmarkList-user";
        const bookmarkListUser = await chrome.storage.local.get([bookmarkListKeyUser]);
        const bookmarkListDataUser = bookmarkListUser[bookmarkListKeyUser] || [];
        
        bookmarkListDataUser.forEach(function(item) {
            const targetItems = document.querySelectorAll(".screen[data-hemo-game-tab='top'] .item[data-category='user'][data-id='" + item.id + "']");
            targetItems.forEach(function(item) {
                item.classList.add("bookmarked");
            });
        });

        // [公式ゲーム]のブックマークリストを取得してブックマーク状態を反映
        const bookmarkListKeyOfficial = "bookmarkList-official";
        const bookmarkListOfficial = await chrome.storage.local.get([bookmarkListKeyOfficial]);
        const bookmarkListDataOfficial = bookmarkListOfficial[bookmarkListKeyOfficial] || [];
        
        bookmarkListDataOfficial.forEach(function(item) {
            const targetItems = document.querySelectorAll(".screen[data-hemo-game-tab='top'] .item[data-category='official'][data-id='" + item.id + "']");
            targetItems.forEach(function(item) {
                item.classList.add("bookmarked");
            });
        });    
    }


    // 既に受信済みでアイテムが表示されてるなら再取得はしない
    const existedSectionList = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='top'] .content-left .item-list");
    if(existedSectionList) {
        return;
    }

    
    const res = await getTopSection(_embeddedDataJson.program.nicoliveProgramId);
    //await gameListAppend('top', itemList, res.data.sections);

    // console.log("トップセクションのデータ");
    // console.log(res);

    let topAllSectionHtml = "";

    //res.data.sections.forEach(async function(section) {
    for(const section of res.data.sections) {

        // console.log("コンテンツタイトル：" + section.title);
        // console.log("紐づくコンテンツ：", section.contents);

        section.contents.forEach(function(item) {
            if(item.serviceName === "akasha") {
                item.authorName = item.author; // TopのAPIで取得するとakashaなのにauthorNameが入っていないのでここで上書き
                item.id = item.serviceProductId; // TopのAPIで取得するとakashaなのにリクエスト用IDがserviceProductIdに入っているのでここで上書き
            }
        });

        topAllSectionHtml += await makeSectionHtml(section.title, section.contents);
    }

    const topics = await getIchibaTopic();
    const topicsHtml = await makeTopicHtml(topics);



    const contentBox = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='top'] .content-left");
    contentBox.insertAdjacentHTML('beforeend', topicsHtml);
    contentBox.insertAdjacentHTML('beforeend', topAllSectionHtml);


}

async function viewOfficalGameList() {

    // ブックマーク状態を再チェックする（お気に入りタブでブックマークを解除したアイテムを反映させるため）
    const bookmarkedItemsList = document.querySelectorAll("#ext_nico_game_launcher .screen[data-hemo-game-tab='official'] .item.bookmarked");
    if(bookmarkedItemsList.length > 0) {
        // 一旦全てのブックマーク状態を解除
        bookmarkedItemsList.forEach(function(item) {
            item.classList.remove("bookmarked");
        });
        // ブックマークリストを取得してブックマーク状態を反映
        const bookmarkListKey = "bookmarkList-official";
        const bookmarkList = await chrome.storage.local.get([bookmarkListKey]);
        const bookmarkListData = bookmarkList[bookmarkListKey] || [];
        bookmarkListData.forEach(function(item) {
            const itemElement = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='official'] .item[data-id='" + item.id + "']");
            itemElement?.classList.add("bookmarked");
        });    
    }
    
    // アクティブ状態のitem-listを全て取得
    const itemLists = document.querySelectorAll("#ext_nico_game_launcher .screen[data-hemo-game-tab='official'] .content-left .item-list.active");

    // アクティブ状態のitem-listのうち、コンテンツが無いものはコンテンツを取得
    itemLists.forEach(async function(itemList) {
        if(itemList.querySelectorAll(".item:not(.dummy)").length === 0) {
            const res = await getOfficalGameList(_embeddedDataJson.program.nicoliveProgramId, itemList.getAttribute("data-hemo-category"));
            res.data.sections.forEach(async function(section) {
                await gameListAppend('official', itemList, section.contents);
            });
        }
    });
}

// 「自作ゲーム」タブがクリックされたらデータを表示する
async function viewUserGameList(bIsRefresh = false) {

    const itemList = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .item-list");

    // リフレッシュフラグが有効な場合、既に表示されているアイテムを削除
    if(bIsRefresh) {
        while (itemList.firstChild) {
            itemList.removeChild(itemList.firstChild);
        }
    } else {
        // リフレッシュフラグが無効ならブックマーク状態だけ再チェックする
        const bookmarkedItemsList = itemList.querySelectorAll(".item.bookmarked");
        if(bookmarkedItemsList.length > 0) {
            bookmarkedItemsList.forEach(function(item) {
                item.classList.remove("bookmarked");
            });
            const bookmarkListKey = "bookmarkList-user";
            const bookmarkList = await chrome.storage.local.get([bookmarkListKey]);
            const bookmarkListData = bookmarkList[bookmarkListKey] || [];
            bookmarkListData.forEach(function(item) {
                const itemElement = itemList.querySelector(".item[data-id='" + item.id + "']");
                itemElement?.classList.add("bookmarked");
            });
        }
    }

    // 現在表示されているアイテムの数を取得
    const itemOffset = itemList.querySelectorAll(".item:not(.dummy)").length;

    // 既に表示されているアイテムがある場合はデータを取得しない
    // （例えば一度自作ゲームタブが押されてから、別のタブに行ってから戻ってきた場合）
    if(itemOffset > 0) {
        return;
    }

    // 現在のフィルターの設定を取得
    const sortKey = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .search-box .radio-group.sort-type .radio-item input[name='sort_type']:checked").getAttribute('value');
    const fixedTag = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .search-box .radio-group.game-type .radio-item input[name='fixedTag']:checked").getAttribute('value');
    const keyword = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .search-box #hemo-gamelauncher-keyword").value;
    


    // 既に表示されているアイテムが無い場合はデータを新規で取得する
    // console.log("自作ゲームの一覧を取得");
    const requestCount = 50;
    const res = await getUserGameList(_embeddedDataJson.program.nicoliveProgramId, keyword, sortKey, "DESC", requestCount, itemOffset, fixedTag);
    // console.log(res);

    await gameListAppend('user', itemList, res.data.contents);


    // もっと見るボタンも初期化
    const exsistMoreBtn = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .more-btn");
    if(exsistMoreBtn) {
        exsistMoreBtn.remove();
    }
    const moreBtn = document.createElement("div");
    moreBtn.classList.add("more-btn");
    moreBtn.innerText = "続きを読み込む";
    // const itemList = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .item-list");
    moreBtn.addEventListener("click", function() { moreBtnClick(keyword, sortKey, fixedTag); });
    // .item-listの兄弟要素の最後に追加
    itemList.parentNode.insertBefore(moreBtn, itemList.nextSibling);


    // 取得できたアイテムの数が50未満の場合は、もっと見るボタンを非表示にする
    if(res.data.contents.length < requestCount) {
        moreBtn.style.display = "none";
    } else {
        moreBtn.style.display = "block";
    }
}

// 「お気に入り」タブがクリックされたらデータを表示する
async function viewBookmarkList() {

    // 自作ゲームのブックマークリストに表示のゲームを削除
    const itemListUser = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='bookmark'] .item-list[data-hemo-category='user']");
    while (itemListUser.firstChild) {
        itemListUser.removeChild(itemListUser.firstChild);
    }

    // 公式ゲームのブックマークリストに表示のゲームを削除
    const itemListOfficial = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='bookmark'] .item-list[data-hemo-category='official']");
    while (itemListOfficial.firstChild) {
        itemListOfficial.removeChild(itemListOfficial.firstChild);
    }

    // console.log("お気に入りの一覧を取得");

    // 拡張機能のストレージからブックマークリストを取得
    const getBookmarkListUser = await chrome.storage.local.get(["bookmarkList-user"]);
    const bookmarkListUser = getBookmarkListUser["bookmarkList-user"] || [];
    const newBookmarkListHtmlUser = await createItemListHtml('user', bookmarkListUser);

    const getBookmarkListOfficial = await chrome.storage.local.get(["bookmarkList-official"]);
    const bookmarkListOfficial = getBookmarkListOfficial["bookmarkList-official"] || [];
    const newBookmarkListHtmlOfficial = await createItemListHtml('official', bookmarkListOfficial);


    let appendHtml = "";
    appendHtml += '<div class="item dummy"></div>';
    appendHtml += '<div class="item dummy"></div>';
    appendHtml += '<div class="item dummy"></div>';

    // .item-listの中身の一番うしろにnewGameListHtml（文字列）を追加
    if (newBookmarkListHtmlUser) { // 追加するHTMLがある場合のみ実行
        itemListUser.insertAdjacentHTML('beforeend', newBookmarkListHtmlUser);
    }

    if (newBookmarkListHtmlOfficial) { // 追加するHTMLがある場合のみ実行
        itemListOfficial.insertAdjacentHTML('beforeend', newBookmarkListHtmlOfficial);
    }

    // ダミー要素（文字列）も追加
    itemListUser.insertAdjacentHTML('beforeend', appendHtml);
    itemListOfficial.insertAdjacentHTML('beforeend', appendHtml);
}

// 「履歴」タブがクリックされたらデータを表示する
async function viewUseHistoryList() {

    // 既に表示されているアイテムを削除
    const itemList = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='history'] .item-list");
    while (itemList.firstChild) {
        itemList.removeChild(itemList.firstChild);
    }

    // 既に表示されているアイテムが無い場合はデータを新規で取得する
    // console.log("履歴の一覧を取得");
    const getHistoryList = await chrome.storage.local.get(["historyList"]);
    let historyList = getHistoryList["historyList"] || [];
    // console.log(historyList);

    // 履歴リストは最新のものが先頭になるようにソートする
    historyList.reverse();

    await gameListAppend('history', itemList, historyList);

}
// 「スコア」タブがクリックされたらデータを表示する
async function viewScoreList() {

    // 既に表示されているアイテムを削除
    const itemList = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='score'] .item-list");
    while (itemList.firstChild) {
        itemList.removeChild(itemList.firstChild);
    }

    // 既に表示されているアイテムが無い場合はデータを新規で取得する
    // console.log("スコアの一覧を取得");
    const getScoreList = await chrome.storage.local.get(["scoreList"]);
    let scoreList = getScoreList["scoreList"] || [];
    // console.log(scoreList);

    // 履歴リストは最新のものが先頭になるようにソートする
    scoreList.reverse();

    await gameListAppend('score', itemList, scoreList);

}
// 「NGリスト」タブがクリックされたらデータを表示する
async function viewNgList() {
    // console.log("NGリストを取得");
    chrome.storage.local.get(["ngList"], function(result) {
        const ngList = result.ngList || [];
        if(ngList.length > 0) {
            let itemHtml = "";

            // ngListを最新の日付が先頭になるようにソートする
            ngList.sort(function(a, b) {
                return new Date(b.date) - new Date(a.date);
            });

            ngList.forEach(function(item) {    
                itemHtml += `
                    <tr>
                        <td>${DOMPurify.sanitize(item.authorName)}</td>
                        <td>${item.authorId}</td>
                        <td><a href="https://namagame.coe.nicovideo.jp/users/${item.authorId}/games" target="_blank">ゲーム一覧</a></td>
                        <td>${item.date}</td>
                        <td><div class="btn" data-authorId="${item.authorId}">削除</div></td>
                    </tr>
                `;
            });
            const tableBody = document.querySelector("#HemoNgListScreen .ng-content table tbody");
            tableBody.innerHTML = itemHtml;
        }
    });
}

async function moreBtnClick(keyword, sortKey, fixedTag) {

    // 現在表示されているアイテムの数を取得
    const itemList = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .item-list");
    const itemOffset = itemList.querySelectorAll(".item:not(.dummy)").length;
    
    // console.log("自作ゲームの一覧を取得(続きを読み込む)");
    const requestCount = 50;    
    const res = await getUserGameList(_embeddedDataJson.program.nicoliveProgramId, keyword, sortKey, "DESC", requestCount, itemOffset, fixedTag);
    // console.log(res);

    // 取得できたアイテムの数が50未満の場合は、もっと見るボタンを非表示にする
    if(res.data.contents.length < requestCount) {
        const moreBtn = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .more-btn");
        moreBtn.style.display = "none";
    }

    await gameListAppend('user', itemList, res.data.contents);
}


async function makeTopicHtml(topics) {

    const titleHtml = `<div class="header-title">お知らせ</div>`;
    let topicsHtml = "";

    // 一覧の最新2件だけ取得
    const latestTopics = topics.data.topics.slice(0, 2);

    // お知らせ一覧のHTMLを作成
    latestTopics.forEach(function(topic) {
        // 2025-09-12T15:00:00.000Z を、2025/09/12 に変換
        const date = topic.postedAt.split("T")[0].replace(/-/g, "/");
        const title = DOMPurify.sanitize(topic.title);
        const topicHtml = `
            <div class="item">
                <div class="news-left">
                    <span class="date">${date}</span>
                </div>
                <div class="news-right">
                    <a href="${topic.sourceUrl}" target="_blank" class="title">${title}</a>
                    <span class="summary">${DOMPurify.sanitize(topic.summary)}</span>
                </div>
            </div>`;
        topicsHtml += topicHtml;
    });

    const sectionHtml = `${titleHtml}
                        <div class="news-list active">
                            ${topicsHtml}
                        </div>`;

    return sectionHtml;
}


async function makeSectionHtml(sectionTitle, gameList) {

    const titleHtml = `<div class="header-title">${DOMPurify.sanitize(sectionTitle)}</div>`;

    // ゲームの一覧のHTMLを作成
    const newGameListHtml = await createItemListHtml('top', gameList);

    const appendHtml = `<div class="item dummy"></div>
                        <div class="item dummy"></div>
                        <div class="item dummy"></div>`;


    const sectionHtml = `${titleHtml}
                        <div class="item-list active">
                            ${newGameListHtml}
                            ${appendHtml}
                        </div>`;

    return sectionHtml;
}

// MARK: ゲームの一覧のHTMLを作成
async function gameListAppend(tabId, itemListDom, gameList) {

    // console.log("使えるデータあるかな");
    // console.log(gameList);
    // console.log(itemList);

    // ゲームの一覧のHTMLを作成
    const newGameListHtml = await createItemListHtml(tabId, gameList);

    //const itemList = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .item-list");

    // 既に表示されているアイテムがある場合は末尾の.item.dummy を削除する
    itemListDom.querySelectorAll(".item.dummy").forEach(function(item) {
        item.remove();
    });

    let appendHtml = "";
    appendHtml += '<div class="item dummy"></div>';
    appendHtml += '<div class="item dummy"></div>';
    appendHtml += '<div class="item dummy"></div>';

    // .item-listの中身の一番うしろにnewGameListHtml（文字列）を追加
    if (newGameListHtml) { // 追加するHTMLがある場合のみ実行
        itemListDom.insertAdjacentHTML('beforeend', newGameListHtml);
    }

    // ダミー要素（文字列）も追加
    itemListDom.insertAdjacentHTML('beforeend', appendHtml);
}

// ゲームの一覧のHTMLを作成
async function createItemListHtml(tabId, contents) {

    // console.log("ゲームの一覧のHTMLを作成");
    // console.log("tabId", tabId);
    // console.log("contents", contents);



    // ngListのデータを取得
    const getNgList = await chrome.storage.local.get(["ngList"]);
    const ngList = getNgList.ngList || [];

    // 拡張機能のストレージからブックマークリストを取得
    const getBookmarkListUser = await chrome.storage.local.get([`bookmarkList-user`]);
    const bookmarkListUser = getBookmarkListUser[`bookmarkList-user`] || [];
    const getBookmarkListOfficial = await chrome.storage.local.get([`bookmarkList-official`]);
    const bookmarkListOfficial = getBookmarkListOfficial[`bookmarkList-official`] || [];


        
    let itemListHtml = "";
    //contents.forEach(async function(item) {
    for(const item of contents) {

        // akashaかgameか判定
        let bIsAkashaItem = false;
        if(item.originName === "unofficial_namagame" || item.category === "user" || item.serviceName === "akasha") {
            // originNameがunofficial_namagameのケース　→　一覧取得のAPIから取得してきたアイテム
            // categoryがuserのケース　→　お気に入りタブのアイテム or 履歴タブのアイテム
            // serviceNameがakashaのケース　→　トップの取得してきたアイテム
            bIsAkashaItem = true;
        }


        // 自作ゲームかつauthorUserIdが存在しない場合は、Owner情報からauthorUserIdを取得
        // Topタブで取得するゲームがここに該当する
        /*
        if(bIsAkashaItem && !item.authorUserID) {
            const product = await getIchibaProductInfo(item.serviceName, item.serviceProductId, _embeddedDataJson.program.nicoliveProgramId);
            const owner = await getOwner(product.data.id); // ProductIdを指定
            console.log(owner);
            if(owner && owner.meta.status === 200) {
                // アカウントによってはniconicoUserInfoが存在しない場合がある
                if(owner.data.niconicoUserInfo){
                    // 作者のアイコン
                    item.authorIcon = owner.data.niconicoUserInfo.icons.urls["150x150"] || owner.data.niconicoUserInfo.icons.urls["50x50"];

                    // 作者の名前
                    item.authorName = DOMPurify.sanitize(owner.data.niconicoUserInfo.nickName);
                
                    // 作者のID
                    item.authorUserID = owner.data.niconicoUserInfo.id;
                }
            }
        }
        */


        // ブックマークリストに含まれているかを確認
        let isBookmarked = false;
        if(bIsAkashaItem) {
            isBookmarked = bookmarkListUser.some(function(bookmark) {
                return bookmark.id === item.id; // 自作ゲームの場合はidで判断
            });
        } else {
            isBookmarked = bookmarkListOfficial.some(function(bookmark) {
                return bookmark.serviceProductId === item.serviceProductId; // 公式ゲームの場合はserviceProductIdで判断
            });
        }

        // NGリストに含まれているかを確認
        const isNg = ngList.some(function(ng) {
            return ng.authorId === item.authorUserID;
        });


        // "2025-09-23T05:39:58.000Z" を、 "2025/09/23" に変換
        // let createdDate = item.createdAt.split("T")[0].replace(/-/g, "/");

        const lgId = DOMPurify.sanitize(item.originContentID);
        const id = DOMPurify.sanitize(item.id);
        const itemThumbnail = DOMPurify.sanitize(item.thumbnailUrl);
        const itemTitle = DOMPurify.sanitize(item.title);
        let itemDescription = DOMPurify.sanitize(item.description);
        const authorName = DOMPurify.sanitize(item.authorName);


        // AuthorIconの取得
        let authorIcon = "";

        if(item.authorUserID && item.authorUserID.length > 4) {
            iconPath = item.authorUserID.substring(0, item.authorUserID.length - 4);
            authorIcon = `https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/${iconPath}/${item.authorUserID}.jpg`;
        }


        
        if(tabId === "score" && item.scores.length > 0) {
            // 3桁区切りのスコア
            const score = item.scores[0].point.toLocaleString();
            // "2025-10-09T03:34:03" を、 "2025/10/09 03:34:03" に変換
            const date = item.scores[0].date.split("T")[0].replace(/-/g, "/");
            const time = item.scores[0].date.split("T")[1].split(":")[0] + ":" + item.scores[0].date.split("T")[1].split(":")[1];
            itemDescription = `
                <div class="score">${score}<span>point</span></div>
                <div class="date">記録日：${date} ${time}</div>
            `;
        }


        if(bIsAkashaItem) {

            // 自作ゲームの場合
            const itemHtml = `
            <div class="item ${isBookmarked ? "bookmarked" : ""} ${isNg ? "ng" : ""}" data-lg-id="${lgId}"
                data-id="${id}" data-author-id="${item.authorUserID ? item.authorUserID : ""}" data-service-name="akasha" data-category="user">
                <div class="title-box">
                    <div class="left">
                        <img src="${itemThumbnail}" alt="${itemTitle}">
                    </div>
                    <div class="right">
                        <div class="title">${itemTitle}</div>
                    </div>
                </div>
                <div class="desc-box">${itemDescription}</div>
                <div class="btnBox">
                    <div class="info">
                        <div class="author-icon" style="background-image: url(${authorIcon}), url(https://secure-dcdn.cdn.nimg.jp/nicoaccount/usericon/defaults/blank.jpg);"></div>
                        <div class="author">
                            <a class="${item.authorUserID ? "" : "hide"}" href="https://www.nicovideo.jp/user/${item.authorUserID}" target="_blank">
                                <span class="author-name">${authorName}</span>
                            </a>
                            <div style="display:${item.authorUserID ? "none" : "inline"}">
                                <span class="author-name">${authorName}</span>
                            </div>
                        </div>
                    </div>    
                    <div class="btn">
                        <div class="requestBtn">リクエスト</div>
                        <div class="balloon item-akasha-${id}"></div>
                    </div>

                </div>
                <div class="bookmarkAdd" title="お気に入りに追加">
                    <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="" stroke-width="0"></g><g id="" stroke-linecap="round" stroke-linejoin="round"></g><g id=""> <path d="M9.15316 5.40838C10.4198 3.13613 11.0531 2 12 2C12.9469 2 13.5802 3.13612 14.8468 5.40837L15.1745 5.99623C15.5345 6.64193 15.7144 6.96479 15.9951 7.17781C16.2757 7.39083 16.6251 7.4699 17.3241 7.62805L17.9605 7.77203C20.4201 8.32856 21.65 8.60682 21.9426 9.54773C22.2352 10.4886 21.3968 11.4691 19.7199 13.4299L19.2861 13.9372C18.8096 14.4944 18.5713 14.773 18.4641 15.1177C18.357 15.4624 18.393 15.8341 18.465 16.5776L18.5306 17.2544C18.7841 19.8706 18.9109 21.1787 18.1449 21.7602C17.3788 22.3417 16.2273 21.8115 13.9243 20.7512L13.3285 20.4768C12.6741 20.1755 12.3469 20.0248 12 20.0248C11.6531 20.0248 11.3259 20.1755 10.6715 20.4768L10.0757 20.7512C7.77268 21.8115 6.62118 22.3417 5.85515 21.7602C5.08912 21.1787 5.21588 19.8706 5.4694 17.2544L5.53498 16.5776C5.60703 15.8341 5.64305 15.4624 5.53586 15.1177C5.42868 14.773 5.19043 14.4944 4.71392 13.9372L4.2801 13.4299C2.60325 11.4691 1.76482 10.4886 2.05742 9.54773C2.35002 8.60682 3.57986 8.32856 6.03954 7.77203L6.67589 7.62805C7.37485 7.4699 7.72433 7.39083 8.00494 7.17781C8.28555 6.96479 8.46553 6.64194 8.82547 5.99623L9.15316 5.40838Z" fill="#dddddd"></path> </g></svg>
                </div>
            </div>
            `;

            itemListHtml += itemHtml;

        } else {

            // 公式ゲームの場合
            const itemHtml = `
                <div class="item ${isBookmarked ? "bookmarked" : ""} ${isNg ? "ng" : ""}"
                    data-id="${item.id}" data-service-name="game"
                    data-service-product-id="${item.serviceProductId}" data-category="official">
                    <div class="title-box">
                        <div class="left">
                            <img src="${itemThumbnail}" alt="${itemTitle}">
                        </div>
                        <div class="right">
                            <div class="title">${itemTitle}</div>
                        </div>
                    </div>
                    <div class="desc-box">${itemDescription}</div>
                    <div class="btnBox">
                        <div class="info">
                            <div class="author">
                                <span class="author-name">${item.author}</span>
                            </div>
                        </div>    
                        <div class="btn">
                            <div class="requestBtn">リクエスト</div>
                            <div class="balloon item-game-${item.serviceProductId}"></div>
                        </div>
                    </div>
                    <div class="bookmarkAdd" title="お気に入りに追加">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="" stroke-width="0"></g><g id="" stroke-linecap="round" stroke-linejoin="round"></g><g id=""> <path d="M9.15316 5.40838C10.4198 3.13613 11.0531 2 12 2C12.9469 2 13.5802 3.13612 14.8468 5.40837L15.1745 5.99623C15.5345 6.64193 15.7144 6.96479 15.9951 7.17781C16.2757 7.39083 16.6251 7.4699 17.3241 7.62805L17.9605 7.77203C20.4201 8.32856 21.65 8.60682 21.9426 9.54773C22.2352 10.4886 21.3968 11.4691 19.7199 13.4299L19.2861 13.9372C18.8096 14.4944 18.5713 14.773 18.4641 15.1177C18.357 15.4624 18.393 15.8341 18.465 16.5776L18.5306 17.2544C18.7841 19.8706 18.9109 21.1787 18.1449 21.7602C17.3788 22.3417 16.2273 21.8115 13.9243 20.7512L13.3285 20.4768C12.6741 20.1755 12.3469 20.0248 12 20.0248C11.6531 20.0248 11.3259 20.1755 10.6715 20.4768L10.0757 20.7512C7.77268 21.8115 6.62118 22.3417 5.85515 21.7602C5.08912 21.1787 5.21588 19.8706 5.4694 17.2544L5.53498 16.5776C5.60703 15.8341 5.64305 15.4624 5.53586 15.1177C5.42868 14.773 5.19043 14.4944 4.71392 13.9372L4.2801 13.4299C2.60325 11.4691 1.76482 10.4886 2.05742 9.54773C2.35002 8.60682 3.57986 8.32856 6.03954 7.77203L6.67589 7.62805C7.37485 7.4699 7.72433 7.39083 8.00494 7.17781C8.28555 6.96479 8.46553 6.64194 8.82547 5.99623L9.15316 5.40838Z" fill="#dddddd"></path> </g></svg>
                    </div>
                </div>
            `;
            itemListHtml += itemHtml;
        }
    };

    return itemListHtml;
}