function power_settings_new_onclick(element) {
    //window.close()
    // Turn off server too
    animation_pack_switch_on_off(element)
    httpGetAsync("/off")
}

function settings_onclick(element) {
    var elements = document.getElementsByClassName("settings_container");
    if (elements.length > 0) {
        for (var i = 0; i < elements.length; i++) {
            if (elements[i].style.display == "none") {
                applyCurrentSettings();
                elements[i].style.display = "flex"
            } else {
                elements[i].style.display = "none"
            }
        }
    }
    animation_pack_switch_on_off(element)
}

function bug_report_onclick(element) {
    animation_pack_switch_on_off(element)
}
function card_giftcard_onclick(element) {
    animation_pack_switch_on_off(element)
}

function set_autonew(value) {
    currentSettings["javascript_page_autorenew"] = value;
    var button = document.getElementById("autorenew");
    var i = button.getElementsByTagName("i")[0];
    animation_pack_set_on_off(button, value);
    animation_pack_set_on_off(i, value);
    if (value) {
        update()
    } else {
        stopTimeOuts()
    }
}
function autorenew_onclick(element) {
    set_autonew(!currentSettings["javascript_page_autorenew"])
}

function set_file_download(value) {
    currentSettings["javascript_page_file_download"] = value;
    var button = document.getElementById("file_download");
    var i = button.getElementsByTagName("i")[0];
    animation_pack_set_on_off(button, value);
    animation_pack_set_on_off(i, value);
}
function file_download_onclick(element) {
    var newValue = !currentSettings["javascript_page_file_download"]
    set_file_download(newValue)
    httpPostAsync("/downloadSwitch", null, {"arg_bool" : newValue}, http_timeout_callback, http_error_callback);
}

function set_animation_on_off(value) {
    currentSettings["javascript_page_animation_on_off"] = value;
    var button = document.getElementById("animation_on_off");
    var i = button.getElementsByTagName("i")[0];
    animation_pack_set_on_off(button, value);
    animation_pack_set_on_off(i, value);
    if (value) {
        animation_pack_activate_all()
    } 
    else {
        animation_pack_deactivate_all()
    }
}
function animation_on_off_onclick(element) {
    //currentSettings["javascript_page_animation_on_off"] = !currentSettings["javascript_page_animation_on_off"];
    set_animation_on_off(!currentSettings["javascript_page_animation_on_off"]);
}

function input_range_card_size_oninput(value) {
    currentSettings["javascript_page_card_size"] = parseInt(value);
    var card_size = document.getElementById("input_range_card_size");
    var setting_value = currentSettings["javascript_page_card_size"];
    var setting_value_str = setting_value + "%"
    setCssVariable("--card-size", setting_value_str)
    document.getElementById("range_value").value = setting_value;
    card_size.setAttribute("value", setting_value)
}

function input_range_card_size_onfocus(value) {
    input_range_card_size_oninput(value);
}
