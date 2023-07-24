import os
import time

def get_full_path(path:str, file_name:str, file_suffix:str)->str:
    return os.path.join(path, file_name + file_suffix)

def get_text_form_file(fullPath:str)->str:
    text = None
    if not os.path.exists(fullPath): 
        return text
    f = open(fullPath, "r")
    try:
        text = f.read()
    except Exception as e:
        print("get_text_form_file")
        print(e)
    finally:
        f.close()
    return text

def write_text_to(full_path, text, writing_suffix):
    tempPath = full_path + writing_suffix
    make_sure_dir_exist(full_path)
    outfile = open(tempPath, "w")
    try:
        outfile.write(text)
        result = True
    except Exception as e:
        print(e)
        result = False
    finally:
        outfile.close()
    if result:
        if os.path.exists(full_path):
            os.remove(full_path)
        os.rename(tempPath, full_path)
    else:
        os.remove(tempPath)
    return result

def get_file_suffix(url:str):
    index = url.rfind(".")
    if index == -1 : return url
    return url[index:]

def get_file_name(url:str):
    indexes = [url.rfind("/"), url.rfind("\\")]
    noFind = True
    for i in indexes:
        noFind = noFind and i == -1
    if noFind: return None
    indexes = list(filter(lambda i: i != -1, indexes))
    if len(indexes) <= 0 : return url
    index = max(indexes)+1
    if index >= len(url) : return url
    return url[index:]

def get_running_path():
    # https://stackoverflow.com/questions/595305/how-do-i-get-the-path-of-the-python-script-i-am-running-in
    import sys, os
    print('sys.argv[0] =', sys.argv[0])
    pathname = os.path.dirname(sys.argv[0])
    print('path =', pathname)
    print('full path =', os.path.abspath(pathname))
    # print(__file__)

def make_sure_dir_exist(path):
    if os.path.isdir(path): return
    path = os.path.split(path)[0]
    if os.path.isdir(path): return
    os.makedirs(path)

def renameIfExists(targetFullPath, newFullPath):
    if os.path.exists(newFullPath) : return False
    if os.path.exists(targetFullPath):
        make_sure_dir_exist(newFullPath)
        os.rename(targetFullPath, newFullPath)
        return True
    return False

def speed_limit(speed_limit_bytes, size_offset, size_current, time_offset, time_current) -> bool:
    elapsed_time = time_current - time_offset
    bytes_per_second = (size_current - size_offset) / max(elapsed_time, 0.001)
    if bytes_per_second > speed_limit_bytes :
        time_to_wait = min((bytes_per_second - speed_limit_bytes) / speed_limit_bytes, 1)
        time.sleep(time_to_wait)

import hashlib
def getHash(file_full_path : str, hashlib_method = hashlib.sha256, buffer_size : int = 65536) -> str:
    if not os.path.isfile(file_full_path) : 
        return None
    algorithm = hashlib_method()
    f = None
    try : 
        f = open(file_full_path, 'rb')
        while True:
            data = f.read(buffer_size)
            if not data : break
            algorithm.update(data)
    except Exception as e:
        print(e)
    finally :
        f.close()
    return str.upper(algorithm.hexdigest())

import glob

def lookingForFiles(path : str, targetFileName : str = "*", targetSuffix : str = ".*", recursive : bool = False) -> list[str]:
    finalPath = path
    if recursive : finalPath = os.path.join(finalPath, "**/")
    result = lookingForFiles_regex(finalPath, targetFileName + targetSuffix, recursive)
    return result

def lookingForFiles_regex(path : str, regex : str, recursive : bool) -> list[str]:
    regexPath = os.path.join(path, regex)
    regexPath = os.path.abspath(regexPath)
    candidates = []
    candidates += glob.iglob(regexPath, recursive=recursive)
    return candidates

def explorer(path):
    result = path is not None and (os.path.isfile(path) or os.path.isdir(path))
    if result :
        import subprocess
        subprocess.run("explorer /select,\"" + path + "\"")
    return result

'''
path = "E:\\testing\\Checkpoints\\camelliamix25D_v2.safetensors"
target = "ED4F26C284BC9BAAEEE63F10AD823486BCC0DD6FCC03C9472FD8C44E508889A1"
result = getHash(path)
print("sha256 : " + result)
print("target : " + target)
print("equal : " + str(result == target))
'''



