
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
    "method": "POST",
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

async function getProduct(programId) {
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


async function getGrade(programId) {
    const url = "https://eapi.spi.nicovideo.jp/v1/contents/" + programId + "/grade";                        

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
        "body": "{\"serviceName\":\"" + item.folderName + "\",\"serviceProductId\":\"" + item.itemId + "\",\"frontendId\":" + frontendId + ",\"frontendVersion\":\"" + frontendVersion + "\",\"expectedGrade\":" + grade.data.programGrade + "}",
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


async function getIchibaGameInfo(lgId) {

    // 以下のURLからHTMLを取得して特定のタグのテキストを取得する
    // https://namagame.coe.nicovideo.jp/games/lg0000

    const url = "https://namagame.coe.nicovideo.jp/games/" + lgId;
    const response = await fetch(url);
    
    // response.ok はステータスコードが200-299の範囲にあるかを示す
    // falseの場合、サーバーがエラーを返したことを意味する
    if (!response.ok) {
        console.error(`HTTPエラーが発生しました: ${response.status} ${response.statusText}`);
        /*
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
        */
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



async function getIchibaServiceInfo(folderName, itemId, programId) {

    const url ="https://services-eapi.spi.nicovideo.jp/v1/services/" + folderName + "/services/program/programs/" + programId + "/contents/" + itemId;
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

    return data;

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
    // console.log("成功:", data);

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
    // console.log("成功:", data);

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

    gameLauncher.addEventListener("click", function() {
        overlay.classList.toggle("show");
        document.querySelector("body").style.overflow = "hidden";
    });

    overlay.addEventListener("click", function(e) {
        // クリックされた要素（event.target）が、
        // イベントリスナーを設定した要素（overlay）自身であった場合
        if (e.target === overlay) {
            // showクラスを削除する
            overlay.classList.remove('show');
            document.querySelector("body").style.overflow = "auto";
        }
    });


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
        const screen = document.querySelector("#ext_nico_game_launcher .screen[data-hemo-game-tab='" + tab.getAttribute("data-hemo-game-tab") + "']");
        screen.classList.add("active");
    });
}


async function getUserGameList(){

}


/*
https://eapi.spi.nicovideo.jp/v2/contents/lv348703573/sections/top

{
    "meta": {
        "status": 200
    },
    "data": {
        "sections": [
            {
                "contents": [
                    {
                        "author": "ドワンゴ",
                        "id": 65583,
                        "serviceName": "game",
                        "serviceProductId": "848",
                        "thumbnailUrl": "https://resource.spi.nicovideo.jp/spi/product/thumbnails/game-848-320x320-660bb94b3cfdb.png",
                        "title": "姫プタワーR 2025.09",
                        "usableState": "DUPLICATED"
                    }
                ],
                "id": 279,
                "isPrivate": false,
                "score": 24.3,
                "title": "イベント開催中!"
            },
            {
                "contents": [
                    {
                        "author": "提供: ドワンゴ",
                        "id": 80739,
                        "serviceName": "game",
                        "serviceProductId": "911",
                        "thumbnailUrl": "https://resource.spi.nicovideo.jp/spi/product/thumbnails/game-911-320x320-68b65f6f7d010.png",
                        "title": "わかせ！まき割りつりっくま",
                        "usableState": "DUPLICATED"
                    }
                ],
                "id": 282,
                "isPrivate": false,
                "score": 24.6,
                "title": "新作ニコ生ゲームリリース！"
            },
            {
                "contents": [
                    {
                        "author": "nm",
                        "id": 80740,
                        "serviceName": "akasha",
                        "serviceProductId": "17757",
                        "thumbnailUrl": "https://resource.spi.nicovideo.jp/akasha/thumbnails/ec791df6ddd96a808a09a0f91a3fda6b31a66a4af9b76afcf89c4ff743499fce",
                        "title": "ディジチェーン",
                        "usableState": "ONLY_PREMIUM_USER"
                    },
                    {
                        "author": "スタイルズ・クラッシュ",
                        "id": 80742,
                        "serviceName": "akasha",
                        "serviceProductId": "17837",
                        "thumbnailUrl": "https://resource.spi.nicovideo.jp/akasha/thumbnails/deadf75ec4d268bcded45518544cd4e632692fcce0418461910cf981be11fbe1",
                        "title": "Getout PIGEON",
                        "usableState": "ONLY_PREMIUM_USER"
                    },
                    {
                        "author": "きゃん。",
                        "id": 80743,
                        "serviceName": "akasha",
                        "serviceProductId": "17749",
                        "thumbnailUrl": "https://resource.spi.nicovideo.jp/akasha/thumbnails/1a57a40f00e845a4c4cf74b8ec2ae53076ea3f154f1084b4250937f65a1412ed",
                        "title": "コメント使ってみんなでお題あて",
                        "usableState": "ONLY_PREMIUM_USER"
                    }
                ],
                "id": 278,
                "isPrivate": false,
                "score": 24.8,
                "title": "新作おすすめゲーム"
            },
            {
                "contents": [
                    {
                        "author": "shink＠らむ",
                        "id": 80744,
                        "serviceName": "akasha",
                        "serviceProductId": "17611",
                        "thumbnailUrl": "https://resource.spi.nicovideo.jp/akasha/thumbnails/6a8ce05af3740f2b2f9acaab1475a76dbc45102284b2197c3f61bfd1341bd1e9",
                        "title": "イス取りゲーム",
                        "usableState": "ONLY_PREMIUM_USER"
                    },
                    {
                        "author": "にばっち",
                        "id": 80745,
                        "serviceName": "akasha",
                        "serviceProductId": "17189",
                        "thumbnailUrl": "https://resource.spi.nicovideo.jp/akasha/thumbnails/9a7493b03c1f7a405d083beb6a7ca68c266ea7290b85987a3e5557c66e5e1b7e",
                        "title": "潜海",
                        "usableState": "ONLY_PREMIUM_USER"
                    },
                    {
                        "author": "岩尾",
                        "id": 80746,
                        "serviceName": "akasha",
                        "serviceProductId": "17561",
                        "thumbnailUrl": "https://resource.spi.nicovideo.jp/akasha/thumbnails/12bf609e6bbdc4ce1582c575b5c1147fd635d86b025aff32fad2c9c1a0cab57d",
                        "title": "どうぶつイコカ",
                        "usableState": "ONLY_PREMIUM_USER"
                    },
                    {
                        "author": "カフェ142mg",
                        "id": 80747,
                        "serviceName": "akasha",
                        "serviceProductId": "17973",
                        "thumbnailUrl": "https://resource.spi.nicovideo.jp/akasha/thumbnails/e87926ccbfd8c47a4769b44199d0871cad04ce200e07e09a6e63234a8db39341",
                        "title": "けだまど（β）毛玉vs魔道士",
                        "usableState": "ONLY_PREMIUM_USER"
                    },
                    {
                        "author": "たかしうむ",
                        "id": 80748,
                        "serviceName": "akasha",
                        "serviceProductId": "16885",
                        "thumbnailUrl": "https://resource.spi.nicovideo.jp/akasha/thumbnails/7d60c89e75385f7af91091594994430a908889e590e829922ca594111dff2198",
                        "title": "ボウリングラン",
                        "usableState": "ONLY_PREMIUM_USER"
                    },
                    {
                        "author": "かーーーぼん ☆",
                        "id": 80749,
                        "serviceName": "akasha",
                        "serviceProductId": "17578",
                        "thumbnailUrl": "https://resource.spi.nicovideo.jp/akasha/thumbnails/0057db2f3b2dd03115f1ef4aba0a742bfb40b866949916fdd9f5337e2f202383",
                        "title": "井戸祓い -ｲﾄﾞﾊﾞﾗｲ-　　※ホラー注意",
                        "usableState": "ONLY_PREMIUM_USER"
                    }
                ],
                "id": 190,
                "isPrivate": false,
                "score": 24.9,
                "title": "急上昇自作ゲームランキング"
            },
            {
                "contents": [
                    {
                        "author": "提供: ドワンゴ",
                        "id": 80750,
                        "serviceName": "game",
                        "serviceProductId": "524",
                        "thumbnailUrl": "https://resource.spi.nicovideo.jp/officialContent/thumbnails/5e8ad86e0e171-320x320.png",
                        "title": "ニコニコタワー",
                        "usableState": "DUPLICATED"
                    },
                    {
                        "author": "提供: ドワンゴ",
                        "id": 80751,
                        "serviceName": "game",
                        "serviceProductId": "91",
                        "thumbnailUrl": "https://resource.spi.nicovideo.jp/spi/product/thumbnails/game-91-320x320-5b7f8c031ece3.png",
                        "title": "ドレミファメモリー",
                        "usableState": "ONLY_PREMIUM_USER"
                    },
                    {
                        "author": "提供: ドワンゴ",
                        "id": 80752,
                        "serviceName": "game",
                        "serviceProductId": "76",
                        "thumbnailUrl": "https://resource.spi.nicovideo.jp/spi/product/thumbnails/game-76-320x320-5c53cc527c48d.png",
                        "title": "どすこいちゃんこ",
                        "usableState": "ONLY_PREMIUM_USER"
                    },
                    {
                        "author": "ラック",
                        "id": 80753,
                        "serviceName": "akasha",
                        "serviceProductId": "2529",
                        "thumbnailUrl": "https://dcdn.cdn.nimg.jp/spi/assets/atsumaru/5a9993279334809c858681b574cf9ee93e83f9de4dda5ca37ed3b15e1facd915",
                        "title": "スピード伐採",
                        "usableState": "ONLY_PREMIUM_USER"
                    },
                    {
                        "author": "ラック",
                        "id": 80754,
                        "serviceName": "akasha",
                        "serviceProductId": "3066",
                        "thumbnailUrl": "https://dcdn.cdn.nimg.jp/spi/assets/atsumaru/0ac903012201fea92fb384e7235abc9c4ef85be3d451bddbbadbc0f42d0ba2cd",
                        "title": "スーパーボールすくい",
                        "usableState": "ONLY_PREMIUM_USER"
                    },
                    {
                        "author": "5.0 ★★★★★",
                        "id": 80755,
                        "serviceName": "akasha",
                        "serviceProductId": "12532",
                        "thumbnailUrl": "https://resource.spi.nicovideo.jp/akasha/thumbnails/d6ec98736a4f0244f7cff3fded0c8751bd312ebfdd854f6f42d9f37f1741937d",
                        "title": "つりクッマ",
                        "usableState": "ONLY_PREMIUM_USER"
                    }
                ],
                "id": 192,
                "isPrivate": false,
                "score": 25,
                "title": "定番ゲーム"
            }
        ]
    }
}

*/