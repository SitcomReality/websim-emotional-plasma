import * as THREE from 'three';
import { Ball } from '../entities/Ball.js';
import { Zone } from '../utils/Zone.js';
import { ZonePresets } from '../levels/ZonePresets.js';
import { StaticProp } from '../entities/StaticProp.js';
import { NPCBehavior } from '../utils/NPCBehavior.js';

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

        this.setupUI();
        this.setupInputListeners();
    }

    setupUI() {
        const panel = document.getElementById('level-editor-panel');
        const closeBtn = document.getElementById('close-editor-btn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.toggle());
        }

        // Mode buttons
        const modeButtons = document.querySelectorAll('[data-mode]');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.mode = btn.dataset.mode;
            });
        });

        // File operations
        const exportBtn = document.getElementById('export-level-btn');
        const importBtn = document.getElementById('import-level-btn');
        const clearBtn = document.getElementById('clear-level-btn');

        if (exportBtn) exportBtn.addEventListener('click', () => this.exportLevel());
        if (importBtn) importBtn.addEventListener('click', () => this.showImportUI());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearLevel());
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
        const panel = document.getElementById('level-editor-panel');
        if (panel) {
            panel.classList.toggle('level-editor-hidden');
        }
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
            this.selectObject(target);
        } else if (this.mode === 'player') {
            this.placePlayer(target);
        } else if (this.mode === 'npc') {
            this.placeNPC(target);
        } else if (this.mode === 'zone') {
            this.placeZone(target);
        } else if (this.mode === 'prop') {
            this.placeProp(target);
        }

        this.updateUI();
    }

    onMouseMove(e) {
        if (!this.isActive) return;

        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    placePlayer(position) {
        // Remove old player if exists
        if (this.objects.player) {
            this.objects.player.destroy();
        }

        const player = new Ball(this.scene, this.camera, position, 0.5);
        player.isPlayer = true;
        this.objects.player = player;
        this.selectedObject = player;
    }

    placeNPC(position) {
        const npc = new Ball(this.scene, this.camera, position, 0.5);
        npc.isNPC = true;
        npc.behavior = new NPCBehavior();
        this.objects.npcs.push(npc);
        this.selectedObject = npc;
    }

    placeZone(position) {
        const zone = new Zone(position, 4, ZonePresets['Peaceful Sanctuary']);
        this.objects.zones.push(zone);
        this.selectedObject = zone;
    }

    placeProp(position) {
        const prop = new StaticProp(this.scene, position, new THREE.Vector3(2, 2, 2));
        this.objects.props.push(prop);
        this.selectedObject = prop;
    }

    selectObject(position) {
        // Raycast to find nearest object
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const allMeshes = [];
        if (this.objects.player) allMeshes.push(this.objects.player.mesh);
        this.objects.npcs.forEach(npc => allMeshes.push(npc.mesh));
        this.objects.zones.forEach(zone => {
            if (zone.mesh) allMeshes.push(zone.mesh);
        });
        this.objects.props.forEach(prop => {
            if (prop.mesh) allMeshes.push(prop.mesh);
        });

        const intersects = this.raycaster.intersectObjects(allMeshes);
        if (intersects.length > 0) {
            const mesh = intersects[0].object;
            this.selectedObject = this.findObjectByMesh(mesh);
        }
    }

    findObjectByMesh(mesh) {
        if (this.objects.player?.mesh === mesh) return this.objects.player;
        for (const npc of this.objects.npcs) {
            if (npc.mesh === mesh) return npc;
        }
        for (const zone of this.objects.zones) {
            if (zone.mesh === mesh) return zone;
        }
        for (const prop of this.objects.props) {
            if (prop.mesh === mesh) return prop;
        }
        return null;
    }

    updateUI() {
        const panel = document.getElementById('properties-panel');
        const countInfo = document.getElementById('object-count');

        if (countInfo) {
            const total = (this.objects.player ? 1 : 0) + this.objects.npcs.length + this.objects.zones.length + this.objects.props.length;
            countInfo.textContent = `Objects: ${total}`;
        }

        if (!panel) return;

        if (!this.selectedObject) {
            panel.innerHTML = '<p style="color: #aaa; font-size: 12px;">Select an object to edit</p>';
            return;
        }

        let html = '<div class="property-panel>';

        if (this.selectedObject.isPlayer || this.selectedObject.isNPC) {
            // Ball properties
            html += `
                <div class="property-row">
                    <label>Position X</label>
                    <input type="number" step="0.1" value="${this.selectedObject.position.x.toFixed(1)}" 
                        onchange="window.levelEditor.updateBallPosition(0, this.value)">
                </div>
                <div class="property-row">
                    <label>Position Z</label>
                    <input type="number" step="0.1" value="${this.selectedObject.position.z.toFixed(1)}" 
                        onchange="window.levelEditor.updateBallPosition(2, this.value)">
                </div>
                <div class="property-row">
                    <label>Valence</label>
                    <input type="range" min="-1" max="1" step="0.1" value="${this.selectedObject.emotionalState.valence}" 
                        onchange="window.levelEditor.updateBallState('valence', this.value)">
                    <span style="font-size: 10px; color: #888;">${parseFloat(this.selectedObject.emotionalState.valence).toFixed(1)}</span>
                </div>
                <div class="property-row">
                    <label>Arousal</label>
                    <input type="range" min="-1" max="1" step="0.1" value="${this.selectedObject.emotionalState.arousal}" 
                        onchange="window.levelEditor.updateBallState('arousal', this.value)">
                    <span style="font-size: 10px; color: #888;">${parseFloat(this.selectedObject.emotionalState.arousal).toFixed(1)}</span>
                </div>
                <div class="property-row">
                    <label>Connectedness</label>
                    <input type="range" min="-1" max="1" step="0.1" value="${this.selectedObject.emotionalState.socialConnectedness}" 
                        onchange="window.levelEditor.updateBallState('connectedness', this.value)">
                    <span style="font-size: 10px; color: #888;">${parseFloat(this.selectedObject.emotionalState.socialConnectedness).toFixed(1)}</span>
                </div>
                <button class="editor-btn" onclick="window.levelEditor.deleteSelectedObject()">Delete</button>
            `;
        } else if (this.selectedObject.radius !== undefined) {
            // Zone properties
            const zoneTypes = Object.keys(ZonePresets);
            html += `
                <div class="property-row">
                    <label>Zone Type</label>
                    <select onchange="window.levelEditor.updateZoneType(this.value)">
                        ${zoneTypes.map(t => `<option value="${t}" ${this.selectedObject.name === t ? 'selected' : ''}>${t}</option>`).join('')}
                    </select>
                </div>
                <div class="property-row">
                    <label>Radius</label>
                    <input type="number" step="0.5" value="${this.selectedObject.radius.toFixed(1)}" 
                        onchange="window.levelEditor.updateZoneRadius(this.value)">
                </div>
                <button class="editor-btn" onclick="window.levelEditor.deleteSelectedObject()">Delete</button>
            `;
        } else if (this.selectedObject.mesh && !this.selectedObject.isPlayer && !this.selectedObject.isNPC && this.selectedObject.radius === undefined) {
            // Prop properties
            html += `
                <div class="property-row">
                    <label>Size X</label>
                    <input type="number" step="0.1" value="${this.selectedObject.mesh.scale.x.toFixed(1)}" 
                        onchange="window.levelEditor.updatePropScale(0, this.value)">
                </div>
                <div class="property-row">
                    <label>Size Y</label>
                    <input type="number" step="0.1" value="${this.selectedObject.mesh.scale.y.toFixed(1)}" 
                        onchange="window.levelEditor.updatePropScale(1, this.value)">
                </div>
                <div class="property-row">
                    <label>Size Z</label>
                    <input type="number" step="0.1" value="${this.selectedObject.mesh.scale.z.toFixed(1)}" 
                        onchange="window.levelEditor.updatePropScale(2, this.value)">
                </div>
                <button class="editor-btn" onclick="window.levelEditor.deleteSelectedObject()">Delete</button>
            `;
        }

        html += '</div>';
        panel.innerHTML = html;
    }

    updateBallPosition(axis, value) {
        if (this.selectedObject && (this.selectedObject.isPlayer || this.selectedObject.isNPC)) {
            this.selectedObject.position.setComponent(axis, parseFloat(value));
        }
    }

    updateBallState(state, value) {
        if (!this.selectedObject || (!this.selectedObject.isPlayer && !this.selectedObject.isNPC)) return;

        const numValue = parseFloat(value);
        if (state === 'valence') {
            this.selectedObject.emotionalState.valence = numValue;
        } else if (state === 'arousal') {
            this.selectedObject.emotionalState.arousal = numValue;
        } else if (state === 'connectedness') {
            this.selectedObject.emotionalState.socialConnectedness = numValue;
        }

        this.updateUI();
    }

    updateZoneType(type) {
        if (!this.selectedObject || this.selectedObject.radius === undefined) return;

        const preset = ZonePresets[type];
        if (preset) {
            this.selectedObject.name = preset.name;
            this.selectedObject.color = preset.color;
            this.selectedObject.valenceEffect = preset.valenceEffect;
            this.selectedObject.arousalEffect = preset.arousalEffect;
            this.selectedObject.connectednessEffect = preset.connectednessEffect;
            this.selectedObject.forceMultiplier = preset.forceMultiplier || 0;

            if (this.selectedObject.mesh) {
                this.selectedObject.mesh.material.color.setHex(preset.color);
                this.selectedObject.mesh.material.emissive.setHex(preset.color);
            }
        }
    }

    updateZoneRadius(value) {
        if (!this.selectedObject || this.selectedObject.radius === undefined) return;

        this.selectedObject.radius = parseFloat(value);
        if (this.selectedObject.mesh) {
            this.selectedObject.mesh.scale.set(this.selectedObject.radius, this.selectedObject.radius, this.selectedObject.radius);
        }
    }

    updatePropScale(axis, value) {
        if (!this.selectedObject || !this.selectedObject.mesh) return;
        this.selectedObject.mesh.scale.setComponent(axis, parseFloat(value));
    }

    deleteSelectedObject() {
        if (!this.selectedObject) return;

        if (this.selectedObject.isPlayer && this.selectedObject === this.objects.player) {
            this.objects.player.destroy();
            this.objects.player = null;
        } else if (this.selectedObject.isNPC) {
            const idx = this.objects.npcs.indexOf(this.selectedObject);
            if (idx > -1) {
                this.objects.npcs[idx].destroy();
                this.objects.npcs.splice(idx, 1);
            }
        } else if (this.selectedObject.radius !== undefined) {
            const idx = this.objects.zones.indexOf(this.selectedObject);
            if (idx > -1) {
                this.objects.zones[idx].destroy(this.scene);
                this.objects.zones.splice(idx, 1);
            }
        } else if (this.selectedObject.mesh) {
            const idx = this.objects.props.indexOf(this.selectedObject);
            if (idx > -1) {
                this.objects.props[idx].destroy();
                this.objects.props.splice(idx, 1);
            }
        }

        this.selectedObject = null;
        this.updateUI();
    }

    exportLevel() {
        const levelData = {
            name: prompt('Level name:', 'New Level') || 'New Level',
            player: null,
            npcs: [],
            zones: [],
            staticProps: []
        };

        if (this.objects.player) {
            levelData.player = {
                position: [this.objects.player.position.x, this.objects.player.position.y, this.objects.player.position.z],
                state: {
                    valence: this.objects.player.emotionalState.valence,
                    arousal: this.objects.player.emotionalState.arousal,
                    connectedness: this.objects.player.emotionalState.socialConnectedness
                }
            };
        }

        this.objects.npcs.forEach(npc => {
            levelData.npcs.push({
                position: [npc.position.x, npc.position.y, npc.position.z],
                state: {
                    valence: npc.emotionalState.valence,
                    arousal: npc.emotionalState.arousal,
                    connectedness: npc.emotionalState.socialConnectedness
                }
            });
        });

        this.objects.zones.forEach(zone => {
            levelData.zones.push({
                type: zone.name,
                position: [zone.position.x, zone.position.y, zone.position.z],
                radius: zone.radius
            });
        });

        this.objects.props.forEach(prop => {
            levelData.staticProps.push({
                position: [prop.mesh.position.x, prop.mesh.position.y, prop.mesh.position.z],
                size: [prop.mesh.scale.x, prop.mesh.scale.y, prop.mesh.scale.z],
                properties: { color: `0x${prop.mesh.material.color.getHexString()}` }
            });
        });

        const json = JSON.stringify(levelData, null, 2);

        // Copy to clipboard
        navigator.clipboard.writeText(json).then(() => {
            alert('Level exported to clipboard!');
        }).catch(() => {
            // Fallback: show in textarea
            const textarea = document.getElementById('json-import');
            if (textarea) {
                textarea.value = json;
                textarea.style.display = 'block';
                textarea.select();
            }
        });
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
            this.clearLevel();

            // Load player
            if (levelData.player) {
                const pos = new THREE.Vector3(...levelData.player.position);
                this.placePlayer(pos);
                if (levelData.player.state) {
                    this.objects.player.emotionalState.valence = levelData.player.state.valence || 0;
                    this.objects.player.emotionalState.arousal = levelData.player.state.arousal || 0;
                    this.objects.player.emotionalState.socialConnectedness = levelData.player.state.connectedness || 0;
                }
            }

            // Load NPCs
            if (levelData.npcs) {
                levelData.npcs.forEach(npcData => {
                    const pos = new THREE.Vector3(...npcData.position);
                    this.placeNPC(pos);
                    if (npcData.state) {
                        this.objects.npcs[this.objects.npcs.length - 1].emotionalState.valence = npcData.state.valence || 0;
                        this.objects.npcs[this.objects.npcs.length - 1].emotionalState.arousal = npcData.state.arousal || 0;
                        this.objects.npcs[this.objects.npcs.length - 1].emotionalState.socialConnectedness = npcData.state.connectedness || 0;
                    }
                });
            }

            // Load zones
            if (levelData.zones) {
                levelData.zones.forEach(zoneData => {
                    const pos = new THREE.Vector3(...zoneData.position);
                    const preset = ZonePresets[zoneData.type] || ZonePresets['Peaceful Sanctuary'];
                    const zone = new Zone(pos, zoneData.radius, preset);
                    this.objects.zones.push(zone);
                });
            }

            // Load props
            if (levelData.staticProps) {
                levelData.staticProps.forEach(propData => {
                    const pos = new THREE.Vector3(...propData.position);
                    const size = new THREE.Vector3(...propData.size);
                    const prop = new StaticProp(this.scene, pos, size, propData.properties);
                    this.objects.props.push(prop);
                });
            }

            alert('Level imported successfully!');
            textarea.style.display = 'none';
            this.updateUI();
        } catch (e) {
            alert('Invalid JSON: ' + e.message);
        }
    }

    clearLevel() {
        if (this.objects.player) {
            this.objects.player.destroy();
            this.objects.player = null;
        }
        this.objects.npcs.forEach(npc => npc.destroy());
        this.objects.npcs = [];
        this.objects.zones.forEach(zone => zone.destroy(this.scene));
        this.objects.zones = [];
        this.objects.props.forEach(prop => prop.destroy());
        this.objects.props = [];
        this.selectedObject = null;
        this.updateUI();
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