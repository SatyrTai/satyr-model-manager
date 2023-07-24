# satyr-model-manager
Get trigger words, Most trained words, also model downloader.<br>
an extension of stable-diffusion-webui (https://github.com/AUTOMATIC1111/stable-diffusion-webui)
<br><img src="/web/imgs/no-preview.jpg" width="250">

## How to install
   - There are some options you can choose to install this extension
      - Open the extension tab and go to "from url" tab, copy-paste the url of this repo and click install.
      - Manually clone this repo to the extension folder or download the zip.

## How To Use
### As extension
   <ul>
      
   <li>
      <details>
      <summary>Trigger words and Most trained tags</summary>
      <ul>
         <li>Click on the model card in the webui extra page to call this extension</li>
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
      <summary>Prompt examples and Descriptions</summary>
      <ul>
         <li>Click bottom right notice card to open popup window</li>
         <li>Click white dot at top left of the image to apply prompt example (Only txt2img)</li>
         <li>Click blue button at top left of the popup window to visite civitai site of the model</li>
         <li>Scroll down to read Model Description and Model version Description</li>
      </ul>
      <br>
      <picture><img src="/web/imgs/no-preview.jpg" width="350"></picture>
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
