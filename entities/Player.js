import * as THREE from 'three';
import { Ball } from './Ball.js';

export class Player extends Ball {
    constructor(scene, camera) {
        super(scene, camera, new THREE.Vector3(0, 0.5, 0), 0.5);
        this.speed = 50;
        this.isPlayer = true;
        
        // Set initial emotional state (slightly positive, neutral arousal, connected)
        this.emotionalState.valence = 0.3;
        this.emotionalState.arousal = 0;
        this.emotionalState.socialConnectedness = 0.2;
    }
    
    update(deltaTime, inputManager) {
        this.handleInput(deltaTime, inputManager);
        this.updatePhysics(deltaTime);
        
        // Call parent update
        super.update(deltaTime);
        
        // Update UI
        this.updateUI();
    }
    
    handleInput(deltaTime, inputManager) {
        const moveVector = new THREE.Vector3();
        
        if (inputManager.keys.w) moveVector.z -= 1;
        if (inputManager.keys.s) moveVector.z += 1;
        if (inputManager.keys.a) moveVector.x -= 1;
        if (inputManager.keys.d) moveVector.x += 1;
        
        if (moveVector.length() > 0) {
            moveVector.normalize();
            this.applyForce(moveVector.multiplyScalar(this.speed));
        }
    }
    
    updateUI() {
        const valenceBar = document.getElementById('valence-bar');
        const arousalBar = document.getElementById('arousal-bar');
        const connectionBar = document.getElementById('connection-bar');
        
        if (!valenceBar || !arousalBar || !connectionBar) return;
        
        // Map from [-1, 1] to [0, 100]
        const valencePercent = ((this.emotionalState.valence + 1) / 2) * 100;
        const arousalPercent = ((this.emotionalState.arousal + 1) / 2) * 100;
        const connectionPercent = ((this.emotionalState.socialConnectedness + 1) / 2) * 100;
        
        valenceBar.style.width = `${valencePercent}%`;
        arousalBar.style.width = `${arousalPercent}%`;
        connectionBar.style.width = `${connectionPercent}%`;
        
        // Add state display
        const stateInfo = this.stateMachine.getStateInfo();
        const stateElement = document.getElementById('emotional-state-label');
        if (stateElement) {
            stateElement.textContent = stateInfo.currentState ? stateInfo.currentState.toUpperCase() : 'NEUTRAL';
        }
    }
}