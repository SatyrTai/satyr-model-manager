document.addEventListener("keypress", function(e) {
    switch (e.code) {
        case "Space" :
            if(e.shiftKey) {
                console.log("shiftKey Space")
            }
            break;
    }
})
var noticeCardManager = null;
(
    function () {
        var loaded_model_infos = {}

        var invisible_button = null;
        var invisible_textbox = null;

        var webui_selected_tab_button_class_name = "selected"

        var txt2img_tab = null;
        var img2img_tab = null;

        window.addEventListener(
            "load", 
            function (e) {
                noticeCardManager = new NoticeCardManager(
                    this.document.body, 0.5, 97, "3vh", false);
            }
        )

        function modelInfo_future_callback() {
            var model_info = loaded_model_infos[this.model_type_name+this.model_file_name]
            if (model_info != null && model_info != undefined) {
                delete loaded_model_infos[this.model_type_name+this.model_file_name]
            }
        }

        function httpCallback(reponseText) {
            var reponseJson = JSON.parse(reponseText)
            var failed = reponseJson["failed"]
            if (failed) {return ;}
            var model_type_name = reponseJson["model_type_name"]
            var model_file_name = reponseJson["model_file_name"]
            var key = model_type_name+model_file_name
            var modelInfo = loaded_model_infos[key]
            if (modelInfo == null || modelInfo == undefined) {
                modelInfo = new Model_Info(reponseJson, buttonClick_trainedWords_highest_frequency_tags)
                loaded_model_infos[key] = modelInfo
            }
            if (modelInfo.show()) modelInfo.current_future.addCallback(
                NoticeCard_status.END, modelInfo_future_callback.bind(modelInfo))
        }

        function timeout(e) {
            console.log("timeout")
        }
        
        function onerror(e) {
            console.log("onerror")
        }

        function is_active_txt2img_tab() {
            return txt2img_tab.style.display != "none"
        }

        function is_active_img2img_tab() {
            return img2img_tab.style.display != "none"
        }

        function getSelectedExtraTabName() {
            if (txt2img_tab == null || txt2img_tab == undefined || img2img_tab == null || img2img_tab == undefined) return
            var result = null;
            var buttons = null;
            var is_txt2img_tab_selected = is_active_txt2img_tab()
            var is_img2img_tab_selected = is_active_img2img_tab()
            
            var gradio_app = gradioApp();
            var txt2img_extra_refresh = gradio_app.querySelector("button#txt2img_extra_refresh")
            var img2img_extra_refresh = gradio_app.querySelector("button#img2img_extra_refresh")

            var target_extra_refresh = null;
            if (is_txt2img_tab_selected) {
                target_extra_refresh = txt2img_extra_refresh
            } else if(is_img2img_tab_selected) {
                target_extra_refresh = img2img_extra_refresh
            }

            var buttons = target_extra_refresh.parentElement.querySelectorAll("button")
            for (const button of buttons.values()) {
                if (button === target_extra_refresh) continue
                //remove the extra blank (maybe the blank from gradio !?)
                if (!button.classList.contains(webui_selected_tab_button_class_name)) continue
                
                var tag_name = button.innerText
                if (button.innerText[button.innerText.length - 1] == " ") {
                    tag_name = button.innerText.slice(0, value.innerText.length - 1)
                }
                result = tag_name;
                break;
            }

            return result;
        }

        function model_manager_card_click_event(e) {
            try {
                var srcElement = e.srcElement;
                if (!srcElement.classList.contains("preview")) return;
                var span = srcElement.parentElement.querySelector("span.name")

                var model_type_name = getSelectedExtraTabName();
                var model_file_name = span.innerText
                var model_info = loaded_model_infos[model_type_name+model_file_name]

                if (model_type_name === "Checkpoints") {
                    httpPostAsync(
                        "/model_manager_card_click_post", httpCallback, 
                        {
                            "model_type_name" : model_type_name,
                            "model_file_name" : model_file_name, 
                        }, timeout, onerror
                    );
                }
                else {
                    var model_prompt = null
                    try {
                        model_prompt = String(srcElement.parentElement.onclick).match(/:(.*?):/g)
                    } catch {
                        console.log("model_prompt error")
                    }
    
                    if (promptIncludes(model_file_name) || promptIncludes(model_prompt)) {
                        if (model_info != null && model_info != undefined) {
                            model_info.show()
                        }
                        else {
                            httpPostAsync(
                                "/model_manager_card_click_post", httpCallback, 
                                {
                                    "model_type_name" : model_type_name,
                                    "model_file_name" : model_file_name, 
                                }, timeout, onerror
                            );
                        }
                    } else {
                        model_info.close()
                    }
                }
            } 
            catch(err) {
                console.log("model_manager_card_click_event : " + err)
            }
        }

        var txt2img_prompt_textarea = null;
        var txt2img_neg_prompt_textarea = null;
        var img2img_prompt_textarea = null;
        var img2img_neg_prompt_textarea = null;

        function init_prompt() {
            var txt2img_prompt = document.getElementById("txt2img_prompt")
            txt2img_prompt_textarea = txt2img_prompt.querySelector("label > textarea")
            if (txt2img_prompt_textarea == null || txt2img_prompt_textarea == undefined) {return false}

            var txt2img_neg_prompt = document.getElementById("txt2img_neg_prompt")
            txt2img_neg_prompt_textarea = txt2img_neg_prompt.querySelector("label > textarea")
            if (txt2img_neg_prompt_textarea == null || txt2img_neg_prompt_textarea == undefined) {return false}

            var img2img_prompt = document.getElementById("img2img_prompt")
            img2img_prompt_textarea = img2img_prompt.querySelector("label > textarea")
            if (img2img_prompt_textarea == null || img2img_prompt_textarea == undefined) {return false}

            var img2img_neg_prompt = document.getElementById("img2img_neg_prompt")
            img2img_neg_prompt_textarea = img2img_neg_prompt.querySelector("label > textarea")
            if (img2img_neg_prompt_textarea == null || img2img_neg_prompt_textarea == undefined) {return false}

            return true
        }

        function promptIncludes(targetString) {
            result = false
            if (is_active_txt2img_tab()) {
                result = result || txt2img_prompt_textarea.value.includes(targetString);
                result = result || txt2img_neg_prompt_textarea.value.includes(targetString);
            }
            if (is_active_img2img_tab()) {
                result = result || img2img_prompt_textarea.value.includes(targetString);
                result = result || img2img_neg_prompt_textarea.value.includes(targetString);
            }
            return result
        }

        function buttonClick_trainedWords_highest_frequency_tags() {
            var active_textarea = null;
            if (is_active_txt2img_tab()) {
                active_textarea = activePromptTextarea['txt2img']
            }
            if (is_active_img2img_tab()) {
                active_textarea = activePromptTextarea['img2img']
            }
            if (active_textarea == null) return;
            active_textarea.value = active_textarea.value + " " + this.targetString
            updateInput(active_textarea)
        }
        
        function init() {
            var result = false;
            try {
                var gradio_app = gradioApp();
                if (gradio_app == null) {
                    console.log("gradio_app == null")
                    return false;
                }

                txt2img_tab = gradio_app.querySelector("div#tab_txt2img")
                if (txt2img_tab == null) {
                    console.log("txt2img_tab == null")
                    return false;
                }
                img2img_tab = gradio_app.querySelector("div#tab_img2img")
                if (img2img_tab == null) {
                    console.log("img2img_tab == null")
                    return false;
                }

                var txt2img_extra_tabs = gradio_app.querySelector("div#txt2img_extra_tabs")
                if (txt2img_extra_tabs == null) {
                    console.log("txt2img_extra_tabs == null")
                    return false;
                }

                var img2img_extra_tabs = gradio_app.querySelector("div#img2img_extra_tabs")
                if (img2img_extra_tabs == null) {
                    console.log("img2img_extra_tabs == null")
                    return false;
                }
                txt2img_extra_tabs.addEventListener('click', model_manager_card_click_event)
                img2img_extra_tabs.addEventListener('click', model_manager_card_click_event)

                // get custom elements
                /*
                invisible_button = gradio_app.querySelector("button#model_manager_invisible_button")
                if (invisible_button == null) {
                    return false;
                }
                invisible_textbox = gradio_app.querySelector("div#model_manager_invisible_textbox")
                if (invisible_textbox == null) {
                    return false;
                }
                */

                result = init_prompt();
            }
            catch(err) {
                console.log(err)
                result = false;
            }
            return result;
        }

        var try_times = 20;
        var try_count = 0;

        function apply() {
            try_count += 1;
            if (init()) {
                console.log("model_manager setup complete.")
            }
            else if (try_count <= try_times){
                setTimeout(apply, 5000);
            } 
            else {
                console.log("model_manager setup failed. -> already try 20 times to apply still fail.")
            }
        }
        apply();
    }
)();