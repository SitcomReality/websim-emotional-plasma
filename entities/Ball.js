import * as THREE from 'three';
import { EmotionalState } from '../utils/EmotionalState.js';
import { EmotionalStateMachine } from '../utils/EmotionalStateMachine.js';
import { NPCBehavior } from '../utils/NPCBehavior.js';
import { createPlasmaShaderMaterial } from '../shaders/PlasmaShader.js';

export class Ball {
    constructor(scene, camera, position = new THREE.Vector3(0, 0.5, 0), size = 0.5) {
        this.scene = scene;
        this.camera = camera;
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
        this.auraMesh = null; // This will now be an invisible hitbox
        this.plasmaBillboard = null;
        this.shaderMaterial = null;
        this.ballShaderMaterial = null;
        this.createMesh();
        
        // AI behavior (for NPCs)
        this.isNPC = false;
        this.behavior = null;
        
        // Nearby balls for plasma interaction
        this.nearbyBalls = [];
    }

    createMesh() {
        const geometry = new THREE.SphereGeometry(this.size, 32, 32);
        
        // Give the ball itself plasma
        this.ballShaderMaterial = createPlasmaShaderMaterial(this.emotionalState);
        this.ballShaderMaterial.transparent = false;
        this.ballShaderMaterial.depthWrite = true;
        this.ballShaderMaterial.blending = THREE.NormalBlending;
        
        this.mesh = new THREE.Mesh(geometry, this.ballShaderMaterial);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);
        
        // Aura mesh (now an invisible hitbox)
        // doubled radius: previously size * 2.5 -> now size * 5
        const auraGeometry = new THREE.SphereGeometry(this.size * 5.0, 32, 32);
        const auraMaterial = new THREE.MeshBasicMaterial({
            visible: false
        });
        this.auraMesh = new THREE.Mesh(auraGeometry, auraMaterial);
        this.scene.add(this.auraMesh);

        // Plasma billboard
        // Match doubled aura diameter: radius = size * 5 -> diameter = size * 10
        const plasmaSize = this.size * 10.0; // Diameter of doubled aura
        const billboardGeometry = new THREE.PlaneGeometry(plasmaSize, plasmaSize);
        this.shaderMaterial = createPlasmaShaderMaterial(this.emotionalState, true); // true = billboard mode
        this.plasmaBillboard = new THREE.Mesh(billboardGeometry, this.shaderMaterial);
        this.scene.add(this.plasmaBillboard);


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
        this.updateAuraAndBillboard(deltaTime);
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
        if (this.plasmaBillboard) {
            this.plasmaBillboard.position.copy(this.position);
        }
    }

    updateShaderUniforms(deltaTime) {
        // Update ball shader
        if (this.ballShaderMaterial && this.ballShaderMaterial.uniforms) {
            this.ballShaderMaterial.uniforms.time.value += deltaTime;
            this.ballShaderMaterial.uniforms.valence.value = this.emotionalState.valence;
            this.ballShaderMaterial.uniforms.arousal.value = this.emotionalState.arousal;
            this.ballShaderMaterial.uniforms.connectedness.value = this.emotionalState.socialConnectedness;
        }
        
        // Update billboard shader
        if (this.shaderMaterial && this.shaderMaterial.uniforms) {
            this.shaderMaterial.uniforms.time.value += deltaTime;
            this.shaderMaterial.uniforms.valence.value = this.emotionalState.valence;
            this.shaderMaterial.uniforms.arousal.value = this.emotionalState.arousal;
            this.shaderMaterial.uniforms.connectedness.value = this.emotionalState.socialConnectedness;
            
            // Update world position
            this.shaderMaterial.uniforms.ballWorldPos.value.copy(this.position);
            
            // Update nearby balls positions
            const maxNearby = 4;
            const nearbyPositions = this.nearbyBalls.slice(0, maxNearby);
            
            for (let i = 0; i < maxNearby; i++) {
                if (i < nearbyPositions.length) {
                    this.shaderMaterial.uniforms.nearbyBalls.value[i].copy(nearbyPositions[i].position);
                } else {
                    // Set far away if slot not used
                    this.shaderMaterial.uniforms.nearbyBalls.value[i].set(9999, 9999, 9999);
                }
            }
            
            this.shaderMaterial.uniforms.nearbyBallCount.value = nearbyPositions.length;
        }
    }

    updateAuraAndBillboard(deltaTime) {
        if (this.auraMesh && this.plasmaBillboard) {
            // baseScale reflects the radius multiplier used to construct the aura geometry (now doubled)
            const baseScale = 5.0;
            const connectednessScale = Math.max(0, this.emotionalState.socialConnectedness) * 1.5;
            const arousalScale = Math.abs(this.emotionalState.arousal) * 0.5;
            const newScale = baseScale + connectednessScale + arousalScale;

            // Plane geometry was created to match the doubled diameter, so normalize by the baseScale
            const finalScale = newScale / baseScale; // Plane scale is relative to its geometry size
            
            this.auraMesh.scale.set(finalScale, finalScale, finalScale);
            this.plasmaBillboard.scale.set(finalScale, finalScale, finalScale);
            
            // Billboard logic
            this.plasmaBillboard.quaternion.copy(this.camera.quaternion);
        }
    }
    
    updateNearbyBalls(allBalls) {
        // Find nearby balls within interaction range
        this.nearbyBalls = [];
        const maxDistance = 10; // Maximum distance to consider
        
        for (const otherBall of allBalls) {
            if (otherBall === this) continue;
            
            const distance = this.position.distanceTo(otherBall.position);
            if (distance < maxDistance) {
                this.nearbyBalls.push(otherBall);
            }
        }
        
        // Sort by distance, closest first
        this.nearbyBalls.sort((a, b) => {
            const distA = this.position.distanceTo(a.position);
            const distB = this.position.distanceTo(b.position);
            return distA - distB;
        });
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
            if (this.ballShaderMaterial) {
                this.ballShaderMaterial.dispose();
            }
        }
        if (this.shaderMaterial) {
            this.shaderMaterial.dispose();
        }
        if (this.auraMesh) {
            this.scene.remove(this.auraMesh);
            this.auraMesh.geometry.dispose();
            this.auraMesh.material.dispose();
        }
        if (this.plasmaBillboard) {
            this.scene.remove(this.plasmaBillboard);
            this.plasmaBillboard.geometry.dispose();
        }
    }
}