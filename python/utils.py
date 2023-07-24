import time

class TimeOutException(Exception): ...

def use_lock(target_lock, method, timeout : int = None, args = (), kwargs = {}):
    result = None
    lock_acquire(target_lock, timeout)
    try :
        result = method(*args, **kwargs)
    except TimeOutException as e :
        print("utils.use_lock : " + str(e))
    finally : 
        target_lock.release()
    return result

def lock_acquire(target_lock, timeout : int = None, sleepTime : int = 0.3) :
    if timeout :
        currentRuntime = 0
        while not target_lock.acquire(blocking=False):
            time.sleep(sleepTime)
            currentRuntime += sleepTime
            if currentRuntime >= timeout :
                raise TimeOutException("lockTimeOut : " + str(currentRuntime))
    else :
        target_lock.acquire()
    
def python_json_default_method_avoid_not_serializable(o) :
    result = None
    try :
        result = o.__dict__
    except : 
        result = "<not serializable>"
    return result

def python_json_default_method_disable(o):
    print("python_json_default_method_disable")
    for key in o.json_disables :
        o.__dict__.pop(key)
    return key

def measurement_of_method(method, times, args = (), kwargs = {}):
    start = time.time()
    for i in range(times) :
        method(*args, **kwargs)
    end = time.time()
    print("measurement_of_method : " + str(end - start))

#measurement_of_method(method = method, times = 10, kwargs={"secs" : 0.1})

def getRunningPath() :
  #https://stackoverflow.com/questions/595305/how-do-i-get-the-path-of-the-python-script-i-am-running-in
  import sys, os
  print('sys.argv[0] =', sys.argv[0])             
  pathname = os.path.dirname(sys.argv[0])        
  print('path =', pathname)
  print('full path =', os.path.abspath(pathname)) 
  #print(__file__)

import json

def print_object_informations(object):
    print("print_object_informations : ")
    print(object)
    print("methods : ")
    methods = []
    for i in dir(object) :
        if callable(getattr(object, i)) :
            if not str(i).startswith("__") and not str(i).endswith("__"):
                methods.append(i)
    print(methods)
    print("properties : ")
    try :
        p = json.dumps(object.__dict__, indent=4)
        print(p)
    except :
        print("Error")

def dynamicImport(target_path, target_file) :
    from importlib.machinery import SourceFileLoader
    import os
    return SourceFileLoader(target_file, os.path.join(target_path, target_file + ".py")).load_module()

class P_Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def colorPrint(text, *settings) -> str :
    ss = ""
    for s in settings :
        ss += s
    return ss + text + P_Colors.ENDC

def getAllSubClasses(cls) :
    result = []
    sub = cls.__subclasses__()
    for s in sub :
        result.append(s)
        result += getAllSubClasses(s)
    return result