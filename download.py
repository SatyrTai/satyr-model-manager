
import threading
import queue
import types
import file_utils
import os
import requests
import math
import utils
import time
from concurrent.futures import ThreadPoolExecutor
from concurrent.futures import Future
from concurrent.futures import thread
from concurrent.futures import _base
from collections import deque
from pydantic import BaseModel
import asyncio

class MySimpleQueue:
    '''Simple, unbounded FIFO queue.

    This pure Python implementation is not reentrant.
    '''
    # Note: while this pure Python version provides fairness
    # (by using a threading.Semaphore which is itself fair, being based
    #  on threading.Condition), fairness is not part of the API contract.
    # This allows the C version to use a different implementation.

    def __init__(self):
        self._queue = deque()
        self._count = threading.Semaphore(0)

    def put(self, item, block=True, timeout=None):
        '''Put the item on the queue.

        The optional 'block' and 'timeout' arguments are ignored, as this method
        never blocks.  They are provided for compatibility with the Queue class.
        '''
        self._queue.append(item)
        self._count.release()

    def put_left(self, item, block=True, timeout=None):
        self._queue.appendleft(item)
        self._count.release()

    def get(self, block=True, timeout=None):
        '''Remove and return an item from the queue.

        If optional args 'block' is true and 'timeout' is None (the default),
        block if necessary until an item is available. If 'timeout' is
        a non-negative number, it blocks at most 'timeout' seconds and raises
        the Empty exception if no item was available within that time.
        Otherwise ('block' is false), return an item if one is immediately
        available, else raise the Empty exception ('timeout' is ignored
        in that case).
        '''
        if timeout is not None and timeout < 0:
            raise ValueError("'timeout' must be a non-negative number")
        if not self._count.acquire(block, timeout):
            raise queue.Empty
        return self._queue.popleft()

    def put_nowait(self, item):
        '''Put an item into the queue without blocking.

        This is exactly equivalent to `put(item, block=False)` and is only provided
        for compatibility with the Queue class.
        '''
        return self.put(item, block=False)

    def get_nowait(self):
        '''Remove and return an item from the queue without blocking.

        Only get an item if one is immediately available. Otherwise
        raise the Empty exception.
        '''
        return self.get(block=False)

    def empty(self):
        '''Return True if the queue is empty, False otherwise (not reliable!).'''
        return len(self._queue) == 0

    def qsize(self):
        '''Return the approximate size of the queue (not reliable!).'''
        return len(self._queue)

    __class_getitem__ = classmethod(types.GenericAlias)

class DownloadThreadPoolExecutor(ThreadPoolExecutor):
    def __init__(self, max_workers):
        super().__init__(max_workers)
        self._work_queue = MySimpleQueue()

    def submit(self, fn, *args, **kwargs):
        future = super().submit(fn, *args, **kwargs)
        return future

    def submit_jump_in(self, fn, /, *args, **kwargs):
        with self._shutdown_lock, thread._global_shutdown_lock:
            if self._broken:
                raise thread.BrokenThreadPool(self._broken)

            if self._shutdown:
                raise RuntimeError('cannot schedule new futures after shutdown')
            if thread._shutdown:
                raise RuntimeError('cannot schedule new futures after '
                                   'interpreter shutdown')
            f = _base.Future()
            w = thread._WorkItem(f, fn, args, kwargs)
            self._work_queue.put_left(w)
            self._adjust_thread_count()
            return f

executor : DownloadThreadPoolExecutor
_chunk_size : int
_speed_limit_bytes : int = 2 * 1024 * 1024
_try_interval : int = 60 # 60s
_maxTryCount : int = 20
retryCode = [-7, -6, -4, -3, -2, -1]


def init(
        thread_workers : int = 1, 
        chunk_size : int = 64 * 1024, 
        speed_limit_bytes : int = 2 * 1024 * 1024, 
        try_interval : int = 10,
        maxTryCount : int = 20

    ) -> None:
    global executor
    executor = DownloadThreadPoolExecutor(thread_workers)
    global _chunk_size
    _chunk_size = chunk_size
    global _speed_limit_bytes
    _speed_limit_bytes = speed_limit_bytes
    global _try_interval
    _try_interval = try_interval
    global _maxTryCount
    _maxTryCount = maxTryCount

def call_on_end():
    print("executor shutdown : Start")
    executor.shutdown(wait=True, cancel_futures=True)
    print("executor shutdown : End")
    
def get_idle_thread_count() :
    return executor._idle_semaphore._value

def get_active_thread_count() :
    return len(executor._threads) - get_idle_thread_count()

def get_current_speed_limit_bytes():
    return _speed_limit_bytes / max(get_active_thread_count(), 1)

def set_speed_limit_bytes(new_speed_limit_bytes : int):
    global _speed_limit_bytes
    _speed_limit_bytes = new_speed_limit_bytes

class ManualPauseException(Exception): ...

class Task(BaseModel) :
    # saveTo : C:\Users\user\Pictures\images.png
    # temp_filePath : C:\Users\user\Pictures\images.png.writing_file_suffix
    url : str = None
    saveTo : str = None
    writing_file_suffix : str = None
    known_file_size_bytes : int = None
    hash_method : object = None
    known_target_file_hash_code : str = None
    request : requests.Request = None
    request_manual_pause : bool = False
    fileSize : int = None
    currentSize : int = 0
    resume_success : bool = None
    tryCount : int = 0
    future : Future = None
    unique_id : int = None
    done_status : int = None
    #the message will show in ui
    message : str = None
    running : bool = False
    callbacks : list = []

    rlock : threading._RLock = None

    class Config:
        arbitrary_types_allowed = True
        fields = {
            'future': {'exclude': True},
            'request': {'exclude': True},
            'rlock': {'exclude': True},
            'hash_method': {'exclude': True},
            'callbacks': {'exclude': True},
        }

    def __init__(self,**kwargs):
        super().__init__(**kwargs)
        self.rlock = threading.RLock()
        self.future = None
        self.unique_id = id(self)

    def __eq__(self, __value: object) -> bool:
        return self is __value or isinstance(__value, Task) and self.url == __value.url and self.saveTo == __value.saveTo
    
    def clear(self):
        try :
            utils.lock_acquire(self.rlock, 10)
        except :
            return -2
        try :
            self.request = None
            self.request_manual_pause = False
            #self.fileSize = None
            #self.currentSize = 0
            self.resume_success = None
            self.future = None
            self.done_status = None
            self.message = None
            self.running = False
        except :
            return -1
        finally :
            self.rlock.release()

    def check_hash_downloaded_file(self, full_path) -> (bool | None):
        if not os.path.isfile(full_path) : return None
        if self.known_target_file_hash_code is None or self.hash_method is None : return None
        hashcode = file_utils.getHash(file_full_path = full_path, hashlib_method = self.hash_method)
        if hashcode is None : return None
        return self.known_target_file_hash_code == hashcode

    def getProgress(self) -> int:
        if self.fileSize == None :
            if self.done_status == 0 or self.done_status == 1:
                return 100
            else :
                return 0
        else :
            return math.floor(self.currentSize / max(self.fileSize, 1)) * 100
        
    def check_saveTo_exist(self):
        return os.path.isfile(self.saveTo)
    
    def isFinishDownload(self):
        return self.done_status in [0, 1, 2]

    def add_download_success_callback(self, callback) :
        self.callbacks.append(callback)

    def done_callback(self, future : Future) :
        msg = ""
        self.message = ""
        if future != self.future : 
            msg +="\nfuture != self.future"
        exception : BaseException
        try : 
            self.done_status = future.result()
            exception = future.exception()
        except _base.CancelledError as e :
            if self.done_status is not None : msg += "\nCancelledError self.done_status is not None"
            self.done_status = -5
        except Exception as e :
            msg +="\nfuture : " + str(e)
        try :
            msg += "\nsaveTo : " + self.saveTo
            msg += "\nexception : " + str(exception)
            msg += "\ndone_status : " + str(self.done_status)
            msg += "\nstatus_msg : "
            match self.done_status :
                case -6 :
                    self.message += "Hash check failed"
                    asyncio.run(self.cancel())
                case -5 :
                    self.message += "Manual pause"
                case -4 :
                    self.message += "Resume requests failed"
                case -3:
                    self.message += "RequestException"
                case -2:
                    self.message += "Internet connection lost"
                case -1:
                    self.message += "Requests failed"
                case 0:
                    self.message += "Download complete -> without hash check"
                case 1:
                    self.message += "Download already"
                case 2:
                    self.message += "Download complete -> with hash check"
                case _:
                    self.message += "Not expected value : " + str(self.done_status)
            retry_accept = _maxTryCount < 0 or self.tryCount < _maxTryCount
            if self.done_status in retryCode and retry_accept: 
                self.tryCount += 1
                self.message += " -> retry"
                time.sleep(_try_interval)
                self.submit(True)
            else :
                for callback in self.callbacks :
                    try : 
                        callback()
                    except Exception as e : 
                        print(e, flush=True)
                if retry_accept :
                    self.message += " -> no retry" 
                else :
                    self.message += " -> " + str(self.tryCount)
        except Exception as e : 
            print(e, flush=True)
        finally :
            try : 
                self.rlock.release()
            except Exception as e : 
                print(e, flush=True)
            
            print(utils.colorPrint(str(msg) + str(self.message), utils.P_Colors.OKGREEN), flush=True)
            print("download -> done_callback -> threading.get_ident() : " + str(threading.get_ident()))

    def submit(self, jump_in : bool):
        if self.future != None and self.future.running() : 
            return False
        if not self.rlock.acquire(False): 
            return False
        if self.isFinishDownload() :
            return False
        try :
            self.clear()
            if jump_in : 
                self.future = executor.submit_jump_in(self.download)
            else :
                self.future = executor.submit(self.download)

            self.future.add_done_callback(self.done_callback)
        finally :
            try : self.rlock.release()
            except : pass
        return True

    async def pause(self):
        if self.future == None : return True
        result = self.future.cancel()
        if not result and self.future.running():
            self.request_manual_pause = True
            self.rlock.acquire()
            self.rlock.release()
        return result
    
    async def cancel(self):
        await self.pause()
        try : 
            utils.lock_acquire(self.rlock, 10)
        except :
            return False
        try :
            temp_file_path = self.saveTo + self.writing_file_suffix
            if os.path.isfile(temp_file_path) :
                os.remove(temp_file_path)
            if os.path.isfile(self.saveTo) :
                os.remove(self.saveTo)
            self.clear()
            self.message = "Cancelled"
        finally :
            self.rlock.release()
        return True

    def change_saveTo(self, new_full_path):
        try : 
            utils.lock_acquire(self.rlock, 10)
        except : return False
        try :
            file_utils.renameIfExists(self.saveTo, new_full_path)
            self.saveTo = new_full_path
        finally :
            self.rlock.release()
        return True
    
    def download(self) :
        try : 
            print("download -> download -> threading.get_ident() : " + str(threading.get_ident()))
            utils.lock_acquire(self.rlock, 10)
        finally : pass
        result = None
        r = None
        targetFile = None
        temp_filePath = self.saveTo + self.writing_file_suffix
        if os.path.isfile(self.saveTo) :
            check_hash = self.check_hash_downloaded_file(self.saveTo)
            if check_hash is None or check_hash :
                size = os.path.getsize(self.saveTo)
                self.fileSize = size
                self.currentSize = size
                result = 1
        else :
            try :
                if self.request_manual_pause : 
                    raise ManualPauseException("manual_pause")
                
                request_headers = {}
                if os.path.isfile(temp_filePath):
                    self.currentSize = os.path.getsize(temp_filePath)
                    request_headers["Range"] = 'bytes=%d-' % self.currentSize
                else :
                    self.currentSize = 0
                
                r = requests.get(self.url, headers=request_headers, stream=True, timeout=10)
                r.raise_for_status()
                mode = None
                if r.status_code == 200 :
                    mode = "wb"
                elif r.status_code == 206 :
                    self.resume_success = "Content-Range" in r.headers
                    self.resume_success = self.resume_success and "Accept-Ranges" in r.headers and r.headers["Accept-Ranges"] == "bytes"
                    self.resume_success = self.resume_success and "Connection" in r.headers and r.headers["Connection"] == "keep-alive"
                    print(".resume_success : " + str(self.resume_success))
                    if self.resume_success :
                        mode = "ab"
                    else :
                        return -4
                else :
                    #connection_failed
                    return -1
                
                if 'Content-Length' in r.headers:
                    headerSize = r.headers['Content-Length']
                    headerSize = int(headerSize)
                    the_size = None
                    if r.status_code == 206 :
                        the_size = headerSize + self.currentSize
                    elif r.status_code == 200 :
                        the_size = headerSize
                    else :
                        the_size = headerSize
                        print("unexperted status_code : " + str(r.status_code))
                    if self.fileSize is not None and the_size != self.fileSize :
                        msg = "worng file size : "
                        msg+= "\nheaderSize : " + str(headerSize)
                        msg+= "\nself.fileSize : " + str(self.fileSize)
                        print(msg, flush=True)
                    self.fileSize = the_size
                else : 
                    print("no Content-Length")
                    
                file_utils.make_sure_dir_exist(temp_filePath)
                targetFile = open(temp_filePath, mode)
                
                size_offset = self.currentSize
                time_offset = time.time()
                local_speed_limit_bytes = _speed_limit_bytes
                local_idle_count = get_idle_thread_count()
                current_speed_limit_bytes = get_current_speed_limit_bytes()

                for chunk in r.iter_content(_chunk_size):
                    targetFile.write(chunk)
                    self.currentSize += len(chunk)

                    if self.request_manual_pause : 
                        raise ManualPauseException("manual_pause")
                    
                    if _speed_limit_bytes != local_speed_limit_bytes or get_idle_thread_count() != local_idle_count:
                        size_offset = self.currentSize
                        time_offset = time.time()
                        local_speed_limit_bytes = _speed_limit_bytes
                        local_idle_count = get_idle_thread_count()
                        current_speed_limit_bytes = get_current_speed_limit_bytes()
                    elif local_speed_limit_bytes > 0 :
                        file_utils.speed_limit(
                            current_speed_limit_bytes, 
                            size_offset, self.currentSize, 
                            time_offset, time.time()
                        )
                
                if self.fileSize != None :
                    if self.currentSize == self.fileSize :
                        result = 0
                    else :
                        result = -2
                else :
                    result = 0

            except ManualPauseException as e :
                return -5
            except requests.exceptions.RequestException as e : 
                print("download -> Task -> download : " + str(e), flush=True)
                return -3
            finally :
                if r is not None : r.close()
                if targetFile is not None : targetFile.close()
                #self.rlock.release()
        
        if result in [0, 1]:
            check_hash = self.check_hash_downloaded_file(temp_filePath)
            if check_hash != None :
                if check_hash :
                    result = 2
                else :
                    result = -6
        
        if result in [0, 2]:
                if os.path.exists(temp_filePath):
                    if os.path.exists(self.saveTo):
                        os.remove(self.saveTo)
                    os.rename(temp_filePath, self.saveTo)
                else:
                    print("exists == False temp_filePath : " + temp_filePath, flush=True)
        return result
