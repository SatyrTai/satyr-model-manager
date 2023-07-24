
var updateTimeout = null;
var lastPageData_responseJson = null;

var cardManager = null; // create when applyCurrentSettings being call the first time

function update_callback(responseText) {
    var responseJson = JSON.parse(responseText);
    lastPageData_responseJson = responseJson
    cardManager.progress(lastPageData_responseJson)
}

function update() {
    if (!currentSettings['javascript_page_autorenew']) {return}
    httpGetAsync("/pagedata", update_callback, http_timeout_callback, http_error_callback);
    if (updateTimeout != null) {
        clearTimeout(updateTimeout);
    }
    var delta = 5000
    if (currentSettings != null) {
        delta = currentSettings.javascript_page_update_delta;
    }
    else {
        console.log("using default delta -> " + delta);
    }
    updateTimeout = setTimeout(update, delta);
}

function download_page_input_panel_from_callback(responseText) {
    var responseJson = JSON.parse(responseText);
    var color = "rgb(255,255,255)";
    var clickEvent = function(e) {   
        var types = responseJson["modelType"]
        document.getElementById("settings").click()
        for (i in types) {
            objectPanel.result_object.paths.object_add_button.click()
            objectPanel.result_object.paths.new_panel_input.value = types[i]
            objectPanel.result_object.paths.new_panel_button.click()
        }
        var target = objectPanel.result_object.paths[types[0]]
        target.array_add_button.click()
        target.input_0.placeholder = "Directory(Click save to apply)"
        target.input_0.focus()
        
        /*
        noticeCardManager.window_show(
            this.the_card.title.innerText, 
            function(parent) {
                parent.style.width = "100%"
                parent.style.height = "100%"
                parent.style.display = "flex"
                parent.style.flexDirection = "row"
                parent.style.flexFlow = "column"
                parent.style.justifyContent = "start"
                parent.style.alignItems = "start"
                var types = responseJson["modelType"]
                for (i in types) {
                    var div = document.createElement("div")
                    div.style.width = "100%"
                    div.style.height = "fit-content"
                    div.style.display = "flex"
                    div.style.flexDirection = "row"
                    div.style.flexFlow = "row"
                    div.style.justifyContent = "start"
                    div.style.alignItems = "start"
                    div.style.gap = "10px"
                    div.style.padding = "10px"
                    var nameTag = document.createElement("p")
                    nameTag.innerText = "Missing path setting for model type : " + types[i]

                    var input = document.createElement("input")
                    input.type = "url"
                    input.innerText = types[i] + " Path"

                    var enter = document.createElement("button")
                    enter.type = "button"
                    enter.innerText = "enter"
                    enter.input = input
                    enter.div = div
                    enter.addEventListener('click', function(e) {
                        currentSettings['paths'][types[i]] = [this.input.value]
                        applyCurrentSettings()
                        div.parentElement.removeChild(div)
                    })

                    parent.appendChild(div)
                    div.appendChild(nameTag)
                    div.appendChild(input)
                    div.appendChild(enter)
                }
            },
            this.the_card
        )
        */

    }

    var notice_msg = responseJson.msg;
    var click_event = null;
    switch(responseJson.code) {
        case 0 : 
            color = "rgb(160, 255, 200)"
            break
        case 1 :
            color = "rgb(255, 100, 100)"
            break;
        case 3 : 
            // error
            color = "rgb(255, 100, 100)"
            notice_msg += "\n Click here to set it up."
            click_event = clickEvent
            break;
        case 2 :
        case 4 : 
            // OK
            color = "rgb(100, 255, 167)"
            break;
        default :
            console.log("download_page_input_panel_from_callback -> unexperted code : " + responseJson.code)
    }
    noticeCardManager.notice_show(
        "file_download", 
        "Download", notice_msg, 
        "10s", 
        click_event, 
        color
    )
    update()
}

function setPreviewMaxWidth(nWidth){
    var value = parseInt(nWidth)
    objectPanel.result_object.preview_max_width.value = value
    var input_panel_preview_max_width = document.getElementById("input_panel_preview_max_width")
    input_panel_preview_max_width.value = value
}

function setSaveApiJson(save) {
    var boolean = toBoolean(save)
    objectPanel.result_object.saveModelApiJson.checked = boolean
    var input_panel_save_api_json = document.getElementById("input_panel_save_api_json")
    input_panel_save_api_json.checked = boolean
}

function preview_max_width_blur() {
    setPreviewMaxWidth(this.value)
    sendSettings()
}

function saveApiJson_click() {
    //console.log(this.checked)
    setSaveApiJson(this.checked)
    sendSettings()
}

function download_page_input_panel_from(from) {
    var url = from.querySelector("#input_panel_url")
    var all_version = from.querySelector("#input_panel_all_version")
    if (url.value == "" || url.value == null) return
    var URL_input_ARGS = {
        "url" : url.value,
        "all_version" : all_version.checked,
        "max_scale_image" : false,
    };
    url.value = "";
    httpPostAsync("/url_input", download_page_input_panel_from_callback, URL_input_ARGS, http_timeout_callback, http_error_callback);
}

//https://stackoverflow.com/questions/10004723/html5-input-type-range-show-range-value
//https://www.w3schools.com/jsref/prop_range_value.asp

