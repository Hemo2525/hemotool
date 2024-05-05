function comeview(){
  let menu = document.querySelector('.ext-setting-menu .ext-comeview');
 

  // トグル
  if(menu.getAttribute("ext-attr-on")) {  
    chrome.storage.local.set({"ext_comeview": "OFF"}, function() {});
    menu.removeAttribute("ext-attr-on");
    // ショートカットを非アクティブ状態
    document.querySelector('#ext_shortcut .item.comeview').removeAttribute("active");

    document.querySelector("[class^=___contents-area___]").removeAttribute("ext-master-comeview");
    document.querySelector("body").removeAttribute("ext-master-comeview");

    // コメビュの幅を元に戻す
    removeSplitterSize();   

  } else {
    chrome.storage.local.set({"ext_comeview": "ON"}, function() {});
    menu.setAttribute("ext-attr-on", "ON");
    // ショートカットをアクティブ状態
    document.querySelector('#ext_shortcut .item.comeview').setAttribute("active", "ON");

    document.querySelector("[class^=___contents-area___]").setAttribute("ext-master-comeview", "ON");
    document.querySelector("body").setAttribute("ext-master-comeview", "ON");

    // コメビュの幅を広げる
    setSplitterSize(true); 
  }
}

function comeview_option_icon(){
  let input = document.querySelector('.ext-setting-menu .ext-comeview .option.icon input');
  
  // トグル
  if(input.checked) {  // 注意　クリックされて変化後の値が入っている
    chrome.storage.local.set({"ext_comeview_opt_icon": "ON"}, function() {});
    document.querySelector("[class^=___contents-area___]").setAttribute("ext-opt-icon", "ON");

  } else {
    chrome.storage.local.set({"ext_comeview_opt_icon": "OFF"}, function() {});
    document.querySelector("[class^=___contents-area___]").removeAttribute("ext-opt-icon");
  }
}

function comeview_option_wide(){
  let input = document.querySelector('.ext-setting-menu .ext-comeview .option.wide input');
  
  // トグル
  if(input.checked) {  // 注意　クリックされて変化後の値が入っている
    chrome.storage.local.set({"ext_comeview_opt_wide": "ON"}, function() {});
    document.querySelector("body").setAttribute("ext-opt-wide", "ON");

    // コメビュの幅を広げる
    setSplitterSize(true);

  } else {
    chrome.storage.local.set({"ext_comeview_opt_wide": "OFF"}, function() {});
    document.querySelector("body").removeAttribute("ext-opt-wide");

    // コメビュの幅を元に戻す
    removeSplitterSize();

  }
}

function comeview_option_name(){
  let input = document.querySelector('.ext-setting-menu .ext-comeview .option.name input');
  
  // トグル
  if(input.checked) {  // 注意　クリックされて変化後の値が入っている
    chrome.storage.local.set({"ext_comeview_opt_name": "ON"}, function() {});
    document.querySelector("[class^=___contents-area___]").setAttribute("ext-opt-name", "ON");

  } else {
    chrome.storage.local.set({"ext_comeview_opt_name": "OFF"}, function() {});
    document.querySelector("[class^=___contents-area___]").removeAttribute("ext-opt-name");
  }
}

function comeview_option_orikaeshi(){
  let input = document.querySelector('.ext-setting-menu .ext-comeview .option.orikaeshi input');
  
  // トグル
  if(input.checked) {  // 注意　クリックされて変化後の値が入っている
    chrome.storage.local.set({"ext_comeview_opt_orikaeshi": "ON"}, function() {});
    document.querySelector("[class^=___contents-area___]").setAttribute("ext-opt-orikaeshi", "ON");

  } else {
    chrome.storage.local.set({"ext_comeview_opt_orikaeshi": "OFF"}, function() {});
    document.querySelector("[class^=___contents-area___]").removeAttribute("ext-opt-orikaeshi");
  }
}

function comeview_option_premium(){
  let input = document.querySelector('.ext-setting-menu .ext-comeview .option.premium input');
  
  // トグル
  if(input.checked) {  // 注意　クリックされて変化後の値が入っている
    chrome.storage.local.set({"ext_comeview_opt_premium": "ON"}, function() {});
    document.querySelector("[class^=___contents-area___]").setAttribute("ext-opt-premium", "ON");

  } else {
    chrome.storage.local.set({"ext_comeview_opt_premium": "OFF"}, function() {});
    document.querySelector("[class^=___contents-area___]").removeAttribute("ext-opt-premium");
  }
}

function comeview_option_color(){
  let input = document.querySelector('.ext-setting-menu .ext-comeview .option.color input');
  
  // トグル
  if(input.checked) {  // 注意　クリックされて変化後の値が入っている
    chrome.storage.local.set({"ext_comeview_opt_color": "ON"}, function() {});
    document.querySelector("[class^=___contents-area___]").setAttribute("ext-opt-color", "ON");

  } else {
    chrome.storage.local.set({"ext_comeview_opt_color": "OFF"}, function() {});
    document.querySelector("[class^=___contents-area___]").removeAttribute("ext-opt-color");
  }
}

function comeview_option_kotehan(){
  let input = document.querySelector('.ext-setting-menu .ext-comeview .option.kotehan input');
  
  // トグル
  if(input.checked) {  // 注意　クリックされて変化後の値が入っている
    chrome.storage.local.set({"ext_comeview_opt_kotehan": "ON"}, function() {});
    document.querySelector("[class^=___contents-area___]").setAttribute("ext-opt-kotehan", "ON");

  } else {
    chrome.storage.local.set({"ext_comeview_opt_kotehan": "OFF"}, function() {});
    document.querySelector("[class^=___contents-area___]").removeAttribute("ext-opt-kotehan");
  }
}

function comeview_option_commentnum(){
  let input = document.querySelector('.ext-setting-menu .ext-comeview .option.commentnum input');
  
  // トグル
  if(input.checked) {  // 注意　クリックされて変化後の値が入っている
    chrome.storage.local.set({"ext_comeview_opt_commentnum": "ON"}, function() {});
    document.querySelector("[class^=___contents-area___]").setAttribute("ext-opt-commentnum", "ON");

  } else {
    chrome.storage.local.set({"ext_comeview_opt_commentnum": "OFF"}, function() {});
    document.querySelector("[class^=___contents-area___]").removeAttribute("ext-opt-commentnum");
  }
}




let _Kotehan_comeview = [];

function getKotehan() {

  //chrome.storage.local.remove('kotehan');

  chrome.storage.local.get("kotehan", function (value) {
      if(value && value.kotehan && Array.isArray(value.kotehan)) {
        _Kotehan_comeview = value.kotehan;

        console.log("▼localに保存されているコテハン");
        console.log(_Kotehan_comeview);

        if(_Kotehan_comeview.length > 0 && document.querySelector("#ext_kotehanToInjectBox")) {
          
          var dom = document.createElement('p');
          var domText = document.createTextNode(JSON.stringify(_Kotehan_comeview));
          dom.appendChild(domText);
          document.querySelector("#ext_kotehanToInjectBox").appendChild(dom);

          console.log("inject側のDOMにコテハンを追加");

        }

      }
  });
}

function setKotehan(kotehan_id, kotehan_kotehan) {

    // 既に同じIDの人が登録されていれば削除してから追加
    _Kotehan_comeview = _Kotehan_comeview.filter(function (x) { return x.id !== kotehan_id });

    let item = { id : kotehan_id, kotehan : kotehan_kotehan };
    _Kotehan_comeview.push(item);
    chrome.storage.local.set({ "kotehan": _Kotehan_comeview }, function () { });

}


function kotehanInitialize(){

  function watchKotehanBox(mutationRecords, observer){
    mutationRecords.forEach(item => {
      //console.debug(item.addedNodes[0].outerText);
      let kotehanJson = item.addedNodes[0].outerText;
      let kote = JSON.parse(kotehanJson);

      setKotehan(kote.id, kote.kotehan);


      /** DOM変化の監視を一時停止 */
      obsKotehan.disconnect();

      /* pタグの削除 */
      let kotehanBox = document.getElementById('ext_kotehanBox');
      kotehanBox.innerHTML = "";

      /** DOM変化の監視を再開 */
      const logOption = {
          childList:  true,  //直接の子の変更を監視
      };
      obsKotehan.observe(kotehanBox, logOption);

    });
  }

  const logOption = {
    childList:  true,  //直接の子の変更を監視
  };
  const targetLogDom = document.getElementById('ext_kotehanBox');
  const obsKotehan = new MutationObserver(watchKotehanBox);
  obsKotehan.observe(targetLogDom, logOption);

};





let _Color_comeview = [];

function getColor() {


  chrome.storage.local.get("color", function (value) {
      if(value && value.color && Array.isArray(value.color)) {
        _Color_comeview = value.color;

        console.log("▼localに保存されているカラー設定");
        console.log(_Color_comeview);

        let colorToInjuectBoxDom = document.getElementById("ext_colorToInjectBox");

        if(_Color_comeview.length > 0 && colorToInjuectBoxDom) {
          
          var dom = document.createElement('p');
          var domText = document.createTextNode(JSON.stringify(_Color_comeview));
          dom.appendChild(domText);
          colorToInjuectBoxDom.appendChild(dom);

          console.log("inject側のDOMにカラー設定を追加");

        }

      }
  });
}

function setColor(user_id, textColor, bgColor, date) {

    // 既に同じIDの人が登録されていれば削除してから追加
    _Color_comeview = _Color_comeview.filter(function (x) { return x.id !== user_id });

    let item = { 
      id : user_id,
      textColor : textColor,
      bgColor : bgColor,
      createDate : date
    };
    _Color_comeview.push(item);
    chrome.storage.local.set({ "color": _Color_comeview }, function () { });
}
function deleteColor(user_id) {

  // IDの人を削除
  _Color_comeview = _Color_comeview.filter(function (x) { return x.id !== user_id });

  // IDの人を削除した構造体を保存
  chrome.storage.local.set({ "color": _Color_comeview }, function () { });
}


function colorInitialize(){

  function watchColorBox(mutationRecords, observer){
    mutationRecords.forEach(item => {
      //console.debug(item.addedNodes[0].outerText);
      let colorJson = item.addedNodes[0].outerText;
      let color = JSON.parse(colorJson);

      if(color.deleteFlag) {
        deleteColor(color.id);
      } else {
        setColor(color.id, color.textColor, color.bgColor, color.date);
      }

      /** DOM変化の監視を一時停止 */
      obsColor.disconnect();

      /* pタグの削除 */
      let colorBox = document.getElementById('ext_colorBox');
      while( colorBox.firstChild ){
        colorBox.removeChild( colorBox.firstChild );
      }      

      /** DOM変化の監視を再開 */
      const logOption = {
          childList:  true,  //直接の子の変更を監視
      };
      obsColor.observe(colorBox, logOption);

    });
  }

  const logOption = {
    childList:  true,  //直接の子の変更を監視
  };
  const targetLogDom = document.getElementById('ext_colorBox');
  const obsColor = new MutationObserver(watchColorBox);
  obsColor.observe(targetLogDom, logOption);

};



if(location.href.startsWith("https://live.nicovideo.jp/")){

  // 前回起動時のボタンのON/OFF状態を読み込みONならばボタンをON状態にする
/*
  chrome.storage.local.get("ext_comeview", function (value) {
    if(value.ext_comeview == "ON") {
*/
      function injectScript(file, node) {
        var th = document.getElementsByTagName(node)[0];
        var s = document.createElement('script');
        s.setAttribute('type', 'text/javascript');
        s.setAttribute('src', file);
        th.appendChild(s);
      }
      injectScript( chrome.runtime.getURL('/js/comeview-inject.js'), 'body');
/*
    }
  });
*/
};




