from pydantic import BaseModel
import threading
import python.file_utils as file_utils
import python.utils as utils
import json
import python.download as download

print("settings : ------------------------------------------")

class Settings(BaseModel):
    stable_diffusion_webui_once: bool = False
    paths: dict[str, list[str]] = {}
    recognized: dict[str, list[str]] = {
        "Checkpoints" : ["Checkpoint", "Pruned Model"],
        "Lora" : ["LORA"],
        "Textual Inversion" : ["TextualInversion"],
        "Hypernetworks" : ["Hypernetwork"],
        "LyCORIS" : ["LoCon", "LoHa"],
        "ESRGAN" : ["Upscaler"],
    }
    accept_model_file_suffixes: list[str] = ['.safetensors', '.vae', '.pt', ".zip", ".ckpt"]
    saveModelApiJson: bool = True
    preview_max_width : int = 250
    threadWorkers: int = 1
    # -1 = no limit
    maxTryCount: int = 20
    # 0 = no limit
    download_speed_limit_bytes : int = 3 * 1024 * 1024 # 3MB 
    chunk_size: int = 4096

    javascript_page_update_delta: int = 2500 # 2.5 seconds
    javascript_page_autorenew: bool = True
    javascript_page_file_download : bool = True
    javascript_page_animation_on_off : bool = True
    javascript_page_card_size : int = 33

    rlock : threading._RLock = None

    class Config:
        arbitrary_types_allowed = True
        fields = {
            'rlock': {'exclude': True},
        }

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.rlock = threading.RLock()
    
    def getRecognized(self, model_type:str)->str:
        utils.lock_acquire(self.rlock, 10)
        try :
            for key in self.recognized.keys() :
                if model_type in self.recognized[key] : 
                    return key
        finally :
            self.rlock.release()

    def set(self, new_settings) :
        for i in list(self.dict().keys()) :
            self.__setattr__(i, new_settings.__getattribute__(i))
        download.set_speed_limit_bytes(self.download_speed_limit_bytes)
        
    def save(self, full_path, writingSubfileName):
        utils.lock_acquire(self.rlock, 10)
        try :
            print("variables : save_settings -> " + str(full_path))
            try:
                file_utils.write_text_to(full_path, self.json(indent=4), writingSubfileName)
            except:
                print("Can't save Settings To " + str(full_path))
        finally :
            self.rlock.release()


def load(full_path:str) -> Settings:
    print("loading settings from : " + str(full_path))
    result = None
    text = file_utils.get_text_form_file(full_path)
    try:
        result = Settings(**json.loads(text))
    except TypeError as e:
        pass
    if result is None:
        print("fail to load setting. default apply.")
        result = Settings()
    return result