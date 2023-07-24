class ObjectPanel {
    static propertyName_array_add_button = "array_add_button"
    static propertyName_object_add_button = "object_add_button"
    static propertyName_array_remove_button = "_array_remove_button"
    static propertyName_object_remove_button = "_object_remove_button"
    constructor(
        parent,
        arrayClass, arrayAddClass, arrayRemoveClass, 
        objectClass, porpertyAddClass, porpertyRemoveClass, 
    ) {
        this.parent = parent;
        this.current_object = null;
        this.current_settings = null;
        this.arrayClass = arrayClass;
        this.arrayAddClass = arrayAddClass;
        this.arrayRemoveClass = arrayRemoveClass;
        this.objectClass = objectClass;
        this.porpertyAddClass = porpertyAddClass;
        this.porpertyRemoveClass = porpertyRemoveClass;
        this.result_object = null;
    }

    reset() {
        if (this.current_object == null) {return;}
        this.solve(this.current_object, this.current_settings);
    }

    clearElement(element) {
        //if (element.parentElement != null) {element.parentElement.removeChild(element);}
        if (element.children.length <= 0) return;
        var temp = []
        for (var index = 0; index < element.children.length; index++) {
            temp[index] = element.children[index]
        }
        for (var i = 0; i < temp.length; i++) {
            element.removeChild(temp[i]);
        }
    }

    getOrCreate(parent, addition_id, element_tag_name, add_to_parent) {
        var parentId = parent.id;
        var targetId = parentId+addition_id;
        var element = document.getElementById(targetId)
        
        if (element == null) {
            element = document.createElement(element_tag_name);
            element.id = targetId;
            if (add_to_parent)
                parent.appendChild(element);
        }
        return element
    }

    button(parent, title, cls, click_event, icon) {
        var button = this.getOrCreate(parent, "_button_"+icon, "button", true)
        button.objectPanel = this;
        button.title = title
        button.classList.add(cls)
        button.addEventListener("click", click_event)
        button.setAttribute("type", "button")
        var i = this.getOrCreate(button, "removeI", "i", true)
        i.classList.add("material-icons")
        i.innerText = icon
        return button
    }

    addArrayItem() {
        //TODO array item type can't change should use settings
        var result = null
        var parent = this.parentElement
        var inputs = parent.getElementsByTagName("input");
        var count = inputs.length;
        
        for(var index in inputs) {
            var instance = inputs[index];
            // looking for same or empty value element instance
            if(instance.value == "") {
                if(result == null) {
                    result = instance;
                } else {
                    instance.parentElement.parentElement.removeChild(instance.parentElement);
                    count-=1;
                }
            }
        }

        if(result == null) {
            var result = this.objectPanel.solve_loop_property(
                "input_"+count, parent, "string", "", this.settings, true, this.result_object)
            
            /*
            var __settings_value_type__ = null;

            if (this.settings != null) {
                try {
                    __settings_value_type__ = this.settings["__settings_value_type__"]
                } catch (e) {}
            }

            var panel = this.objectPanel.getOrCreate(parent, "_panel_new_item", "div", true)
            if (__settings_value_type__ == null) {
                __settings_value_type__ = this.objectPanel.getValueTypeSelect(panel);
            }
            var enter_button = this.objectPanel.getOrCreate(panel, "_enter_", "button", true)

            var removeButton = this.objectPanel.button(
                panel, "remove a key-value pair : ",
                this.objectPanel.arrayRemoveClass, this.objectPanel.removeArrayItem, 
                "close"
            )
            removeButton.propertyName = this.propertyName
            removeButton.result_object = this.result_object

            enter_button.type = "button"
            enter_button.innerText = "Create"
            enter_button.style.padding = "6px"
            enter_button.style.backgroundColor = "white"
            enter_button.style.border = "none"
            enter_button.style.borderRadius = "3px"
            enter_button.style.cursor = "pointer";
            enter_button.style.fontWeight = "bold";

            enter_button.objectPanel = this.objectPanel
            enter_button.panel = panel
            enter_button.value_type = __settings_value_type__
            enter_button.result_object = this.result_object
            enter_button.propertyName = this.propertyName+""

            enter_button.addEventListener("click", function(e) {
                var value_type = this.value_type.value
                if (value_type == null || value_type == undefined || value_type == "") {
                    value_type = this.value_type
                }
                var type = undefined;
                var default_value = undefined;
                switch (value_type) {
                    case "text": 
                    case "url": 
                        type = "string";
                        default_value = ""
                        break;
                    case "number": 
                        type = "number";
                        default_value = 0
                        break;
                    case "boolean": 
                        type = "boolean";
                        default_value = false
                        break;
                    case "object":
                        type = "object";
                        default_value = {}
                    case "array":
                        type = "object";
                        default_value = []
                        break;
                }
                var result = this.objectPanel.solve_loop_property(
                    this.propertyName, this.panel.parentElement, type, default_value, null, false, this.result_object)
                this.panel.parentElement.replaceChild(result, this.panel);
            })
            parent.insertBefore(panel, this);
            */
        }
    }

    removeArrayItem() {
        var parent = this.parentElement;
        parent.parentElement.removeChild(parent);
        delete this.result_object[this.propertyName];
        delete this.result_object[this.propertyName+"_array_remove_button"];
    }

    getValueTypeSelect(parent) {
        var select_label = this.getOrCreate(parent, "select_label", "label", true);
        var select = this.getOrCreate(parent, "select", "select", true);
        var option_array = this.getOrCreate(select, "option_array", "option", true)
        var option_object = this.getOrCreate(select, "option_object", "option", true)
        var option_text = this.getOrCreate(select, "option_text", "option", true)
        var option_number = this.getOrCreate(select, "option_number", "option", true)
        var option_boolean = this.getOrCreate(select, "option_boolean", "option", true)
        select_label.for = "value_type"
        select_label.innerText = "Choose a Value Type"
        select.name = "value_type"
        option_array.value = "array"
        option_array.innerText = "array"
        option_object.value = "object"
        option_object.innerText = "object"
        option_text.value = "text"
        option_text.innerText = "text"
        option_number.value = "number"
        option_number.innerText = "number"
        option_boolean.value = "boolean"
        option_boolean.innerText = "boolean"
        return select
    }

    addHashMapPair() {
        var parent = this.parentElement;
        var panel = this.objectPanel.getOrCreate(parent, "_panel_new_item", "div", true)
        var p = this.objectPanel.getOrCreate(panel, "_p", "p", true)
        var user_input_key = this.objectPanel.getOrCreate(panel, "user_input_key", "input", true)
        var enter_button = this.objectPanel.getOrCreate(panel, "_enter_", "button", true)

        this.result_object.new_panel = panel
        this.result_object.new_panel_p = p
        this.result_object.new_panel_input = user_input_key
        this.result_object.new_panel_button = enter_button

        var __settings_value_type__ = null;
        var __settings_title__ = "Title";
        var __settings_Key_placeholder__ = "Input Key";

        if (this.settings != null) {
            try {
                __settings_value_type__ = this.settings["__settings_value_type__"]
            } catch (e) {}
            try {
                __settings_title__ = this.settings["__settings_title__"]
            } catch (e) {}
            try {
                __settings_Key_placeholder__ = this.settings["__settings_Key_placeholder__"]
            } catch (e) {}
        }
        if (__settings_value_type__ == null) {
            __settings_value_type__ = this.objectPanel.getValueTypeSelect(panel);
        }

        panel.classList.add(this.objectPanel.objectClass)

        var removeButton = this.objectPanel.button(
            panel, "remove a key-value pair : ",
            this.objectPanel.porpertyRemoveClass, this.objectPanel.removeHashMapPair, 
            "close"
        )
        removeButton.propertyName = this.propertyName
        removeButton.result_object = this.result_object

        p.innerHTML = __settings_title__;

        user_input_key.placeholder = __settings_Key_placeholder__
        user_input_key.type = "text"

        enter_button.type = "button"
        enter_button.innerText = "Create"
        enter_button.style.padding = "6px"
        enter_button.style.backgroundColor = "white"
        enter_button.style.border = "none"
        enter_button.style.borderRadius = "3px"
        enter_button.style.cursor = "pointer";
        enter_button.style.fontWeight = "bold";

        enter_button.objectPanel = this.objectPanel
        enter_button.panel = panel
        enter_button.key = user_input_key
        enter_button.value_type = __settings_value_type__
        enter_button.result_object = this.result_object

        enter_button.addEventListener("click", function(e) {
            var propertyName = this.key.value
            var value_type = this.value_type.value
            if (propertyName == null || propertyName == undefined || propertyName == "") {
                return;
            }
            if (value_type == null || value_type == undefined || value_type == "") {
                value_type = this.value_type
            }
            var type = undefined;
            var default_value = undefined;
            switch (value_type) {
                case "text": 
                case "url": 
                    type = "string";
                    default_value = ""
                    break;
                case "number": 
                    type = "number";
                    default_value = 0
                    break;
                case "boolean": 
                    type = "boolean";
                    default_value = false
                    break;
                case "object":
                    type = "object";
                    default_value = {}
                case "array":
                    type = "object";
                    default_value = []
                    break;
            }
            var result = this.objectPanel.solve_loop_property(
                propertyName, this.panel.parentElement, type, default_value, null, false, this.result_object)
            this.panel.parentElement.replaceChild(result, this.panel);
            
            delete this.result_object.new_panel
            delete this.result_object.new_panel_p
            delete this.result_object.new_panel_input
            delete this.result_object.new_panel_button
        })
        parent.insertBefore(panel, this);
    }

    removeHashMapPair() {
        var parent = this.parentElement
        parent.parentElement.removeChild(parent);
        delete this.result_object[this.propertyName];
        delete this.result_object[this.propertyName+"_object_remove_button"];
    }

    solve(object, settings) {
        this.result_object = {}
        this.clearElement(this.parent);
        this.solve_loop(object, this.parent, settings, this.result_object);
        this.current_object = object;
    }

    solve_loop(object, parent, settings, result_object) {
        if (object == null || object == undefined) return;
        var t = typeof(object)
        if (t == "object") {
            this.solve_loop_object(object, parent, settings, result_object)
        } else {
            this.solve_loop_property(object, parent, typeof(object), object, settings, true, result_object)
        }
    }

    solve_loop_object(object, parent, settings, result_object) {
        for (var propertyName in object) {
            var value = object[propertyName];
            var type = typeof(value);
            var _settings = null
            try {
                _settings = settings[propertyName];
            }
            catch(err) {
                _settings = null;
            }
            this.solve_loop_property(propertyName, parent, type, value, _settings, true, result_object)
        }
    }

    solve_loop_property(propertyName, parent, type, value, settings, add_to_parent, result_object) {
        var panel = this.getOrCreate(parent, "_panel_" + propertyName, "div", add_to_parent)
        var is_array_inside = parent.classList.contains(this.arrayClass)
        var is_object_inside = parent.classList.contains(this.objectClass)
        var need_p = true
        if (is_array_inside) {
            var array_remove_button = this.button(
                panel, "remove a item : " + propertyName,
                this.arrayRemoveClass, this.removeArrayItem, 
                "remove_circle_outline"
            )
            array_remove_button.propertyName = propertyName
            array_remove_button.result_object = result_object
            result_object[propertyName+ObjectPanel.propertyName_array_remove_button] = array_remove_button
            need_p = false;
        }
        if (is_object_inside) {
            var object_remove_button = this.button(
                panel, "remove a key-value pair : " + propertyName,
                this.porpertyRemoveClass, this.removeHashMapPair, 
                "close"
            )
            object_remove_button.propertyName = propertyName
            object_remove_button.result_object = result_object
            result_object[propertyName+ObjectPanel.propertyName_object_remove_button] = object_remove_button
            need_p = true;
        }
        if (need_p) {
            var p = this.getOrCreate(panel, "_p", "p", true)
            p.innerHTML = propertyName;
        }
        if (type == "object") {
            result_object[propertyName] = {}
            if (value instanceof Array) {
                panel.classList.add(this.arrayClass)
                for (var i = 0; i < value.length; i++) {
                    this.solve_loop(value[i], panel, settings, result_object[propertyName])
                }
                var array_add_button = this.button(
                    panel, "Add an item for : " + propertyName,
                    this.arrayAddClass, this.addArrayItem, 
                    "add_circle_outline"
                )
                array_add_button.propertyName = propertyName
                array_add_button.result_object = result_object[propertyName]
                result_object[propertyName][ObjectPanel.propertyName_array_add_button] = array_add_button
                array_add_button.settings = settings
            }
            else if(value != null && value != undefined) {
                // javascript only treat a map as an object
                panel.classList.add(this.objectClass)
                this.solve_loop(value, panel, settings, result_object[propertyName])
                var property_add_button = this.button(
                    panel, "Add a key-value pair : " + propertyName,
                    this.porpertyAddClass, this.addHashMapPair, 
                    "add"
                )
                property_add_button.propertyName = propertyName
                property_add_button.result_object = result_object[propertyName]
                result_object[propertyName][ObjectPanel.propertyName_object_add_button] = property_add_button
                property_add_button.settings = settings
            } 
            else {
                var p = this.getOrCreate(panel, "_p", "p", true)
                p.innerText = "not support null Value"

                var select = this.getValueTypeSelect(panel)
                var enter_button = this.getOrCreate(panel, "_enter_button", "button", true)
                enter_button.select = select
                enter_button.addEventListener("click", function(e) {
                    console.log(select.value)
                })
                enter_button.innerText = "Enter"
                enter_button.type = "button"
            }
        }
        else {
            var element = this.getOrCreate(panel, "_element_" + value, "input", true)
            switch(type) {
                case "string":
                    element.setAttribute("type", "text");
                    element.setAttribute("value", value);
                    element.value = value;
                    break;
                case "number":
                    element.setAttribute("type", "number");
                    element.setAttribute("value", value);
                    element.value = value;
                    break;
                case "boolean":
                    element.setAttribute("type", "checkbox");
                    element.setAttribute("checked", value);
                    element.checked = value;
                    break;
                default :
                    console.error("unexperted type : " + type);
            }
            result_object[propertyName] = element
        }
        return panel;
    }

    get() {
        var result = {}
        this.get_loop(result, this.parent);
        return result
    }

    get_loop(result, parent) {
        var c = 0;
        for (var i = 0; i < parent.children.length; i++) {
            var element = parent.children[i];
            if (element.tagName != "DIV") {
                c++;
                continue;
            }
            var is_array_inside = element.classList.contains(this.arrayClass)
            var is_object_inside = element.classList.contains(this.objectClass)
            var propertyName = null
            
            var p = element.querySelector("* > p");
            if (p != null) {
                propertyName = p.innerText;
            }
            else {
                propertyName = i - c
            }

            if (is_array_inside) {
                var array_result = []
                this.get_loop(array_result, element);
                result[propertyName] = array_result
            } 
            else if (is_object_inside) {
                var object_result = {}
                this.get_loop(object_result, element);
                result[propertyName] = object_result;
            } 
            else {
                var input = element.querySelector("* > input");
                if (input != null) {
                    var input_value = input.value
                    switch (input.type) {
                        case "checkbox":
                            input_value = toBoolean(input.checked)
                            break;
                        case "number" :
                            input_value = parseInt(input_value)
                            break;
                        case "text":
                            input_value = String(input_value)
                            break
                        default :
                            console.log("unexcepted input.type : " + input.type)
                            break;
                    }
                    result[propertyName] = input_value;
                }
            }
        }
    }
}

// below is a better solution working on
function isObject(target) {
    return target != null && target != undefined && typeof(target) == "object";
}
function isArray(target) {
    return target != null && target != undefined && typeof(target) == "object" && target instanceof Array;
}
function isNode(o){
    return (
        typeof Node === "object" ? 
        o instanceof Node 
        : 
        o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
    );
}
function isElement(o){
    return (
        typeof HTMLElement === "object" ? 
        o instanceof HTMLElement 
        : //DOM2
        o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
    );
}
class ObjectPanelContainer {

    constructor (
        HTML_Element, 
        arrayClass, arrayAddClass, arrayRemoveClass, 
        objectClass, porpertyAddClass, porpertyRemoveClass
    ) {
        this.HTML_Element = HTML_Element
        this.root_card = new ObjectPanel_Card(
            this, null, HTML_Element, null
        )

        this.current_object = null;
        this.current_settings = null;
        this.arrayClass = arrayClass;
        this.arrayAddClass = arrayAddClass;
        this.arrayRemoveClass = arrayRemoveClass;
        this.objectClass = objectClass;
        this.porpertyAddClass = porpertyAddClass;
        this.porpertyRemoveClass = porpertyRemoveClass;
    }

    solve(object, settings) {
        this.root_card.solve(object)
        this.current_object = object;
        this.current_settings = settings;
    }

    get() {
        return this.root_card.get();
    }
}
class ObjectPanel_Card {
    constructor(
        objectPanelContainer, parent_card, HTML_Element, propertyName
    ) {
        this.objectPanelContainer = objectPanelContainer;
        this.parent_card = parent_card;
        this.settings = null;
        this.HTML_Element = HTML_Element;
        if (propertyName != null && propertyName != undefined) {
            this.propertyName_element = document.createElement("p");
            this.propertyName_element.innerText = propertyName;
            this.HTML_Element.appendChild(this.propertyName_element);
        } 
        else {
            this.propertyName_element = null;
        }
        this.value = null;
        this.add_button = null;
        this.remove_button = null;
        this.addition_panel = null;
    }

    addValueCard(propertyName) {
        var card = new ObjectPanel_Card(
            this.objectPanelContainer, this, 
            document.createElement("div"),
            propertyName
        );
        this.HTML_Element.appendChild(card.HTML_Element)
        this.value[propertyName] = card;
        return card;
    }

    solve(object) {
        if (isObject(object)) {
            if(isArray(object)) {
                this.value = []
            } 
            else {
                this.value = {}
            }
            for(var prop in object) {
                var value_card = this.addValueCard(prop)
                value_card.solve(object[prop])
                this.value[prop] = value_card
            }
        } 
        else {
            var input_element = document.createElement("input");
            var type = typeof(object);
            switch(type) {
                case "string":
                    input_element.setAttribute("type", "text");
                    input_element.setAttribute("value", object);
                    input_element.value = object;
                    break;
                case "number":
                    input_element.setAttribute("type", "number");
                    input_element.setAttribute("value", object);
                    input_element.value = object;
                    break;
                case "boolean":
                    input_element.setAttribute("type", "checkbox");
                    input_element.setAttribute("checked", object);
                    input_element.checked = object;
                    break;
                default :
                    console.log("type : " + type)
            }
            this.HTML_Element.appendChild(input_element);
            this.value = input_element;
        }
    }

    get() {
        result = null;
        console.log(this.value)
        if(isObject(this.value)) {
            if(isArray(this.value)) {
                result = []
            } 
            else {
                result = {}
            }
            for(var i in this.value) {
                result[i] = this.value[i].get()
            }
        } 
        else {
            result = value.value;
        }
        return result;
    }
}
