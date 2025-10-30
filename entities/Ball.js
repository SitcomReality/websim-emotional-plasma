import * as THREE from 'three';
import { EmotionalState } from '../utils/EmotionalState.js';
import { EmotionalStateMachine } from '../utils/EmotionalStateMachine.js';

export class Ball {
    constructor(scene, position = new THREE.Vector3(0, 0, 0), size = 0.5) {
        this.scene = scene;
        this.position = position.clone();
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.size = size;
        this.speed = 5;

        // Emotional state (core attributes)
        this.emotionalState = new EmotionalState();
        this.stateMachine = new EmotionalStateMachine(this.emotionalState);

        // Physics
        this.mass = 1;
        this.friction = 0.85;

        this.mesh = null;
        this.createMesh();
    }

    createMesh() {
        const geometry = new THREE.SphereGeometry(this.size, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.3,
            roughness: 0.4,
            emissive: 0x222222
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);

        this.updateMeshPosition();
    }

    update(deltaTime) {
        // Update emotional state
        this.emotionalState.update(deltaTime);
        
        // Update state machine
        this.stateMachine.update(deltaTime);

        // Update mesh
        this.updateMeshPosition();
        this.updateMeshColor();
    }

    applyForce(force) {
        const acceleration = force.clone().divideScalar(this.mass);
        this.acceleration.add(acceleration);
    }

    updatePhysics(deltaTime) {
        // Apply acceleration to velocity
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));

        // Apply friction
        this.velocity.multiplyScalar(this.friction);

        // Apply velocity to position
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // Reset acceleration
        this.acceleration.multiplyScalar(0);
    }

    updateMeshPosition() {
        this.mesh.position.copy(this.position);
    }

    updateMeshColor() {
        const colorData = this.emotionalState.getColor();
        const hsl = `hsl(${colorData.h}, ${colorData.s}%, ${colorData.l}%)`;

        if (this.mesh.material.color) {
            this.mesh.material.color.setStyle(hsl);
        }
    }

    setEmotionalState(valence, arousal, connectedness) {
        this.emotionalState.valence = THREE.MathUtils.clamp(valence, -1, 1);
        this.emotionalState.arousal = THREE.MathUtils.clamp(arousal, -1, 1);
        this.emotionalState.socialConnectedness = THREE.MathUtils.clamp(connectedness, -1, 1);
    }

    getEmotionalState() {
        return {
            valence: this.emotionalState.valence,
            arousal: this.emotionalState.arousal,
            connectedness: this.emotionalState.socialConnectedness
        };
    }

    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
}