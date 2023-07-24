/* 
animation pack settings
*/
var setup_switches = "animation_pack_setup_switches"
var switch_on  = "animation_pack_on"
var switch_off = "animation_pack_off"
var deactivate_on = "animation_pack_deactivate_on"
var deactivate_off = "animation_pack_deactivate_off"
var defaultValue = switch_on;

function animation_pack_set_switch_on(targetHtmlElement) {
    var cl = targetHtmlElement.classList
    cl.add(switch_on)
    cl.remove(switch_off)
    cl.remove(deactivate_on)
    cl.remove(deactivate_off)
}
function animation_pack_set_switch_off(targetHtmlElement) {
    var cl = targetHtmlElement.classList
    cl.remove(switch_on)
    cl.add(switch_off)
    cl.remove(deactivate_on)
    cl.remove(deactivate_off)
}
function animation_pack_set_deactivate_on(targetHtmlElement) {
    var cl = targetHtmlElement.classList
    cl.remove(switch_on)
    cl.remove(switch_off)
    cl.add(deactivate_on)
    cl.remove(deactivate_off)
}
function animation_pack_set_deactivate_off(targetHtmlElement) {
    var cl = targetHtmlElement.classList
    cl.remove(switch_on)
    cl.remove(switch_off)
    cl.remove(deactivate_on)
    cl.add(deactivate_off)
}
function animation_pack_getElementsByClassName(className) {
    var elements = document.getElementsByClassName(className);
    result = []
    for (var i = 0; i < elements.length; i++) result[i] = elements[i]
    return result
}

function animation_pack_is_on(targetHtmlElement) {
    var cl = targetHtmlElement.classList
    return cl.contains(switch_on) || cl.contains(deactivate_on)
}

function animation_pack_is_deactivate(targetHtmlElement) {
    var cl = targetHtmlElement.classList
    return cl.contains(deactivate_on) || cl.contains(deactivate_off)
}

function animation_pack_set_on_off(targetHtmlElement, on_off) {
    if (on_off) {
        if (animation_pack_is_deactivate(targetHtmlElement)) {
            animation_pack_set_deactivate_on(targetHtmlElement)
        } else {
            animation_pack_set_switch_on(targetHtmlElement)
        }
    } else {
        if (animation_pack_is_deactivate(targetHtmlElement)) {
            animation_pack_set_deactivate_off(targetHtmlElement)
        } else {
            animation_pack_set_switch_off(targetHtmlElement)
        }
    }
}

function animation_pack_switch_on_off(targetHtmlElement) {
    var is_deactivate = animation_pack_is_deactivate(targetHtmlElement)
    var is_on = animation_pack_is_on(targetHtmlElement)
    if (is_deactivate) {
        if (is_on) {
            animation_pack_set_deactivate_off(targetHtmlElement)
        } else {
            animation_pack_set_deactivate_on(targetHtmlElement)
        }
    } else {
        if (is_on) {
            animation_pack_set_switch_off(targetHtmlElement)
        } else {
            animation_pack_set_switch_on(targetHtmlElement)
        }
    }
}

function animation_pack_deactivate_all() {
    var copy_switch_on = animation_pack_getElementsByClassName(switch_on);
    var copy_switch_off = animation_pack_getElementsByClassName(switch_off);
    for (var i = 0; i < copy_switch_on.length; i++) {
        copy_switch_on[i].classList.replace(switch_on, deactivate_on)
    }
    for (var i = 0; i < copy_switch_off.length; i++) {
        copy_switch_off[i].classList.replace(switch_off, deactivate_off)
    }

}

function animation_pack_activate_all() {
    var copy_deactivate_on = animation_pack_getElementsByClassName(deactivate_on);
    var copy_deactivate_off = animation_pack_getElementsByClassName(deactivate_off);
    for (var i = 0; i < copy_deactivate_on.length; i++) {
        copy_deactivate_on[i].classList.replace(deactivate_on, switch_on)
    }
    for (var i = 0; i < copy_deactivate_off.length; i++) {
        copy_deactivate_off[i].classList.replace(deactivate_off, switch_off)
    }
}

/* animation setup */
function animation_pack_switch_eventlistener(event) {
    if (event.pointerType!="") animation_pack_switch_on_off(this)
}
function setup_animation_pack_switches(e) {
    var elements = animation_pack_getElementsByClassName(setup_switches);
    for (var i = 0; i < elements.length; i++) {
        elements[i].addEventListener("click", animation_pack_switch_eventlistener)
    }
}
window.addEventListener("load", setup_animation_pack_switches)