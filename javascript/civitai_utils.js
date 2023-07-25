
const siteURL = "https://civitai.com"
const apiURL = "https://civitai.com/api/v1"
const targetString_PreferredModelVersionID = "modelVersionId="

function get_specific_scale_image(url, width) {
    var old_scale = get_image_scale_from_url(url)
    return url.replace("width="+old_scale, "width=" + String(width))
}

function get_model_page_url_modelVersionId(page_id, modelVersionId) {
    return siteURL + "/models/" + page_id + "?modelVersionId=" + modelVersionId
}

function get_image_scale_from_url(url) {
    return url.match(/width=(\d+)/)[1];
}

function get_model_api_url(page_id) {
    return apiURL + "/models/" + String(page_id);
}

function get_model_api_url_by_hash(hash) {
    return apiURL + "/model-versions/by-hash/"+hash;
}

function get_page_id_from_page_url(url) {
    var replaced = url.replace(siteURL + "/models/", "");
    var indexes = [replaced.indexOf("/"), replaced.indexOf("?")];
    var noFind = true;
    for (var i = 0; i < indexes.length; i++) {
        noFind = noFind && indexes[i] === -1;
    }
    if (noFind) {
        return replaced;
    }
    indexes = indexes.filter(function (i) { return i !== -1; });
    return replaced.substr(0, Math.min.apply(null, indexes));
}
