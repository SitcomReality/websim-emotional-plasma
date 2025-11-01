import * as THREE from 'three';

export class StaticProp {
    constructor(scene, position, size, properties = {}) {
        this.scene = scene;

        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshStandardMaterial({
            color: properties.color ? parseInt(properties.color) : 0x555555,
            roughness: properties.roughness || 0.8,
            metalness: properties.metalness || 0.2,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.scene.add(this.mesh);
    }

    // Empty update to prevent errors in game loop
    update() {}

    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
}