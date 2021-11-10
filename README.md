# skribbl.io-streamer-mode

Super quick browser extension to add streamer mode to skribbl.io.  
Works by hiding the word selection from the skribbl.io site, moving it into a separate popup window that you can hide from your stream.

## Installation

Download the files for the project, then add the folder as an unpacked extension to your browser of choice.

<dl>
  <dt>Chrome</dt>
  <dd>
  Navigate to <code>chrome://extensions</code>.
  
  Enable developer mode (top right) and click "Load unpacked" (top left). Choose the folder containing <code>manifest.json</code>.
  
  You should now have an extension loaded called "skribbl.io streamer mode".
  </dd>
  <dt>Firefox</dt>
  <dd>
  Navigate to <code>about:debugging</code>.
  
  Click "This Firefox" (top left) and then "Load Temporary Add-on...". Choose the file <code>manifest.json</code>.
  
  You should now have an extension loaded called "skribbl.io streamer mode".
  </dd>
</dl>

## Usage

The extension will automatically remove the words from the skribbl.io website so as not to give away anything if you're streaming the game.  
The word list will instead be moved into a separate popup window, in which you can choose the word to draw as if it was done on the skribbl.io website.

You can open the popup by clicking the "Streamer mode" button that is added to the top-right of every page on skribbl.io.  
This popup will contain the list of words you can choose from when it's your turn to draw, as well as the current word while you're drawing.

![Example of the extension in action](docs/example.png)
