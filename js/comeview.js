function comeview(){
  let menu = document.querySelector('.ext-setting-menu .ext-comeview');
  
  if(menu.getAttribute("ext-attr-on")) {  
    chrome.storage.local.set({"ext_comeview": "OFF"}, function() {});
    menu.removeAttribute("ext-attr-on");
  } else {
    chrome.storage.local.set({"ext_comeview": "ON"}, function() {});
    menu.setAttribute("ext-attr-on", "ON");
  }
}


if(location.href.startsWith("https://live.nicovideo.jp/")){

  // 前回起動時のボタンのON/OFF状態を読み込みONならばボタンをON状態にする
  chrome.storage.local.get("ext_comeview", function (value) {
    if(value.ext_comeview == "ON") {

      function injectScript(file, node) {
        var th = document.getElementsByTagName(node)[0];
        var s = document.createElement('script');
        s.setAttribute('type', 'text/javascript');
        s.setAttribute('src', file);
        th.appendChild(s);
      }
      injectScript( chrome.runtime.getURL('/js/comeview-inject.js'), 'body');

    }
  });
};




