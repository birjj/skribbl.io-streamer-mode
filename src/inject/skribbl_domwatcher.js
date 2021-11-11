/**
 * @fileoverview A translation layer, observing DOM changes and translating them into meaningful events
 * Also defines the `elms` object
 */

const elms = {
    $overlay: document.getElementById("overlay"),
    $wordContainer: document.querySelector(".wordContainer"),
    $currentWord: document.getElementById("currentWord"),
    $drawingToolbar: document.querySelector(".containerToolbar"),
};
if (Object.keys(elms).some((k) => !elms[k])) {
    console.warn("Failed to get elements from DOM", elms);
    throw new Error("Couldn't find needed elements");
}

class DOMWatcher {
    listeners = {};

    constructor() {
        // attach our observer for the list of words
        const wordlistObserver = new MutationObserver(this.updateWords);
        wordlistObserver.observe(elms.$wordContainer, {
            childList: true,
            attributes: true,
        });
        wordlistObserver.observe(elms.$overlay, { attributes: true });

        // attach our observer for the current word
        const curWordObserver = new MutationObserver(this.updateCurrentWord);
        curWordObserver.observe(elms.$currentWord, { childList: true });
    }

    updateCurrentWord = (() => {
        let shouldIgnore = false; // set to true when we trigger an update ourselves, and we want to ignore it
        return () => {
            if (shouldIgnore) {
                shouldIgnore = false;
                return;
            }
            const activelyDrawing =
                elms.$drawingToolbar.style.display !== "none";
            if (!activelyDrawing) {
                console.log("Ignoring active word because we aren't drawing");
                return;
            }

            const word = elms.$currentWord.textContent;
            shouldIgnore = true;
            elms.$currentWord.textContent = word.replace(/[^\s]/g, "_");
            this.emit("currentWord", word);
        };
    })();

    updateWords = (() => {
        let lastVisible = null;
        return () => {
            const visible =
                elms.$overlay.style.display !== "none" &&
                elms.$wordContainer.style.display !== "none";
            const words = [...elms.$wordContainer.children].map(
                ($node) => $node.textContent
            );

            if (visible === lastVisible) {
                console.log(
                    "Skipping word list because visible is same as last"
                );
                return;
            }
            lastVisible = visible;

            this.emit("wordList", visible ? words : []);
        };
    })();

    /**
     * Add a listener for a specific event
     * Events currently supported and their callback type:
     *   "currentWord": (curWord: string) => {}
     *   "wordList": (wordList: string[]) => {}
     */
    addListener(evt, callback) {
        if (!this.listeners[evt]) {
            this.listeners[evt] = [];
        }
        this.listeners[evt].push(callback);
    }

    /** Emit an event with some specific props */
    emit(evt, ...data) {
        console.log("DOM watcher emitting", evt, data);
        if (!this.listeners[evt]) {
            return;
        }
        this.listeners[evt].forEach((cb) => cb(...data));
    }
}
