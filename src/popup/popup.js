const $wordList = document.querySelector(".word-list");
const $currentWord = document.querySelector(".current-word");
const $text = document.querySelector(".text");

chrome.runtime.onMessage.addListener(function (req) {
    switch (req.type) {
        case "state":
            update(req.state);
            break;
        default:
            console.warn("Ignoring message from background page", req);
    }
});

// Ask background page for newest information when we load the popup
chrome.runtime.sendMessage({ type: "request" });

// Called when the background page has an update for us
function update(msg) {
    $text.textContent = "";
    $currentWord.textContent = "";
    setWords([]);

    if (msg.wordList && msg.wordList.length) {
        setWords(msg.wordList);
    } else if (msg.currentWord) {
        $currentWord.textContent = msg.currentWord;
    } else {
        $text.textContent = "Awaiting...";
    }
}

// Updates the list of words we can choose from
function setWords(words) {
    // empty all words
    while ($wordList.children.length) {
        $wordList.removeChild($wordList.children[0]);
    }

    // then insert new ones
    words.forEach((word) => {
        const $word = document.createElement("button");
        $word.classList.add("word");
        $word.textContent = word;
        $word.addEventListener("click", () => selectWord(word));
        $wordList.appendChild($word);
    });
}

// Called when the user clicks a specific word
function selectWord(word) {
    chrome.runtime.sendMessage({ type: "select", word });
}
