import * as THREE from 'three';
import { Ball } from '../entities/Ball.js';
import { NPCBehavior } from '../utils/NPCBehavior.js';
import { Zone } from '../utils/Zone.js';
import { ZonePresets } from '../levels/ZonePresets.js';
import { StaticProp } from '../entities/StaticProp.js';

export class LevelEditorPlacement {
    constructor(editor) {
        this.editor = editor;
    }

    placeObject(position, mode) {
        switch (mode) {
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
        // Remove old player if exists
        if (this.editor.objects.player) {
            this.editor.objects.player.destroy();
        }

        const player = new Ball(this.editor.scene, this.editor.camera, position, 0.5);
        player.isPlayer = true;
        this.editor.objects.player = player;
        this.editor.selectedObject = player;
    }

    placeNPC(position) {
        const npc = new Ball(this.editor.scene, this.editor.camera, position, 0.5);
        npc.isNPC = true;
        npc.behavior = new NPCBehavior();
        this.editor.objects.npcs.push(npc);
        this.editor.selectedObject = npc;
    }

    placeZone(position) {
        const zone = new Zone(position, 4, ZonePresets['Peaceful Sanctuary']);
        this.editor.objects.zones.push(zone);
        this.editor.selectedObject = zone;
    }

    placeProp(position) {
        const prop = new StaticProp(this.editor.scene, position, new THREE.Vector3(2, 2, 2));
        this.editor.objects.props.push(prop);
        this.editor.selectedObject = prop;
    }

    updateBallPosition(axis, value) {
        if (this.editor.selectedObject && (this.editor.selectedObject.isPlayer || this.editor.selectedObject.isNPC)) {
            this.editor.selectedObject.position.setComponent(axis, parseFloat(value));
        }
    }

    updateBallState(state, value) {
        if (!this.editor.selectedObject || (!this.editor.selectedObject.isPlayer && !this.editor.selectedObject.isNPC)) return;

        const numValue = parseFloat(value);
        if (state === 'valence') {
            this.editor.selectedObject.emotionalState.valence = numValue;
        } else if (state === 'arousal') {
            this.editor.selectedObject.emotionalState.arousal = numValue;
        } else if (state === 'connectedness') {
            this.editor.selectedObject.emotionalState.socialConnectedness = numValue;
        }

        this.editor.ui.update();
    }

    updateZoneType(type) {
        if (!this.editor.selectedObject || this.editor.selectedObject.radius === undefined) return;

        const preset = ZonePresets[type];
        if (preset) {
            this.editor.selectedObject.name = preset.name;
            this.editor.selectedObject.color = preset.color;
            this.editor.selectedObject.valenceEffect = preset.valenceEffect;
            this.editor.selectedObject.arousalEffect = preset.arousalEffect;
            this.editor.selectedObject.connectednessEffect = preset.connectednessEffect;
            this.editor.selectedObject.forceMultiplier = preset.forceMultiplier || 0;

            if (this.editor.selectedObject.mesh) {
                this.editor.selectedObject.mesh.material.color.setHex(preset.color);
                this.editor.selectedObject.mesh.material.emissive.setHex(preset.color);
            }
        }
    }

    updateZoneRadius(value) {
        if (!this.editor.selectedObject || this.editor.selectedObject.radius === undefined) return;

        this.editor.selectedObject.radius = parseFloat(value);
        if (this.editor.selectedObject.mesh) {
            this.editor.selectedObject.mesh.scale.set(this.editor.selectedObject.radius, this.editor.selectedObject.radius, this.editor.selectedObject.radius);
        }
    }

    updatePropScale(axis, value) {
        if (!this.editor.selectedObject || !this.editor.selectedObject.mesh) return;
        this.editor.selectedObject.mesh.scale.setComponent(axis, parseFloat(value));
    }
}