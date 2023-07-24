function _notice_pack_card_click_event(e) {
    this.the_card.click_event(e)
}

function _notice_pack_card_animationend_event(e) {
    this.the_card.animationend_event(e)
}

class NoticeCard {
    constructor(_manager, left_side) {
        this.manager = _manager;
        this.left_side = left_side;
        this.parent = _manager.element;

        this.element = document.createElement("div");
        this.icon = document.createElement("i");
        this.info = document.createElement("div");
        this.close_button = document.createElement("button");
        this.title = document.createElement("p");
        //this.p = document.createElement("p");
        this.content = document.createElement("div");

        this.element.addEventListener("click", _notice_pack_card_click_event);
        this.element.addEventListener("animationend", _notice_pack_card_animationend_event);
        this.element.classList.add("notice_pack_card");
        this.element.style.animationDuration = "1s";

        if (this.left_side) {
            this.element.style.borderLeft = "5px";
            this.element.style.borderRight = "0";
        } else {
            this.element.style.borderLeft = "0";
            this.element.style.borderRight = "5px";
        }

        if (this.left_side) {
            this.element.style.left = "4px";
            this.element.style.borderLeft = "5px"
            this.element.style.borderRight = "0px"
        } else {
            this.element.style.right = "4px";
            this.element.style.borderLeft = "0px"
            this.element.style.borderRight = "5px"
        }
        this.title.style.paddingRight = "3vmin"

        this.close_button.classList.add("material-icons")
        this.close_button.style.position = "absolute"
        this.close_button.style.right = "0"
        this.close_button.style.top = "0"
        this.close_button.style.color = "white"
        this.close_button.style.background = "none"
        this.close_button.style.border = "none"
        this.close_button.style.cursor = "pointer"
        this.close_button.style.pointerEvents = "auto"
        this.close_button.type = "button"
        this.close_button.innerText = "close"
        this.close_button.addEventListener("click", this.close_event)

        this.icon.classList.add("material-icons")
        this.icon.style.color = "white"
        //this.icon.style.textShadow = "0 0 8px black"

        this.parent.appendChild(this.element);
        this.element.appendChild(this.icon);
        this.element.appendChild(this.info);
        this.element.appendChild(this.close_button);
        this.info.appendChild(this.title);
        //this.info.appendChild(this.p);
        this.info.appendChild(this.content);

        this.element.the_card = this;

        this.duration = null;
        this.running = false;
        this.future = null;

        this.onclick_event = null;

        this.defaultColor = "white"
    }
    // onclick_event : 
    // could be null or undefined, will be default click event
    // color :
    // must be rgb(), do not use "red" "white" something like this
    // and also do not rgba() it will make no difference between msg and background
    show(google_icon, title, msg, duration, onclick_event, color, future) {
        this.future = future

        //this.parent.appendChild(this.element);
        //this.element.style.display = "initial"
        this.element.style.pointerEvents = "auto";
        if (this.left_side) {
            this.element.classList.add("notice_pack_rightOut");
        } 
        else {
            this.element.classList.add("notice_pack_leftOut");
        }
        this.element.style.animationDuration = "1s"

        this.icon.innerText = google_icon;
        this.title.innerText = title;
        //this.p.innerText = msg;
        
        this.content.innerHTML = ''
        this.content.className = ''
        this.content.style = ''

        if (Object.prototype.toString.call(msg) == '[object Function]') {
            msg(this.content)
        } else {
            var p = document.createElement("p")
            this.content.appendChild(p)
            p.innerText = msg
            p.style.color = 'white'
        }
        
        this.duration = duration;
        this.running = true;
        this.future.set(NoticeCard_status.RUNNING)
        this.future.card = this
        this.onclick_event = onclick_event;
        if (
            this.onclick_event != null && this.onclick_event != undefined && 
            Object.prototype.toString.call(this.onclick_event) == '[object Function]'
        ) {
            this.element.addEventListener("click", this.onclick_event)
        } 
        else {
            this.element.addEventListener("click", this.card_default_click_event)
        }
        var finalColor = "rgba(255,255,255)";
        if (color != null && color != undefined) {
            finalColor = color;
        }
        //this.element.style.backgroundColor = finalColor_alpha;
        //this.element.style.backdropFilter = "blur(4px)"
        this.element.style.borderLeftColor = finalColor;
        this.element.style.borderRightColor = finalColor;
        this.element.style.borderTopColor = finalColor;
        this.element.style.borderBottomColor = finalColor;
        this.info.style.borderLeftColor = finalColor;
        this.icon.style.color = finalColor;
        //this.h3.style.color = finalColor;
        //this.p.style.color = finalColor;
    }
    close(manager_callback) {
        //this.element.style.display = "none"
        this.element.style.pointerEvents = "none";
        this.element.classList.remove("notice_pack_rightOut");
        this.element.classList.remove("notice_pack_leftOut");
        this.element.classList.remove("notice_pack_opacity");
        this.element.classList.remove("notice_pack_shining");
        this.element.style.animationDuration = "unset"
        this.element.style.animationIterationCount = "1"
        //this.element.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
        this.element.style.borderLeftColor = this.defaultColor;
        this.element.style.borderRightColor = this.defaultColor;
        this.element.style.borderTopColor = this.defaultColor;
        this.element.style.borderBottomColor = this.defaultColor;
        this.info.style.borderLeftColor = this.defaultColor;
        this.icon.style.color = this.defaultColor;
        //this.h3.innerText = undefined;
        //this.p.innerText = undefined;
        this.running = false;
        if (this.future != null && this.future != undefined) {
            this.future.set(NoticeCard_status.END)
            this.future.card = null
        }
        if (
            this.onclick_event != null && this.onclick_event != undefined && 
            Object.prototype.toString.call(this.onclick_event) == '[object Function]'
        ) {
            this.element.removeEventListener("click", this.onclick_event)
        }

        this.info.style.borderLeftColor = "white";
        this.icon.style.color = "white";
        this.title.style.color = "white";
        //this.p.style.color = "white";

        if (!manager_callback) return;
        this.manager.notice_end_callback(this)
    }
    close_event(e) {
        this.parentElement.the_card.close(true)
        e.stopPropagation()
    }
    //card_default_click_event(e) {this.the_card.manager.window_show(this.the_card.h3.innerText, this.the_card.p.innerText, this.the_card)}
    click_event(e) {
        if (!this.element.classList.contains("notice_pack_opacity") && e != undefined) {
            return;
        }
        var state = this.element.style.animationPlayState
        if (state == "running" || state == "") {
            this.element.style.animationPlayState = "paused"

        } else {
            this.element.style.animationPlayState = "running"
        }
    }
    animationend_event(e) {
        switch (e.animationName) {
            case "notice_pack_rightOut":
                if(this.duration == "-1" || this.duration == "infinite") {
                    this.element.classList.replace(
                        "notice_pack_rightOut", "notice_pack_shining"
                    );
                    this.element.style.animationDuration = "5s";
                    this.element.style.animationIterationCount = "infinite";
                } else {
                    this.element.classList.replace(
                        "notice_pack_rightOut", "notice_pack_opacity"
                    );
                    this.element.style.animationDuration = this.duration;
                    this.element.style.animationIterationCount = 1;
                }
                break;
            case "notice_pack_leftOut":
                if(this.duration == "-1" || this.duration == "infinite") {
                    this.element.classList.replace(
                        "notice_pack_leftOut", "notice_pack_shining"
                    );
                    this.element.style.animationDuration = "5s";
                    this.element.style.animationIterationCount = "infinite";
                } else {
                    this.element.classList.replace(
                        "notice_pack_leftOut", "notice_pack_opacity"
                    );
                    this.element.style.animationDuration = this.duration;
                    this.element.style.animationIterationCount = 1;
                }
                break;
            case "notice_pack_opacity":
                this.close(true);
                this.element.style.animationIterationCount = 1;
                break;
        }
    }
}

const NoticeCard_status = {
    NONE : -1,
    RUNNING: 0,
    WATING: 1,
    END: 2
}

class NoticeFuture {
    constructor(manager) {
        this.manager = manager
        this.status = NoticeCard_status.NONE
        this.status_callbacks = {}
        this.card = null
    }

    set(status) {
        this.status = status
        var callbacks = this.status_callbacks[this.status]
        if (callbacks != null && callbacks != undefined) {
            for(var index in callbacks) {
                var callback = callbacks[index]
                callback()
            }
        }
    }

    addCallback(status, callbackfun) {
        var callbacks = this.status_callbacks[status]
        if (callbacks == null || callbacks == undefined) {
            callbacks = []
            this.status_callbacks[status] = callbacks
        }
        callbacks.push(callbackfun)
    }

    notice_close() {
        this.manager.notice_close(this)
    }
}

class NoticeCardManager {
    constructor(parent, gap, available_height_proportion, bottom_offset, left_side) {
        this.parent = parent;
        this.element = document.createElement("div");
        this.element.classList.add("notice_pack_manager")
        this.element.style.bottom = bottom_offset
        this.element.style.gap = gap+"vh";
        this.element.style.paddingTop = gap+"vh";
        this.element.style.paddingBottom = gap+"vh";
        if (left_side) {
            this.element.style.left = "0";
            this.element.style.alignItems = "start"
        } else {
            this.element.style.right = "0";
            this.element.style.alignItems = "end"
        }
        this.parent.appendChild(this.element)

        this.card_list = []
        this.gap = gap
        this.available_height_proportion = available_height_proportion
        this.left_side = left_side

        this.records = []
        this.current_size = 0

        this.notice_pack_window = document.createElement("div");
        this.notice_pack_window.id = "notice_pack_window";
        this.notice_pack_window.style.display = "none";

        this.pop_up_window = document.createElement("div");

        this.pop_up_window_close_button = document.createElement("button");
        this.pop_up_window_close_button.id = "notice_pack_window_close";
        this.pop_up_window_close_button.type = "button";
        this.pop_up_window_close_button.addEventListener("click", this.window_close.bind(this));
        this.pop_up_window_close_button.classList.add("disable_user_selection");
        this.pop_up_window_close_button.classList.add("disable_scrollbar");
        this.pop_up_window_close_button.classList.add("material-icons");
        this.pop_up_window_close_button.innerText = "close";

        this.pop_up_window_title = document.createElement("h3");
        this.pop_up_window_title.id = "notice_pack_window_title";

        this.pop_up_container = document.createElement("div");

        this.parent.appendChild(this.notice_pack_window);
        this.pop_up_window.appendChild(this.pop_up_window_close_button);
        this.pop_up_window.appendChild(this.pop_up_window_title);
        this.pop_up_window.appendChild(this.pop_up_container);
        this.notice_pack_window.appendChild(this.pop_up_window);
        this.notice_pack_window.current_pop_up_card = null;
        
    }
    get_gap_size_pixel() {
        return window.innerHeight / 100 * this.gap;
    }
    window_show(title, content, card) {
        this.notice_pack_window.style.display = "flex";
        this.notice_pack_window.current_pop_up_card = card;
        this.pop_up_window_title.innerText = title
        
        this.pop_up_container.innerHTML = ''
        this.pop_up_container.className = ''
        this.pop_up_container.style = ''

        if (Object.prototype.toString.call(content) == '[object Function]') {
            content(this.pop_up_container)
        } else {
            var p = document.createElement("p")
            p.innerText = content
            p.style.color = "white";
            p.style.textAlign = "center";
            this.pop_up_container.appendChild(p)
        }
    }
    window_close() {
        var notice_pack_window = this.notice_pack_window;
        notice_pack_window.style.display = "none";
        if (notice_pack_window.current_pop_up_card == undefined || notice_pack_window.current_pop_up_card == null) {
            return;
        }
        notice_pack_window.current_pop_up_card.click_event(undefined)
        notice_pack_window.current_pop_up_card = null;
    }
    notice_show(google_icon, title, msg, duration, onclick_event, color) {
        var future = new NoticeFuture(this)
        var card = null;
        var current_container_size = 0;
        var current_gap_size = this.get_gap_size_pixel();
        current_container_size += current_gap_size * 2;
        for (var i = 0; i < this.card_list.length; i++) {
            var temp = this.card_list[i];
            if(temp.running) {
                current_container_size += temp.element.clientHeight | temp.element.offsetHeight;
                current_container_size += current_gap_size;
                continue;
            }
            card = temp
            break;
        }
        if (card == null) {
            card = new NoticeCard(this, this.left_side);
            this.card_list[this.card_list.length] = card;
        }
        card.show(google_icon, title, msg, duration, onclick_event, color, future)
        current_container_size += card.element.clientHeight | card.element.offsetHeight;
        current_container_size += current_gap_size;
        if (window.innerHeight * (this.available_height_proportion / 100) <= current_container_size) {
            card.close(false)
            future.set(NoticeCard_status.WATING)
            this.records.push(
                {
                    "google_icon" : google_icon,
                    "title" : title,
                    "msg" : msg,
                    "duration" : duration,
                    "onclick_event" : onclick_event,
                    "color" : color,
                    "future": future,
                }
            )
        }
        return future
    }
    notice_close(future) {
        if (future.card != null && future.card != undefined) {
            future.card.close(true)
        }
    }
    notice_end_callback(noticeCard) {
        if (this.records.length <= 0) return;
        var record = this.records.shift();
        noticeCard.show(record["google_icon"], record["title"], record["msg"], record["duration"], record["future"])
    }
}
/*
how to use
var noticeCardManager = null;
window.addEventListener(
    "load", 
    function (e) {
        noticeCardManager = new NoticeCardManager(document.body, 0.5, 50, "10vh", true);
    }
)
noticeCardManager.notice_show(icon, "Title", "text", "5s")
*/
