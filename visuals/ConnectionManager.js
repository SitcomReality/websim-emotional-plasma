import * as THREE from 'three';
import { createTendrilMaterial } from '../shaders/TendrilShader.js';

// TUNABLE CONSTANTS: Modify these to adjust visual representation of tendrils
export const TendrilVisualConfig = {
    // Geometry
    tubeRadius: 0.15,           // Increase to 0.3 for thicker, more visible tendrils
    tubeSegments: 16,
    radialSegments: 8,
    curvePoints: 10,
    
    // Visibility
    baseOpacity: 0.9,           // Try 1.0 for fully opaque tendrils
    centerPeakOpacity: 1.0,     // Opacity at connection center
    fadeExponent: 2.0,          // Lower = softer edges, higher = sharper falloff
    
    // Animation
    flowSpeed: 1.5,             // Higher = faster flow animation
    wobbleAmount: 0.3,          // Increase for more dramatic wobble
    
    // Growth
    growthDuration: 500,        // Milliseconds to fully grow (lower = faster)
    
    // Effects
    turbulenceStrength: 1.0,    // Increase for more chaotic conflicts
    harmonyCohesion: 0.5,       // Higher = more coherent harmonious flows
    drainingFlow: 2.0,          // Intensity of draining effect
    conflictFlicker: 10.0,      // Frequency of flicker in conflicts
    colorIntensity: 1.2,        // Boost colors (try 2.0 for very vibrant)
    
    // Connection threshold
    connectionThreshold: 0.3,
    connectionDistance: 20
};

class ConnectionTendril {
    constructor(ballA, ballB, scene, config = TendrilVisualConfig) {
        this.ballA = ballA;
        this.ballB = ballB;
        this.scene = scene;
        this.config = config;
        this.isActive = true;

        const curve = new THREE.CatmullRomCurve3([
            this.ballA.position,
            this.ballB.position
        ]);

        this.geometry = new THREE.TubeGeometry(
            curve,
            this.config.tubeSegments,
            this.config.tubeRadius,
            this.config.radialSegments,
            false
        );
        this.material = createTendrilMaterial();
        this.material.uniforms.baseOpacity.value = this.config.baseOpacity;
        this.material.uniforms.centerPeakOpacity.value = this.config.centerPeakOpacity;
        this.material.uniforms.fadeExponent.value = this.config.fadeExponent;
        this.material.uniforms.flowSpeed.value = this.config.flowSpeed;
        this.material.uniforms.harmonyCohesion.value = this.config.harmonyCohesion;
        this.material.uniforms.drainingFlow.value = this.config.drainingFlow;
        this.material.uniforms.conflictFlicker.value = this.config.conflictFlicker;
        this.material.uniforms.colorIntensity.value = this.config.colorIntensity;

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);
        this.connectionStartTime = Date.now();
    }

    update() {
        // Update uniforms
        this.material.uniforms.time.value += 0.016; // Approx deltaTime

        // Update curve with dynamic wobble
        const points = [this.ballA.position.clone()];
        
        for (let i = 0; i < this.config.curvePoints; i++) {
            const t = i / (this.config.curvePoints + 1);
            const midPoint = new THREE.Vector3().lerpVectors(this.ballA.position, this.ballB.position, t);

            // Dynamic wobble based on emotional states
            const wobbleAmount = (Math.abs(this.ballA.emotionalState.arousal) + Math.abs(this.ballB.emotionalState.arousal)) * this.config.wobbleAmount;
            const timeOffset = Date.now() * 0.001 * (1 + i);
            midPoint.y += (Math.sin(timeOffset) * wobbleAmount);
            midPoint.x += (Math.cos(timeOffset * 1.3) * wobbleAmount * 0.5);

            points.push(midPoint);
        }

        points.push(this.ballB.position.clone());

        const curve = new THREE.CatmullRomCurve3(points);

        // Update geometry
        this.mesh.geometry.dispose();
        this.mesh.geometry = new THREE.TubeGeometry(
            curve,
            this.config.tubeSegments,
            this.config.tubeRadius,
            this.config.radialSegments,
            false
        );

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
    constructor(scene, config = TendrilVisualConfig) {
        this.scene = scene;
        this.config = config;
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

        const connectionThreshold = this.config.connectionThreshold;
        const connectionDistance = this.config.connectionDistance;

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
                        const tendril = new ConnectionTendril(ballA, ballB, this.scene, this.config);
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