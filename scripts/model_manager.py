# print("__name__ : " + str(__name__))
# print("__file__ : " + str(__file__))


import os

from modules import shared
from modules import scripts
from modules import script_callbacks
from modules import ui_extra_networks
from modules import shared
from modules import generation_parameters_copypaste
from modules.paths import data_path
from gradio import Blocks
import gradio as gr

from typing import Optional
from fastapi import FastAPI
from fastapi import concurrency
from pydantic import BaseModel

#current extension's directory
basedir = scripts.basedir()
user_data_dir = shared.cmd_opts.user_data_dir
if user_data_dir is None : 
    user_data_dir = basedir
user_data_dir = os.path.realpath(user_data_dir)
print("user_data_dir : " + user_data_dir)
import python.variables as variables
variables.load(user_data_dir)

is_bootstrap = False
import inspect
for stack in inspect.stack():
    if "<frozen importlib._bootstrap>" == stack.frame.f_code.co_filename:
        is_bootstrap = True
        break

from modules import sd_vae
from modules import shared
from modules import paths
from modules.upscaler import Upscaler
import python.utils as utils

#https://github.com/AUTOMATIC1111/stable-diffusion-webui/blob/master/modules/modelloader.py
def varibales_settings_setup() :
    if variables.settings_object.stable_diffusion_webui_once is not True :
        variables.settings_object.stable_diffusion_webui_once = True
    # extra_pages dir
    for page in ui_extra_networks.extra_pages:
        page_dir_list : list[str] = None
        try :
            page_dir_list = variables.settings_object.paths[page.title]
        except : 
            pass
        if page_dir_list is None : page_dir_list = []
        for dir in page.allowed_directories_for_previews() :
            if dir not in page_dir_list :
                page_dir_list.append(dir)
        variables.settings_object.paths[page.title] = page_dir_list
    
    # vae
    vae_dir_list : list[str] = None
    try :
        vae_dir_list = variables.settings_object.paths['VAE']
    except :
        pass
    if vae_dir_list is None : vae_dir_list = []
    if sd_vae.vae_path not in vae_dir_list :
        vae_dir_list.append(sd_vae.vae_path)
    variables.settings_object.paths['VAE'] = vae_dir_list

    # upscalers
    for upscaler in shared.sd_upscalers :
        upscaler_dir_list : list[str] = None
        try :
            upscaler_dir_list = variables.settings_object.paths[upscaler.scaler.name]
        except :
            pass
        if upscaler_dir_list is None : upscaler_dir_list = []
        
        dirs = [upscaler.scaler.model_path, upscaler.scaler.user_path]
        for dir in dirs :
            if dir is None : continue
            if dir not in upscaler_dir_list :
                upscaler_dir_list.append(dir)
        variables.settings_object.paths[upscaler.scaler.name] = upscaler_dir_list

    '''
    for cls in utils.getAllSubClasses(Upscaler):
        classname = str(cls)
        print("classname : " + classname)
    '''
    variables.settings_object.save(variables.settingsJsonFullPath, variables.writingSuffix)

#https://github.com/civitai/civitai/wiki/REST-API-Reference#get-apiv1models-versionsby-hashhash

#generation_parameters_copypaste.paste_fields.keys()
#['txt2img', 'img2img', 'inpaint', 'extras']

def paste_func(prompt):
    paste_fields = generation_parameters_copypaste.paste_fields["txt2img"]["fields"]
    if not prompt and not shared.cmd_opts.hide_ui_dir_config:
        filename = os.path.join(data_path, "params.txt")
        if os.path.exists(filename):
            with open(filename, "r", encoding="utf8") as file:
                prompt = file.read()

    params = generation_parameters_copypaste.parse_generation_parameters(prompt)
    script_callbacks.infotext_pasted_callback(prompt, params)
    res = []
    for output, key in paste_fields:
        if callable(key):
            v = key(params)
        else:
            v = params.get(key, None)

        if v is None:
            res.append(gr.update())
        elif isinstance(v, generation_parameters_copypaste.type_of_gr_update):
            res.append(v)
        else:
            try:
                valtype = type(output.value)

                if valtype == bool and v == "False":
                    val = False
                else:
                    val = valtype(v)

                res.append(gr.update(value=val))
            except Exception:
                res.append(gr.update())

    return res

import python.model_manager_card_click as model_manager_card_click
def call_on_start(demo: Optional[Blocks], app: FastAPI):
    varibales_settings_setup()
    '''
    with demo :
        invisible_textbox = gr.Textbox(elem_id="model_manager_invisible_textbox", interactive=True)#, visible = False
        invisible_button = gr.Button(value = "load_file_hash", elem_id="model_manager_invisible_button")
        invisible_button.click(
            fn=invisible_button_click, 
            outputs=invisible_textbox
        ).then(
            fn=None,
            inputs=invisible_textbox,
            _js='(x) => {model_manager_call(x);}'
        )
    '''
         
    @app.post("/model_manager_card_click_post")
    async def card_click(args : model_manager_card_click.CardClick_ARGS):
        return await model_manager_card_click.card_click(args)

if is_bootstrap:
    script_callbacks.on_app_started(call_on_start)
    #script_callbacks.on_ui_tabs(ui.add_tab)
    #script_callbacks.on_model_loaded(on_model_loaded)
    #script_callbacks.on_before_component(on_before_component)
    #script_callbacks.on_script_unloaded(variables.call_on_end)