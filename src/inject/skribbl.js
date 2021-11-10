const $overlay = document.getElementById("overlay");
const $wordContainer = document.querySelector(".wordContainer");
const $currentWord = document.getElementById("currentWord");

chrome.runtime.onMessage.addListener(function (req) {
    switch (req.type) {
        case "select":
            selectWord(req.word);
            break;
        default:
            console.warn("Ignoring message from background page", req);
    }
});

// Called whenever we want to extract the currently active word and send it to the background page
const updateCurrentWord = (function () {
    let shouldIgnore = false; // set to true when we trigger an update ourselves, and we want to ignore it
    return function updateCurrentWord() {
        if (shouldIgnore) {
            shouldIgnore = false;
            return;
        }
        const $toolbar = document.querySelector(".containerToolbar");
        const activelyDrawing = $toolbar && $toolbar.style.display !== "none";
        if (!activelyDrawing) {
            console.warn("Ignoring active word because we aren't drawing");
            return;
        }

        const word = $currentWord.textContent;
        console.log("Got current word", word);
        shouldIgnore = true;
        $currentWord.textContent = word.replace(/[^\s]/g, "_");
        chrome.runtime.sendMessage({
            type: "update",
            currentWord: word,
        });
    };
})();

// Called whenever we want to extract the current words and send them to the background page
const updateWords = (function () {
    let lastVisible = null;
    return function updateWords() {
        const visible =
            $overlay.style.display !== "none" &&
            $wordContainer.style.display !== "none";
        const words = [...$wordContainer.childNodes].map(
            ($node) => $node.textContent
        );

        if (visible === lastVisible) {
            console.log("Skipping because visible is same as last");
            return;
        }
        lastVisible = visible;

        console.log("Informing background page", { visible, words });
        chrome.runtime.sendMessage({
            type: "update",
            wordList: visible ? words : [],
        });
    };
})();

// Called whenever we should click on a specific word
function selectWord(word) {
    const $words = [...$wordContainer.childNodes];
    const $word = $words.find(($node) => $node.textContent === word);
    if (!$word) {
        console.warn("Failed to find word element for", word);
        return false;
    }
    $word.click();
    return true;
}

(function init() {
    if ($overlay && $wordContainer && $currentWord) {
        $wordContainer.classList.add("wordContainer--hide");

        const wordlistObserver = new MutationObserver(updateWords);
        wordlistObserver.observe($wordContainer, {
            childList: true,
            attributes: true,
        });
        wordlistObserver.observe($overlay, { attributes: true });

        const curWordObserver = new MutationObserver(updateCurrentWord);
        curWordObserver.observe($currentWord, { childList: true });
    } else {
        console.warn("Failed to locate important element", {
            $overlay,
            $wordContainer,
            $currentWord,
        });
        return;
    }

    // attach our "Streamer mode" button for opening the popup
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
})();
