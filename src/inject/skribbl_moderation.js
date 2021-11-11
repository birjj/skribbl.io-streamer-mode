/**
 * @fileoverview Implements the moderation features (player mute and canvas hiding)
 * Depends on skribbl_domwatcher.js being executed first
 */

const moderationHandler = new (class ModerationHandler {
    /** @type {Set<string>} */
    mutedPlayers = new Set();
    /** @type {Set<string>} */
    hiddenPlayers = new Set();
    currentlyDrawing = "";

    constructor() {
        // add our canvas hider to be used later
        this.$canvasHider = document.createElement("div");
        this.$canvasHider.classList.add("streamer-mode__canvas-hider");
        elms.$canvas.parentNode.insertBefore(
            this.$canvasHider,
            elms.$canvas.nextSibling
        );

        // listen for players being added to the game so we can attach buttons to them
        domWatcher.addListener("players", this.handlePlayers);

        // listen for when players start drawing so we can activate the canvas blocker
        domWatcher.addListener("drawing", this.handleDrawing);

        // listen for chat messages so we can hide them if they're muted
        domWatcher.addListener("chat", this.handleChat);
    }

    handleChat = (messages) => {
        messages.forEach((message) => {
            if (this.mutedPlayers.has(message.sender)) {
                message.$elm.style.display = "none";
            }
        });
    };

    handleDrawing = (player) => {
        if (!player) {
            // skribbl still displays canvas after player has stopped drawing
            // don't unhide until next player starts drawing
            /*this.$canvasHider.classList.remove("active");
            this.currentlyDrawing = "";*/
            return;
        }

        const name = player.name;
        this.currentlyDrawing = name;
        this.$canvasHider.classList.toggle(
            "active",
            this.hiddenPlayers.has(name)
        );
    };

    handlePlayers = (players) => {
        players.forEach(({ name, isUs, $elm }) => {
            // we can't moderator ourselves
            if (isUs) {
                return;
            }

            const isMuted = this.mutedPlayers.has(name);
            const isHidden = this.hiddenPlayers.has(name);

            // create our buttons
            const $btnContainer = document.createElement("div");
            $btnContainer.classList.add("streamer-mode__moderation");
            const $muteBtn = document.createElement("button");
            $muteBtn.classList.add("streamer-mode__mute-btn");
            $muteBtn.classList.toggle("active", isMuted);
            $muteBtn.textContent = isMuted ? "Muted" : "Mute";
            $muteBtn.addEventListener(
                "click",
                this.toggleMute.bind(this, name, $elm)
            );
            const $hideBtn = document.createElement("button");
            $hideBtn.classList.add("streamer-mode__hide-btn");
            $hideBtn.classList.toggle("active", isHidden);
            $hideBtn.textContent = isHidden ? "Hidden" : "Hide";
            $hideBtn.addEventListener(
                "click",
                this.toggleHide.bind(this, name, $elm)
            );
            $btnContainer.appendChild($hideBtn);
            $btnContainer.appendChild($muteBtn);

            $elm.appendChild($btnContainer);
        });
    };

    toggleHide = (name, $elm) => {
        const nextValue = !this.hiddenPlayers.has(name);

        // update the button state
        const $btn = $elm.querySelector(".streamer-mode__hide-btn");
        $btn.classList.toggle("active", nextValue);
        $btn.textContent = nextValue ? "Hidden" : "Hide";

        // toggle the canvas hider if this player is currently drawing
        if (this.currentlyDrawing === name) {
            this.$canvasHider.classList.toggle("active", nextValue);
        }

        // store the state
        if (nextValue) {
            this.hiddenPlayers.add(name);
        } else {
            this.hiddenPlayers.delete(name);
        }
    };

    toggleMute = (name, $elm) => {
        const nextValue = !this.mutedPlayers.has(name);

        // update the button state
        $elm.classList.toggle("muted", nextValue);
        const $btn = $elm.querySelector(".streamer-mode__mute-btn");
        $btn.classList.toggle("active", nextValue);
        $btn.textContent = nextValue ? "Muted" : "Mute";

        this.updateChat(name, nextValue);

        // store the state
        if (nextValue) {
            this.mutedPlayers.add(name);
        } else {
            this.mutedPlayers.delete(name);
        }
    };

    updateChat(name, shouldHide) {
        [...elms.$chat.children].forEach(($elm) => {
            const parsed = domWatcher.parseChatElm($elm);
            if (!parsed) {
                return;
            }

            if (parsed.sender === name) {
                $elm.style.display = shouldHide ? "none" : "";
            }
        });
    }
})();
