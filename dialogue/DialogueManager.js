import { SpeechBubble } from './SpeechBubble.js';
import { DialogueUI } from './DialogueUI.js';
import { DialogueNode } from './DialogueNode.js';

export class DialogueManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.activeBubbles = []; // For proximity, though might be deprecated

        this.isActive = false;
        this.player = null;
        this.currentNpc = null;
        this.dialogueTree = new Map();
        this.currentNode = null;

        this.ui = new DialogueUI();
    }

    // Allow other systems (e.g. ConnectionManager) to make an NPC "speak" a short line
    say(npc, text, lifespan = 3000) {
        if (!npc || !npc.mesh) return;
        try {
            const bubble = new SpeechBubble(text, npc, this.camera);
            bubble.lifespan = lifespan;
            this.activeBubbles.push(bubble);
        } catch (e) {
            console.warn('Failed to create speech bubble:', e);
        }
    }

    startDialogue(player, npc) {
        if (this.isActive || !npc.dialogueData) return;

        this.isActive = true;
        this.player = player;
        this.currentNpc = npc;
        
        this.dialogueTree.clear();
        for (const [id, data] of Object.entries(npc.dialogueData)) {
            this.dialogueTree.set(id, new DialogueNode(id, data));
        }

        const startNode = this.findStartNode();
        if (startNode) {
            this.currentNode = startNode;
            this.ui.show();
            this.ui.update(this.currentNode);
        } else {
            this.endDialogue();
        }
    }

    endDialogue() {
        this.isActive = false;
        this.player = null;
        this.currentNpc = null;
        this.currentNode = null;
        this.ui.hide();
    }

    handleInput() {
        if (!this.isActive || !this.currentNode) return;

        const selectedResponse = this.currentNode.responses[this.ui.selectedResponseIndex];
        if (!selectedResponse) {
            this.endDialogue();
            return;
        }

        // Apply effects
        selectedResponse.applyEffects(this.player, this.currentNpc);

        // Transition to next node
        const nextNodeId = selectedResponse.nextNodeId;
        if (nextNodeId === 'end' || !this.dialogueTree.has(nextNodeId)) {
            this.endDialogue();
        } else {
            this.currentNode = this.dialogueTree.get(nextNodeId);
            this.ui.update(this.currentNode);
        }
    }

    findStartNode() {
        let bestNode = null;
        // Find a conditional node that matches the NPC's state
        for (const node of this.dialogueTree.values()) {
            if (node.id.includes('greeting') && node.checkConditions(this.currentNpc)) {
                 bestNode = node;
                 break; 
            }
        }
        
        // Fallback to a default greeting if no conditional one is found
        if (!bestNode && this.dialogueTree.has('default_greeting')) {
            bestNode = this.dialogueTree.get('default_greeting');
        }

        return bestNode;
    }


    update() {
        // This method is now mostly for the old speech bubble system, which is being phased out.
        // It can be removed once proximity dialogue is fully replaced.
        this.activeBubbles = this.activeBubbles.filter(bubble => bubble.update());
    }

    clear() {
        this.activeBubbles.forEach(bubble => bubble.destroy());
        this.activeBubbles = [];
        if (this.isActive) {
            this.endDialogue();
        }
    }
}