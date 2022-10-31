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




