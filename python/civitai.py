import os
import python.file_utils as file_utils
import python.civitai_utils as civitai_utils
import python.variables as variables
import math
import python.download as download
import python.utils as utils
import threading
import traceback
from pydantic import BaseModel
import hashlib

rename_images = True

class File(BaseModel):
    active: bool = False
    apiJson : dict = None
    path : str = None
    downloadTask : download.Task = None
    file_name : str = None
    file_suffix : str = None
    class Config:
        fields = {
            'apiJson': {'exclude': True},
            'file_suffix': {'exclude': True},
        }

    def __eq__(self, __value: object) -> bool:
        return self is __value or isinstance(__value, File) and self.downloadTask == __value.downloadTask

    async def set(self, target):
        if not isinstance(target, File): return
        await self.setActive(target.active)
        #self.path = target.path
        #self.file_name = target.file_name
        #self.file_suffix = target.file_suffix

    async def setActive(self, active : bool) :
        if not active and self.active :
            await self.cancel()
        self.active = active

    def submit(self, jump_in : bool):
        if not self.active or self.downloadTask is None : return
        self.downloadTask.submit(jump_in)

    async def pause(self):
        if self.downloadTask is None : return
        await self.downloadTask.pause()

    async def cancel(self):
        if self.downloadTask is not None : 
            await self.downloadTask.cancel()
        self.active = False

    def isDownloading(self):
        return (self.downloadTask.future is not None) and (not self.downloadTask.future.done())
    
    def is_file_exist(self):
        return self.downloadTask.check_saveTo_exist()

    def changeSaveTo(self, new_path:str):
        if self.downloadTask is not None : 
            self.downloadTask.change_saveTo(new_full_path=os.path.join(new_path, self.file_name))
        self.path = new_path

    def changeFileName(self, new_file_name):
        if self.downloadTask is not None : 
            self.downloadTask.change_saveTo(new_full_path=os.path.join(self.path, new_file_name))
        self.file_name = new_file_name
    
class ModelFile(File):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
    
    def setup(self):
        downloadUrl = self.apiJson["downloadUrl"]
        self.file_name = self.apiJson["name"]
        self.file_suffix = file_utils.get_file_suffix(self.file_name)
        
        _known_file_size_bytes = None
        _hashcode = None
        _hash_method = None
        try : 
            _known_file_size_bytes = self.apiJson["sizeKB"] * 1024
        except : pass
        try :
            _hashcode = self.apiJson["hashes"]["SHA256"]
            _hash_method = hashlib.sha256
        except : pass
        if self.path is None : return
        self.downloadTask = download.Task(
            url = downloadUrl,
            saveTo = os.path.join(self.path, self.file_name),
            writing_file_suffix = variables.writingSuffix,
            known_file_size_bytes = _known_file_size_bytes,
            hash_method = _hash_method,
            known_target_file_hash_code = _hashcode
        )
    
class ImageFile(File):

    max_width : int = None
    width : int = None

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def setup(self):
        image_url = self.apiJson["url"]
        self.file_name = file_utils.get_file_name(image_url)
        self.file_suffix = file_utils.get_file_suffix(self.file_name)
        self.max_width = int(self.apiJson["width"])
        default_width = civitai_utils.get_image_scale_from_url(image_url)
        self.setScaleOfImage(default_width)

    async def set(self, target):
        await super().set(target)
        if not isinstance(target, ImageFile): return 
        self.setScaleOfImage(target.width)

    def setScaleOfImage(self, width : int) :
        image_url = self.apiJson["url"]
        final_width = width
        if final_width > self.max_width : 
            final_width = self.max_width
        image_url = civitai_utils.get_specific_scale_image(image_url, self.max_width)
        if self.downloadTask is not None : 
            if self.downloadTask.url == image_url : 
                return
            self.cancel()
        self.width = final_width
        self.downloadTask = download.Task(
            url = image_url, 
            saveTo = os.path.join(self.path, self.file_name),
            writing_file_suffix = variables.writingSuffix,
            known_file_size_bytes = None
        )

    def renameImage(self, version_main_name : str, version_main_suffix : str) :
        self.file_name = version_main_name.replace(version_main_suffix, "_") + self.file_name
        self.changeSaveTo(self.path)
        '''
        imageFileName = version_main_name.replace(version_main_suffix, self.file_suffix)
        if index > 0:
            imageFileName = imageFileName.replace(
                self.file_suffix, " (" + str(index) + ")" + self.file_suffix
            )
        self.file_name = imageFileName
        self.changeSaveTo(self.path)
        '''

class ModelTypePathMissingException(Exception):
    modeltype : str
    def __init__(self, modeltype:str, *args: object) -> None:
        super().__init__(*args)
        self.modeltype = modeltype

class CivitaiTask(BaseModel):
    rlock : threading._RLock = None
    version_json : dict
    pageId : str
    model_type : str
    version_main_name : str
    version_main_suffix : str
    version_id : str
    unique_id : int = None
    model_type_path : str = None
    files : list[ModelFile] = []
    images : list[ImageFile] = []
    preview_index : int = None
    preview_task : download.Task = None

    class Config:
        arbitrary_types_allowed = True
        fields = {
            'rlock': {'exclude': True}
        }

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.rlock = threading.RLock()

    async def setup(self) :
        self.unique_id = id(self)
        self.model_type_path = civitai_utils.get_path(self.model_type)
        fileNames = []
        files_json = self.version_json["files"]
        for file in files_json:
            file_path = None
            imgs_path = self.model_type_path
            auto_active = False
            file_type = file['type']
            match file_type :
                case 'Model' :
                    auto_active = files_json[0] is file
                    file_path = civitai_utils.get_path(self.model_type)
                case 'VAE' :
                    auto_active = True
                    file_path = civitai_utils.get_path(file_type)
                case 'Archive' :
                    auto_active = files_json[0] is file
                    file_path = civitai_utils.get_path(self.model_type)
                case 'Training Data' :
                    auto_active = False
                    file_path = civitai_utils.get_path(file_type)
                case _:
                    file_path = None
                    msg = "civitai -> CivitaiTask -> __init__ -> unexcetped file_type : " + str(file_type)
                    msg = utils.colorPrint(msg, utils.P_Colors.BOLD,  utils.P_Colors.FAIL)
                    print(msg)
            if file_path is None : raise ModelTypePathMissingException()
            f = ModelFile(path=file_path, apiJson = file)
            f.setup()
            auto_active = auto_active or f.is_file_exist()
            await f.setActive(auto_active)
            f.downloadTask.add_download_success_callback(self.file_done_callback)
            if f.file_name in fileNames :
                metadata = None
                try : metadata = file["metadata"] 
                except : pass
                if metadata is None : 
                    pass
                else :
                    replacement = "_" + str(metadata["fp"]) + "_" + str(metadata["size"]) + "_" + str(metadata["format"]) + f.file_suffix
                    f.changeFileName(new_file_name=f.file_name.replace(f.file_suffix, replacement))
            fileNames.append(f.file_name)
            self.files.append(f)
        
        self.images = []
        for image in self.version_json["images"]:
            f = ImageFile(path=imgs_path, apiJson = image)
            f.setup()
            if rename_images : f.renameImage(self.version_main_name, self.version_main_suffix)
            await f.setActive(f.is_file_exist())
            f.downloadTask.add_download_success_callback(self.file_done_callback)
            self.images.append(f)

        
        record = variables.asset_record_manager.get(os.path.join(self.model_type_path, self.version_main_name))
        perferedPreviewIndex = 0
        if record is not None : 
            print("record : " + str(record))
            perferedPreviewIndex = record.perferedPreviewIndex
        await self.change_preview_index(perferedPreviewIndex)
    
    def __eq__(self, __value: object) -> bool:
        if self is __value : return True
        if isinstance(__value, CivitaiTask) and self.pageId == __value.pageId and self.version_id == __value.version_id : return True
        if len(self.files) != len(__value.files) : 
            return False
        if len(self.images) != len(__value.images) : 
            return False
        for f in self.files :
            if f not in __value.files : 
                return False
        for i in self.images :
            if i not in __value.images: 
                return False
        return True

    async def set(self, target) -> bool:
        if not isinstance(target, CivitaiTask) : return False
        #use await
        #await self.rlock.acquire()
        try : 
            utils.lock_acquire(self.rlock, 10)
        except : return False
        try :
            #self.pageId = target.pageId
            #self.model_type = target.model_type
            #self.version_main_name = target.version_main_name
            #self.version_main_suffix = target.version_main_suffix
            #self.version_id = target.version_id
            #self.unique_id = target.unique_id
            self.model_type_path = target.model_type_path
            for i in range(len(self.files)) :
                await self.files[i].set(target.files[i])

            for i in range(len(self.images)) :
                await self.images[i].set(target.images[i])
            
            await self.change_preview_index(target.preview_index)
        finally :
            self.rlock.release()
        return True

    def getProgress(self, defaultFileSize : int = 8388608):
        unknowFileSizeProgressList : list[int] = []
        totalCurrentSize : int = 0
        totalFileSize : int = 0
        for f in self.files :
            if not f.active : continue
            if f.downloadTask.fileSize == None :
                unknowFileSizeProgressList.append(f.downloadTask.getProgress())
            else :
                totalFileSize += int(f.downloadTask.fileSize)
                totalCurrentSize += int(f.downloadTask.currentSize)
        for f in self.images :
            if not f.active : continue
            if f.downloadTask.fileSize == None :
                unknowFileSizeProgressList.append(f.downloadTask.getProgress())
            else :
                totalFileSize += int(f.downloadTask.fileSize)
                totalCurrentSize += int(f.downloadTask.currentSize)
        totalCurrentSize = totalCurrentSize + defaultFileSize * unknowFileSizeProgressList.count(100)
        totalFileSize = max(totalFileSize, 1) + defaultFileSize * len(unknowFileSizeProgressList)
        return math.floor((totalCurrentSize / totalFileSize) * 100)

    def isDownloading(self):
        for file in self.files   : 
            if file.isDownloading() : 
                return True
        for image in self.images : 
            if image.isDownloading() : 
                return True
        return False
    
    async def setDownloading(self, enable : bool):
        if enable :
            for file in self.files   : 
                file.submit(False)
            for image in self.images :
                image.submit(False)
        else :
            for file in self.files   : 
                await file.pause()
            for image in self.images :
                await image.pause()

    def add_task(self):
        task_list.add_task(self)

    async def remove_task(self, delete_related_files):
        await task_list.remove_task(self, delete_related_files)
        if delete_related_files : 
            self.remove_reocrd()

    def isAllDownloadFinished(self)->bool:
        return self.isFinishDownload_files() and (self.preview_task is None or self.preview_task.isFinishDownload())
    
    def setScaleOfImage_ALL(self, max_scale_image : bool):
        for img in self.images : img.setScaleOfImage(max_scale_image)

    def isAlreadyDownloadAllFileBeforeStart(self):
        for f in self.files :
            if f.active and not f.is_file_exist() : 
                return False
        for f in self.images :
            if f.active and not f.is_file_exist() : 
                return False
        return self.preview_task.check_saveTo_exist()
    
    def isFinishDownload_files(self):
        for f in self.files :
            if f.active and not f.downloadTask.isFinishDownload(): 
                return False
        for f in self.images :
            if f.active and not f.downloadTask.isFinishDownload(): 
                return False
        return True
    
    def getStatus(self):
        _files = self.isFinishDownload_files()
        _preview = self.preview_task is None or self.preview_task.isFinishDownload()

        if _files : 
            if _preview :
                return 2
            else :
                return 1

        any_active = False
        # return if any one error
        for f in self.files :
            if f.active : 
                any_active = True
                if f.downloadTask.done_status != None and f.downloadTask.done_status < 0 :
                    return f.downloadTask.done_status
        for f in self.images :
            if f.active : 
                any_active = True
                if f.downloadTask.done_status != None and f.downloadTask.done_status < 0 :
                    return f.downloadTask.done_status
        if self.preview_task is not None and self.preview_task.done_status != None and self.preview_task.done_status < 0 :
            return self.preview_task.done_status
        if not any_active : 
            # -99 : nothing is active 
            return -99
        # 0 : running or finish download files
        return 0

    async def change_preview_index(self, index) :
        if self.preview_index == index or len(self.images) == 0 : return
        try :
            utils.lock_acquire(self.rlock, 10)
        except Exception as e :
            print(e)
            return
        try : 
            self.preview_index = index
            if self.preview_task != None :
                await self.preview_task.cancel()
                self.preview_task = None
            downloadURL = self.images[self.preview_index].apiJson["url"]
            downloadURL = civitai_utils.get_specific_scale_image(downloadURL, variables.settings_object.preview_max_width)
            file_name = file_utils.get_file_name(downloadURL)
            file_suffix = file_utils.get_file_suffix(file_name)
            previewFileName = self.version_main_name.replace(self.version_main_suffix, file_suffix)
            self.preview_task = download.Task(
                url = downloadURL,
                saveTo = os.path.join(self.model_type_path, previewFileName),
                writing_file_suffix = variables.writingSuffix,
                known_file_size_bytes = None
            )
            if self.isFinishDownload_files() :
                await self.preview_task.pause()
                self.preview_task.submit(True)
                self.make_record()
        except Exception as e :
            print(e)
        finally :
            self.rlock.release()
    
    def file_done_callback(self) :
        if not self.isFinishDownload_files() or self.preview_task.isFinishDownload(): 
            return
        try :
            utils.lock_acquire(self.rlock, 10)
        except :
            print("civitai -> file_done_callback -> rlock timeout")
            return
        
        try :
            self.preview_task.submit(True)
            self.make_record()
        except :
            print("civitai -> file_done_callback -> error")
        finally :
            self.rlock.release()

    def make_record(self):
        import python.asset_record as asset_record
        for f in self.files :
            record = asset_record.AssetRecord(
                full_path = f.downloadTask.saveTo,
                model_page_id = self.pageId, 
                model_version_id = self.version_id, 
                hashCode = f.downloadTask.known_target_file_hash_code,
                perferedPreviewIndex = self.preview_index
            )
            variables.asset_record_manager.register(record)
            
    def remove_reocrd(self):
        for f in self.files :
            variables.asset_record_manager.unregister(f.downloadTask.saveTo)

class CardData(BaseModel):
    title : str = None
    preview : int = None
    previews : list[str] = []
    progress : int = None
    civitaiTaskObjectId : int = None
    enable : bool = None
    recognized_path : str = None
    status : int = None
    currentTask : CivitaiTask = None
    class Config:
        fields = {
            'currentTask': {'exclude': True},
        }

    def setup(self) :
        self.title = None
        self.preview = None
        self.previews.clear()
        self.progress = None
        self.civitaiTaskObjectId = None
        self.enable = None
        self.recognized_path = None
        self.status = None
        self.currentTask = None
    
    def set(self, task : CivitaiTask):
        self.title = task.version_main_name
        self.preview = task.preview_index
        self.previews.clear()
        for img in task.images :
            self.previews.append(img.downloadTask.url)

        self.progress = task.getProgress()
        self.civitaiTaskObjectId = task.unique_id
        self.enable = task.isDownloading()
        self.recognized_path = task.model_type_path
        self.status = task.getStatus()
        self.currentTask = task
        
class PageDataProcessor(BaseModel) :
    cardDataList : list[CardData] = []
    card_data_store : list[CardData] = []

    def releaseCardData(self, targetCardData : CardData) :
        targetCardData.setup()
        self.card_data_store.append(targetCardData)

    def getCardData(self) -> CardData :
        result = None
        if len(self.card_data_store) > 0 :
            result = self.card_data_store.pop()
        else :
            result = CardData()
        return result

    def getCardDataList(self, civitaiTaskList : dict) -> list[CardData]:
        taskListLen = len(civitaiTaskList)
        try :
            newCardCount = taskListLen - len(self.cardDataList)
            if newCardCount > 0 :
                for index in range(newCardCount):
                    self.cardDataList.append(self.getCardData())

            index = 0
            for key in civitaiTaskList :
                task = civitaiTaskList[key]
                self.cardDataList[index].set(task)
                index += 1

        except Exception as e :
            traceback.print_exc()
        return self.cardDataList[:taskListLen]

class InputProcessor() :
    def __init__(self, url, all_version):
        self.url : str = url
        self.all_version : bool = all_version
        self.pageId : str = civitai_utils.get_page_id_from_page_url(url)
        self.preferId : str = civitai_utils.get_prefered_model_version_id_from_page_url(url)
        self.path : str = None
        self.loaded_json : dict = None

    def setup(self, loaded_json):
        self.loaded_json = loaded_json
    
    def checkPreviousApiJson(self):
        #apiJson = civitai_utils.loadApiJson(str(self.pageId))
        return True
    
    def checkModelPaths(self) -> list[str]:
        missing_setting_model_type : list[str] = []
        
        model_type = self.loaded_json["type"]
        self.path = civitai_utils.get_path(model_type)

        if self.path is None : 
            missing_setting_model_type.append(model_type)
            print(utils.colorPrint("unexpected model_type : " + str(model_type), utils.P_Colors.BOLD, utils.P_Colors.FAIL), flush=True)

        modelVersions_json = self.loaded_json['modelVersions']
        for modelVersion in modelVersions_json :
            files_json = modelVersion["files"]
            for file in files_json:
                file_type = str(file["type"])
                if file_type == 'Model' : continue
                if file_type == 'Archive' : continue
                path = civitai_utils.get_path(file_type)
                if path is None and file_type not in missing_setting_model_type: 
                    print(utils.colorPrint("unexpected file type : " + str(file_type), utils.P_Colors.BOLD, utils.P_Colors.FAIL), flush=True)
                    missing_setting_model_type.append(file_type)

        return missing_setting_model_type

    async def getTasks(self) -> list[CivitaiTask]:
        result = []
        #if self.apiText == None : raise Exception("self.apiText == None")
        if self.loaded_json == None : 
            raise Exception("self.loaded_json == None")
        if self.path == None : 
            raise Exception("self.path == None")
        if self.preferId == None :
            self.preferId = str(self.loaded_json["modelVersions"][0]["id"])

        print("preferId : " + str(self.preferId))
        for version_json in self.loaded_json["modelVersions"]:
            version_id : str = str(version_json["id"])

            if not self.all_version and self.preferId != version_id: 
                print("getTasks : Passing Model - Version Id : " + version_id)
                continue

            version_downloadUrl = version_json["downloadUrl"]
            for f in version_json["files"]:
                if version_downloadUrl == f["downloadUrl"]:
                    version_main_name = f["name"]
                    version_main_suffix = file_utils.get_file_suffix(version_main_name)
                    break
            
            if version_main_name is None and version_main_suffix is None :
                print("can't get main name " + str(version_id))
                continue

            task = CivitaiTask(
                pageId = self.pageId,
                model_type = self.loaded_json["type"],
                version_main_name = version_main_name, 
                version_main_suffix = version_main_suffix,
                version_id = version_json['id'],
                version_json = version_json
            )
            await task.setup()
            result.append(task)
        return result

async def input_solver(processor : InputProcessor):
    code = 0
    msg = "Your input is accepted -> url : " + processor.url
    result = {"code": code, "msg" : msg}

    if processor.loaded_json is None: 
        result["code"] = 1
        result["msg"] += "\nUnable to get API Json from civitai server"
        result["msg"] += "\nPossibility : server down, server refused, network disconnected."
        return result
    
    if not processor.checkPreviousApiJson() : 
        result["code"] = 2
        result["msg"] += "\nMessages not set"
        return result
    
    missingSettingModelType : list[str] = processor.checkModelPaths()
    if len(missingSettingModelType) > 0 : 
        result["code"] = 3
        result["msg"] += "\nMissing Path setting for model type"
        result["modelType"] = missingSettingModelType
        return result
        
    tasks = await processor.getTasks()
    
    did = False

    if len(tasks) > 0 :
        for task in tasks :
            if task_list.contain(task): 
                print("task_list.contain(task) : " + str(task.version_main_name))
                continue
            '''
            if task.isAlreadyDownloadAllFileBeforeStart() :
                print("isAlreadyDownloadAllFileBeforeStart()\n" + str(task.version_main_name))
                continue
            '''
            did = True
            task.add_task()
    
    if not did : 
        result["code"] = 4
        result["msg"] = "Already in task list."
        return result
    
    if variables.settings_object.saveModelApiJson :
        civitai_utils.saveApiJson(processor.pageId, processor.loaded_json)
    return result

class TaskList():
    hash_map : dict[int, CivitaiTask] = {}
    rlock : threading._RLock = threading.RLock()
    pageDataProcessor : PageDataProcessor = PageDataProcessor()

    class Config:
        arbitrary_types_allowed = True
        fields = {
            'rlock': {'exclude': True},
        }

    async def setDownloading(self, isDownloading : bool):
        try : 
            utils.lock_acquire(self.rlock, 10)
            try :
                for value in self.hash_map.values() :
                    await value.setDownloading(isDownloading)
            finally :
                self.rlock.release()
        except : 
            return False
        return True

    def add_task(self, task : CivitaiTask):
        utils.lock_acquire(self.rlock, 10)
        try :
            if not self.contain(task) : 
                self.hash_map[id(task)] = task
                for file in task.files : 
                    file.submit(False)
                for image in task.images : 
                    image.submit(False)
            else :
                print("taskList contain : " + task.version_main_name)
        finally :
            self.rlock.release()

    async def remove_task(self, task : CivitaiTask, delete_related_files : bool) :
        utils.lock_acquire(self.rlock, 10)
        try :
            if not self.contain(task) : 
                raise Exception("not contain")
            self.hash_map.pop(id(task))
            if delete_related_files : 
                for file in task.files   : 
                    #if not file.active : continue
                    await file.downloadTask.cancel()
                for image in task.images : 
                    #if not image.active : continue
                    await image.downloadTask.cancel()
                await task.preview_task.cancel()
        finally :
            self.rlock.release()

    def get_task(self, key) :
        result = None
        try : 
            result = self.hash_map[key]
        except Exception as e :
            print(e)
        return result
    
    def contain(self, task : CivitaiTask) :
        result = False
        utils.lock_acquire(self.rlock, 10)
        try :
            result = task in self.hash_map.values()
        finally :
            self.rlock.release()
        return result
    
    def get_card_data_list(self):
        return self.pageDataProcessor.getCardDataList(self.hash_map)

task_list : TaskList = TaskList()

import json
def saveTaskList(full_path):
    result = []
    values = list(task_list.hash_map.values())
    for index in range(len(values)):
        value : CivitaiTask = values[index]
        if value.isAllDownloadFinished() : continue
        result.append({
            "pageId" : value.pageId, 
            "version_id" : value.version_id
        })
    file_utils.write_text_to(full_path, json.dumps({"result" : result}), variables.writingSuffix)

def end() :
    full_path = file_utils.get_full_path(variables.localFilesPath, "taskList", variables.jsonSuffix)
    saveTaskList(full_path)

variables.on_end_callback.append(end)
    
async def loadTaskList(full_path):
    text = file_utils.get_text_form_file(full_path)
    if text == None : return None
    d = json.loads(text)
    result = d["result"]
    for index in range(len(result)):
        value = result[index]
        pageId = value["pageId"]
        version_id = value["version_id"]
        url = civitai_utils.get_model_page_url_modelVersionId(pageId, version_id)
        processor = InputProcessor(url, False)
        processor.setup(civitai_utils.getApiJsonFromSite(pageId))
        result = await input_solver(processor)
        print(result, flush=True)

import asyncio
def start():
    full_path = file_utils.get_full_path(variables.localFilesPath, "taskList", variables.jsonSuffix)
    asyncio.run(loadTaskList(full_path))