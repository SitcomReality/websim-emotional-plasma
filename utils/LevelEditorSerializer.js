import * as THREE from 'three';
import { Zone } from '../utils/Zone.js';
import { ZonePresets } from '../levels/ZonePresets.js';
import { StaticProp } from '../entities/StaticProp.js';
import { Ball } from '../entities/Ball.js';
import { NPCBehavior } from '../utils/NPCBehavior.js';

export class LevelEditorSerializer {
    constructor(levelEditor) {
        this.levelEditor = levelEditor;
    }

    exportLevel(objects) {
        const levelName = prompt('Level name:', 'New Level') || 'New Level';
        const levelData = this.buildLevelData(levelName, objects);
        const json = JSON.stringify(levelData, null, 2);

        navigator.clipboard.writeText(json).then(() => {
            alert('Level exported to clipboard!');
        }).catch(() => {
            this.showExportInTextarea(json);
        });
    }

    buildLevelData(name, objects) {
        const levelData = {
            name: name,
            player: null,
            npcs: [],
            zones: [],
            staticProps: []
        };

        if (objects.player) {
            levelData.player = {
                position: [objects.player.position.x, objects.player.position.y, objects.player.position.z],
                state: {
                    valence: objects.player.emotionalState.valence,
                    arousal: objects.player.emotionalState.arousal,
                    connectedness: objects.player.emotionalState.socialConnectedness
                }
            };
        }

        objects.npcs.forEach(npc => {
            levelData.npcs.push({
                position: [npc.position.x, npc.position.y, npc.position.z],
                state: {
                    valence: npc.emotionalState.valence,
                    arousal: npc.emotionalState.arousal,
                    connectedness: npc.emotionalState.socialConnectedness
                }
            });
        });

        objects.zones.forEach(zone => {
            levelData.zones.push({
                type: zone.name,
                position: [zone.position.x, zone.position.y, zone.position.z],
                radius: zone.radius
            });
        });

        objects.props.forEach(prop => {
            levelData.staticProps.push({
                position: [prop.mesh.position.x, prop.mesh.position.y, prop.mesh.position.z],
                size: [prop.mesh.scale.x, prop.mesh.scale.y, prop.mesh.scale.z],
                properties: { color: `0x${prop.mesh.material.color.getHexString()}` }
            });
        });

        return levelData;
    }

    showExportInTextarea(json) {
        const textarea = document.getElementById('json-import');
        if (textarea) {
            textarea.value = json;
            textarea.style.display = 'block';
            textarea.select();
        }
    }

    showImportUI() {
        const textarea = document.getElementById('json-import');
        if (textarea) {
            textarea.style.display = textarea.style.display === 'none' ? 'block' : 'none';
            if (textarea.style.display === 'block') {
                textarea.focus();
            }
        }
    }

    importLevel() {
        const textarea = document.getElementById('json-import');
        if (!textarea || !textarea.value) {
            alert('Please paste JSON level data');
            return;
        }

        try {
            const levelData = JSON.parse(textarea.value);
            this.levelEditor.clearLevel();
            this.loadLevelData(levelData);
            alert('Level imported successfully!');
            textarea.style.display = 'none';
            this.levelEditor.updateUI();
        } catch (e) {
            alert('Invalid JSON: ' + e.message);
        }
    }

    loadLevelData(levelData) {
        const { scene, camera, objects } = this.levelEditor;

        if (levelData.player) {
            const pos = new THREE.Vector3(...levelData.player.position);
            this.levelEditor.placePlayer(pos);
            if (levelData.player.state) {
                objects.player.emotionalState.valence = levelData.player.state.valence || 0;
                objects.player.emotionalState.arousal = levelData.player.state.arousal || 0;
                objects.player.emotionalState.socialConnectedness = levelData.player.state.connectedness || 0;
            }
        }

        if (levelData.npcs) {
            levelData.npcs.forEach(npcData => {
                const pos = new THREE.Vector3(...npcData.position);
                this.levelEditor.placeNPC(pos);
                if (npcData.state) {
                    const npc = objects.npcs[objects.npcs.length - 1];
                    npc.emotionalState.valence = npcData.state.valence || 0;
                    npc.emotionalState.arousal = npcData.state.arousal || 0;
                    npc.emotionalState.socialConnectedness = npcData.state.connectedness || 0;
                }
            });
        }

        if (levelData.zones) {
            levelData.zones.forEach(zoneData => {
                const pos = new THREE.Vector3(...zoneData.position);
                const preset = ZonePresets[zoneData.type] || ZonePresets['Peaceful Sanctuary'];
                const zone = new Zone(pos, zoneData.radius, preset);
                zone.addToScene(scene);
                objects.zones.push(zone);
            });
        }

        if (levelData.staticProps) {
            levelData.staticProps.forEach(propData => {
                const pos = new THREE.Vector3(...propData.position);
                const size = new THREE.Vector3(...propData.size);
                const prop = new StaticProp(scene, pos, size, propData.properties);
                objects.props.push(prop);
            });
        }
    }
}