import * as THREE from 'three';
import { createTendrilMaterial } from '../shaders/TendrilShader.js';
import { TendrilConstants } from '../shaders/TendrilConstants.js';

class ConnectionTendril {
    constructor(ballA, ballB, scene, config = TendrilConstants) {
        this.ballA = ballA;
        this.ballB = ballB;
        this.scene = scene;
        this.config = config;
        this.isActive = true;
        this.distance = this.ballA.position.distanceTo(this.ballB.position);

        const distance = this.distance;
        this.geometry = new THREE.PlaneGeometry(this.config.tendrilWidth, 1, 1, 1);

        this.material = createTendrilMaterial();
        // Apply tunable constants to material uniforms to make testing easier
        this.material.uniforms.baseOpacity.value = this.config.baseOpacity;
        this.material.uniforms.centerPeakOpacity.value = this.config.centerPeakOpacity;
        this.material.uniforms.fadeExponent.value = this.config.fadeExponent;
        this.material.uniforms.flowSpeed.value = this.config.flowSpeed;
        this.material.uniforms.harmonyCohesion.value = this.config.harmonyCohesion;
        this.material.uniforms.drainingFlow.value = this.config.drainingFlow;
        this.material.uniforms.conflictFlicker.value = this.config.conflictFlicker;
        this.material.uniforms.colorIntensity.value = this.config.colorIntensity;
        this.material.uniforms.noiseScale.value = this.config.noiseScale;
        this.material.uniforms.edgeSoftness.value = this.config.edgeSoftness;

        // Expose peak controls so they can be tuned from TendrilConstants if desired
        if (this.config.peakThreshold !== undefined) {
            this.material.uniforms.peakThreshold.value = this.config.peakThreshold;
        } else {
            this.material.uniforms.peakThreshold.value = 0.15;
        }
        if (this.config.peakSoftness !== undefined) {
            this.material.uniforms.peakSoftness.value = this.config.peakSoftness;
        } else {
            this.material.uniforms.peakSoftness.value = 0.18;
        }

        // Distance-based strength: stronger when closer
        this.material.uniforms.distanceStrength.value = 1.0;

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        // Ensure the plane does not occlude and sits as an additive transparent layer
        this.mesh.renderOrder = 1;
        this.scene.add(this.mesh);
        this.connectionStartTime = Date.now();
    }

    update(camera) {
        // Update uniforms
        this.material.uniforms.time.value += 0.016; // Approx deltaTime

        const posA = this.ballA.position;
        const posB = this.ballB.position;

        // 1. Position at midpoint
        const midpoint = new THREE.Vector3().addVectors(posA, posB).multiplyScalar(0.5);
        this.mesh.position.copy(midpoint);

        // 2. Scale to match distance
        this.distance = posA.distanceTo(posB);
        this.mesh.scale.set(this.config.tendrilWidth, this.distance, 1);

        // 3. Orient to face camera and align with balls
        const up = new THREE.Vector3(0, 1, 0);
        const lookAt = new THREE.Vector3().subVectors(camera.position, this.mesh.position).normalize();
        
        const direction = new THREE.Vector3().subVectors(posB, posA).normalize();
        this.mesh.up.copy(direction);
        this.mesh.lookAt(this.mesh.position.clone().add(lookAt));

        // Distance-based strength: closer = stronger, fade out starting at 50% of max distance
        const maxDistance = 10.0; // Match connectionDistance in ConnectionManager
        const fadeStartDistance = maxDistance * 0.5; // Start fading at 50% of max distance
        const fadeRange = maxDistance - fadeStartDistance;
        const distanceBeyondFadeStart = Math.max(0, this.distance - fadeStartDistance);
        const distanceRatio = Math.max(0, 1.0 - (distanceBeyondFadeStart / fadeRange));
        this.material.uniforms.distanceStrength.value = distanceRatio;

        // Update material based on combined emotional state
        const colorA = new THREE.Color().setHSL(this.ballA.emotionalState.getColor().h / 360, 0.9, 0.6);
        const colorB = new THREE.Color().setHSL(this.ballB.emotionalState.getColor().h / 360, 0.9, 0.6);
        this.material.uniforms.colorA.value = colorA;
        this.material.uniforms.colorB.value = colorB;

        // Determine interaction type
        const valenceA = this.ballA.emotionalState.valence;
        const valenceB = this.ballB.emotionalState.valence;
        const arousalA = this.ballA.emotionalState.arousal;
        const arousalB = this.ballB.emotionalState.arousal;

        if (Math.sign(valenceA) === Math.sign(valenceB) && Math.abs(valenceA - valenceB) < 0.8) {
            this.material.uniforms.interactionType.value = 0.0; // Harmonious
            this.material.uniforms.turbulence.value = 0.0;
        } else if (Math.abs(arousalA) > Math.abs(arousalB) + 0.3) {
            this.material.uniforms.interactionType.value = 1.0; // Draining A->B
            this.material.uniforms.turbulence.value = 0.5;
        } else if (Math.abs(arousalB) > Math.abs(arousalA) + 0.3) {
            // Swap colors for B->A drain
            this.material.uniforms.colorA.value = colorB;
            this.material.uniforms.colorB.value = colorA;
            this.material.uniforms.interactionType.value = 1.0; // Draining B->A
            this.material.uniforms.turbulence.value = 0.5;
        } else {
            this.material.uniforms.interactionType.value = 2.0; // Conflicting
            this.material.uniforms.turbulence.value = 1.0;
        }

        // Animate growth
        const timeSinceCreation = Date.now() - this.connectionStartTime;
        this.material.uniforms.connectionStrength.value = Math.min(1.0, timeSinceCreation / this.config.growthDuration);
    }

    destroy() {
        this.isActive = false;
        this.scene.remove(this.mesh);
        this.geometry.dispose();
        this.material.dispose();
    }
}

export class ConnectionManager {
    constructor(scene, config = TendrilConstants) {
        this.scene = scene;
        this.config = config;
        this.connections = new Map(); // Use a map to store connections, key is pair of IDs
    }

    getKey(ballA, ballB) {
        return ballA.mesh.uuid < ballB.mesh.uuid
            ? `${ballA.mesh.uuid}-${ballB.mesh.uuid}`
            : `${ballB.mesh.uuid}-${ballA.mesh.uuid}`;
    }

    update(entities, camera) {
        const checkedPairs = new Set();
        const activeKeys = new Set();

        const connectionDistance = this.config.connectionDistance;

        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const ballA = entities[i];
                const ballB = entities[j];
                const key = this.getKey(ballA, ballB);
                checkedPairs.add(key);

                const distance = ballA.position.distanceTo(ballB.position);
                const canConnect = distance < connectionDistance;

                if (canConnect) {
                    activeKeys.add(key);
                    if (!this.connections.has(key)) {
                        // Create new connection
                        const tendril = new ConnectionTendril(ballA, ballB, this.scene, this.config);
                        this.connections.set(key, tendril);
                    } else {
                        // Update existing connection
                        this.connections.get(key).update(camera);
                    }
                }
            }
        }

        // Clean up old/inactive connections
        for (const [key, connection] of this.connections.entries()) {
            if (!activeKeys.has(key)) {
                connection.destroy();
                this.connections.delete(key);
            }
        }
    }
}