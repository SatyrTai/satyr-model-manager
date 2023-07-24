

var noticeCardManager = null;
var objectPanel = null;
window.addEventListener(
    'load', 
    function(e) {
        noticeCardManager = new NoticeCardManager(
            this.document.body, 0.5, 50, "10vh", true);
        objectPanel = new ObjectPanel(
            document.getElementById("settings_main_panel"), 
            "settingPanelArray", "addButton", "deleteButton", 
            "settingPanelObject", "addButton", "deleteButton"
        );
        //console.log(objectPanel.__proto__)
        // get settings from server
        getSettings();
        // close settings panel
        settings_onclick(document.getElementById("settings"));

        var input_panel_save_api_json = this.document.getElementById("input_panel_save_api_json")
        input_panel_save_api_json.addEventListener('change', saveApiJson_click)
        var input_panel_preview_max_width = this.document.getElementById("input_panel_preview_max_width")
        input_panel_preview_max_width.addEventListener('blur', preview_max_width_blur)

    }
)

function http_timeout_callback(e) {
    noticeCardManager.notice_show("timelapse", "HTTP Error", "http timeout", "10s", null, "red")
}

function http_error_callback(e) {
    msg = "http_error : localhost closed or refused the connection."
    msg+= "\nreadyState : " + e.currentTarget.readyState
    msg+= "\nstatus : " + e.currentTarget.status
    noticeCardManager.notice_show("sync_disabled", "HTTP Error", msg, "10s", null, "red")
    set_autonew(false)
    console.log("http_error_callback")
}

window.addEventListener(
    'beforeunload', 
    function(e) {
        httpGetAsync("/close", null)
    }
);

var windowTimeOut = null;
var windowTimeOut_time = 3000; // 1s
function stopTimeOuts() {
    console.log("stopTimeOuts")
    if (windowTimeOut != null) {
        clearTimeout(windowTimeOut);
        windowTimeOut = null;
    }
    if (updateTimeout != null) {
        clearTimeout(updateTimeout);
        updateTimeout = null;
    }
}
window.addEventListener(
    "blur", 
    function(e) {
        //lost user focus
        //console.log("blur")
        if (!currentSettings['javascript_page_autorenew']) {return}
        if (windowTimeOut != null) {
            clearTimeout(windowTimeOut);
            windowTimeOut = null;
        }
        windowTimeOut = setTimeout(stopTimeOuts, windowTimeOut_time)
    }
)
window.addEventListener("focus", function(e) {
    //user focus
    if (!currentSettings['javascript_page_autorenew']) {return}
    if (windowTimeOut != null) {
        clearTimeout(windowTimeOut);
        windowTimeOut = null;
    }
    if (updateTimeout == null)
        update()
})

function input_panel_url_enter() {
    if (!document.getElementById("download_page").matches(":hover")) {return;}
    //if (document.getElementById("input_panel_url") == document.activeElement) {return;}
    document.getElementById("input_panel").onsubmit();
}

document.addEventListener("keypress", function(e) {
    //console.log(e)
    switch (e.code) {
        case "Enter" :
        case "NumpadEnter" :
            input_panel_url_enter();
            break;
        default :
            console.log("default : " + e.code)

    }
})

document.addEventListener("paste", function(e) {
    var input_panel_url = document.getElementById("input_panel_url");
    if (input_panel_url == document.activeElement) return;
    input_panel_url.value = e.clipboardData.getData('text/plain');
})