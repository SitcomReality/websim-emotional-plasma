import * as THREE from 'three';
import { Ball } from '../entities/Ball.js';
import { NPCBehavior } from '../utils/NPCBehavior.js';
import { Zone } from '../utils/Zone.js';
import { ZonePresets } from '../levels/ZonePresets.js';
import { StaticProp } from '../entities/StaticProp.js';

export class LevelEditorImport {
    constructor(editor) {
        this.editor = editor;
    }

    importLevel() {
        const textarea = document.getElementById('json-import');
        if (!textarea || !textarea.value) {
            alert('Please paste JSON level data');
            return;
        }

        try {
            const levelData = JSON.parse(textarea.value);
            this.clearLevel();

            // Load player
            if (levelData.player) {
                const pos = new THREE.Vector3(...levelData.player.position);
                this.editor.placement.placePlayer(pos);
                if (levelData.player.state) {
                    this.editor.objects.player.emotionalState.valence = levelData.player.state.valence || 0;
                    this.editor.objects.player.emotionalState.arousal = levelData.player.state.arousal || 0;
                    this.editor.objects.player.emotionalState.socialConnectedness = levelData.player.state.connectedness || 0;
                }
            }

            // Load NPCs
            if (levelData.npcs) {
                levelData.npcs.forEach(npcData => {
                    const pos = new THREE.Vector3(...npcData.position);
                    this.editor.placement.placeNPC(pos);
                    if (npcData.state) {
                        const npc = this.editor.objects.npcs[this.editor.objects.npcs.length - 1];
                        npc.emotionalState.valence = npcData.state.valence || 0;
                        npc.emotionalState.arousal = npcData.state.arousal || 0;
                        npc.emotionalState.socialConnectedness = npcData.state.connectedness || 0;
                    }
                });
            }

            // Load zones
            if (levelData.zones) {
                levelData.zones.forEach(zoneData => {
                    const pos = new THREE.Vector3(...zoneData.position);
                    const preset = ZonePresets[zoneData.type] || ZonePresets['Peaceful Sanctuary'];
                    const zone = new Zone(pos, zoneData.radius, preset);
                    this.editor.objects.zones.push(zone);
                });
            }

            // Load props
            if (levelData.staticProps) {
                levelData.staticProps.forEach(propData => {
                    const pos = new THREE.Vector3(...propData.position);
                    const size = new THREE.Vector3(...propData.size);
                    const prop = new StaticProp(this.editor.scene, pos, size, propData.properties);
                    this.editor.objects.props.push(prop);
                });
            }

            alert('Level imported successfully!');
            textarea.style.display = 'none';
            this.editor.ui.update();
        } catch (e) {
            alert('Invalid JSON: ' + e.message);
        }
    }

    clearLevel() {
        if (this.editor.objects.player) {
            this.editor.objects.player.destroy();
            this.editor.objects.player = null;
        }
        this.editor.objects.npcs.forEach(npc => npc.destroy());
        this.editor.objects.npcs = [];
        this.editor.objects.zones.forEach(zone => zone.destroy(this.editor.scene));
        this.editor.objects.zones = [];
        this.editor.objects.props.forEach(prop => prop.destroy());
        this.editor.objects.props = [];
        this.editor.selectedObject = null;
        this.editor.ui.update();
    }
}