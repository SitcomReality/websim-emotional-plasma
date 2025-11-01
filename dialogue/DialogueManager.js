import { SpeechBubble } from './SpeechBubble.js';

export class DialogueManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.activeBubbles = [];
    }

    say(anchor, text) {
        // Optional: remove any existing bubble for this anchor to prevent overlap
        this.activeBubbles = this.activeBubbles.filter(bubble => {
            if (bubble.anchor === anchor) {
                bubble.destroy();
                return false;
            }
            return true;
        });

        const bubble = new SpeechBubble(text, anchor, this.camera);
        this.activeBubbles.push(bubble);
    }

    update() {
        this.activeBubbles = this.activeBubbles.filter(bubble => bubble.update());
    }

    clear() {
        this.activeBubbles.forEach(bubble => bubble.destroy());
        this.activeBubbles = [];
    }
}