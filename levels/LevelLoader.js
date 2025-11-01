import * as THREE from 'three';
import { Ball } from '../entities/Ball.js';
import { NPCBehavior } from '../utils/NPCBehavior.js';
import { Zone } from '../utils/Zone.js';
import { ZonePresets } from './ZonePresets.js';
import { StaticProp } from '../entities/StaticProp.js';

export class LevelLoader {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
    }

    async load(levelUrl) {
        const response = await fetch(levelUrl);
        if (!response.ok) {
            throw new Error(`Failed to load level: ${response.statusText}`);
        }
        const levelData = await response.json();
        return this.parseLevelData(levelData);
    }

    parseLevelData(data) {
        const entities = [];
        let player = null;

        // Player
        if (data.player) {
            const p = data.player;
            const pos = p.position ? new THREE.Vector3(...p.position) : new THREE.Vector3(0, 0.5, 0);
            
            // This assumes the Player class is instantiated separately
            // For now, we return the player's start data
            const playerStartData = { position: pos, state: p.state };

            // NPCs
            if (data.npcs) {
                for (const npcData of data.npcs) {
                    const npcPos = npcData.position ? new THREE.Vector3(...npcData.position) : new THREE.Vector3(0, 0.5, 0);
                    const npc = new Ball(this.scene, this.camera, npcPos);
                    
                    if (npcData.state) {
                        npc.setEmotionalState(
                            npcData.state.valence || 0,
                            npcData.state.arousal || 0,
                            npcData.state.connectedness || 0
                        );
                    }

                    if (npcData.dialogue) {
                        npc.dialogueData = npcData.dialogue;
                    }
                    
                    npc.isNPC = true;
                    npc.behavior = new NPCBehavior();
                    entities.push(npc);
                }
            }

            // Zones
            const zones = [];
            if (data.zones) {
                for (const zoneData of data.zones) {
                    const preset = ZonePresets[zoneData.type];
                    if (preset) {
                        const zonePos = zoneData.position ? new THREE.Vector3(...zoneData.position) : new THREE.Vector3(0, 0, 0);
                        const radius = zoneData.radius || 5;
                        const zone = new Zone(zonePos, radius, preset);
                        zones.push(zone);
                    }
                }
            }
            
            // Static Props
            if (data.staticProps) {
                for (const propData of data.staticProps) {
                    const propPos = propData.position ? new THREE.Vector3(...propData.position) : new THREE.Vector3(0, 0, 0);
                    const propSize = propData.size ? new THREE.Vector3(...propData.size) : new THREE.Vector3(1, 1, 1);
                    const prop = new StaticProp(this.scene, propPos, propSize, propData.properties);
                    // We don't need to add it to the main `entities` array if it doesn't need updates
                }
            }

            return { playerStartData, entities, zones };
        } else {
            throw new Error("Level data must contain player information.");
        }
    }
}