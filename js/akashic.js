function setAkashicParentFrameEvent(){
    
    /*-----------------------------------------
    ここはakashicのiframe内(親)
    -------------------------------------------*/

    var childFrame = document.querySelector("iframe"); // akashicのiframeは1つだけ
    if(childFrame){
        //console.log(childFrame.contentDocument);
    }

    window.addEventListener("message", receiveMessage, false);

    function receiveMessage(event) {
        //console.log(event);

        /*
        if(event.data.type != "amf:[t]") {
            //console.log(event.data.type==="loader:setMasterVolume");
        }
        */

        if(event.data.type==="loader:setMasterVolume") {
            //console.log(event);
        }

        if (event.origin === "https://live.nicovideo.jp") {
            
            if(event.data == "EXT-RIGHTCLICK-OFF") {
                //console.log(event);
                document.oncontextmenu = function () {return true;}
                childFrame.contentDocument.oncontextmenu = function () {return true;}
            }
            if(event.data == "EXT-RIGHTCLICK-ON") {
                //console.log(event);
                document.oncontextmenu = function () {return false;}
                childFrame.contentDocument.oncontextmenu = function () {return false;}
            }

        }
        return true;
    }
}