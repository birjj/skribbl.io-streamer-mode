/**
 * @fileoverview The main inject script
 * Depends on skribbl_domwatcher.js being executed first
 */

// add our listeners to the DOM watcher
domWatcher.addListener("currentWord", (currentWord) => {
    chrome.runtime.sendMessage({
        type: "update",
        currentWord,
    });
});
domWatcher.addListener("wordList", (wordList) => {
    chrome.runtime.sendMessage({
        type: "update",
        wordList,
    });
});

// react to messages from the backend
chrome.runtime.onMessage.addListener(function (req) {
    switch (req.type) {
        case "select":
            selectWord(req.word);
            break;
        default:
            console.log("Ignoring message from background page", req);
    }
});

// Called whenever we should click on a specific word
function selectWord(word) {
    const $words = [...elms.$wordContainer.children];
    const $word = $words.find(($node) => $node.textContent === word);
    if (!$word) {
        console.warn("Failed to find word element for", word);
        return false;
    }
    $word.click();
    return true;
}

// attach our "Streamer mode" button for opening the popup
elms.$wordContainer.classList.add("wordContainer--hide");
const $btn = document.createElement("a");
$btn.classList.add("streamer-mode__btn");
$btn.href = chrome.runtime.getURL("src/popup/popup.html");
$btn.textContent = "Streamer mode";
$btn.addEventListener("click", (e) => {
    e.preventDefault();
    window.open(
        $btn.href,
        "skribbl-streamer-mode",
        "width=512,height=256,location=no,menubar=no,status=no,scrollbars=no"
    );
});
document.body.appendChild($btn);
