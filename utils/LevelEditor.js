import { LevelEditorUI } from './LevelEditorUI.js';
import { LevelEditorInput } from './LevelEditorInput.js';
import { LevelEditorObjectManager } from './LevelEditorObjectManager.js';
import { LevelEditorSerializer } from './LevelEditorSerializer.js';

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

        this.ui = new LevelEditorUI(this);
        this.input = new LevelEditorInput(this, renderer);
        this.objectManager = new LevelEditorObjectManager(this);
        this.serializer = new LevelEditorSerializer(this);

        this.ui.setupCloseButton();
    }

    toggle() {
        this.isActive = !this.isActive;
        const panel = document.getElementById('level-editor-panel');
        if (panel) {
            panel.classList.toggle('level-editor-hidden');
        }
    }

    updateBallPosition(axis, value) {
        this.objectManager.updateBallPosition(axis, value);
    }

    updateBallState(state, value) {
        this.objectManager.updateBallState(state, value);
        this.ui.updatePropertiesPanel(this.selectedObject);
    }

    updateZoneType(type) {
        this.objectManager.updateZoneType(type);
    }

    updateZoneRadius(value) {
        this.objectManager.updateZoneRadius(value);
    }

    updatePropScale(axis, value) {
        this.objectManager.updatePropScale(axis, value);
    }

    deleteSelectedObject() {
        this.objectManager.deleteSelectedObject();
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

