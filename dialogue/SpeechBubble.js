import * as THREE from 'three';

export class SpeechBubble {
    constructor(text, anchor, camera) {
        this.anchor = anchor; // The Ball object to follow
        this.camera = camera;
        this.text = text;
        this.element = this.createElement();
        this.lifespan = 3000; // 3 seconds
        this.createdAt = Date.now();
        
        const gameContainer = document.getElementById('game-container');
        gameContainer.appendChild(this.element);
    }

    createElement() {
        const div = document.createElement('div');
        div.className = 'speech-bubble';
        div.textContent = this.text;
        return div;
    }

    update() {
        if (Date.now() - this.createdAt > this.lifespan) {
            this.destroy();
            return false; // indicate it should be removed
        }

        const screenPos = this.getScreenPosition();
        if (screenPos.z > 1) { // Behind camera, so hide it
            this.element.style.display = 'none';
        } else {
            this.element.style.display = 'block';
            this.element.style.left = `${screenPos.x}px`;
            this.element.style.top = `${screenPos.y}px`;
        }
        
        // Fade out
        const timeRemaining = this.lifespan - (Date.now() - this.createdAt);
        if (timeRemaining < 500) {
            this.element.style.opacity = Math.max(0, timeRemaining / 500);
        }

        return true; // still active
    }

    getScreenPosition() {
        const vector = new THREE.Vector3();
        const widthHalf = window.innerWidth / 2;
        const heightHalf = window.innerHeight / 2;

        this.anchor.mesh.updateMatrixWorld();
        // Position bubble above the ball
        vector.setFromMatrixPosition(this.anchor.mesh.matrixWorld).add(new THREE.Vector3(0, this.anchor.size * 2, 0));
        vector.project(this.camera);

        vector.x = (vector.x * widthHalf) + widthHalf;
        vector.y = -(vector.y * heightHalf) + heightHalf;

        return vector;
    }

    destroy() {
        if (this.element.parentElement) {
            this.element.parentElement.removeChild(this.element);
        }
    }
}