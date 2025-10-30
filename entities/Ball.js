import * as THREE from 'three';
import { EmotionalState } from '../utils/EmotionalState.js';
import { EmotionalStateMachine } from '../utils/EmotionalStateMachine.js';
import { NPCBehavior } from '../utils/NPCBehavior.js';
import { createPlasmaShaderMaterial } from '../shaders/PlasmaShader.js';

export class Ball {
    constructor(scene, position = new THREE.Vector3(0, 0.5, 0), size = 0.5) {
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
        this.auraMesh = null;
        this.shaderMaterial = null;
        this.createMesh();
        
        // AI behavior (for NPCs)
        this.isNPC = false;
        this.behavior = null;
    }

    createMesh() {
        const geometry = new THREE.SphereGeometry(this.size, 32, 32);
        this.shaderMaterial = createPlasmaShaderMaterial(this.emotionalState);

        this.mesh = new THREE.Mesh(geometry, this.shaderMaterial);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
        
        // Aura mesh
        const auraGeometry = new THREE.SphereGeometry(this.size * 2.5, 32, 32);
        const auraMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        this.auraMesh = new THREE.Mesh(auraGeometry, auraMaterial);
        this.scene.add(this.auraMesh);


        this.updateMeshPosition();
    }

    update(deltaTime) {
        // Update emotional state
        this.emotionalState.update(deltaTime);
        
        // Update state machine
        this.stateMachine.update(deltaTime);

        // Update NPC behavior if applicable
        if (this.isNPC && this.behavior) {
            this.behavior.update(this, deltaTime);
            this.updatePhysics(deltaTime);
        }

        // Update mesh
        this.updateMeshPosition();
        this.updateShaderUniforms(deltaTime);
        this.updateAura(deltaTime);
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
        if (this.auraMesh) {
            this.auraMesh.position.copy(this.position);
        }
    }

    updateShaderUniforms(deltaTime) {
        if (this.shaderMaterial && this.shaderMaterial.uniforms) {
            this.shaderMaterial.uniforms.time.value += deltaTime;
            this.shaderMaterial.uniforms.valence.value = this.emotionalState.valence;
            this.shaderMaterial.uniforms.arousal.value = this.emotionalState.arousal;
            this.shaderMaterial.uniforms.connectedness.value = this.emotionalState.socialConnectedness;
        }
    }

    updateAura(deltaTime) {
        if (this.auraMesh) {
            const emotionalColor = this.emotionalState.getColor();
            const color = new THREE.Color();
            color.setHSL(emotionalColor.h / 360, emotionalColor.s / 100, 0.7);
            
            this.auraMesh.material.color = color;

            const baseOpacity = 0.05;
            const arousalBonus = Math.abs(this.emotionalState.arousal) * 0.1;
            const connectednessBonus = Math.max(0, this.emotionalState.socialConnectedness) * 0.2;
            this.auraMesh.material.opacity = baseOpacity + arousalBonus + connectednessBonus;

            const baseScale = 2.5;
            const connectednessScale = Math.max(0, this.emotionalState.socialConnectedness) * 1.5;
            const arousalScale = Math.abs(this.emotionalState.arousal) * 0.5;
            const newScale = baseScale + connectednessScale + arousalScale;
            this.auraMesh.scale.set(newScale, newScale, newScale);
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
            if (this.shaderMaterial) {
                this.shaderMaterial.dispose();
            }
        }
        if (this.auraMesh) {
            this.scene.remove(this.auraMesh);
            this.auraMesh.geometry.dispose();
            this.auraMesh.material.dispose();
        }
    }
}