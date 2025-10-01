
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

function ichibaShortcutToggle() {
    console.log("ichibaShortcut------------------------");

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
            console.log(mutation);

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
                    console.log(currentNode);
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
    console.log(id);

    /*
    以下のURLから、１階層目のフォルダ名(以下の例ならgame）を取得する
    "https://services.spi.nicovideo.jp/game/index.html?id=521&content_id=lv00000000000&frontend_id=9&frontend_version=600.0.0&content_type=live"
    */
    const folderName = src.split('/')[3];
    console.log('フォルダ名:', folderName);

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
    addHemoTool.addEventListener("click", function(){
        console.log(this.getAttribute("data-ichiba-id"));
        
        addHemoTool.disabled = true;
        addHemoTool.style.backgroundColor = "rgb(71, 71, 71)";

        const selectItem = document.querySelector("[class^=___ichiba-counter-section___] [data-is-selected='true'] img");
        if(selectItem){
            console.log("アイコンURL", selectItem.getAttribute("src"));
            console.log("タイトル", selectItem.getAttribute("alt"));

            /*
            chrome.storage.localに、以下のように追加していく
            {
                ichibaList: [
                    {
                        "folderName": "game",
                        "itemNo": 123,
                        "itemName": "テスト",
                        "itemIcon": "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"
                    },
                    {
                        "folderName": "akasha",
                        "itemNo": 345,
                        "itemName": "テスト"2,
                        "itemIcon": "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"
                    }
                ]
            }
            */

            chrome.storage.local.get("ichibaList", function(value){
                
                if(value && value.ichibaList && Array.isArray(value.ichibaList)){

                    // 既に追加済みなら追加しない
                    if(value.ichibaList.find(item => item.itemId === id && item.folderName === folderName)){
                        addHemoTool.textContent = "追加済みアイテム";
                        console.log("既に追加済みのアイテムです");
                        return;
                    }

                    value.ichibaList.push({
                        "folderName": folderName,
                        "itemId": id,
                        "itemName": selectItem.getAttribute("alt"),
                        "itemIcon": selectItem.getAttribute("src")
                    });
                    chrome.storage.local.set({"ichibaList": value.ichibaList}, function() {
                        console.log("追加しました1");
                        addHemoTool.textContent = "追加しました";
                        addIchibaShortcut();
                    });
                } else {
                    chrome.storage.local.set({"ichibaList": [{
                        "folderName": folderName,
                        "itemId": id,
                        "itemName": selectItem.getAttribute("alt"),
                        "itemIcon": selectItem.getAttribute("src")
                    }]}, function() {
                        console.log("追加しました2");
                        addHemoTool.textContent = "追加しました";
                        addIchibaShortcut();

                        // 0件から1件になった場合はショートカット機能を有効状態にする

                        const ichibaShortcut = document.querySelector('#ext_ichiba_shortcut');
                        ichibaShortcut.classList.add("show");
                        
                        // ON状態に
                        const menu = document.querySelector('.ext-setting-menu .ext-ichiba');
                        menu.setAttribute("ext-attr-on", "ON");        
                        
                        // ストレージにボタンの状態を保存
                        chrome.storage.local.set({"ext_ichiba": "ON"}, function() {});
                
                        // ショートカットをアクティブ状態
                        document.querySelector('#ext_shortcut .item.ichiba').setAttribute("active", "ON");
                    });
                }
            });


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

async function addIchibaShortcut() {
    const ichibaItemBox = document.querySelector("#ext_ichiba_shortcut .item-box");
    ichibaItemBox.innerHTML = "";

    // タイムシフトなどで、ゲームを追加できない場合は、ショートカットを無効化
    const waitTime = document.querySelector('#ext_ichiba_shortcut .time-box');
    const ichibaAddBtn = document.querySelector("[class^=___ichiba-counter-section___] [class^=___add-button___]");
    const bIsDisableIchiba = ichibaAddBtn && ichibaAddBtn.hasAttribute("disabled");
    if(bIsDisableIchiba){
        const ichibaShortcut = document.querySelector("#ext_ichiba_shortcut");
        ichibaShortcut.classList.add("disabled");
        waitTime.innerText = "リクエストできません";
    } else {

        const product = await getProduct(_embeddedDataJson.program.nicoliveProgramId);
        if(product.data.cooldownTime > 0) {
            // 秒数から、n分m秒を取得
            const minutes = Math.floor(product.data.cooldownTime / 60);
            const seconds = product.data.cooldownTime % 60;            
            setIchibaWaitTime(minutes, seconds);
        } else {
            waitTime.innerText = "リクエストが可能です";
        }

    }

    
    console.log("--------------------------------");
    console.log(_embeddedDataJson);
    

    let frontendId = "9";
    if(_embeddedDataJson && _embeddedDataJson.site && _embeddedDataJson.site.frontendId){
        console.log("frontendId:", _embeddedDataJson.site.frontendId);
        frontendId = _embeddedDataJson.site.frontendId;
    } else {
        console.error("frontendIdが取得できませんでした");
    }

    let frontendVersion = "600.0.0";
    if(_embeddedDataJson && _embeddedDataJson.site && _embeddedDataJson.site.frontendVersion){
        console.log("frontendVersion:", _embeddedDataJson.site.frontendVersion);
        frontendVersion = _embeddedDataJson.site.frontendVersion;
    } else {
        console.error("frontendVersionが取得できませんでした");
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
                                console.log("削除しました - itemId:", targetItemId, "folderName:", targetFolderName);
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

                img.addEventListener('click', function(){
                    if(bIsDisableIchiba){
                        return;
                    }

                    // 放送ネタが禁止になっている配信では、「動画・生」タブのリクエストは禁止
                    if(_embeddedDataJson.programSuperichiba.programIsPermittedToRequestSpecificNeta === false && item.folderName === "quotation"){
                        
                        // balloonにエラーメッセージを表示
                        document.querySelector(".balloon.item-" + item.folderName + "-" + item.itemId).textContent = "放送ネタが許可されていません";
                        document.querySelector(".balloon.item-" + item.folderName + "-" + item.itemId).classList.add("show");
                        // 数ミリ秒後に非表示
                        setTimeout(function(){
                            document.querySelector(".balloon.item-" + item.folderName + "-" + item.itemId).classList.remove("show");
                            document.querySelector(".balloon.item-" + item.folderName + "-" + item.itemId).style.pointerEvents = "none";
                        }, 900);
                        return
                    }

                    const itemIcon = document.querySelector(".item.ichiba:has(.item-" + item.folderName + "-" + item.itemId + ") img");
                    itemIcon.classList.add("loading");


                    /*
                    以下のDOMから、"lv000000000" の部分を番組IDとして取得する。
                    <meta property="og:url" content="https://live.nicovideo.jp/watch/lv000000000"></meta>
                    */
                    const programId = "lv" + document.querySelector('meta[property="og:url"]').getAttribute("content").split("lv")[1].split("/")[0];

                    console.log("--------------------------------");
                    console.log("クリックされました！");
                    console.log("folderName:", item.folderName);
                    console.log("itemId:", item.itemId);
                    console.log("programId:", programId);

                    // アイテムをリクエスト
                    requestIchibaItem(programId, item, frontendId, frontendVersion);

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
                            console.log("順序を保存しました");
                        });
                    }
                });
            }
        } else {
            ichibaItemBox.textContent = "ここにゲームが登録されます。リクエスト済みのゲームをクリックするとショートカットに登録できます。";
        }
    });
}



// 通信を実行し、結果を処理する非同期関数
async function requestIchibaItem(programId, item, frontendId, frontendVersion) {

    const itemIcon = document.querySelector(".item.ichiba:has(.item-" + item.folderName + "-" + item.itemId + ") img");
    itemIcon.classList.add("loading");

    // 番組グレードを取得
    const grade = await getGrade(programId);
    if(!grade || grade.meta.status != 200) {
        console.error("番組グレードを取得できませんでした");
        return;
    }
    console.log("番組グレード:", grade.data.programGrade);


    const url = "https://eapi.spi.nicovideo.jp/v1/ichibas/" + programId + "/products";

    // POSTリクエストの場合は、メソッドをPOSTに、ボディを指定する（但し_fetchOptionsは修正しない）
    const options = {..._fetchOptions};
    options.method = "POST";
    options.body = "{\"serviceName\":\"" + item.folderName + "\",\"serviceProductId\":\"" + item.itemId + "\",\"frontendId\":" + frontendId + ",\"frontendVersion\":\"" + frontendVersion + "\",\"expectedGrade\":" + grade.data.programGrade + "}";

    
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
            console.log("エラーコード: ", errorBody.meta.errorCode);
            switch(errorBody.meta.errorCode) {
                case "NO_REMAINING_USE_RIGHT":

                    const product = await getProduct(programId);
                    // 秒数から、n分m秒を取得
                    const minutes = Math.floor(product.data.cooldownTime / 60);
                    const seconds = product.data.cooldownTime % 60;
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
                default:
                    break;
            }

            // balloonにエラーメッセージを表示
            document.querySelector(".balloon.item-" + item.folderName + "-" + item.itemId).textContent = errorMessage;
            document.querySelector(".balloon.item-" + item.folderName + "-" + item.itemId).classList.add("show");
            // 数ミリ秒後に非表示
            setTimeout(function(){
                document.querySelector(".balloon.item-" + item.folderName + "-" + item.itemId).classList.remove("show");
                document.querySelector(".balloon.item-" + item.folderName + "-" + item.itemId).style.pointerEvents = "none";
            }, 900);

            itemIcon.classList.remove("loading");
            
            // エラーなのでここで処理を中断
            return; 
        }

        // 通信が成功した場合、応答をJSONとして解析
        const data = await response.json();
        console.log("成功:", data);

        // balloonに成功メッセージを表示
        document.querySelector(".balloon.item-" + item.folderName + "-" + item.itemId).textContent = "リクエストしました";
        document.querySelector(".balloon.item-" + item.folderName + "-" + item.itemId).classList.add("show");
        // 数ミリ秒後に非表示
        setTimeout(function(){
            document.querySelector(".balloon.item-" + item.folderName + "-" + item.itemId).classList.remove("show");
        }, 900);

        itemIcon.classList.remove("loading");

        // 番組グレードを取得し、次のリクエストまでの時間を取得して表示しておく
        const gradeData = await getGrade(programId);
        // 次のリクエストまでの時間を取得して表示しておく
        const minutes = Math.floor(gradeData.data.freezeTime / 60);
        const seconds = gradeData.data.freezeTime % 60;    
        setIchibaWaitTime(minutes, seconds);


    } catch (networkError) {
        // ネットワーク接続の問題やCORSエラーなど、通信自体が失敗した場合
        console.error("通信エラー:", networkError);
        itemIcon.classList.remove("loading");
    }
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
    console.log("Product情報を取得します");
    const product = await getIchibaProductInfo(folderName, itemId, _embeddedDataJson.program.nicoliveProgramId);
    console.log(product);


    
    let service;
    let game;
    let owner;

    // 投稿ゲームの場合
    if(product.data.categoryName == "akasha"){
        // Service情報を取得
        console.log("Service情報を取得します");
        service = await getIchibaServiceInfo(folderName, itemId, _embeddedDataJson.program.nicoliveProgramId);
        console.log(service);

        // 作者が非表示(HIDDEN)状態にしているゲームはゲームページが存在しないので、ゲーム情報を取得できない
        // "HIDDEN"...非公開状態（でも作者は起動できる）
        // "USABLE"...通常公開状態
        // "ONLY_PREMIUM_USER"...プレミアム会員のみ起動可能？
        // "DUPLICATED"...？
        if(product.data.usableState !== "HIDDEN") {
            // Game情報を取得
            console.log("Game情報を取得します");
            game = await getIchibaGameInfo(service.data.content.originContentId);
            console.log(game);
        }

        // Owner情報を取得
        console.log("Owner情報を取得します");
        owner = await getOwner(product.data.id);
        console.log(owner);

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
        authorIcon.alt = owner.data.niconicoUserInfo.displayName;

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
    
    const itemId = item.getAttribute("data-id");
    const authorId = item.getAttribute("data-author-id");

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
    console.log("Product情報を取得します");
    const product = await getIchibaProductInfo(folderName, itemId, _embeddedDataJson.program.nicoliveProgramId);
    console.log(product);



    let service;
    let game;
    let owner;

    // 投稿ゲームの場合
    if(product.data.categoryName == "akasha"){
        // Service情報を取得
        console.log("Service情報を取得します");
        service = await getIchibaServiceInfo(folderName, itemId, _embeddedDataJson.program.nicoliveProgramId);
        console.log(service);

        // 作者が非表示(HIDDEN)状態にしているゲームはゲームページが存在しないので、ゲーム情報を取得できない
        // "HIDDEN"...非公開状態（でも作者は起動できる）
        // "USABLE"...通常公開状態
        // "ONLY_PREMIUM_USER"...プレミアム会員のみ起動可能？
        // "DUPLICATED"...？
        if(product.data.usableState !== "HIDDEN") {
            // Game情報を取得
            console.log("Game情報を取得します");
            game = await getIchibaGameInfo(service.data.content.originContentId);
            console.log(game);
        }

        // Owner情報を取得
        console.log("Owner情報を取得します");
        owner = await getOwner(product.data.id);
        console.log(owner);

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
            authorIconName = DOMPurify.sanitize(owner.data.niconicoUserInfo.displayName);
        
            // 作者のレベル
            authorLevel = owner.data.niconicoUserInfo.level;

        }

        // 作者の名前
        authorName = DOMPurify.sanitize(owner.data.displayName);
    }

    // 作者のユーザーページ
    authorPageUrl= "https://www.nicovideo.jp/user/" + authorId;

    // 作者の他のゲームを見る
    authorGamePageUrl = "https://namagame.coe.nicovideo.jp/users/" + authorId + "/games";

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
                    <div class="addShortcutBtn">ショートカットに追加</div>
                    <div class="addNgBtn" data-authorName="${authorName}" data-authorId="${authorId}">作者の作品を全てNG登録</div>
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
            <div class="game-info-box">
                <div class="refCount">親作品登録：${product.data.refCount.toLocaleString()}件</div>
            </div>
            <div class="author-box">
                <div class="left">
                </div>
                <div class="right">
                    <div class="addShortcutBtn">ショートカットに追加</div>
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


    // ローディングを非表示
    //extHideLoading();

    // 作者情報が取得できなかった場合は最後に非表示
    /*
    if(!owner || owner.meta.status != 200) {
        authorBox.classList.add("hide");
    }
    // ゲーム情報が取得できなかった場合は最後に非表示
    if(!game) {
        const gameInfoBox = document.querySelector("#ext_ichiba_info .game-info-box");
        gameInfoBox.classList.add("hide");
    }
    */

    return;

}

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
        console.log("ゲームのネタ詳細ページが非公開か削除されたようです");
        data = null;
    }
    
    return data;
}

async function getOfficalGameList(programId, section) {
    /* 対戦・協力ゲーム
        全員対戦：vsall
        協力：coop
        主と対戦：vsnushi
    */
    
    const url = "https://eapi.spi.nicovideo.jp/v2/contents/" + programId + "/sections/" + section;
    return runCommonFetch(url, _fetchOptions);
}

async function getProduct(programId) {
    const url = "https://eapi.spi.nicovideo.jp/v1/users/self/authority?contentId=" + programId;
    return runCommonFetch(url, _fetchOptions);
}

async function getGrade(programId) {
    const url = "https://eapi.spi.nicovideo.jp/v1/contents/" + programId + "/grade";
    return runCommonFetch(url, _fetchOptions);
}

async function getIchibaServiceInfo(folderName, itemId, programId) {
    const url ="https://services-eapi.spi.nicovideo.jp/v1/services/" + folderName + "/services/program/programs/" + programId + "/contents/" + itemId;
    return runCommonFetch(url, _fetchOptions);
}

async function getOwner(ownerId) {
    const url = "https://eapi.spi.nicovideo.jp/v2/products/products/" + ownerId + "/owner";
    return runCommonFetch(url, _fetchOptions);
}

async function getIchibaProductInfo(folderName, itemId, programId) {
    const url =  "https://eapi.spi.nicovideo.jp/v2/services/" + folderName + "/products/" + itemId + "?exclude_registered=false&tmp_page_id=detail&contentId=" + programId;
    return runCommonFetch(url, _fetchOptions);
}

async function getUserGameList(nicoliveProgramId, keyword, sortKey, sortOrder, limit, offset, launchTypes){
    let url = "https://services-eapi.spi.nicovideo.jp/v1/services/akasha/services/content/contents?programID=" + nicoliveProgramId +"&sortKey=" + sortKey + "&sortOrder=" + sortOrder + "&limit=" + limit + "&offset=" + offset;
    if(launchTypes) {
        url += "&launchTypes=" + launchTypes;
    }
    if(keyword) {
        url += "&keyword=" + keyword;
    }
    return runCommonFetch(url, _fetchOptions);
}

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

    // 受け取った分と秒数を1秒毎にカウントダウンさせて表示する
    let count = minutes * 60 + seconds;
    _ichibaInterval = setInterval(function() {
        count--;
        waitTime.innerText = "次のリクエストまで\n残り" + Math.floor(count / 60) + "分" + count % 60 + "秒";
        if(count <= 0) {
            clearInterval(_ichibaInterval);
            _ichibaInterval = null;
            waitTime.innerText = "リクエストが可能です";
        }
    }, 1000);
}

// MARK: イベント設定
function setEventGameLauncher() {
    const overlay = document.querySelector("#ext_nico_game_launcher_overlay");
    const gameLauncher = document.querySelector(".hemo-view-game-btn");

    // ランチャー起動ボタン
    gameLauncher.addEventListener("click", function() {
        overlay.classList.toggle("show");
        document.querySelector("body").style.overflow = "hidden";
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
        if (event.target.name === 'game_type') {
            // フィルターを適用
            viewUserGameList(true);
        }
    });

    async function itemClick(e) {
        const tab = e.target.closest('.screen');
        const tabId = tab?.getAttribute("data-hemo-game-tab");
        const itemList = e.target.closest('.item-list');
        const itemElement = e.target.closest('.item');
        if(itemElement) {
            // ブックマークボタンがクリックされた
            if(e.target.classList.contains('bookmarkAdd') || e.target.closest('.bookmarkAdd')) {
                if(itemElement.classList.contains('bookmarked')) {
                    console.log("ブックマークから削除");
                    await removeBookmark(itemElement);
                    
                    // お気に入りタブを開いている場合は一覧を更新
                    if(tabId === 'bookmark') {
                        viewBookmarkList();
                    }
                } else {
                    console.log("ブックマークを追加");
                    addBookmark(itemElement);    
                }
                return;
            }

            const serviceName = itemElement.getAttribute("data-service-name");
            
            // アイテム本体がクリックされた
            showIchibaInfoToGameLauncher(itemElement, serviceName);
            itemList.querySelectorAll(".item.active").forEach(function(item) {
                item.classList.remove("active");
            });
            itemElement.classList.add("active");
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
    const itemListFromBookmarkList = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='bookmark'] .item-list");
    itemListFromBookmarkList.addEventListener("click", itemClick);


    // 自作ゲーム詳細情報内のクリック判定
    const itemInfo = document.querySelector("#HemoUserGameScreen .content-right");
    itemInfo.addEventListener("click", async function(e) {
        // .addNgBtnがクリックされたら、作者の作品を全てNG登録
        if(e.target.classList.contains('addNgBtn')) {

            //確認画面を表示
            if(confirm("NG登録を実行しますか？")){

                const authorName = e.target.getAttribute("data-authorName");
                const authorId = e.target.getAttribute("data-authorId");
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
                    itemInfo.innerHTML = "";

                    // ゲーム一覧から作者の作品を全て非表示にする(.ngクラスを追加)
                    const ngItemList = document.querySelectorAll("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .item-list .item[data-author-id='" + authorId + "']");
                    ngItemList.forEach(function(item) {
                        item.classList.add("ng");
                    });
                });
            }
        }        
    });

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

async function addBookmark(itemElement) {
    const thumbnailUrl = itemElement.querySelector(".title-box img").src;
    const title = itemElement.querySelector(".title-box .title").innerText;
    const launchType = itemElement.querySelector(".launchType").getAttribute("data-launch-type");
    const authorName = itemElement.querySelector(".author .author-name").innerText;
    const authorUserID = itemElement.getAttribute("data-author-id");
    const id = itemElement.getAttribute("data-id");
    const originContentID = itemElement.getAttribute("data-lg-id");
    const getBookmarkList = await chrome.storage.local.get(["bookmarkList"]);
    const bookmarkList = getBookmarkList.bookmarkList || [];
    bookmarkList.push({thumbnailUrl: thumbnailUrl, title: title, launchType: launchType, authorName: authorName, authorUserID: authorUserID, id: id, originContentID: originContentID});
    await chrome.storage.local.set({"bookmarkList": bookmarkList});
    itemElement.classList.add("bookmarked");
}

async function removeBookmark(itemElement) {
    const id = itemElement.getAttribute("data-id");
    const getBookmarkList = await chrome.storage.local.get(["bookmarkList"]);
    const bookmarkList = getBookmarkList.bookmarkList || [];
    const newBookmarkList = bookmarkList.filter(item => item.id !== id);
    await chrome.storage.local.set({"bookmarkList": newBookmarkList});
    itemElement.classList.remove("bookmarked");
}

async function viewOfficalGameList() {
    
    // アクティブ状態のitem-listを全て取得
    const itemLists = document.querySelectorAll("#ext_nico_game_launcher .screen[data-hemo-game-tab='official'] .content-left .item-list.active");

    // アクティブ状態のitem-listのうち、コンテンツが無いものはコンテンツを取得
    itemLists.forEach(async function(itemList) {
        if(itemList.querySelectorAll(".item:not(.dummy)").length === 0) {
            const res = await getOfficalGameList(_embeddedDataJson.program.nicoliveProgramId, itemList.getAttribute("data-hemo-category"));
            res.data.sections.forEach(async function(section) {
                await gameListAppend(itemList, section.contents);
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
            const bookmarkList = await chrome.storage.local.get(["bookmarkList"]);
            const bookmarkListData = bookmarkList.bookmarkList || [];
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
    const launchTypes = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .search-box .radio-group.game-type .radio-item input[name='game_type']:checked").getAttribute('value');
    const keyword = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .search-box #hemo-gamelauncher-keyword").value;
    


    // 既に表示されているアイテムが無い場合はデータを新規で取得する
    console.log("自作ゲームの一覧を取得");
    const res = await getUserGameList(_embeddedDataJson.program.nicoliveProgramId, keyword, sortKey, "DESC", "50", itemOffset, launchTypes);
    console.log(res);


    await gameListAppend(itemList, res.data.contents);


    // もっと見るボタンも初期化
    const exsistMoreBtn = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .more-btn");
    if(exsistMoreBtn) {
        exsistMoreBtn.remove();
    }
    const moreBtn = document.createElement("div");
    moreBtn.classList.add("more-btn");
    moreBtn.innerText = "もっと見る";
    // const itemList = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .item-list");
    moreBtn.addEventListener("click", function() { moreBtnClick(keyword, sortKey, launchTypes); });
    // .item-listの兄弟要素の最後に追加
    itemList.parentNode.insertBefore(moreBtn, itemList.nextSibling);
}

// 「お気に入り」タブがクリックされたらデータを表示する
async function viewBookmarkList() {
    const itemList = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='bookmark'] .item-list");
    while (itemList.firstChild) {
        itemList.removeChild(itemList.firstChild);
    }

    console.log("お気に入りの一覧を取得");
    // 拡張機能のストレージからブックマークリストを取得
    const getBookmarkList = await chrome.storage.local.get(["bookmarkList"]);
    const bookmarkList = getBookmarkList.bookmarkList || [];

    console.log("bookmarkList",bookmarkList);
    const newBookmarkListHtml = await createItemListHtml(bookmarkList);


    let appendHtml = "";
    appendHtml += '<div class="item dummy"></div>';
    appendHtml += '<div class="item dummy"></div>';
    appendHtml += '<div class="item dummy"></div>';

    // .item-listの中身の一番うしろにnewGameListHtml（文字列）を追加
    if (newBookmarkListHtml) { // 追加するHTMLがある場合のみ実行
        itemList.insertAdjacentHTML('beforeend', newBookmarkListHtml);
    }

    // ダミー要素（文字列）も追加
    itemList.insertAdjacentHTML('beforeend', appendHtml);
}

// 「NGリスト」タブがクリックされたらデータを表示する
async function viewNgList() {
    console.log("NGリストを取得");
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

async function moreBtnClick(keyword, sortKey, launchTypes) {

    // 現在表示されているアイテムの数を取得
    const itemList = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .item-list");
    const itemOffset = itemList.querySelectorAll(".item:not(.dummy)").length;
    
    console.log("自作ゲームの一覧を取得(もっと見る)");        
    const res = await getUserGameList(_embeddedDataJson.program.nicoliveProgramId, keyword, sortKey, "DESC", "50", itemOffset, launchTypes);
    console.log(res);

    await gameListAppend(itemList, res.data.contents);
}


async function gameListAppend(itemList, gameList) {

    console.log("使えるデータあるかな");
    console.log(gameList);
    console.log(itemList);

    // ゲームの一覧のHTMLを作成
    const newGameListHtml = await createItemListHtml(gameList);

    //const itemList = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .item-list");

    // 既に表示されているアイテムがある場合は末尾の.item.dummy を削除する
    itemList.querySelectorAll(".item.dummy").forEach(function(item) {
        item.remove();
    });

    let appendHtml = "";
    appendHtml += '<div class="item dummy"></div>';
    appendHtml += '<div class="item dummy"></div>';
    appendHtml += '<div class="item dummy"></div>';

    // .item-listの中身の一番うしろにnewGameListHtml（文字列）を追加
    if (newGameListHtml) { // 追加するHTMLがある場合のみ実行
        itemList.insertAdjacentHTML('beforeend', newGameListHtml);
    }

    // ダミー要素（文字列）も追加
    itemList.insertAdjacentHTML('beforeend', appendHtml);
}

// ゲームの一覧のHTMLを作成
async function createItemListHtml(contents) {

    console.log("ゲームの一覧のHTMLを作成");
    console.log(contents);



    // ngListのデータを取得
    const getNgList = await chrome.storage.local.get(["ngList"]);
    const ngList = getNgList.ngList || [];

    // 拡張機能のストレージからブックマークリストを取得
    const getBookmarkList = await chrome.storage.local.get(["bookmarkList"]);
    const bookmarkList = getBookmarkList.bookmarkList || [];
        
    let itemListHtml = "";
    contents.forEach(function(item) {

        // ブックマークリストに含まれているかを確認
        const isBookmarked = bookmarkList.some(function(bookmark) {
            return bookmark.id === item.id;
        });

        // NGリストに含まれているかを確認
        const isNg = ngList.some(function(ng) {
            return ng.authorId === item.authorUserID;
        });


        let launchTypeStr = "";
        switch(item.launchType) {
            case "multi":
                launchTypeStr = "協力・対戦";
                break;
            case "podium":
                launchTypeStr = "全員対戦";
                break;
            case "self":
                launchTypeStr = "その他";
                break;
            default:
                launchTypeStr = "公式";
                break;
        }

        // "2025-09-23T05:39:58.000Z" を、 "2025/09/23" に変換
        // let createdDate = item.createdAt.split("T")[0].replace(/-/g, "/");

        const lgId = DOMPurify.sanitize(item.originContentID);
        const id = DOMPurify.sanitize(item.id);
        const itemThumbnail = DOMPurify.sanitize(item.thumbnailUrl);
        const itemTitle = DOMPurify.sanitize(item.title);
        const itemDescription = DOMPurify.sanitize(item.description);
        const authorName = DOMPurify.sanitize(item.authorName);

        // 公式ゲームの場合
        if(item.author) {
            let itemHtml = `
                <div class="item ${isBookmarked ? "bookmarked" : ""} ${isNg ? "ng" : ""}" data-lg-id="${lgId}" 
                data-id="${item.serviceProductId}" data-author-id="${item.authorUserID}" data-service-name="${item.serviceName}">
                    <div class="title-box">
                        <div class="left">
                            <img src="${itemThumbnail}" alt="${itemTitle}">
                        </div>
                        <div class="right">
                            <div class="title">${itemTitle}</div>
                        </div>
                    </div>
                    <div class="btnBox">
                        <div class="info">
                            <div class="author">
                                <span class="author-name">${item.author}</span>
                            </div>
                        </div>    
                        <div class="btn big">リクエスト</div>
                    </div>
                    <div class="bookmarkAdd" title="お気に入りに追加">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="" stroke-width="0"></g><g id="" stroke-linecap="round" stroke-linejoin="round"></g><g id=""> <path d="M9.15316 5.40838C10.4198 3.13613 11.0531 2 12 2C12.9469 2 13.5802 3.13612 14.8468 5.40837L15.1745 5.99623C15.5345 6.64193 15.7144 6.96479 15.9951 7.17781C16.2757 7.39083 16.6251 7.4699 17.3241 7.62805L17.9605 7.77203C20.4201 8.32856 21.65 8.60682 21.9426 9.54773C22.2352 10.4886 21.3968 11.4691 19.7199 13.4299L19.2861 13.9372C18.8096 14.4944 18.5713 14.773 18.4641 15.1177C18.357 15.4624 18.393 15.8341 18.465 16.5776L18.5306 17.2544C18.7841 19.8706 18.9109 21.1787 18.1449 21.7602C17.3788 22.3417 16.2273 21.8115 13.9243 20.7512L13.3285 20.4768C12.6741 20.1755 12.3469 20.0248 12 20.0248C11.6531 20.0248 11.3259 20.1755 10.6715 20.4768L10.0757 20.7512C7.77268 21.8115 6.62118 22.3417 5.85515 21.7602C5.08912 21.1787 5.21588 19.8706 5.4694 17.2544L5.53498 16.5776C5.60703 15.8341 5.64305 15.4624 5.53586 15.1177C5.42868 14.773 5.19043 14.4944 4.71392 13.9372L4.2801 13.4299C2.60325 11.4691 1.76482 10.4886 2.05742 9.54773C2.35002 8.60682 3.57986 8.32856 6.03954 7.77203L6.67589 7.62805C7.37485 7.4699 7.72433 7.39083 8.00494 7.17781C8.28555 6.96479 8.46553 6.64194 8.82547 5.99623L9.15316 5.40838Z" fill="#dddddd"></path> </g></svg>
                    </div>
                </div>
            `;
            itemListHtml += itemHtml;
        } else {
            // 自作ゲームの場合
            let itemHtml = `
                <div class="item ${isBookmarked ? "bookmarked" : ""} ${isNg ? "ng" : ""}" data-lg-id="${lgId}"
                data-id="${id}" data-author-id="${item.authorUserID}" data-service-name="akasha">
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
                            <div class="launchType" data-launch-type="${item.launchType}">${launchTypeStr}</div>
                            <div class="author">
                                <span class="category">作者</span>
                                <a href="https://namagame.coe.nicovideo.jp/users/${item.authorUserID}/games" target="_blank"><span class="author-name">${authorName}</span></a>
                            </div>
                        </div>    
                        <div class="btn big">リクエスト</div>
                    </div>
                    <div class="bookmarkAdd" title="お気に入りに追加">
                        <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="" stroke-width="0"></g><g id="" stroke-linecap="round" stroke-linejoin="round"></g><g id=""> <path d="M9.15316 5.40838C10.4198 3.13613 11.0531 2 12 2C12.9469 2 13.5802 3.13612 14.8468 5.40837L15.1745 5.99623C15.5345 6.64193 15.7144 6.96479 15.9951 7.17781C16.2757 7.39083 16.6251 7.4699 17.3241 7.62805L17.9605 7.77203C20.4201 8.32856 21.65 8.60682 21.9426 9.54773C22.2352 10.4886 21.3968 11.4691 19.7199 13.4299L19.2861 13.9372C18.8096 14.4944 18.5713 14.773 18.4641 15.1177C18.357 15.4624 18.393 15.8341 18.465 16.5776L18.5306 17.2544C18.7841 19.8706 18.9109 21.1787 18.1449 21.7602C17.3788 22.3417 16.2273 21.8115 13.9243 20.7512L13.3285 20.4768C12.6741 20.1755 12.3469 20.0248 12 20.0248C11.6531 20.0248 11.3259 20.1755 10.6715 20.4768L10.0757 20.7512C7.77268 21.8115 6.62118 22.3417 5.85515 21.7602C5.08912 21.1787 5.21588 19.8706 5.4694 17.2544L5.53498 16.5776C5.60703 15.8341 5.64305 15.4624 5.53586 15.1177C5.42868 14.773 5.19043 14.4944 4.71392 13.9372L4.2801 13.4299C2.60325 11.4691 1.76482 10.4886 2.05742 9.54773C2.35002 8.60682 3.57986 8.32856 6.03954 7.77203L6.67589 7.62805C7.37485 7.4699 7.72433 7.39083 8.00494 7.17781C8.28555 6.96479 8.46553 6.64194 8.82547 5.99623L9.15316 5.40838Z" fill="#dddddd"></path> </g></svg>
                    </div>
                </div>
            `;

            itemListHtml += itemHtml;
        }
    });

    return itemListHtml;
}