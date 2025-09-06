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

function addIchibaShortcut() {
    const ichibaShortcut = document.querySelector("#ext_ichiba_shortcut .item-box");
    ichibaShortcut.innerHTML = "";

    // タイムシフトなどで、ゲームを追加できない場合は、ショートカットを無効化
    const ichibaAddBtn = document.querySelector("[class^=___ichiba-counter-section___] [class^=___add-button___]");
    const bIsDisableIchiba = ichibaAddBtn && ichibaAddBtn.hasAttribute("disabled");
    if(bIsDisableIchiba){
        ichibaShortcut.classList.add("disabled");
    }

    /*
    console.log("--------------------------------");
    console.log(_embeddedDataJson);
    */

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

            ichibaShortcut.textContent = "";

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
                
                ichibaShortcut.appendChild(dom);

                img.addEventListener('click', function(){
                    if(bIsDisableIchiba){
                        return;
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


                    async function getProduct(programId, folderName, itemId) {
                        const url = "https://eapi.spi.nicovideo.jp/v1/users/self/authority?contentId=" + programId;                        

                        // fetchに渡す設定情報
                        const options = {
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
                            
                            // エラーなのでここで処理を中断
                            return; 
                        }

                        // 通信が成功した場合、応答をJSONとして解析
                        const data = await response.json();
                        console.log("成功:", data);
                        return data;                        
                    }


                    // 通信を実行し、結果を処理する非同期関数
                    async function postDataAndHandleErrors(programId, folderName, itemId) {
                        
                        const url = "https://eapi.spi.nicovideo.jp/v1/ichibas/" + programId + "/products";
                        
                        
                        // fetchに渡す設定情報
                        const options = {
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
                        "body": "{\"serviceName\":\"" + folderName + "\",\"serviceProductId\":\"" + itemId + "\",\"frontendId\":" + frontendId + ",\"frontendVersion\":\"" + frontendVersion + "\",\"expectedGrade\":5}",
                        "method": "POST",
                        "mode": "cors",
                        "credentials": "include"
                        };
                        
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
                                        const product = await getProduct(programId, item.folderName, item.itemId);
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


                        } catch (networkError) {
                            // ネットワーク接続の問題やCORSエラーなど、通信自体が失敗した場合
                            console.error("通信エラー:", networkError);
                            itemIcon.classList.remove("loading");
                        }
                    }

                    // 作成した関数を実行
                    postDataAndHandleErrors(programId, item.folderName, item.itemId);



                });
                
            });

            // 追加したアイテムはドラッグで並び替えできるようにする
            const items = document.querySelectorAll('#ext_ichiba_shortcut .item-box .item');
            const dropbox = document.querySelector('#ext_ichiba_shortcut .item-box');
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

            dropbox.addEventListener('dragover', function(event){
                event.preventDefault();
                
                // ドロップ可能な位置を視覚的に示す
                const afterElement = getDragAfterElement(dropbox, event.clientX);
                const draggables = [...dropbox.querySelectorAll('.item:not(.dragging)')];
                
                // 既存のインジケーターを削除
                draggables.forEach(item => item.classList.remove('drag-after'));
                
                if (afterElement) {
                    afterElement.classList.add('drag-after');
                }
            });

            dropbox.addEventListener('drop', function(event){
                event.preventDefault();
                
                if (!draggedElement) return;
                
                // ドロップ位置を計算
                const afterElement = getDragAfterElement(dropbox, event.clientX);
                
                if (afterElement == null) {
                    // 末尾に挿入
                    dropbox.appendChild(draggedElement);
                } else {
                    // 指定した要素の前に挿入
                    dropbox.insertBefore(draggedElement, afterElement);
                }
                
                // 視覚的インジケーターをクリア
                [...dropbox.querySelectorAll('.item')].forEach(item => 
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
            ichibaShortcut.textContent = "ここにゲームが登録されます。リクエスト済みのゲームをクリックするとショートカットに登録できます。";
        }
    });
}

async function showIchibaInfo(itemId, folderName){

    const extIchibaInfo = document.querySelector("#ext_ichiba_info");

    // 既に同じアイテムが表示されている場合は、表示を解除
    if(extIchibaInfo.classList.contains("show")){
        if(extIchibaInfo.getAttribute("data-item-id") === folderName + "-" + itemId){
            extIchibaInfo.classList.remove("show");
            return;
        }
    }

    // 情報ウインドウの位置と高さを設定
    const  playerHeight = document.querySelector('[class^=___player-display-screen___]').clientHeight * 0.9;
    const playerController = document.querySelector('[class^=___player-controller___]');
    extIchibaInfo.style.bottom = playerController.clientHeight + "px";
    extIchibaInfo.style.maxHeight = playerHeight + "px";


    extIchibaInfo.setAttribute("data-item-id", folderName + "-" + itemId);

    const data = await getIchibaProductInfo(folderName, itemId, _embeddedDataJson.program.nicoliveProgramId);
    console.log(data);


    const owner = await getOwner(data.data.id);
    console.log(owner);

    /*
    
    以下のDOMに、データを追加する

    <div id="ext_ichiba_info" class="show">
        <div class="game-box">
            <div class="left">
                <img src="画像URL" alt="アイテムタイトル">
            </div>
            <div class="right">
                <div class="title">アイテムタイトル</div>
            </div>
        </div>
        <div class="author-box">
            <div class="left">
                <img src="アイコンURL" alt="アイコンタイトル">
            </div>
            <div class="right">
                <a class="author-name" href="ユーザーURL" target="_blank">ドワンゴ</a>
                <span class="level">Lv.10</span>
            </div>
        </div>
        <div class="description-box">みんなで交互にストーンを投げてフィールドのストーンをこわしましょう。「ココ」機能無し版</div>
    </div>

    */

    const gameBox = document.querySelector("#ext_ichiba_info .game-box");
    gameBox.innerHTML = '<div class="left"></div><div class="right"></div></div>';

    const left = document.querySelector("#ext_ichiba_info .game-box .left");
    const leftImg = document.createElement('img');
    leftImg.src = data.data.thumbnailUrl;
    left.appendChild(leftImg);

    const right = document.querySelector("#ext_ichiba_info .game-box .right");
    const title = document.createElement('div');
    title.innerText = data.data.title;
    right.appendChild(title);

    const authorBox = document.querySelector("#ext_ichiba_info .author-box");

    if(owner.meta.status === 200) {
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
    } else {
        authorBox.classList.add("hide");
    }

    console.log("説明" + data.data.description);
    const descriptionBox = document.querySelector("#ext_ichiba_info .description-box");
    descriptionBox.innerText = data.data.description;


    // 表示する
    extIchibaInfo.classList.add("show");
    
}

async function getOwner(ownerId) {
    const url = "https://eapi.spi.nicovideo.jp/v2/products/products/" + ownerId + "/owner";

    // fetchに渡す設定情報
    const options = {
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
        
        // エラーなのでここで処理を中断
        return errorBody; 
    }

    // 通信が成功した場合、応答をJSONとして解析
    const data = await response.json();
    console.log("成功:", data);

    return data;
}

async function getIchibaProductInfo(folderName, itemId, programId) {
                
    const url =  "https://eapi.spi.nicovideo.jp/v2/services/" + folderName + "/products/" + itemId + "?exclude_registered=false&tmp_page_id=detail&contentId=" + programId;

    // fetchに渡す設定情報
    const options = {
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
        
        // エラーなのでここで処理を中断
        return; 
    }

    // 通信が成功した場合、応答をJSONとして解析
    const data = await response.json();
    console.log("成功:", data);

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
            waitTime.innerText = "次のリクエストが可能です";
        }
    }, 1000);
}