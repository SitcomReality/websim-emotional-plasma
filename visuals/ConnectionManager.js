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

        this.geometry = new THREE.TubeGeometry(curve, 8, 0.05, 8, false);
        this.material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.scene.add(this.mesh);
    }

    update() {
        // Update curve points
        const points = [this.ballA.position.clone()];

        // Add a midpoint for some curve
        const midPoint = new THREE.Vector3().lerpVectors(this.ballA.position, this.ballB.position, 0.5);
        const wobble = (Math.sin(Date.now() * 0.002) + Math.cos(Date.now() * 0.0015)) * 0.5;
        midPoint.y += wobble;
        points.push(midPoint);

        points.push(this.ballB.position.clone());

        const curve = new THREE.CatmullRomCurve3(points);

        // Update geometry
        this.mesh.geometry.dispose();
        this.mesh.geometry = new THREE.TubeGeometry(curve, 8, 0.05, 8, false);

        // Update material based on combined emotional state
        const combinedValence = (this.ballA.emotionalState.valence + this.ballB.emotionalState.valence) / 2;
        const color = new THREE.Color();
        const hue = combinedValence > 0
            ? 30 + (combinedValence * 30)
            : 240 - (combinedValence * 60);
        color.setHSL(hue / 360, 0.8, 0.6);
        this.material.color = color;

        this.material.opacity = Math.max(0, (this.ballA.emotionalState.socialConnectedness + this.ballB.emotionalState.socialConnectedness) / 2 - 0.5);
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