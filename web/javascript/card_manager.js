

function download_page_element_get_or_create(parentTag, addition_id, element_tag_name) {
    var parentId = parentTag.id;
    var targetId = parentId+addition_id;
    var element = parentTag.querySelector('#'+targetId)
    if (element == null) {
        element = document.createElement(element_tag_name);
        element.id = targetId;
        parentTag.appendChild(element);
    }
    return element;
}

function cardInfo_version_info_setup(json, container) {
    container.style.display = "initial"
    var name = _easy_json_display_getOrCreate(container, "_name", "p")
    name.innerText = json["file_name"]
    var progress = _easy_json_display_getOrCreate(container, "_progress", "p")
    var downloadTask = json["downloadTask"]
    var currentSize = downloadTask["currentSize"]
    var known_file_size_bytes = downloadTask["known_file_size_bytes"]
    if (currentSize != null && known_file_size_bytes != null) {
        progress.innerText = (currentSize / known_file_size_bytes * 100) + "%"
    } else if(known_file_size_bytes != null) {
        progress.innerText = "unknow file size : " + currentSize
    } else {
        progress.innerText = "unknow"
    }
    var active = _easy_json_display_getOrCreate(container, "_active", "input")
    active.type = "checkbox"
    active.checked = json["active"]
    //active.addEventListener("", )
}

var card_info = null;

window.addEventListener('load', function(e) {
    card_info = new CardInfo();
});

class CardInfoListItem {
    constructor(cardInfo, parent) {
        this.cardInfo = cardInfo
        this.container = document.createElement("div");

        this.control_container = document.createElement("div");

        this.active = document.createElement("input");
        this.active.type = "checkbox"
        this.active.addEventListener("click", this.active_event.bind(this))

        this.file_button = document.createElement("button")
        this.file_button.type = "button"
        this.file_button.addEventListener('click', this.file_button_event.bind(this))
        this.file_button.classList.add("material-icons")
        this.file_button.innerText = "folder_open"

        parent.appendChild(this.container);
        this.container.appendChild(this.control_container)
        this.control_container.appendChild(this.active)
        this.control_container.appendChild(this.file_button)
        this.json = null
    }

    set(json) {
        this.json = json
        this.container.style.display = "flex"
        this.active.checked = json["active"]
    }

    disable() {
        this.container.style.display = "none"
    }
    
    active_event() {
        this.json["active"] = this.active.checked
    }

    file_button_event() {
        //abstract
    }

    file_button_event_callback(e) {
        var b = toBoolean(e)
        if (b == null || b) return
        noticeCardManager.notice_show("error", "Explorer", "File not exist", "3s", null, "red")
    }
}

class CardInfoListItem_Files extends CardInfoListItem {
    constructor(cardInfo, parent) {
        super(cardInfo, parent)
        
        this.name = document.createElement("p");
        this.name.style.textAlign = "center"
        this.name.style.backgroundColor = "rgb(36, 36, 36)"
        this.name.style.borderRadius = "5px"
        this.name.style.flexGrow = "1"
        this.progress = document.createElement("p");
        this.progress.style.textAlign = "center"
        this.progress.style.backgroundColor = "rgb(36, 36, 36)"
        this.progress.style.borderRadius = "5px"
        this.progress.style.flexGrow = "1"
        this.message = document.createElement("p");
        this.message.style.textAlign = "center"
        this.message.style.backgroundColor = "rgb(36, 36, 36)"
        this.message.style.borderRadius = "5px"
        this.message.style.flexGrow = "1"
        this.try_count = document.createElement("p");
        this.try_count.style.textAlign = "center"
        this.try_count.style.backgroundColor = "rgb(36, 36, 36)"
        this.try_count.style.borderRadius = "5px"
        this.try_count.style.flexGrow = "1"

        this.container.appendChild(this.name)
        this.container.appendChild(this.progress)
        this.container.appendChild(this.message)
        this.container.appendChild(this.try_count)
    }

    set(json) {
        super.set(json)
        var downloadTask = json["downloadTask"]
        var currentSize = downloadTask["currentSize"]
        var known_file_size_bytes = downloadTask["known_file_size_bytes"]
        if (currentSize != null && known_file_size_bytes != null) {
            var percentage = currentSize / known_file_size_bytes * 100
            this.progress.innerText = currentSize + " / " + known_file_size_bytes + " bytes (" + parseInt(percentage) + "%)"
        } else if(known_file_size_bytes != null) {
            this.progress.innerText = "unknow file size : " + currentSize
        } else {
            this.progress.innerText = "unknow"
        }
        this.name.style.display = "initial"
        this.name.innerText = json["file_name"]
        this.progress.style.display = "initial"
        this.message.style.display = "initial"
        this.message.innerText = downloadTask['message']
        this.message.style.color = "red"
        this.set_try_count(downloadTask["tryCount"], currentSettings["maxTryCount"])

    }

    set_try_count(tryCount, maxTryCount) {
        if (currentSettings['keep_trying']) {
            this.try_count.innerText = 'keep_trying -> tryCount : ' + tryCount
        } else {
            this.try_count.innerText = 'tryCount / maxTryCount : ' + tryCount + " / " + maxTryCount
        }
    }

    file_button_event() {
        var CardControl_ARGS = {
            "civitaiTaskObjectId" : this.cardInfo.json["unique_id"],
            "code" : 6,
            "arg_int" : this.cardInfo.json["files"].indexOf(this.json)
        };
        httpPostAsync("/card_control", this.file_button_event_callback, CardControl_ARGS);
    }
    
}

class CardInfoListItem_Images extends CardInfoListItem {
    constructor(cardInfo, parent) {
        super(cardInfo, parent)

        this.img_container = document.createElement("div")
        this.img_container.style.position = "relative"

        this.img = document.createElement("img")
        this.img.loading = "lazy";
        this.img.title = "title not set"
        this.img.style.height = "33vh"
        this.img.style.objectFit="contain"

        this.scale_container = document.createElement("div")
        this.scale_container.style.position = "absolute"
        this.scale_container.style.left = "0"
        this.scale_container.style.right = "0"
        this.scale_container.style.bottom = "0"
        this.scale_container.style.display = "flex"
        this.scale_container.style.justifyContent = "center"

        this.scale = document.createElement("input")
        this.scale.type = "range"
        this.scale.style.width = "90%"
        this.scale.target_item = this
        this.scale.addEventListener("input", this.scale_oninput)
        this.scale_output = document.createElement("output")
        this.scale_output.style.position = "absolute"
        this.scale_output.style.bottom = "100%"
        this.scale_output.style.right = "5%"
        this.scale_output.style.fontWeight = "bolder"
        this.scale_output.style.fontSize = "larger"
        this.scale_output.style.backgroundColor = "white"
        this.scale_output.style.borderRadius = "1vmin"
        this.scale_output.style.padding = "1vmin"
        this.scale_output.style.whiteSpace = "nowrap"

        this.info = document.createElement("div")
        this.info.style.position = "relative"
        this.info.style.display = "flex"
        this.info.style.flexDirection = "row"
        this.info.style.flexFlow = "column"
        this.info.style.flex = "1 1 auto"
        this.info.style.gap = "5px"
        this.name = document.createElement("p");
        this.name.style.textAlign = "center"
        this.name.style.backgroundColor = "rgb(36, 36, 36)"
        this.name.style.borderRadius = "5px"
        this.message = document.createElement("p");
        this.message.style.textAlign = "center"
        this.message.style.backgroundColor = "rgb(36, 36, 36)"
        this.message.style.borderRadius = "5px"
        this.try_count = document.createElement("p");
        this.try_count.style.textAlign = "center"
        this.try_count.style.backgroundColor = "rgb(36, 36, 36)"
        this.try_count.style.borderRadius = "5px"   

        this.container.appendChild(this.img_container)
        this.img_container.appendChild(this.img)
        this.img_container.appendChild(this.scale_container)
        this.scale_container.appendChild(this.scale)
        this.scale_container.appendChild(this.scale_output)

        this.container.appendChild(this.info)
        this.info.appendChild(this.name)
        this.info.appendChild(this.message)
        this.info.appendChild(this.try_count)
    }
    set(json) {
        super.set(json)
        var downloadTask = json["downloadTask"]
        var currentValue = get_image_scale_from_url(downloadTask['url'])
        currentValue = parseInt(currentValue)
        var preferredValue = 450
        if (preferredValue >= currentValue) preferredValue = currentValue
        this.img.style.display = "initial"
        this.img.src = get_specific_scale_image(downloadTask['url'], preferredValue)
        this.img.title = json["file_name"]

        var maxValue = json["max_width"]
        var minValue = 100
        //var minValue = window.screen.availWidth / 8
        if (minValue >= maxValue) {minValue = maxValue}
        this.scale.min = minValue
        this.scale.max = json["max_width"]
        this.set_scale(currentValue)

        this.name.style.display = "initial"
        this.name.innerText = json["file_name"]
        this.message.style.display = "initial"
        this.message.innerText = downloadTask['message']
        this.message.style.color = "red"
        this.set_try_count(downloadTask["tryCount"], currentSettings["maxTryCount"])


    }

    set_try_count(tryCount, maxTryCount) {
        if (currentSettings['keep_trying']) {
            this.try_count.innerText = 'keep_trying -> tryCount : ' + tryCount
        } else {
            this.try_count.innerText = 'tryCount / maxTryCount : ' + tryCount + " / " + maxTryCount
        }
    }

    get_max_scale() {
        return parseInt(this.scale.max);
    }

    set_scale(value) {
        var final_value = parseInt(value)
        var max = parseInt(this.scale.max)
        var min = parseInt(this.scale.min)
        if(max < final_value) {final_value = max}
        if(min > final_value) {final_value = min}
        this.scale.value = final_value
        this.scale_output.value = "width : " + final_value
        this.json['width'] = final_value
    }
    set_max_scale() {
        this.set_scale(this.scale.max)
    }
    set_min_scale() {
        this.set_scale(this.scale.min)
    }
    scale_oninput(value) {
        this.target_item.set_scale(this.value)
    }

    file_button_event() {
        var CardControl_ARGS = {
            "civitaiTaskObjectId" : this.cardInfo.json["unique_id"],
            "code" : 7,
            "arg_int" : this.cardInfo.json["images"].indexOf(this.json)
        };
        httpPostAsync("/card_control", this.file_button_event_callback, CardControl_ARGS);
    }
}

class CardInfo {
    constructor() {
        this.close = document.getElementById('card_info_panel_close_button')
        this.close.cardInfo = this
        this.close.addEventListener('click', function(e){
            document.getElementById("card_info_panel").style.display = "none";
        })
        this.web = document.getElementById("card_info_panel_web")
        this.web.url = undefined
        this.web.addEventListener("click", function(e){
            if (this.url == null || this.url == undefined) return;
            window.open(this.url, '_blank');
        })
        this.all_images_scale = document.getElementById("card_info_panel_all_images_scale")
        this.all_images_scale.card_info = this
        this.all_images_scale.addEventListener('input', this.all_images_scale_input_event)
        this.all_images_scale.min = 100

        this.retry_all = document.getElementById("card_info_panel_retry")
        this.retry_all.addEventListener('click', this.retry_button_event.bind(this))

        this.apply_change = document.getElementById("card_info_panel_apply")
        this.apply_change.addEventListener('click', this.apply_change_event.bind(this))

        this.explorer_button = document.getElementById("card_info_panel_explorer_button")
        this.explorer_button.addEventListener('click', this.explorer_event.bind(this))

        this.pageId = document.getElementById("card_info_panel_pageId")
        this.version_id = document.getElementById("card_info_panel_version_id")
        this.version_main_name = document.getElementById("card_info_panel_version_main_name")
        this.path = document.getElementById("card_info_panel_path")
        //this.max_image_count = document.getElementById("card_info_panel_max_image_count")
        //this.max_scale_image = document.getElementById("card_info_panel_max_scale_image")
        //this.save_api_json = document.getElementById("card_info_panel_save_api_json")
        this.version_info_files = document.getElementById("card_info_panel_version_info_files")
        this.version_info_images = document.getElementById("card_info_panel_version_info_images")
        this.file_list_items = []
        this.img_list_items = []

        this.json = null;
    }

    set(responseJson) {
        this.json = responseJson
        this.web.url = get_model_page_url_modelVersionId(responseJson["pageId"], responseJson["version_id"])
        this.pageId.value = responseJson["pageId"]
        this.version_id.value = responseJson["version_id"]
        this.version_main_name.value = responseJson["version_main_name"]
        this.path.value = responseJson["model_type_path"]
        //this.max_image_count.value = responseJson["max_image_count"]
        //this.max_scale_image.checked = responseJson["max_scale_image"]
        //this.save_api_json.checked = responseJson["save_api_json"]
        
        var json_flies = responseJson["files"];
        for (var i = this.file_list_items.length; i < json_flies.length; i++) {
            this.file_list_items[i] = new CardInfoListItem_Files(this, this.version_info_files)
        }
        for (var i = 0; i < json_flies.length; i++) {
            this.file_list_items[i].set(json_flies[i])
        }
        for (var i = json_flies.length; i < this.file_list_items.length; i++) {
            this.file_list_items[i].disable()
        }
    
        var max_scale_imgs = 0
        var json_images = responseJson["images"];
        for (var i = this.img_list_items.length; i < json_images.length; i++) {
            this.img_list_items[i] = new CardInfoListItem_Images(this, this.version_info_images)
        }
        for (var i = 0; i < json_images.length; i++) {
            var item = this.img_list_items[i]
            item.set(json_images[i])
            var max_scale = item.get_max_scale()
            if (max_scale_imgs < max_scale) {
                max_scale_imgs = max_scale
            }
        }
        for (var i = json_images.length; i < this.img_list_items.length; i++) {
            this.img_list_items[i].disable()
        }
        this.all_images_scale.max = max_scale_imgs;
        this.set_all_images_scale(max_scale_imgs)
    }

    all_images_scale_input_event(e) {
        this.card_info.set_all_images_scale(this.value)
    }

    set_all_images_scale(value) {
        this.all_images_scale.value = value
        var items = this.img_list_items
        for (var i in items) {
            items[i].set_scale(value)
        }
    }
    
    retry_button_event() {
        var CardControl_ARGS = {
            "civitaiTaskObjectId" : this.json["unique_id"],
            "code" : 4,
        };
        httpPostAsync("/card_control", null, CardControl_ARGS);
    }

    apply_change_event() {
        httpPostAsync("/task_control", function(e){
            console.log(e)
        }, this.json);
    }

    explorer_event() {
        var CardControl_ARGS = {
            "civitaiTaskObjectId" : this.json["unique_id"],
            "code" : 5,
        };
        httpPostAsync("/card_control", null, CardControl_ARGS);
    }

}

function cardClickEvent_callback(responseText) {
    var responseJson = JSON.parse(responseText)
    card_info.set(responseJson)
}

function cardClickEvent(e) {
    var cardInfo = document.getElementById("card_info_panel");
    if (cardInfo == null) {return}
    cardInfo.style.display = "initial";
    var CardControl_ARGS = {
        "civitaiTaskObjectId" : this.card.cardJson["civitaiTaskObjectId"],
        "code" : 2,
    };
    httpPostAsync("/card_control", cardClickEvent_callback, CardControl_ARGS);
}

function cardControlCallback(responseText) {
    update()
}

function card_cancel_event(e) {
    var CardControl_ARGS = {
        "civitaiTaskObjectId" : this.card.cardJson["civitaiTaskObjectId"],
        "code" : 0,
    };
    httpPostAsync("/card_control", cardControlCallback, CardControl_ARGS);
}

function cardPlayPauseEvent(e) {
    var CardControl_ARGS = {
        "civitaiTaskObjectId" : this.card.cardJson["civitaiTaskObjectId"],
        "code" : 1,
    };
    httpPostAsync("/card_control", cardControlCallback, CardControl_ARGS);
}

function card_delete_event() {
    var CardControl_ARGS = {
        "civitaiTaskObjectId" : this.card.cardJson["civitaiTaskObjectId"],
        "code" : 0,
        "arg_bool" : true
    };
    httpPostAsync("/card_control", cardControlCallback, CardControl_ARGS);
}

function card_mouseover_event() {
    if (this.card.card_status.style.display == "none") return
    this.card.preview_change_lock.style.display = "flex"
}

function card_mouseout_event() {
    if (this.card.card_status.style.display == "none") return
    this.card.preview_change_lock.style.display = "none"
}

class CardManager {

    constructor(maxCardCount, cards_panel) {
        this.maxCardCount = maxCardCount
        this.cards_panel = cards_panel
        this.cardList = []
        this.lastIndex = 0
    }

    progress(responseJson) {
        var length = responseJson['length'];
        //var cardContanerCount = this.cards_panel.childElementCount;
        for (var card_num = this.cardList.length; card_num < length; card_num++) {
            this.cardList[card_num] = new Card(card_num, this.cards_panel)
        }
        var index = 0;
        for (; index < length; index++) {
            var card = this.cardList[index]
            var task_index = length - 1 - index
            var json = responseJson[task_index]
            card.set(json);
        }

        var _lastIndex = this.lastIndex
        this.lastIndex = index

        for (;index < _lastIndex; index++) {
            var card = this.cardList[index]
            card.disable()
            //console.log("disabled : " + card.id)
        }
    }
}

class Card {
    constructor(index, cards_panel) {
        this.cardJson = null;
        this.previewIndex = null;
        this.index = index

        this.card = download_page_element_get_or_create(cards_panel, "_card" + index, "div");
        this.card.setAttribute("card_index", index)
        this.card.card = this
        this.card.addEventListener('mouseover', card_mouseover_event)
        this.card.addEventListener('mouseout', card_mouseout_event)

        this.tittle = download_page_element_get_or_create(this.card, "_h1", "h1")

        this.preview = download_page_element_get_or_create(this.card, "_preview", "img");
        this.preview.loading = "lazy";
        this.preview.card = this;
        this.preview.addEventListener("click", cardClickEvent)

        //this.preview = download_page_element_get_or_create(this.card, "_preview", "canvas");
        //this.preview.addEventListener("click", cardClickEvent)

        this.cancel_button = download_page_element_get_or_create(this.card, "_c", "button")
        this.cancel_button.card = this
        this.cancel_button.addEventListener("click", card_cancel_event)
        this.cancel_button.classList.add("cancel_button")
        this.cancel_button.classList.add('material-icons')
        this.cancel_button.innerText = "close";

        this.delete_button = download_page_element_get_or_create(this.card, "_d", "button")
        this.delete_button.card = this
        this.delete_button.addEventListener("click", card_delete_event)
        this.delete_button.classList.add("delete_button")
        this.delete_button.classList.add('material-icons')
        this.delete_button.innerText = "delete";
        this.delete_button.title = "remove from task list, and delete all related files."
        
        this.card_status = download_page_element_get_or_create(this.card, "_card_status", "div");
        this.card_status.classList.add('card_status')
        this.status_container = download_page_element_get_or_create(this.card_status, "container", "div");
        this.status_container.classList.add('status_container')
        this.status_sign = download_page_element_get_or_create(this.status_container, "sign", "i");
        this.status_sign.classList.add('material-icons')

        this.preivew_controll = download_page_element_get_or_create(this.card, "_pc", "div")
        this.preivew_controll.classList.add("card_preview_controller")
        
        this.preivew_controll_lb = download_page_element_get_or_create(this.preivew_controll, "_lb", "button")
        this.preivew_controll_lb.classList.add('lb')
        this.preivew_controll_lb.classList.add('material-icons')
        this.preivew_controll_lb.innerText = "keyboard_arrow_left"
        this.preivew_controll_lb.card = this
        this.preivew_controll_lb.addEventListener('click', function(e){
            this.card.previewIndex -= 1
            this.card.setPreview(true && this.card.preview_change_lock._locked)
        })

        this.preivew_controll_rb = download_page_element_get_or_create(this.preivew_controll, "_rb", "button")
        this.preivew_controll_rb.classList.add('rb')
        this.preivew_controll_rb.classList.add('material-icons')
        this.preivew_controll_rb.innerText = "keyboard_arrow_right"
        this.preivew_controll_rb.card = this
        this.preivew_controll_rb.addEventListener('click', function(e) {
            this.card.previewIndex += 1
            this.card.setPreview(true && this.card.preview_change_lock._locked)
        })

        this.preview_change_lock = download_page_element_get_or_create(this.card, "_previewLock", "button")
        this.preview_change_lock.classList.add('preview_lock')
        this.preview_change_lock.classList.add('material-icons')
        this.preview_change_lock.card = this
        this.preview_change_lock.addEventListener("click", function(e) {
            this.card.preview_change_lock._locked = !this.card.preview_change_lock._locked;
            this.card.preview_change_lock_update(true);
        })
        this.preview_change_lock._locked = true
        this.preview_change_lock_update(false)

        this.card_progress_container = download_page_element_get_or_create(this.card, "_card_progress_container", "div");
        this.card_progress_container.classList.add('card_progress_container')

        this.card_progress_container_layer = download_page_element_get_or_create(this.card_progress_container, "_layer", "div")
        this.card_progress_container_layer.classList.add("card_progress_container_layer")

        this.h1 = download_page_element_get_or_create(this.card_progress_container_layer, "_h1", "h1");

        this.controll_button = download_page_element_get_or_create(this.card_progress_container_layer, "_eb", "button")
        this.controll_button.card = this
        this.controll_button.addEventListener("click", cardPlayPauseEvent)
        this.controll_button.classList.add('material-icons')

        this.shell = download_page_element_get_or_create(this.card_progress_container, "_shell", "div");
        this.shell.classList.add("progress_bar_shell")
        this.bar = download_page_element_get_or_create(this.shell, "_bar", "div");
    }

    reset() {
        this.cardJson = null;
        this.previewIndex = null;
        this.preview.src = ""
        this.preview_change_lock._locked = true;
        this.preview_change_lock_update(false);
    }

    postpreviewChange() {
        var CardControl_ARGS = {
            "civitaiTaskObjectId" : this.cardJson["civitaiTaskObjectId"],
            "code" : 3,
            "arg_str" : this.preview.src
        };
        httpPostAsync("/card_control", null, CardControl_ARGS);
    }

    setPreview(doPost) {
        if(this.cardJson == null || this.cardJson == undefined) return;
        if (this.previewIndex == null) {
            this.previewIndex = this.cardJson['preview']
        }
        if (this.previewIndex < 0) {
            this.previewIndex = this.cardJson["previews"].length - 1
        } 
        else if (this.previewIndex >= this.cardJson["previews"].length) {
            this.previewIndex = 0
        }
        var preview_url = this.cardJson["previews"][this.previewIndex]
        // TODO : make it small

        if (preview_url === undefined) {
            preview_url = "web/imgs/no-preview.jpg"
        }

        this.preview.src = preview_url
        
        if (!doPost) return;
        this.postpreviewChange()
    }

    preview_change_lock_update(doPost) {
        if (this.preview_change_lock._locked) {
            this.preview_change_lock.innerText = "lock_outline";
            this.preview_change_lock.title = "unlock to change preview or delete related files"
            this.preivew_controll.style.display = "none"
            this.delete_button.style.display = "none"
            if (doPost) {
                this.postpreviewChange()
            }
        } else {
            this.preview_change_lock.innerText = "lock_open";
            this.preview_change_lock.title = "lock it up to setup preview"
            this.preivew_controll.style.display = "flex"
            this.delete_button.style.display = "flex"
        }
    }

    retry() {

    }

    set(cardJson) {
        if(this.cardJson != null && cardJson['title'] != this.cardJson['title']) {
            this.reset()
        }

        this.cardJson = cardJson;

        if (this.card.style.display != "flex") {
            this.card.style.display = "flex"
        }
        if (this.tittle.innerText != cardJson["title"]) {
            this.tittle.innerText = cardJson["title"]
        }

        this.setPreview(false)
        
        var progress = cardJson["progress"] + "%"
        if (this.h1.innerText != progress) {
            this.h1.innerText = progress
            this.bar.style.width = progress
        }

        if (cardJson["enable"]) {
            if (this.controll_button.innerText != "pause") {
                this.controll_button.innerText = "pause"
            }
        } 
        else {
            if (this.controll_button.innerText != "play_arrow") {
                this.controll_button.innerText = "play_arrow"
            }
        }

        var status = cardJson["status"]
        var show_preivew_controll = false;
        switch (status) {
            case -5 :
                // manual_pause
            case 0 :
                // downloading
                this.cancel_button.title = "remove from task list, and remove all related files."
                this.card_progress_container.style.display = "flex"
                this.card_status.style.display = "none"
                show_preivew_controll = true
                break;
            case 1 : 
                // files download finish
                this.cancel_button.title = "remove from task list"
                this.card_progress_container.style.display = "none"
                this.card_status.style.display = "flex"
                this.status_sign.innerText = "done";
                this.status_sign.style.color = "greenyellow"
                show_preivew_controll = false
                break;
            case 2 : 
                // all download finish
                this.cancel_button.title = "remove from task list"
                this.card_progress_container.style.display = "none"
                this.card_status.style.display = "flex"
                this.status_sign.innerText = "done_all";
                this.status_sign.style.color = "greenyellow"
                show_preivew_controll = false
                break;
            default :
                // error or unexcepted
                this.cancel_button.title = "remove from task list, and remove all related files."
                this.card_progress_container.style.display = "none"
                this.card_status.style.display = "flex"
                //this.status_sign.innerText = "refresh";
                //this.status_sign.innerText = "report";
                this.status_sign.innerText = "error_outline";
                this.status_sign.style.color = "firebrick"
                show_preivew_controll = false
                break;
        }
        if (show_preivew_controll || !this.preview_change_lock._locked) {
            this.preivew_controll.style.display = "flex"
        } else {
            this.preivew_controll.style.display = "none"
        }
    }

    disable() {
        this.card.style.display = "none"
        this.reset()
    }
}