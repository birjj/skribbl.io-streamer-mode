let currentState = {
    wordList: [],
    currentWord: "",
};

// Broadcast a message (by default the current state) to all content scripts and pages
function broadcast(msg = { type: "state", state: currentState }) {
    // send to all extension pages (e.g. the popup)
    chrome.runtime.sendMessage(null, msg);
    // send to all content scripts
    chrome.tabs.query(
        {
            url: "https://skribbl.io/*",
        },
        (tabs) => {
            tabs.forEach((tab) => chrome.tabs.sendMessage(tab.id, msg));
        }
    );
}

// Listener for when we receive messages from content script, usually to update the state
chrome.runtime.onMessage.addListener(function (request) {
    console.log("Message", request);
    switch (request.type) {
        case "update": // update the current state
            currentState.wordList = request.wordList || currentState.wordList;
            currentState.currentWord =
                request.currentWord || currentState.currentWord;
            broadcast();
            break;
        case "request": // we've been asked to broadcast the current state
            broadcast();
            break;
        case "select": // the user has selected a word
            broadcast({
                type: "select",
                word: request.word,
            });
            break;
        default:
            console.warn("Unknown runtime message", request);
    }
});
