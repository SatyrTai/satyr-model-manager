import json
import requests
import variables
import file_utils
import re

def changeAllExistPreview(nWidth : int):
    from PIL import Image
    paths = variables.settings_object.paths
    all_paths = []
    for key in paths :
        value = paths[key]
        all_paths += value
    
    for path in all_paths :
        full_paths = []
        full_paths += file_utils.lookingForFiles(path, targetSuffix=".png")
        full_paths += file_utils.lookingForFiles(path, targetSuffix=".jpeg")

        for full_path in full_paths :
            b : bool = False
            try : 
                #b = Image.open(full_path).width == nWidth
                print(Image.open(full_path).width)
            except : pass

    


def get_prefered_model_version_id_from_page_url(url) -> str:
    index = url.find(variables.targetString_PreferredModelVersionID)
    if index == -1: return None
    return url[index + len(variables.targetString_PreferredModelVersionID):]


def get_model_page_url_page_name(page_id, page_name):
    # return "https://civitai.com/models/" + str(pageId) + "/" + str(pageName)
    return variables.siteURL + "/models/" + str(page_id)


def get_model_page_url_modelVersionId(page_id, modelVersionId):
    # return "https://civitai.com/models/" + str(pageId) + "/" + str(pageName)
    return variables.siteURL + "/models/" + str(page_id) + "?modelVersionId=" + str(modelVersionId)


def get_model_api_url(page_id):
    return variables.apiURL + "/models/" + str(page_id)


def get_model_api_url_by_hash(hash) :
    return variables.apiURL + "/model-versions/by-hash/" + hash
    

def get_page_id_from_page_url(url)->str:
    replaced = url.replace(variables.siteURL + "/models/", "")
    indexes = [replaced.find("/"), replaced.find("?")]
    noFind = True
    for i in indexes:
        noFind = noFind and i == -1
    if noFind: return replaced
    indexes = list(filter(lambda i: i != -1, indexes))
    return replaced[0:min(indexes)]


def get_civitai_api_text(url):
    # https://github.com/civitai/civitai/wiki/REST-API-Reference
    r = None
    try : 
        r = requests.get(url, headers={"Content-Type": "application/json"})
        if not r.status_code == 200:
            return None
    except Exception as e :
        print("civitai_utils -> get_civitai_api_text : " + str(e))
        return None
    finally :
        if r is not None : r.close()
    return r.text


def get_creator_name(loaded_json):
    return loaded_json["creator"]["username"]


def get_creator_url(loaded_json):
    return variables.siteURL + "/user/" + str(get_creator_name(loaded_json)) + "/models"


def get_specific_scale_image(url:str, width:str|int):
    return url.replace("width=450", "width=" + str(width))


def get_image_scale_from_url(url:str) -> int:
    return int(re.search(r'width=(\d+)', url).group(1))


def get_paths(model_type) -> list[str] | None:
    paths = variables.settings_object.paths
    t = None
    if model_type in paths:
        t = model_type
    else :
        t = variables.settings_object.getRecognized(model_type)
    if t is None or t not in paths : return None
    return paths[t]


def get_path(model_type) -> str | None:
    paths = get_paths(model_type)
    if paths is None or len(paths) <= 0 : return None
    return paths[0]


def lookingForFilesInPaths(model_type, model_name) -> list[str]:
    #finding file with model_name may more than one
    result = []
    model_paths = get_paths(model_type)
    if model_paths != None : 
        for path in model_paths :
            full_paths = file_utils.lookingForFiles(path = path, targetFileName=model_name, targetSuffix=".**", recursive=True)
            for path in full_paths :
                result.append(path)
    return result

'''
def get_auto_matching_result(model_type):
    paths = variables.settings_object.paths
    t = matching.getMostLikelyMatch(list(paths.keys()), model_type, 0.2)
    # ask user for result
    print("a model type did not set : " + model_type)
    print("auto matching to : " + str(t))
    matching_path = os.path.join(variables.settings_object.this_extension_directory, model_type)
    print("Default Path : " + matching_path)
    _input = input("is Default Path OK ? (Y/N) : ")
    if _input == "Y":
        paths[model_type] = []
        paths[model_type].append(matching_path)
        return matching_path
    else:
        return None
'''


def loadApiJson(pageId:str)->dict:
    full_path = file_utils.get_full_path(
        variables.jsonFilesPath, 
        pageId,
        variables.jsonSuffix
    )
    api_text = file_utils.get_text_form_file(full_path)
    if api_text == None : return None
    return json.loads(api_text)


def saveApiJson(pageId : str, target_json : str):
    try:
        full_path = file_utils.get_full_path(
            variables.jsonFilesPath,
            pageId, variables.jsonSuffix
        )
        file_utils.write_text_to(
            full_path,
            json.dumps(target_json),
            variables.writingSuffix
        )
    except Exception as e:
        print("Can't save ApiJson.")
        print(e)


def getApiJsonFromSite(pageId) :
    result = None
    api_url = get_model_api_url(pageId)
    apiText = get_civitai_api_text(api_url)
    if apiText is not None and "<title>We'll be right back | Civitai</title>" not in apiText :
        try:
            result = json.loads(apiText)
        except Exception as e:
            print(e)
    return result