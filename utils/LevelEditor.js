import * as THREE from 'three';
import { LevelEditorUI } from './LevelEditorUI.js';
import { LevelEditorPlacement } from './LevelEditorPlacement.js';
import { LevelEditorSelection } from './LevelEditorSelection.js';
import { LevelEditorExport } from './LevelEditorExport.js';
import { LevelEditorImport } from './LevelEditorImport.js';

export class LevelEditor {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.isActive = false;
        this.mode = null;
        this.selectedObject = null;
        this.objects = {
            player: null,
            npcs: [],
            zones: [],
            props: []
        };

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.groundPoint = new THREE.Vector3();

        // Initialize sub-modules
        this.ui = new LevelEditorUI(this);
        this.placement = new LevelEditorPlacement(this);
        this.selection = new LevelEditorSelection(this);
        this.export = new LevelEditorExport(this);
        this.import = new LevelEditorImport(this);

        this.setupInputListeners();
    }

    setupInputListeners() {
        // Toggle editor with 'E'
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'e' && !e.ctrlKey) {
                this.toggle();
            }
        });

        // Canvas click for placement/selection
        this.renderer.domElement.addEventListener('click', (e) => this.onCanvasClick(e));

        // Mouse move for raycasting
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }

    toggle() {
        this.isActive = !this.isActive;
        this.ui.togglePanel();
    }

    onCanvasClick(e) {
        if (!this.isActive || !this.mode) return;

        // Calculate mouse position
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        // Raycast to ground
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const target = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(this.groundPlane, target);
        target.y = 0.5; // Place at ground level

        if (this.mode === 'select') {
            this.selection.selectObject(target);
        } else {
            this.placement.placeObject(target, this.mode);
        }

        this.ui.update();
    }

    onMouseMove(e) {
        if (!this.isActive) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    getExportData() {
        return {
            player: this.objects.player,
            npcs: this.objects.npcs,
            zones: this.objects.zones,
            props: this.objects.props
        };
    }
}