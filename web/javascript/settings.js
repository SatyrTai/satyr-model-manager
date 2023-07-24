var objectPanel_settings = {
    "recognized" : {
        "__settings_value_type__" : "array",
        "__settings_title__" : "Input the model type in Key ",
        "__settings_Key_placeholder__" : "Key",
    },
    "paths" : {
        "__settings_value_type__" : "array",
        "__settings_title__" : "Input the model type in Key And path that model type store to.",
        "__settings_Key_placeholder__" : "Key",
    },
    "api_json_path" : {
        "__settings_title_enable__" : true,
        "__settings_value_type__" : "url",
    },

}
var currentSettings = null;
function applyCurrentSettings() {
    objectPanel.solve(currentSettings, objectPanel_settings)
    set_autonew(currentSettings["javascript_page_autorenew"]);
    set_file_download(currentSettings["javascript_page_file_download"])
    set_animation_on_off(currentSettings["javascript_page_animation_on_off"]);
    input_range_card_size_oninput(currentSettings["javascript_page_card_size"]);
    setSaveApiJson(currentSettings["saveModelApiJson"])
    setPreviewMaxWidth(currentSettings["preview_max_width"])
    if (cardManager == null) {cardManager = new CardManager(30, document.getElementById("cards"));}
    //else {cardManager.setMaxCount()}
}

function getSettings_callback(responseText) {
    currentSettings = JSON.parse(responseText);
    applyCurrentSettings();
    update();
}

function getSettings() {
    httpGetAsync("/settings", getSettings_callback);
}

function sendSettings_callback(responseText) {
    getSettings_callback(responseText);
    noticeCardManager.notice_show("settings", "Setting", "new Setting applyed", "5s");
}

function sendSettings() {
    var newSettings = objectPanel.get();
    httpPostAsync("/sendsettings", sendSettings_callback, newSettings);
}