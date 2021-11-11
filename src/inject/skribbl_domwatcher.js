/**
 * @fileoverview A translation layer, observing DOM changes and translating them into meaningful events
 * Also defines the `elms` object
 */

const elms = {
    $overlay: document.getElementById("overlay"),
    $wordContainer: document.querySelector(".wordContainer"),
    $currentWord: document.getElementById("currentWord"),
    $drawingToolbar: document.querySelector(".containerToolbar"),
    $chat: document.getElementById("boxMessages"),
    $players: document.querySelector(".containerGame #containerGamePlayers"),
};
if (Object.keys(elms).some((k) => !elms[k])) {
    console.warn("Failed to get elements from DOM", elms);
    throw new Error("Couldn't find needed elements");
}

/**
 * A simple EventListener-like interface to DOM changes
 * Events currently supported and their callback type:
 *   "currentWord": (curWord: string) => {}
 *   "wordList": (wordList: string[]) => {}
 *   "chat": (messages: {sender: string, message: string, $elm: Element}[]) => {}
 *   "players": (players: {name: string, isUs: boolean, $elm: Element}[]) => {}
 *   "playersLeft": (players: {...}[]) => {}
 *   "drawing": (player: {...} | null) => {}
 */
const domWatcher = new (class DOMWatcher {
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

        // attach our observer for chat messages
        const chatObserver = new MutationObserver(this.handleChatMessages);
        chatObserver.observe(elms.$chat, { childList: true });

        // attach our observer for player changes
        const playerObserver = new MutationObserver(this.handlePlayers);
        playerObserver.observe(elms.$players, { childList: true });

        // attach our observer for drawing changes
        const drawingObserver = new MutationObserver(this.handleDrawing);
        drawingObserver.observe(elms.$players, {
            attributes: true,
            subtree: true,
        });
    }

    handleDrawing = (/** @type {MutationRecord[]} */ records) => {
        records.forEach((record) => {
            // we get attribute updates for the entire subtree, but are only interested in the .drawing element
            if (
                !record.target.classList ||
                !record.target.classList.contains("drawing")
            ) {
                return;
            }

            const isDrawing = record.target.style.display !== "none";

            const $player = record.target.closest(".player");
            if (!$player || !$player.skribblPlayerData) {
                console.warn(
                    "Unable to find player for drawing update",
                    record.target
                );
                return;
            }

            this.emit("drawing", isDrawing ? $player.skribblPlayerData : null);
        });
    };

    handlePlayers = (/** @type {MutationRecord[]} */ records) => {
        const interpretPlayer = (/** @type {HTMLElement} */ $elm) => {
            const $name = $elm.querySelector(".name");
            if (!$name) {
                console.warn("Failed to find name for player elm", $elm);
                return null;
            }
            const isUs = $name.style.color !== "";
            let name = $name.textContent;
            if (isUs) {
                name = name.replace(/ \(You\)$/, "");
            }
            $elm.skribblPlayerData = {
                name,
                isUs,
                $elm,
            };
            return $elm.skribblPlayerData;
        };
        records.forEach((record) => {
            const newPlayers = [...record.addedNodes].map(interpretPlayer);
            const removedPlayers = [...record.removedNodes].map(
                interpretPlayer
            );

            if (newPlayers.length) {
                this.emit("players", newPlayers);
            }
            if (removedPlayers.length) {
                this.emit("playersLeft", removedPlayers);
            }
        });
    };

    handleChatMessages = (/** @type {MutationRecord[]} */ records) => {
        records.forEach((record) => {
            const messages = [...record.addedNodes]
                .map(($msg) => {
                    if ($msg.childNodes.length !== 2) {
                        return null;
                    }
                    return {
                        sender: $msg.childNodes[0].textContent.replace(
                            /: $/,
                            ""
                        ),
                        message: $msg.childNodes[1].textContent,
                        $elm: $msg,
                    };
                })
                .filter((v) => v);

            if (messages.length) {
                this.emit("chat", messages);
            }
        });
    };

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
})();
