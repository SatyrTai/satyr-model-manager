
var noticeCardManager = null;

window.addEventListener(
    "load", 
    function (e) {
        noticeCardManager = new NoticeCardManager(this.document.body, 0.5, 98, "2vh", false);
    }
)

function timeout() {
    console.log("timeout")
}

function onerror() {
    console.log("onerror")
}

var loaded_model_infos = {}

function modelInfo_future_callback() {
    var model_info = loaded_model_infos[this.model_type_name+this.model_file_name]
    if (model_info != null || model_info != undefined) {
        delete loaded_model_infos[this.model_type_name+this.model_file_name]
    }
}

function httpCallback(reponseText) {
    var reponseJson = JSON.parse(reponseText)
    var model_type_name = reponseJson["model_type_name"]
    var model_file_name = reponseJson["model_file_name"]
    var key = model_type_name+model_file_name
    var modelInfo = loaded_model_infos[key]
    if (modelInfo == null || modelInfo == undefined) {
        modelInfo = new Model_Info(reponseJson)
        loaded_model_infos[key] = modelInfo
    }
    if (modelInfo.show()) {
        modelInfo.current_future.addCallback(
            NoticeCard_status.END, 
            modelInfo_future_callback.bind(modelInfo)
        )
    }
}

function send(model_type_name, model_file_name) {
    var model_info = loaded_model_infos[this.model_type_name+this.model_file_name]
    if (model_info != null && model_info != undefined) {
        //model_info.
    } else {
        httpPostAsync(
            "/model_manager_card_click_post", httpCallback, 
            {
                "model_type_name" : model_type_name,
                "model_file_name" : model_file_name, 
            }, timeout, onerror
        );
    }
}


document.addEventListener("keypress", function(e) {
    //console.log(e)
    switch (e.code) {
        case "KeyP" :
            noticeCardManager.notice_show("timelapse", "HTTP Error", "HTTP Error Occur", "10s")
            break;
        case "KeyG" :
            send("Lora", "betterCuteAsian03")
            break;
        case "KeyQ":
            console.log(Object.keys(loaded_model_infos).length)
            break;
        case "KeyX":
            var info = loaded_model_infos["LorabetterCuteAsian03"]
            if (info != null) {
                info.close()
            }
            break;
        default :
            console.log("default : " + e.code)

    }
})