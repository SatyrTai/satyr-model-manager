# satyr-model-manager
Get trigger words, Most trained words, also model downloader.<br>
an extension of stable-diffusion-webui (https://github.com/AUTOMATIC1111/stable-diffusion-webui)
<br><img src="/README/extension_preview.png"><img src="/README/extension_preview_model_info.png">

## How to install
   - There are some options you can choose to install this extension
      - Open the extension tab and go to "from url" tab, copy-paste the url of this repo and click install.
         - [https://github.com/SatyrTai/satyr-model-manager.git](https://github.com/SatyrTai/satyr-model-manager.git)
      - Manually clone this repo to the extension folder or download the zip.

## How To Use🤪
### As extension
   <ul>
      
   <li>
      <details>
      <summary>Trigger words and Most trained tags</summary>
      <ul>
         <li>Click on the model card in the webui extra page</li>
         <li>Afterwards, a notification card will appear in the bottom right corner of your webui window</li>
         <li>If the information is present, the notification card will contain the trigger words and the most trained tags</li>
      </ul>
      <picture>
         <img src="/web/imgs/no-preview.jpg" width="350">
      </picture>
      <br>[Link](https://github.com/SatyrTai/satyr-model-manager/web/imgs/no-preview.jpg)
      </details>
   </li>
   
   <li>
      <details>
      <summary>View Prompt examples and Descriptions</summary>
      <ul>
         <li>Click bottom right notice card to open popup window</li>
         <li>Scroll down to read Model Description and Model version Description</li>
      </ul>
      <br>
      <picture><img src="/web/imgs/no-preview.jpg" width="350"></picture>
      <br>[Link](https://github.com/SatyrTai/satyr-model-manager/web/imgs/no-preview.jpg)
      </details>
   </li>
   
   <li>
      <details>
      <summary>Apply Prompt example (Only txt2img)</summary>
      <ul>
         <li>Click bottom right notice card to open popup window</li>
         <li>Click white dot at top left of the image to apply prompt example (Only txt2img)</li>
      </ul>
      <br>
      <picture><img src="/web/imgs/no-preview.jpg" width="350"></picture>
      <br>[Link](https://github.com/SatyrTai/satyr-model-manager/web/imgs/no-preview.jpg)
      </details>
   </li>
   
   <li>
      <details>
      <summary>Visite model page at Civitai site</summary>
      <ul>
         <li>Click bottom right notice card to open popup window</li>
         <li>Click blue button at top left of the popup window to visite civitai site of the model</li>
      </ul>
      <br>
      <picture><img src="/web/imgs/no-preview.jpg" width="350"></picture>
      <br>[Link](https://github.com/SatyrTai/satyr-model-manager/web/imgs/no-preview.jpg)
      </details>
   </li>
   
   </ul>

### As application (Must run as extension once)
   <ul>
      
   <li>
      <details>
      <summary>Get Start (Must run as extension once)</summary>
      <ul>
         <li>Run once as an extension to gather model path information recognized by the webui</li>
         <li>Windows OS : Double Click the satyr-model-manager.bat</li>
         <li>macOS and linux : Double Click the satyr-model-manager.sh(converted by chatgpt from .bat <- never tested🤣)</li>
         <li>By Default localhost will be [127.0.0.1/8762](http://127.0.0.1:8762/)</li>
      </ul>
      </details>
   </li>
   
   <li>
      <details>
      <summary>Download Model From Civitai</summary>
      <ul>
         <li>Copy(Ctrl+C) the Model page URL from your browser such as https://civitai.com/models/71961/fast-negative-embedding-fastnegativev2</li>
         <li>Paste(Ctrl+V) the Model page URL to the page and enter.</li>
         <li>Download Card show up and it is downloading</li>
         <li>Model is automatic located to path recognized by webui</li>
      </ul>
      <picture>
         <img src="/web/imgs/no-preview.jpg" width="350">
      </picture>
      <br>[Link](https://github.com/SatyrTai/satyr-model-manager/web/imgs/no-preview.jpg)
      </details>
   </li>
   
   <li>
      <details>
      <summary>Download images provided by creator</summary>
      <ul>
         <li>Click bottom right notice card to open popup window</li>
         <li>Click the checkbox of the target image</li>
         <li>Click "Apply Changes" button top left of popup window</li>
         <li>The downloaded image is located next to the model</li>
      </ul>
      <br>
      <picture><img src="/web/imgs/no-preview.jpg" width="350"></picture>
      <br>[Link](https://github.com/SatyrTai/satyr-model-manager/web/imgs/no-preview.jpg)
      </details>
   </li>

   <li>
      <details>
      <summary>Remove a download request and delete all related</summary>
      <ul>
         <br>
         <li>If download not complete.</li>
         <li>Just click the close button on download card</li>
         <br>
         <li>If download has completed.</li>
         <li>Click the lock button</li>
         <li>Delete button will show up top left of the download card</li>
      </ul>
      <picture>
         <img src="/web/imgs/no-preview.jpg" width="350">
      </picture>
      <br>[Link](https://github.com/SatyrTai/satyr-model-manager/web/imgs/no-preview.jpg)
      </details>
   </li>
   
   <li>
      <details>
      <summary>Change Preview (before download complete)</summary>
      <ul>
         <li>Download Card has two arrow buttons</li>
         <li>Click arrow buttons to change preview</li>
      </ul>
      <picture>
         <img src="/web/imgs/no-preview.jpg" width="350">
      </picture>
      <br>[Link](https://github.com/SatyrTai/satyr-model-manager/web/imgs/no-preview.jpg)
      </details>
   </li>
   
   <li>
      <details>
      <summary>Change Preview (after download complete)</summary>
      <ul>
         <li>Download card has a lock button</li>
         <li>Click it ! </li>
         <li>Arrow buttons show up</li>
         <li>Click arrow buttons to change preview</li>
      </ul>
      <picture>
         <img src="/web/imgs/no-preview.jpg" width="350">
      </picture>
      <br>[Link](https://github.com/SatyrTai/satyr-model-manager/web/imgs/no-preview.jpg)
      </details>
   </li>
      
   </ul>

## Function

   ### Meaning of emoji 
   👌 <-- Completed<br>
   🤪 <-- Working on it

   ### As extension
   - Trigger words from civitai api json (TEXTUAL INVERSION, Checkpoints, LORA, LyCORIS)👌
   - Most trained tags of metadata from safetensor (LORA, LyCORIS)👌
   - Automatic download the civitai api json of clicked model👌
      - This prevents you from losing access to trigger words, descriptions, <br>and prompt examples in images provided by creators after civitai delete the model
   - Share setting and downloaded civitai api json with the individual application👌
   - Search model by Trigger words from civitai api json🤪
   - Search model by Trained tags of metadata from safetensor🤪
   - Search model by Civitai Tags🤪
   - Search model by Civitai User name🤪
   
   ### As application
   - Download models from civitai api👌
   - Retry when connection failed, hashcheck failed and localhost reboot👌
   - Speed limit setting👌
   - Preview size setting👌
   - Download images provided by creator👌
   - Change preview image after and before download complete👌
   - Delete all related files when download not complete by the close button ( when download complete will not delete anythings👌
   - Delete all related files of selected model👌
   - Management of models🤪
   - Auto update models🤪
