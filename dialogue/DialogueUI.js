export class DialogueUI {
    constructor() {
        this.container = null;
        this.npcTextElement = null;
        this.responsesContainer = null;
        this.selectedResponseIndex = 0;
        this.createElements();
    }

    createElements() {
        this.container = document.createElement('div');
        this.container.id = 'dialogue-container';
        this.container.className = 'dialogue-hidden';

        const npcBox = document.createElement('div');
        npcBox.className = 'dialogue-npc-box';
        this.npcTextElement = document.createElement('p');
        npcBox.appendChild(this.npcTextElement);

        this.responsesContainer = document.createElement('div');
        this.responsesContainer.className = 'dialogue-responses';

        this.container.appendChild(npcBox);
        this.container.appendChild(this.responsesContainer);

        const gameContainer = document.getElementById('game-container');
        gameContainer.appendChild(this.container);
    }

    show() {
        this.container.classList.remove('dialogue-hidden');
    }

    hide() {
        this.container.classList.add('dialogue-hidden');
    }

    update(dialogueNode) {
        this.npcTextElement.textContent = dialogueNode.text;
        this.responsesContainer.innerHTML = '';
        this.selectedResponseIndex = 0;

        if (dialogueNode.responses.length > 0) {
            dialogueNode.responses.forEach((response, index) => {
                const responseEl = document.createElement('div');
                responseEl.className = 'dialogue-response';
                responseEl.textContent = response.text;
                if (index === this.selectedResponseIndex) {
                    responseEl.classList.add('selected');
                }
                this.responsesContainer.appendChild(responseEl);
            });
        }
    }

    destroy() {
        if (this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
        }
    }
}

