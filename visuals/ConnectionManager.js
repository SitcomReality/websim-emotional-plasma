import * as THREE from 'three';
import { createTendrilMaterial } from '../shaders/TendrilShader.js';

class ConnectionTendril {
    constructor(ballA, ballB, scene) {
        this.ballA = ballA;
        this.ballB = ballB;
        this.scene = scene;
        this.isActive = true;

        const curve = new THREE.CatmullRomCurve3([
            this.ballA.position,
            this.ballB.position
        ]);

        this.geometry = new THREE.TubeGeometry(curve, 16, 0.08, 8, false);
        this.material = createTendrilMaterial();

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);
        this.connectionStartTime = Date.now();
    }

    update() {
        // Update uniforms
        this.material.uniforms.time.value += 0.016; // Approx deltaTime

        // Update curve with dynamic wobble
        const points = [this.ballA.position.clone()];
        const numMidpoints = 10;
        
        for (let i = 0; i < numMidpoints; i++) {
            const t = i / (numMidpoints + 1);
            const midPoint = new THREE.Vector3().lerpVectors(this.ballA.position, this.ballB.position, t);

            // Dynamic wobble based on emotional states
            const wobbleAmount = (Math.abs(this.ballA.emotionalState.arousal) + Math.abs(this.ballB.emotionalState.arousal)) * 0.3;
            const timeOffset = Date.now() * 0.001 * (1 + i);
            midPoint.y += (Math.sin(timeOffset) * wobbleAmount);
            midPoint.x += (Math.cos(timeOffset * 1.3) * wobbleAmount * 0.5);

            points.push(midPoint);
        }

        points.push(this.ballB.position.clone());

        const curve = new THREE.CatmullRomCurve3(points);

        // Update geometry
        this.mesh.geometry.dispose();
        this.mesh.geometry = new THREE.TubeGeometry(curve, 16, 0.08, 8, false);

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
        const growDuration = 500; // ms
        const timeSinceCreation = Date.now() - this.connectionStartTime;
        this.material.uniforms.connectionStrength.value = Math.min(1.0, timeSinceCreation / growDuration);
    }

    destroy() {
        this.isActive = false;
        this.scene.remove(this.mesh);
        this.geometry.dispose();
        this.material.dispose();
    }
}

export class ConnectionManager {
    constructor(scene) {
        this.scene = scene;
        this.connections = new Map(); // Use a map to store connections, key is pair of IDs
    }

    getKey(ballA, ballB) {
        return ballA.mesh.uuid < ballB.mesh.uuid
            ? `${ballA.mesh.uuid}-${ballB.mesh.uuid}`
            : `${ballB.mesh.uuid}-${ballA.mesh.uuid}`;
    }

    update(entities) {
        const checkedPairs = new Set();
        const activeKeys = new Set();

        const connectionThreshold = 0.3;
        const connectionDistance = 20;

        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const ballA = entities[i];
                const ballB = entities[j];
                const key = this.getKey(ballA, ballB);
                checkedPairs.add(key);

                const canConnect =
                    ballA.emotionalState.socialConnectedness > connectionThreshold &&
                    ballB.emotionalState.socialConnectedness > connectionThreshold &&
                    ballA.position.distanceTo(ballB.position) < connectionDistance;

                if (canConnect) {
                    activeKeys.add(key);
                    if (!this.connections.has(key)) {
                        // Create new connection
                        const tendril = new ConnectionTendril(ballA, ballB, this.scene);
                        this.connections.set(key, tendril);
                    } else {
                        // Update existing connection
                        this.connections.get(key).update();
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