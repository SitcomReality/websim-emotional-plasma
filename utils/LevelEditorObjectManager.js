import * as THREE from 'three';
import { Ball } from '../entities/Ball.js';
import { Zone } from '../utils/Zone.js';
import { ZonePresets } from '../levels/ZonePresets.js';
import { StaticProp } from '../entities/StaticProp.js';
import { NPCBehavior } from '../utils/NPCBehavior.js';

export class LevelEditorObjectManager {
    constructor(levelEditor) {
        this.levelEditor = levelEditor;
    }

    handlePlacement(mode, position) {
        switch (mode) {
            case 'select':
                this.selectObject(position);
                break;
            case 'player':
                this.placePlayer(position);
                break;
            case 'npc':
                this.placeNPC(position);
                break;
            case 'zone':
                this.placeZone(position);
                break;
            case 'prop':
                this.placeProp(position);
                break;
        }
    }

    placePlayer(position) {
        const { objects, scene, camera } = this.levelEditor;

        if (objects.player) {
            objects.player.destroy();
        }

        const player = new Ball(scene, camera, position, 0.5);
        player.isPlayer = true;
        objects.player = player;
        this.levelEditor.selectedObject = player;
    }

    placeNPC(position) {
        const { objects, scene, camera } = this.levelEditor;

        const npc = new Ball(scene, camera, position, 0.5);
        npc.isNPC = true;
        npc.behavior = new NPCBehavior();
        objects.npcs.push(npc);
        this.levelEditor.selectedObject = npc;
    }

    placeZone(position) {
        const { objects } = this.levelEditor;

        const zone = new Zone(position, 4, ZonePresets['Peaceful Sanctuary']);
        objects.zones.push(zone);
        this.levelEditor.selectedObject = zone;
    }

    placeProp(position) {
        const { objects, scene } = this.levelEditor;

        const prop = new StaticProp(scene, position, new THREE.Vector3(2, 2, 2));
        objects.props.push(prop);
        this.levelEditor.selectedObject = prop;
    }

    selectObject(position) {
        const { objects, input } = this.levelEditor;

        const allMeshes = this.getAllMeshes(objects);
        const intersects = input.raycastObjects(allMeshes);

        if (intersects.length > 0) {
            const mesh = intersects[0].object;
            this.levelEditor.selectedObject = this.findObjectByMesh(mesh, objects);
        }
    }

    findObjectByMesh(mesh, objects) {
        if (objects.player?.mesh === mesh) return objects.player;
        for (const npc of objects.npcs) {
            if (npc.mesh === mesh) return npc;
        }
        for (const zone of objects.zones) {
            if (zone.mesh === mesh) return zone;
        }
        for (const prop of objects.props) {
            if (prop.mesh === mesh) return prop;
        }
        return null;
    }

    getAllMeshes(objects) {
        const meshes = [];
        if (objects.player) meshes.push(objects.player.mesh);
        objects.npcs.forEach(npc => meshes.push(npc.mesh));
        objects.zones.forEach(zone => {
            if (zone.mesh) meshes.push(zone.mesh);
        });
        objects.props.forEach(prop => {
            if (prop.mesh) meshes.push(prop.mesh);
        });
        return meshes;
    }

    deleteSelectedObject() {
        const { selectedObject, objects, scene } = this.levelEditor;

        if (!selectedObject) return;

        if (selectedObject.isPlayer && selectedObject === objects.player) {
            objects.player.destroy();
            objects.player = null;
        } else if (selectedObject.isNPC) {
            const idx = objects.npcs.indexOf(selectedObject);
            if (idx > -1) {
                objects.npcs[idx].destroy();
                objects.npcs.splice(idx, 1);
            }
        } else if (selectedObject.radius !== undefined) {
            const idx = objects.zones.indexOf(selectedObject);
            if (idx > -1) {
                objects.zones[idx].destroy(scene);
                objects.zones.splice(idx, 1);
            }
        } else if (selectedObject.mesh) {
            const idx = objects.props.indexOf(selectedObject);
            if (idx > -1) {
                objects.props[idx].destroy();
                objects.props.splice(idx, 1);
            }
        }

        this.levelEditor.selectedObject = null;
        this.levelEditor.ui.updatePropertiesPanel(null);
    }

    clearAll() {
        const { objects, scene } = this.levelEditor;

        if (objects.player) {
            objects.player.destroy();
            objects.player = null;
        }
        objects.npcs.forEach(npc => npc.destroy());
        objects.npcs = [];
        objects.zones.forEach(zone => zone.destroy(scene));
        objects.zones = [];
        objects.props.forEach(prop => prop.destroy());
        objects.props = [];
        this.levelEditor.selectedObject = null;
        this.levelEditor.ui.updatePropertiesPanel(null);
    }

    updateBallPosition(axis, value) {
        if (this.levelEditor.selectedObject && (this.levelEditor.selectedObject.isPlayer || this.levelEditor.selectedObject.isNPC)) {
            this.levelEditor.selectedObject.position.setComponent(axis, parseFloat(value));
        }
    }

    updateBallState(state, value) {
        const { selectedObject } = this.levelEditor;
        if (!selectedObject || (!selectedObject.isPlayer && !selectedObject.isNPC)) return;

        const numValue = parseFloat(value);
        if (state === 'valence') {
            selectedObject.emotionalState.valence = numValue;
        } else if (state === 'arousal') {
            selectedObject.emotionalState.arousal = numValue;
        } else if (state === 'connectedness') {
            selectedObject.emotionalState.socialConnectedness = numValue;
        }

        this.levelEditor.ui.updatePropertiesPanel(selectedObject);
    }

    updateZoneType(type) {
        const { selectedObject } = this.levelEditor;
        if (!selectedObject || selectedObject.radius === undefined) return;

        const preset = ZonePresets[type];
        if (preset) {
            selectedObject.name = preset.name;
            selectedObject.color = preset.color;
            selectedObject.valenceEffect = preset.valenceEffect;
            selectedObject.arousalEffect = preset.arousalEffect;
            selectedObject.connectednessEffect = preset.connectednessEffect;
            selectedObject.forceMultiplier = preset.forceMultiplier || 0;

            if (selectedObject.mesh) {
                selectedObject.mesh.material.color.setHex(preset.color);
                selectedObject.mesh.material.emissive.setHex(preset.color);
            }
        }
    }

    updateZoneRadius(value) {
        const { selectedObject } = this.levelEditor;
        if (!selectedObject || selectedObject.radius === undefined) return;

        selectedObject.radius = parseFloat(value);
        if (selectedObject.mesh) {
            selectedObject.mesh.scale.set(selectedObject.radius, selectedObject.radius, selectedObject.radius);
        }
    }

    updatePropScale(axis, value) {
        const { selectedObject } = this.levelEditor;
        if (!selectedObject || !selectedObject.mesh) return;
        selectedObject.mesh.scale.setComponent(axis, parseFloat(value));
    }
}