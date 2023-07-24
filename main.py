
import os
import sys
import python.utils as utils
import python.variables as variables
import python.file_utils as file_utils

user_data_dir = os.path.join(__file__, "..\\")
if "--user-data-dir" in sys.argv:
    try :
        index = sys.argv.index("--user-data-dir")
        arg_user_data_dir = sys.argv[index + 1]
        if os.path.exists(arg_user_data_dir) and os.path.isdir(arg_user_data_dir):
            user_data_dir = arg_user_data_dir
        else:
            print("--user-data-dir : \"" + arg_user_data_dir + "\" not exists or not a directory.")
    except :
        pass

user_data_dir = os.path.realpath(user_data_dir)
print("user_data_dir : " + user_data_dir)
variables.load(user_data_dir)

if not variables.settings_object.stable_diffusion_webui_once :
    sys.exit(utils.colorPrint("--------> Have to run as a extension once for information", utils.P_Colors.WARNING, utils.P_Colors.BOLD))

import uvicorn
from uvicorn import Config
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.responses import HTMLResponse
from fastapi.responses import RedirectResponse
from fastapi.encoders import jsonable_encoder
from fastapi import concurrency
from pydantic import BaseModel

from python.variables import Settings
import webbrowser
import python.civitai as civitai
import python.civitai_utils as civitai_utils

import contextlib
import time
import threading


# step 1
# TODO : blurhash
# TODO : card info -> keep update informations
# TODO : card error sign -> retry ?
# TODO : notification click -> add settings and re-input the url with same args <- first
# TODO : extra imgs -> user control
# TODO : update settings -> preview size , accept file suffix , (remove) maxImageCount_Download <- first
# TODO : easy setting for download_speed_limit_bytes, javascript_page_update_delta <- first
# TODO : check target path disk space available, before download <- first

# step 2
# TODO : model management on disk
# TODO : keep update
# TODO : check model hashcode
# TODO : fillup preview
# TODO : follow user -> new Model infomation
# TODO : bookmark -> auto delete

# step 3
# TODO : modifies webui <- first


#https://fastapi.tiangolo.com/
#block fastapi docs redoc
#http://127.0.0.1:8762/docs
#http://127.0.0.1:8762/redoc

#網路安全 -> 網頁前端
#https://dev.to/jankapunkt/how-to-mess-up-your-javascript-code-like-a-boss-pa9
#https://rambox.app/blog/how-to-inject-javascript-code-for-advanced-website-and-apps-manipulation/
#https://medium.com/hannah-lin/%E5%BE%9E%E6%94%BB%E6%93%8A%E8%87%AA%E5%B7%B1%E7%B6%B2%E7%AB%99%E5%AD%B8-xss-cross-site-scripting-%E5%8E%9F%E7%90%86%E7%AF%87-fec3d1864e42

app = FastAPI(
    docs_url=None, 
    redoc_url=None
)
app.mount("/web", StaticFiles(directory="web"), name="web")
app.mount("/javascript", StaticFiles(directory="javascript"), name="javascript")

import python.download as download
download.init(
    variables.settings_object.threadWorkers, 
    variables.settings_object.chunk_size,
    variables.settings_object.download_speed_limit_bytes,
    10, 
    variables.settings_object.maxTryCount,
)
variables.on_end_callback.append(download.call_on_end)


#------------------------------------------------------------GET

@app.get("/")
async def downloadPage() -> FileResponse:
    return FileResponse(path="web/site.html", media_type="text/html")

@app.get("/testing")
async def testing() -> FileResponse:
    return FileResponse(path="web/testing.html", media_type="text/html")

@app.get("/pagedata")
async def getCardDataList():
    result = await concurrency.run_in_threadpool(civitai.task_list.get_card_data_list)
    return await concurrency.run_in_threadpool(jsonable_encoder, result)

@app.get("/settings")
async def getSettings():
    return variables.settings_object

@app.get("/close")
async def getClose():
    print("UI-Close")


@app.get("/off")
async def off():
    print("UI-off")
    await civitai.task_list.setDownloading(False)
    server.manual_close()

#------------------------------------------------------------POST
@app.post("/sendsettings")
async def postSettings(settings: Settings):
    #Check and Apply new Setting
    if settings.threadWorkers < 1 :
        settings.threadWorkers = 1
    if settings.maxTryCount < -1 :
        settings.maxTryCount = 0
    if settings.chunk_size < 1024 :
        settings.chunk_size = 1024
    if settings.javascript_page_card_size < 5 :
        settings.javascript_page_card_size = 5
    elif settings.javascript_page_card_size > 100 :
        settings.javascript_page_card_size = 100
    if settings.javascript_page_update_delta <= 1000 : 
        settings.javascript_page_update_delta = 1000
    variables.settings_object.set(settings)
    variables.save_setting()
    return jsonable_encoder(variables.settings_object)

class downloadSwitch_ARGS(BaseModel):
    arg_bool : bool

@app.post("/downloadSwitch")
async def _downloadSwitch(args : downloadSwitch_ARGS):
    return await civitai.task_list.setDownloading(args.arg_bool)

class URL_input_ARGS(BaseModel):
    url : str
    all_version : bool
    max_scale_image : bool

@app.post("/url_input")
async def url_input(args: URL_input_ARGS, request: Request):
    print("url_input -> args : " + str(args))
    processor = civitai.InputProcessor(args.url, args.all_version)
    processor.setup(await concurrency.run_in_threadpool(civitai_utils.getApiJsonFromSite, processor.pageId))
    return await civitai.input_solver(processor)

class CardControl_ARGS(BaseModel):
    civitaiTaskObjectId : int
    code : int
    arg_str : str = None
    arg_bool : bool = None
    arg_int : int = None
    
@app.post("/card_control")
async def card_control(args: CardControl_ARGS):
    result = None
    target_task : civitai.CivitaiTask = civitai.task_list.get_task(args.civitaiTaskObjectId)
    if target_task is None or id(target_task) != args.civitaiTaskObjectId :
        return str(result) + "failed"
    match args.code : 
        case 0 :
            # 0 cancel
            b = (args.arg_bool is not None) and args.arg_bool
            await target_task.remove_task(b or not target_task.isAllDownloadFinished())
            result = True
        case 1 :
            # 1 play and pause
            await target_task.setDownloading(not target_task.isDownloading())
            result = True
        case 2 :
            # 2 card info
            result = jsonable_encoder(target_task)
        case 3 :
            # 3 change_preview
            if args.arg_str != None : 
                index = -1
                for imgFile in target_task.images :
                    if imgFile.downloadTask.url == args.arg_str : 
                        index = target_task.images.index(imgFile)
                        break
                if index != -1 :
                    await target_task.change_preview_index(index)
                result = True
        case 4 :
            # 4 retry 
            await target_task.setDownloading(True)
            result = True
        case 5 :
            # 5 open in explorer
            result = file_utils.explorer(target_task.model_type_path)
        case 6 :
            target_full_path = None
            try :
                target_full_path = target_task.files[args.arg_int].downloadTask.saveTo
            except : pass
            result = file_utils.explorer(target_full_path)
        case 7 :
            target_full_path = None
            try :
                target_full_path = target_task.images[args.arg_int].downloadTask.saveTo
            except : pass
            result = file_utils.explorer(target_full_path)
    return result


@app.post("/task_control")
async def task_control(n_task : civitai.CivitaiTask) :
    #print(n_task.json(indent=4))
    task : civitai.CivitaiTask = civitai.task_list.get_task(n_task.unique_id)
    if task is None : return {}
    await task.setDownloading(False)
    await task.set(n_task)
    await task.setDownloading(True)
    return {}

import python.model_manager_card_click as model_manager_card_click
@app.post("/model_manager_card_click_post")
async def card_click(args : model_manager_card_click.CardClick_ARGS):
    return await model_manager_card_click.card_click(args)

class Server(uvicorn.Server):
    
    def install_signal_handlers(self):
        pass

    @contextlib.contextmanager
    def run_in_thread(self):
        thread = threading.Thread(target=self.run)
        thread.start()
        webbrowser.open_new("http://" + str(self.config.host) + ":" + str(self.config.port))
        
        try:
            while not self.should_exit:
                time.sleep(1)
        except Exception as e: 
            #print(e)
            pass
        finally:
            self.manual_close()
            print("thread.join Start")
            thread.join()
            print("thread.join End")

    def manual_close(self) :
        self.should_exit = True
        self.force_exit = True

server : Server = None
if __name__ == "__main__" : 
    civitai.start()
    config = Config(app, host="127.0.0.1", port=8762, log_level="info")
    try :
        server = Server(config)
        server.run_in_thread()
        print("server.run_in_thread() End")
    finally :
        variables.call_on_end()

#https://github.com/encode/uvicorn/issues/742
#https://stackoverflow.com/questions/70632673/fastapi-is-not-loading-static-files
#https://huggingface.co/spaces/templates/fastapi-uvicorn/blob/main/modules/app.py
#https://blog.csdn.net/leoppeng/article/details/119384097

#https://www.youtube.com/watch?v=ATEGpAb8GWI&ab_channel=Pingcode
#https://stackoverflow.com/questions/64901945/how-to-send-a-progress-of-operation-in-a-fastapi-app
#https://fastapi.tiangolo.com/advanced/websockets/

#https://plainenglish.io/blog/3-ways-to-handle-errors-in-fastapi-that-you-need-to-know-e1199e833039
