
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
async function showIchibaInfoToGameLauncher(itemId, folderName){

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

        // 作者のアイコン
        authorIcon = owner.data.niconicoUserInfo.icons.urls["150x150"] || owner.data.niconicoUserInfo.icons.urls["50x50"];
        authorIconName = DOMPurify.sanitize(owner.data.niconicoUserInfo.displayName);

        // 作者の名前
        authorPageUrl= "https://www.nicovideo.jp/user/" + owner.data.niconicoUserInfo.id;
        authorName = DOMPurify.sanitize(owner.data.displayName);

        // 作者のレベル
        authorLevel = owner.data.niconicoUserInfo.level;

        // 作者の他のゲームを見る
        authorGamePageUrl = "https://namagame.coe.nicovideo.jp/users/" + owner.data.niconicoUserInfo.id + "/games";
    }

    const insertHtml = `
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
                <a class="more-info" href="${authorGamePageUrl}" target="_blank">この作者の他のゲームを見る</a>
            </div>
        </div>
        <div class="pr-photo-box">
            <img src="${prPhotoUrl}">
        </div>
        <div class="description-box">
            ${description}
        </div>
        <div class="loading-box">
            <div class="loader"></div>
        </div>
    `;

    document.querySelector("#HemoUserGameScreen .content-right").innerHTML = insertHtml;


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

async function getUserGameList(nicoliveProgramId, sortKey, sortOrder, limit, offset, launchTypes){
    let url = "https://services-eapi.spi.nicovideo.jp/v1/services/akasha/services/content/contents?programID=" + nicoliveProgramId +"&sortKey=" + sortKey + "&sortOrder=" + sortOrder + "&limit=" + limit + "&offset=" + offset;
    if(launchTypes) {
        url += "&launchTypes=" + launchTypes;
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
                break;
            case "user":
                viewUserGameList();
                break;
        }
    });


    // 自作ゲーム画面のフィルター(並び順)
    const sortInputs = document.querySelectorAll("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .search-box .radio-group .radio-item input[name='sort']");
    sortInputs.forEach(function(input) {
        input.addEventListener("change", function() {
            // 他のinputのcheckedをfalseにする
            sortInputs.forEach(function(input) {
                if(input !== this) {
                    input.setAttribute("checked", "false");
                }
            });
            // checkedを設定
            input.setAttribute("checked", "true");
            // フィルターを適用
            viewUserGameList();
        });
    });

    // 自作ゲーム画面のフィルター(ゲームタイプ)
    const gameTypeInputs = document.querySelectorAll("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .search-box .radio-group .radio-item input[name='game_type']");
    gameTypeInputs.forEach(function(input) {
        input.addEventListener("change", function() {
            // 他のinputのcheckedをfalseにする
            gameTypeInputs.forEach(function(input) {
                if(input !== this) {
                    input.setAttribute("checked", "false");
                }
            });
            // checkedを設定
            input.setAttribute("checked", "true");
            // フィルターを適用
            viewUserGameList();
        });
    });


    // 自作ゲームの一覧をクリックしたら、ゲームの詳細情報を表示
    const itemList = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .item-list");
    itemList.addEventListener("click", function(e) {
        // .closest('.item')で、その要素から一番近い親の.itemを探す
        const itemElement = e.target.closest('.item');
        if(itemElement) {
            showIchibaInfoToGameLauncher(itemElement.getAttribute("data-id"), "akasha");
        }
    });
}


// 「自作ゲーム」タブがクリックされたらデータを表示する
async function viewUserGameList() {

    // 現在のフィルターの設定を取得
    const sortKey = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .search-box .radio-group .radio-item input[name='sort'][checked='true']").getAttribute('value');
    const launchTypes = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .search-box .radio-group .radio-item input[name='game_type'][checked='true']").getAttribute('value');
    
    console.log("自作ゲームの一覧を取得");
    const res = await getUserGameList(_embeddedDataJson.program.nicoliveProgramId, sortKey, "DESC", "21", "0", launchTypes);
    console.log(res);

    let itemListHtml = "";
    let contentCount = res.data.contents.length;

    // ゲーム一覧のDOMを作成
    itemListHtml = createItemHtml(res.data.contents);

    let appendHtml = "";
    appendHtml += '<div class="item dummy"></div>';
    appendHtml += '<div class="item dummy"></div>';
    appendHtml += '<div class="item dummy"></div>';
    appendHtml += '<div class="more-btn">もっと見る</div>';

    // ゲーム一覧のDOMを追加
    const itemList = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .item-list");
    itemList.innerHTML = itemListHtml + appendHtml;

    // もっと見るボタン
    const moreBtn = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .more-btn");
    moreBtn.addEventListener("click", function() { moreBtnClick(itemListHtml, appendHtml, sortKey, launchTypes, contentCount); });
}

async function moreBtnClick(itemListHtml, appendHtml, sortKey, launchTypes, contentCount) {
    console.log("自作ゲームの一覧を取得");
    const res = await getUserGameList(_embeddedDataJson.program.nicoliveProgramId, sortKey, "DESC", "21", contentCount, launchTypes);
    contentCount += res.data.contents.length;

    
    itemListHtml += createItemHtml(res.data.contents);

    const itemList = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .item-list");
    itemList.innerHTML = itemListHtml + appendHtml;

    const moreBtn = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='user'] .more-btn");
    moreBtn.addEventListener("click", function() { moreBtnClick(itemListHtml, appendHtml, sortKey, launchTypes, contentCount); });
}

function createItemHtml(contents) {
    let itemListHtml = "";
    contents.forEach(function(item) {

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
        }

        // "2025-09-23T05:39:58.000Z" を、 "2025/09/23" に変換
        // let createdDate = item.createdAt.split("T")[0].replace(/-/g, "/");

        const lgId = DOMPurify.sanitize(item.originContentID);
        const id = DOMPurify.sanitize(item.id);
        const itemThumbnail = DOMPurify.sanitize(item.thumbnailUrl);
        const itemTitle = DOMPurify.sanitize(item.title);
        const itemDescription = DOMPurify.sanitize(item.description);
        const authorName = DOMPurify.sanitize(item.authorName);

        let itemHtml = `
            <div class="item" data-lg-id="${lgId}" data-id="${id}">
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
                <div class="bookmarkAdd">
                        <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="" stroke-width="0"></g><g id="" stroke-linecap="round" stroke-linejoin="round"></g><g id=""> <path d="M9.15316 5.40838C10.4198 3.13613 11.0531 2 12 2C12.9469 2 13.5802 3.13612 14.8468 5.40837L15.1745 5.99623C15.5345 6.64193 15.7144 6.96479 15.9951 7.17781C16.2757 7.39083 16.6251 7.4699 17.3241 7.62805L17.9605 7.77203C20.4201 8.32856 21.65 8.60682 21.9426 9.54773C22.2352 10.4886 21.3968 11.4691 19.7199 13.4299L19.2861 13.9372C18.8096 14.4944 18.5713 14.773 18.4641 15.1177C18.357 15.4624 18.393 15.8341 18.465 16.5776L18.5306 17.2544C18.7841 19.8706 18.9109 21.1787 18.1449 21.7602C17.3788 22.3417 16.2273 21.8115 13.9243 20.7512L13.3285 20.4768C12.6741 20.1755 12.3469 20.0248 12 20.0248C11.6531 20.0248 11.3259 20.1755 10.6715 20.4768L10.0757 20.7512C7.77268 21.8115 6.62118 22.3417 5.85515 21.7602C5.08912 21.1787 5.21588 19.8706 5.4694 17.2544L5.53498 16.5776C5.60703 15.8341 5.64305 15.4624 5.53586 15.1177C5.42868 14.773 5.19043 14.4944 4.71392 13.9372L4.2801 13.4299C2.60325 11.4691 1.76482 10.4886 2.05742 9.54773C2.35002 8.60682 3.57986 8.32856 6.03954 7.77203L6.67589 7.62805C7.37485 7.4699 7.72433 7.39083 8.00494 7.17781C8.28555 6.96479 8.46553 6.64194 8.82547 5.99623L9.15316 5.40838Z" fill="#dddddd"></path> </g></svg>
                    <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M4 6H20M4 12H20M4 18H20" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                </div>
                <div class="popup-box">
                    <div class="btn-area">
                        <div class="btn">作者の作品をNG登録</div>
                        <div class="btn">ショートカットに追加</div>    
                    </div>
                </div>
            </div>
        `;
        itemListHtml += itemHtml;
    });

    return itemListHtml;
}