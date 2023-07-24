import os
import sys
#import appdirs
import file_utils

print("variables : ------------------------------------------")

# print(__file__)
# print(sys.argv)

# SubFileName settings ------------------------------------------------------
jsonSuffix = ".json"
writingSuffix = ".temp"

# civitai setting -----------------------------------------------------------
siteURL = "https://civitai.com"
apiURL = "https://civitai.com/api/v1"
targetString_PreferredModelVersionID = "modelVersionId="

# dir  ----------------------------------------------------------------------
user_data_dir : str = None
#from modules import paths
localFilesPath : str = None
jsonFilesPath : str = None

# settings---------------------------------------------------------------
import settings
from settings import Settings
settingsJsonFullPath : str = None
settings_object : Settings = None
#print(settings_object.json(indent=4))
# asset hash ----------------------------------------------------------------
import asset_record
from asset_record import AssetRecordManager
asset_record_full_path : str = None
asset_record_manager : AssetRecordManager = None
#print(asset_record_manager.json(indent=4))
# apiJsonPath ----------------------------------------------------------------

# https://www.geeksforgeeks.org/python-tkinter-messagebox-widget/
# from tkinter import messagebox
# -----------------------------------------------------------------------------

def load(args_user_data_dir):
    global user_data_dir
    user_data_dir = args_user_data_dir
    global localFilesPath
    localFilesPath = os.path.join(user_data_dir, "localFiles")
    global jsonFilesPath
    jsonFilesPath = os.path.join(localFilesPath, "apiJson")
    global settingsJsonFullPath
    settingsJsonFullPath = file_utils.get_full_path(localFilesPath, "modelManagerSettings", jsonSuffix)
    global settings_object
    settings_object = settings.load(settingsJsonFullPath)
    global asset_record_full_path
    asset_record_full_path = file_utils.get_full_path(localFilesPath, "asset_record", jsonSuffix)
    global asset_record_manager
    asset_record_manager = asset_record.load(asset_record_full_path, jsonFilesPath) 


def save_asset_record():
    if asset_record_manager != None :
        asset_record_manager.save(asset_record_full_path, writingSuffix)

def save_setting():
    if settings_object != None :
        settings_object.save(settingsJsonFullPath, writingSuffix)

def save():
    save_setting()
    save_asset_record()

def end_call():
    if settings_object != None :
        settings_object.save(settingsJsonFullPath, writingSuffix)
    if asset_record_manager != None :
        asset_record_manager.save(asset_record_full_path, writingSuffix)

on_end_callback = [end_call]

def call_on_end():
    for callback in on_end_callback : callback()

