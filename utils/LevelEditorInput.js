import * as THREE from 'three';

export class LevelEditorInput {
    constructor(levelEditor, renderer) {
        this.levelEditor = levelEditor;
        this.renderer = renderer;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.groundPoint = new THREE.Vector3();

        this.setupKeyboardListener();
        this.setupCanvasListener();
    }

    setupKeyboardListener() {
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'e' && !e.ctrlKey) {
                this.levelEditor.toggle();
            }
        });
    }

    setupCanvasListener() {
        this.renderer.domElement.addEventListener('click', (e) => this.onCanvasClick(e));
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }

    onCanvasClick(e) {
        if (!this.levelEditor.isActive || !this.levelEditor.mode) return;

        const target = this.getGroundPoint(e);
        if (!target) return;

        this.levelEditor.objectManager.handlePlacement(this.levelEditor.mode, target);
        this.levelEditor.ui.updatePropertiesPanel(this.levelEditor.selectedObject);
    }

    onMouseMove(e) {
        if (!this.levelEditor.isActive) return;
        this.updateMousePosition(e);
    }

    getGroundPoint(e) {
        this.updateMousePosition(e);
        this.raycaster.setFromCamera(this.mouse, this.levelEditor.camera);
        this.raycaster.ray.intersectPlane(this.groundPlane, this.groundPoint);
        this.groundPoint.y = 0.5;
        return this.groundPoint.clone();
    }

    updateMousePosition(e) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    raycastObjects(allMeshes) {
        this.raycaster.setFromCamera(this.mouse, this.levelEditor.camera);
        return this.raycaster.intersectObjects(allMeshes);
    }
}

