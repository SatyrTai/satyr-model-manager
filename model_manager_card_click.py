from fastapi import concurrency
from pydantic import BaseModel

import civitai_utils
import asset_record
import variables
import file_utils
import json


def read_metadata_from_safetensors(filename : str):
    import json

    with open(filename, mode="rb") as file:
        metadata_len = file.read(8)
        metadata_len = int.from_bytes(metadata_len, "little")
        json_start = file.read(2)

        assert metadata_len > 2 and json_start in (b'{"', b"{'"), f"{filename} is not a safetensors file"
        json_data = json_start + file.read(metadata_len-2)
        json_obj = json.loads(json_data)

        res = {}
        for k, v in json_obj.get("__metadata__", {}).items():
            res[k] = v
            if isinstance(v, str) and v[0:1] == '{':
                try:
                    res[k] = json.loads(v)
                except Exception:
                    pass

        return res

def get_ss_tag_frequency(path:str) -> dict:
    target_key = "ss_tag_frequency"
    final_dict = {}
    _json = read_metadata_from_safetensors(path)
    if target_key in _json : 
        _dict = _json[target_key]
        for _key in _dict.keys():
            _value = _dict[_key]
            if isinstance(_value, dict) :
                for key, value in final_dict.items():
                    final_dict[key] = value + _value.get(key, 0)
                for key, value in _value.items():
                    if key not in final_dict:
                        final_dict[key] = value
                #final_dict = {**final_dict, **value}
    sorted_dict = sorted(final_dict.items(), key=lambda x: x[1], reverse=True)
    return sorted_dict

class CardClick_ARGS(BaseModel):
    model_type_name : str
    model_file_name : str

matches = {
    "negativePrompt" : "Negative prompt",
    "steps" : "Steps",
    "sampler" : "Sampler",
    "cfgScale" : "CFG scale",
    "seed" : "Seed",
    "sampler" : "CFG scale",
}

passes = [
    "prompt",
    "negativePrompt",
    "resources",
    "hashes",
]


def apiJson_to_pnginfo(json_image:dict):
    #from modules import sd_samplers
    meta = json_image["meta"]
    if meta is None or "prompt" not in meta: return None
    result = meta["prompt"] + "\n"
    result+= "Negative prompt: " + meta["negativePrompt"] + "\n"
    for key in meta :
        if key in passes : continue
        final_key = key
        if key in matches : final_key = matches[key]
        result += str(final_key) + ": " + str(meta[key]) + ", "

    return result[:len(result)-2]

async def card_click(args : CardClick_ARGS):
    files = await concurrency.run_in_threadpool(
        civitai_utils.lookingForFilesInPaths, 
        args.model_type_name, args.model_file_name
    )

    msg = str(args) + " -> "
    if len(files) <= 0 :
        msg += "no files -> "

    target_api_json = None
    target_model_api_json = None
    target_full_path = None
    hashCode = None
    
    for full_path in files :
        suffix = file_utils.get_file_suffix(full_path)
        if suffix in [".jpg", ".jpeg", ".png"] : continue
        msg+="\n"
        apiJson = None
        modelApiJson = None
        record : asset_record.AssetRecord = variables.asset_record_manager.get(full_path)
        msg += "get apiJson from record -> "
        if record is not None :
            apiJson = record.get_model_api()
            modelApiJson = record.get_modelVersion_api()
            hashCode = record.hashCode
        else :
            msg += "failed -> "
        if apiJson is None or modelApiJson is None:
            msg+= "get apiJson from civitai -> "
            if hashCode is None : 
                hashCode = await concurrency.run_in_threadpool(
                    file_utils.getHash, full_path)
            url = civitai_utils.get_model_api_url_by_hash(hashCode)
            modelApiText = await concurrency.run_in_threadpool(
                civitai_utils.get_civitai_api_text, url)
            try :
                modelApiJson = json.loads(modelApiText)
            except Exception as e:
                msg += "failed to load json -> "
            
            if modelApiJson is None :
                msg += "failed -> "
            else :
                msg += "register -> "
                try :
                    pageId = str(modelApiJson['modelId'])
                    versionId = str(modelApiJson['id'])
                    pageURL = civitai_utils.get_model_api_url(pageId)
                    api_text = await concurrency.run_in_threadpool(
                        civitai_utils.get_civitai_api_text, pageURL)
                    apiJson = json.loads(api_text)
                    if variables.settings_object.saveModelApiJson :
                        civitai_utils.saveApiJson(pageId, apiJson)
                    r = asset_record.AssetRecord(
                        full_path = full_path, 
                        model_page_id = pageId,
                        model_version_id = versionId,
                        hashCode = hashCode
                    )
                    variables.asset_record_manager.register(r)
                    variables.save_asset_record()
                except Exception as e:
                    msg += "failed -> "
                    #print(e)

        if apiJson is not None and modelApiJson is not None: 
            target_api_json = apiJson
            target_model_api_json = modelApiJson
            target_full_path = full_path
            break

    description = ""
    pageId = None
    modelVersionId = None
    trainedWords = None
    highest_frequency_tags = []
    images = None

    if target_api_json is None : 
        msg += "target_api_json is None -> "
    else :
        description += str(target_api_json["description"])

    if target_model_api_json is None :
        msg += "target_model_api_json is None -> "
    else :
        description += "\nModelVersion Description : \n"
        description += str(target_model_api_json["description"])
        pageId = target_model_api_json["modelId"]
        modelVersionId = target_model_api_json["id"]
        trainedWords = target_model_api_json["trainedWords"]

    if target_full_path is None :
        msg += "target_full_path is None -> "
    else :
        # load target_full_path for metadata in file
        try :
            highest_frequency_tags = await concurrency.run_in_threadpool(
                get_ss_tag_frequency, target_full_path)
        except Exception as e :
            #print(e)
            pass
    
    msg += "End."
    print(msg)

    try :
        
        json_images = modelApiJson["images"]
        images = []
        for json_image in json_images :
            images.append({
                "url" : json_image["url"],
                "prompt" : apiJson_to_pnginfo(json_image),
            })

        #images = modelApiJson["images"]
    except Exception as e :
        pass

    return {
        "failed" : pageId is None or modelVersionId is None,
        "model_type_name" : args.model_type_name, 
        "model_file_name" : args.model_file_name, 
        "description" : description,
        "pageId" : pageId,
        "modelVersionId" : modelVersionId,
        "trainedWords" : trainedWords,
        "highest_frequency_tags" : highest_frequency_tags[0:5],
        "images" : images
    }

