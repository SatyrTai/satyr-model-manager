var DEFAULT_http_timeout_limit = 10000; // 10s

function printObjectInformations(object) {
    msg = "printObjectInformations : "
    msg+= "\ntypeof object : " + typeof object;
    msg+= "\nobject.constructor : " + object.constructor;
    msg+= "\nobject.constructor.name : " + object.constructor.name;
    msg+= "\nobject.lenght : " + object.lenght;
    msg+= "\nobject map   : " + (object instanceof Map);
    msg+= "\nobject set   : " + (object instanceof Set);
    msg+= "\nobject array : " + (object instanceof Array);
    for (i in object) msg+= "\n" + i + " : " + object[i];
    console.log(msg)
}

function toBoolean(value) {
    if (value == null || value == undefined) return null
    result = null
    try {
        result = (String(value).toLowerCase() === 'true')
    } catch {}
    return result
}

/* https://www.w3schools.com/jsref/met_cssstyle_getpropertypriority.asp */


var fastapi_async_params_name = "fastapiasynccode"

class HttpAsyncCodeManager {
    constructor() {
      this.pool = new Set();
    }
  
    acquire() {
      let value = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
      while (this.pool.has(value)) {
        value = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
      }
      this.pool.add(value);
      return value;
    }
  
    release(value) {
      this.pool.delete(value);
    }
}

const httpAsyncCodeManager = new HttpAsyncCodeManager()

function http_onloadend_callback(e) {
    var URLSplit = e.currentTarget.responseURL.split('?')
    var URLParams = URLSplit[1]
    if (URLParams != null && URLParams != undefined) {
        var searchParams = new URLSearchParams(URLParams);
        var code = searchParams.get(fastapi_async_params_name);
        if(code != null) {
            httpAsyncCodeManager.release(code);
        }
    }
}

function httpGetAsync(url, callback, ontimeout, onerror, http_timeout_limit) {
    var xmlHttp = new XMLHttpRequest();
    if(http_timeout_limit != null && http_timeout_limit != undefined) {
        xmlHttp.timeout = http_timeout_limit;
    } else {
        xmlHttp.timeout = 10000;
    }
    xmlHttp.responseType = "text";
    //xmlHttp.onload = function(e) {};
    if(ontimeout != null && ontimeout != undefined) {
        xmlHttp.ontimeout = ontimeout;
    }
    if(onerror != null && onerror != undefined) {
        xmlHttp.onerror = onerror;
    }
    //xmlHttp.upload.onprogress = function(e) {};
    if (callback != null && callback != undefined) {
        xmlHttp.onreadystatechange = function() { 
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
                callback(xmlHttp.responseText);
        }
    }
    xmlHttp.onloadend = http_onloadend_callback
    var URLSplit = url.split('?')
    var resultURL = URLSplit[0]
    var URLParams = URLSplit[1]
    var searchParams = new URLSearchParams(URLParams);
    searchParams.append(fastapi_async_params_name, httpAsyncCodeManager.acquire())
    resultURL += "?" + searchParams.toString()
    xmlHttp.open("GET", resultURL, true);
    xmlHttp.send(null);
}

function httpPostAsync(url, callback, object, ontimeout, onerror, http_timeout_limit) {
    var xmlHttp = new XMLHttpRequest();
    if(http_timeout_limit != null && http_timeout_limit != undefined) {
        xmlHttp.timeout = http_timeout_limit;
    } else {
        xmlHttp.timeout = 10000;
    }
    xmlHttp.responseType = "text";
    //xmlHttp.onload = function(e) {};
    if(ontimeout != null && ontimeout != undefined) {
        xmlHttp.ontimeout = ontimeout;
    }
    if(onerror != null && onerror != undefined) {
        xmlHttp.onerror = onerror;
    }
    //xmlHttp.upload.onprogress = function(e) {};
    if (callback != null && callback != undefined) {
        xmlHttp.onreadystatechange = function() { 
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
                callback(xmlHttp.responseText);
        }
    }

    xmlHttp.onloadend = http_onloadend_callback
    var URLSplit = url.split('?')
    var resultURL = URLSplit[0]
    var URLParams = URLSplit[1]
    var searchParams = new URLSearchParams(URLParams);
    searchParams.append(fastapi_async_params_name, httpAsyncCodeManager.acquire())
    resultURL += "?" + searchParams.toString()

    xmlHttp.open("POST", resultURL, true);
    xmlHttp.setRequestHeader('Content-Type', 'application/json');
    jsonObject = null
    if (object != null && object != undefined) {
        jsonObject = JSON.stringify(object)
    }
    xmlHttp.send(jsonObject);
}

function innerHTML_security_process(target_innerHTML) {

    return target_innerHTML
}

//https://www.w3schools.com/css/css3_variables_javascript.asp
var r = document.querySelector(':root');
function setCssVariable(varName, varValue) {
    //'--blue', 'lightblue'
    r.style.setProperty(varName, varValue);
}

//https://www.w3schools.com/js/default.asp
//https://stackoverflow.com/questions/247483/http-get-request-in-javascript
//https://stackoverflow.com/questions/6396101/pure-javascript-send-post-data-without-a-form