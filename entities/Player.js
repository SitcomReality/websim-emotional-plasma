import * as THREE from 'three';
import { EmotionalState } from '../utils/EmotionalState.js';

export class Player {
    constructor(scene) {
        this.scene = scene;
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.speed = 5;
        
        this.emotionalState = new EmotionalState();
        
        this.createMesh();
        this.updateUI();
    }
    
    createMesh() {
        // Create the core ball
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.3,
            roughness: 0.4
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
    }
    
    update(deltaTime, inputManager) {
        this.handleInput(deltaTime, inputManager);
        this.updatePosition(deltaTime);
        this.emotionalState.update(deltaTime);
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
            this.velocity.copy(moveVector.multiplyScalar(this.speed));
        } else {
            this.velocity.multiplyScalar(0.9); // Friction
        }
    }
    
    updatePosition(deltaTime) {
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        this.mesh.position.copy(this.position);
    }
    
    updateUI() {
        const valenceBar = document.getElementById('valence-bar');
        const arousalBar = document.getElementById('arousal-bar');
        const connectionBar = document.getElementById('connection-bar');
        
        // Map from [-1, 1] to [0, 100]
        const valencePercent = ((this.emotionalState.valence + 1) / 2) * 100;
        const arousalPercent = ((this.emotionalState.arousal + 1) / 2) * 100;
        const connectionPercent = ((this.emotionalState.socialConnectedness + 1) / 2) * 100;
        
        valenceBar.style.width = `${valencePercent}%`;
        arousalBar.style.width = `${arousalPercent}%`;
        connectionBar.style.width = `${connectionPercent}%`;
    }
}

