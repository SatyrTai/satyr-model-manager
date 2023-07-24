
class Model_Info {
    constructor(reponseJson, buttonClick) {
        this.model_type_name = reponseJson["model_type_name"]
        this.model_file_name = reponseJson["model_file_name"]
        this.name = reponseJson["model_file_name"]

        //description
        {
            var description = reponseJson["description"]
            if (description == null || description == undefined) {
                description = "There is no description available in the Civitai API."
                description+= "\nPlease click the button in the upper left corner to access the model site."
            } else {
                description = innerHTML_security_process(description)
            }
            this.description_container = document.createElement("div");
            this.description_container.innerHTML = description
            this.description_container.style.padding = "3vmin"
        }

        //images
        {
            this.images_container = document.createElement("div")
            this.images_container.style.display = "flex"
            this.images_container.style.flexWrap = "wrap"
            this.images_container.style.justifyContent = "center"
            this.images_container.style.alignContent = "flex-start"
            this.images_container.style.gap = "1%"
            this.images_container.style.padding = "1%"

            var images = reponseJson["images"]
            for (var index in images) {
                var image_json = images[index]
                
                {
                    var image_div = document.createElement("div")
                    image_div.style.position = "relative"
                    image_div.style.flex = "0 1 auto"
                    image_div.style.paddingTop = "8px"
                    image_div.style.paddingBottom = "8px"
                    image_div.style.width = "18%"
                    image_div.style.minWidth = "18%"
                    image_div.style.minHeight = "100px"
                    {
                        var img = document.createElement("img")
                        img.style.width = "100%"
                        img.style.objectFit = "contain"
                        img.loading = "lazy";
                        img.src = image_json["url"]
                        image_div.appendChild(img)
                    }
                    var prompt = image_json["prompt"]
                    if (prompt != null && prompt != undefined) {
                        var size = "2vmin"
                        var button = document.createElement("button")
                        button.style.width = size
                        button.style.height = size
                        button.style.border = "none"
                        button.style.borderRadius = "1vmin"
                        button.style.color = "black"
                        button.style.fontSize = "1vmin"
                        button.style.fontWeight = "bolder"
                        button.style.transitionDuration = "0.2s"
                        button.style.position = "absolute"
                        button.style.top = "5%"
                        button.style.left = "5%"
                        button.style.boxShadow = "0px 0px 4px black"
                        
                        button.type = "button"
                        button.prompt = prompt
                        button.addEventListener('click', this.pnginfo)
                        button.addEventListener('mouseover', function(e){
                            this.style.width = "90%"
                            this.style.height = size
                        })
                        button.addEventListener('transitionend', function(e){
                            if (this.style.width == size) {
                                this.innerText = ""
                                this.style.height = size
                            } else {
                                this.innerText = "Send to txt2img"
                                this.style.height = "3vmin"
                            }
                        })
                        button.addEventListener('mouseout', function(e){
                            this.style.width = size
                            this.style.height = size
                            this.innerText = ""
                        })
                        image_div.appendChild(button)
                    }
                    this.images_container.appendChild(image_div)
                }
            }
        }

        //url_button
        {
            this.url_button = document.createElement("button")
            this.url_button.style.position = "absolute"
            this.url_button.style.left = "5px"
            this.url_button.style.top = "5px"
            this.url_button.style.border = "none"
            this.url_button.style.borderRadius = "5px"
            this.url_button.style.backgroundColor = "rgb(0, 150, 188)"
            this.url_button.style.color = "white"
            this.url_button.style.cursor = "pointer"
            this.url_button.style.padding = "10px"
            this.url_button.classList.add('material-icons')
            this.url_button.title = "Visit the site"
            this.url_button.innerText = 'tab'
            this.url_button.type = 'button'
            this.url_button.url = get_model_page_url_modelVersionId(
                reponseJson['pageId'], reponseJson['modelVersionId'])
            this.url_button.addEventListener('click', function(e){
                window.open(this.url, "_blank")
            })
        }
        //trainedWords
        {
            this.set_0 = document.createElement("div")
            this.set_0.title = "trainedWords"
            this.set_0.style.borderBottom = "3px solid rgba(172, 255, 47, 0.6)"
            var trainedWords = reponseJson["trainedWords"]
            for (var i in trainedWords) {
                var button = document.createElement("button")
                button.innerText = trainedWords[i]
                button.targetString = trainedWords[i]
                button.addEventListener('click', buttonClick)
                this.set_0.appendChild(button)
            }
        }
        //highest_frequency_tags
        {
            this.set_1 = document.createElement("div")
            this.set_1.title = "highest_frequency_tags"
            this.set_1.style.borderBottom = "3px solid rgba(255, 172, 47, 0.6)"
            var highest_frequency_tags = reponseJson["highest_frequency_tags"]
            for (var i in highest_frequency_tags) {
                var button = document.createElement("button")
                button.innerText = highest_frequency_tags[i]
                button.targetString = highest_frequency_tags[i][0]
                button.addEventListener('click', buttonClick)
                this.set_1.appendChild(button)
            }
        }
        this.current_future = null
    }

    pnginfo() {
        if (this.prompt == null || this.prompt == undefined) return;
        try {
            var textarea = document.getElementById("pnginfo_generation_info").querySelector("textarea")
            var button = document.getElementById("tab_pnginfo").querySelector("button#txt2img_tab")
            textarea.value = this.prompt
            updateInput(textarea)
            button.click()
        } catch {}
    }

    

    custom_content(parentElement_div) {
        parentElement_div.classList.add("Model_Info")
        parentElement_div.appendChild(this.set_0)
        parentElement_div.appendChild(this.set_1)
    }

    window_content(parentElement_div) {
        parentElement_div.style.display = "flex"
        parentElement_div.style.flexWrap = "wrap"
        parentElement_div.style.flexDirection = "column"
        parentElement_div.style.color = "white"
        parentElement_div.appendChild(this.url_button)
        parentElement_div.appendChild(this.images_container)
        parentElement_div.appendChild(this.description_container)
        
    }

    cardClick(e) {
        if (!(e.srcElement.tagName.toLowerCase() === 'button')) {
            noticeCardManager.window_show(this.name, this.window_content.bind(this), null)
        }
    }

    show() {
        //google_icon, title, msg, duration, onclick_event, color

        if (this.current_future != null && this.current_future != undefined) {
            if (this.current_future.status != NoticeCard_status.END) {
                return false
            }
        }

        this.current_future = noticeCardManager.notice_show(
            'android', this.name, 
            this.custom_content.bind(this), "infinite", 
            this.cardClick.bind(this), 'white'
        )
        return true
    }

    close() {
        if(this.current_future != null && this.current_future != undefined) {
            this.current_future.notice_close()
        }
    }
}