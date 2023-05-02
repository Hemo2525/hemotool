function comeview(){
  let menu = document.querySelector('.ext-setting-menu .ext-comeview');
 

  // トグル
  if(menu.getAttribute("ext-attr-on")) {  
    chrome.storage.local.set({"ext_comeview": "OFF"}, function() {});
    menu.removeAttribute("ext-attr-on");
    // ショートカットを非アクティブ状態
    document.querySelector('#ext_shortcut .item.comeview').removeAttribute("active");

    document.querySelector("[class^=___contents-area___]").removeAttribute("ext-master-comeview");

  } else {
    chrome.storage.local.set({"ext_comeview": "ON"}, function() {});
    menu.setAttribute("ext-attr-on", "ON");
    // ショートカットをアクティブ状態
    document.querySelector('#ext_shortcut .item.comeview').setAttribute("active", "ON");

    document.querySelector("[class^=___contents-area___]").setAttribute("ext-master-comeview", "ON");
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
      document.querySelector('#ext_kotehanBox').innerHTML = "";

      /** DOM変化の監視を再開 */
      let targetLogDom = document.querySelector('#ext_kotehanBox');
      const logOption = {
          childList:  true,  //直接の子の変更を監視
      };
      obsKotehan.observe(targetLogDom, logOption);

    });
  }

  const logOption = {
    childList:  true,  //直接の子の変更を監視
  };
  const targetLogDom = document.querySelector('#ext_kotehanBox');
  const obsKotehan = new MutationObserver(watchKotehanBox);
  obsKotehan.observe(targetLogDom, logOption);

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




