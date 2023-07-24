import python.utils as utils
import python.file_utils as file_utils
import threading
import json
from pydantic import BaseModel
import python.civitai_utils as civitai_utils

print("asset_record : ------------------------------------------")

file_name = "asset_record"

class AssetRecord(BaseModel) :
    full_path : str
    model_page_id : str
    model_version_id : str
    hashCode : str
    perferedPreviewIndex : int = 0
    model_api : dict = None
    rlock : threading._RLock = None

    class Config:
        arbitrary_types_allowed = True
        fields = {
            'model_api': {'exclude': True},
            'rlock': {'exclude': True},
        }
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def get_modelVersion_api(self):
        # same as by-hash
        if self.model_api is None :
            self.get_model_api()
        if self.model_api is None :
            return None
        result = None
        modelVersions = self.model_api["modelVersions"]
        for modelVersion in modelVersions :
            if self.model_version_id == str(modelVersion["id"]) :
                result = modelVersion
                break
        return result
        
    def get_model_api(self):
        if self.model_api is None :
            try :
                self.model_api = civitai_utils.loadApiJson(self.model_page_id)
            except Exception as e : 
                print(e)
        return self.model_api

    def load_model_api(self):
        if self.model_page_id == None : return 

        
class AssetRecordManager(BaseModel) :
    jsonFilesPath : str
    rlock : threading._RLock = None
    records : dict[str,AssetRecord] = {}

    class Config:
        arbitrary_types_allowed = True
        fields = {
            'rlock': {'exclude': True},
        }

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.rlock = threading.RLock()

    def referch_asset_records(self):
        utils.lock_acquire(self.rlock, 10)
        try :
            pass
        finally:
            self.rlock.release()

    def get(self, full_path) -> AssetRecord | None:
        utils.lock_acquire(self.rlock, 10)
        result = None
        try :
            result = self.records[full_path]
        except :
            pass
        finally:
            self.rlock.release()
        return result

    def register(self, assetRecord : AssetRecord):
        utils.lock_acquire(self.rlock, 10)
        try :
            self.records[assetRecord.full_path] = assetRecord
        finally:
            self.rlock.release()

    def unregister(self, full_path):
        utils.lock_acquire(self.rlock, 10)
        try :
            self.records.pop(full_path)
        except KeyError as e : pass
        finally:
            self.rlock.release()

    def has_register(self, full_path):
        return full_path in self.records

    def save(self, full_path : str, writingSubfileName):
        try:
            file_utils.write_text_to(full_path, self.json(), writingSubfileName)
        except:
            print("Can't save asset_record To -> " + full_path)

def load(full_path : str, jsonFilesPath:str) -> AssetRecordManager :
    print("loading asset_record from : " + str(full_path))
    result = None
    text = file_utils.get_text_form_file(full_path)
    try:
        json_dict : dict = json.loads(text)
        json_dict["jsonFilesPath"] = jsonFilesPath
        result = AssetRecordManager(**json_dict)
    except TypeError as e:
        pass
    if result is None:
        print("fail to load asset_record. default apply.")
        result = AssetRecordManager(jsonFilesPath = jsonFilesPath)
    return result
