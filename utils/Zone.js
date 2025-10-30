import * as THREE from 'three';

export class Zone {
    constructor(position, radius, config = {}) {
        this.position = position.clone();
        this.radius = radius;

        // Effect configuration
        this.valenceEffect = config.valenceEffect || 0;
        this.arousalEffect = config.arousalEffect || 0;
        this.connectednessEffect = config.connectednessEffect || 0;
        this.forceMultiplier = config.forceMultiplier || 0; // Push/pull force

        // Zone properties
        this.name = config.name || 'Zone';
        this.color = config.color || 0x888888;
        this.isActive = config.isActive !== false;
        this.decayRate = config.decayRate || 1; // How quickly effects fade

        // Mesh for visualization
        this.mesh = null;
        this.createMesh();
    }

    createMesh() {
        const geometry = new THREE.SphereGeometry(this.radius, 16, 16);
        const material = new THREE.MeshStandardMaterial({
            color: this.color,
            metalness: 0.1,
            roughness: 0.7,
            opacity: 0.15,
            transparent: true,
            emissive: this.color,
            emissiveIntensity: 0.2
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.castShadow = false;
        this.mesh.receiveShadow = false;
    }

    addToScene(scene) {
        if (this.mesh) {
            scene.add(this.mesh);
        }
    }

    removeFromScene(scene) {
        if (this.mesh) {
            scene.remove(this.mesh);
        }
    }

    isPointInZone(point) {
        return this.position.distanceTo(point) <= this.radius;
    }

    getDistanceToPoint(point) {
        return Math.max(0, this.position.distanceTo(point) - this.radius);
    }

    // Calculate effect strength based on distance (stronger at center)
    getEffectStrength(point) {
        const distance = this.position.distanceTo(point);
        if (distance > this.radius) return 0;

        // Linear falloff from center
        return 1 - (distance / this.radius);
    }

    applyEffect(ball, deltaTime) {
        if (!this.isActive) return;

        const strength = this.getEffectStrength(ball.position);
        if (strength <= 0) return;

        // Apply emotional effects
        const valenceChange = this.valenceEffect * strength * deltaTime;
        const arousalChange = this.arousalEffect * strength * deltaTime;
        const connectednessChange = this.connectednessEffect * strength * deltaTime;

        ball.emotionalState.modify(valenceChange, arousalChange, connectednessChange);

        // Apply force (push/pull from center)
        if (Math.abs(this.forceMultiplier) > 0) {
            const direction = ball.position.clone().sub(this.position).normalize();
            const force = direction.multiplyScalar(this.forceMultiplier * strength);
            ball.applyForce(force);
        }
    }

    destroy(scene) {
        this.removeFromScene(scene);
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
}