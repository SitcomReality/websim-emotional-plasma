import * as THREE from 'three';

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
        this.material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);
    }

    update() {
        // Update curve with dynamic wobble
        const points = [this.ballA.position.clone()];

        // Add multiple midpoints for smoother curve
        const numMidpoints = 3;
        for (let i = 1; i <= numMidpoints; i++) {
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
        const combinedValence = (this.ballA.emotionalState.valence + this.ballB.emotionalState.valence) / 2;
        const combinedArousal = (Math.abs(this.ballA.emotionalState.arousal) + Math.abs(this.ballB.emotionalState.arousal)) / 2;

        const color = new THREE.Color();
        const hue = combinedValence > 0
            ? 30 + (combinedValence * 30)
            : 240 - (combinedValence * 60);
        color.setHSL(hue / 360, 0.9, 0.6);
        this.material.color = color;

        // Opacity based on connection strength and arousal
        const distance = this.ballA.position.distanceTo(this.ballB.position);
        const maxDistance = (this.ballA.size + this.ballB.size) * 10; // Aura diameter
        const proximityFactor = 1 - (distance / maxDistance);
        this.material.opacity = proximityFactor * 0.8 * (0.5 + combinedArousal * 0.5);
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
        this.connections = new Map();
    }

    getKey(ballA, ballB) {
        return ballA.mesh.uuid < ballB.mesh.uuid
            ? `${ballA.mesh.uuid}-${ballB.mesh.uuid}`
            : `${ballB.mesh.uuid}-${ballA.mesh.uuid}`;
    }

    update(entities) {
        const activeKeys = new Set();

        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const ballA = entities[i];
                const ballB = entities[j];
                const key = this.getKey(ballA, ballB);

                // Use aura radius for overlap detection
                const auraRadiusA = ballA.size * 5.0;
                const auraRadiusB = ballB.size * 5.0;
                const distance = ballA.position.distanceTo(ballB.position);

                // Check if aura spheres overlap
                const aurasOverlap = distance < (auraRadiusA + auraRadiusB);

                if (aurasOverlap) {
                    activeKeys.add(key);
                    if (!this.connections.has(key)) {
                        // Create new connection tendril
                        const tendril = new ConnectionTendril(ballA, ballB, this.scene);
                        this.connections.set(key, tendril);
                    } else {
                        // Update existing connection
                        this.connections.get(key).update();
                    }
                }
            }
        }

        // Clean up inactive connections
        for (const [key, connection] of this.connections.entries()) {
            if (!activeKeys.has(key)) {
                connection.destroy();
                this.connections.delete(key);
            }
        }
    }
}