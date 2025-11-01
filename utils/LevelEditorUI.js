import { ZonePresets } from '../levels/ZonePresets.js';
export class LevelEditorUI {
    constructor(levelEditor) {
        this.levelEditor = levelEditor;
        this.setupModeButtons();
        this.setupFileButtons();
    }

    setupModeButtons() {
        const modeButtons = document.querySelectorAll('[data-mode]');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.levelEditor.mode = btn.dataset.mode;
            });
        });
    }

    setupFileButtons() {
        const exportBtn = document.getElementById('export-level-btn');
        const importBtn = document.getElementById('import-level-btn');
        const clearBtn = document.getElementById('clear-level-btn');

        if (exportBtn) exportBtn.addEventListener('click', () => this.levelEditor.serializer.exportLevel(this.levelEditor.objects));
        if (importBtn) importBtn.addEventListener('click', () => this.levelEditor.serializer.showImportUI());
        if (clearBtn) clearBtn.addEventListener('click', () => this.levelEditor.objectManager.clearAll());
    }

    setupCloseButton() {
        const closeBtn = document.getElementById('close-editor-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.levelEditor.toggle());
        }
    }

    updatePropertiesPanel(selectedObject) {
        const panel = document.getElementById('properties-panel');
        const countInfo = document.getElementById('object-count');

        if (countInfo) {
            const total = this.getTotalObjectCount();
            countInfo.textContent = `Objects: ${total}`;
        }

        if (!panel) return;

        if (!selectedObject) {
            panel.innerHTML = '<p style="color: #aaa; font-size: 12px;">Select an object to edit</p>';
            return;
        }

        let html = '<div class="property-panel>';
        html += this.buildPropertyHTML(selectedObject);
        html += '</div>';
        panel.innerHTML = html;
    }

    buildPropertyHTML(obj) {
        if (obj.isPlayer || obj.isNPC) {
            return this.buildBallPropertyHTML(obj);
        } else if (obj.radius !== undefined) {
            return this.buildZonePropertyHTML(obj);
        } else if (obj.mesh) {
            return this.buildPropPropertyHTML(obj);
        }
        return '';
    }

    buildBallPropertyHTML(ball) {
        let html = `
            <div class="property-row">
                <label>Position X</label>
                <input type="number" step="0.1" value="${ball.position.x.toFixed(1)}" 
                    onchange="window.levelEditor.updateBallPosition(0, this.value)">
            </div>
            <div class="property-row">
                <label>Position Z</label>
                <input type="number" step="0.1" value="${ball.position.z.toFixed(1)}" 
                    onchange="window.levelEditor.updateBallPosition(2, this.value)">
            </div>
            <div class="property-row">
                <label>Valence</label>
                <input type="range" min="-1" max="1" step="0.1" value="${ball.emotionalState.valence}" 
                    onchange="window.levelEditor.updateBallState('valence', this.value)">
                <span style="font-size: 10px; color: #888;">${parseFloat(ball.emotionalState.valence).toFixed(1)}</span>
            </div>
            <div class="property-row">
                <label>Arousal</label>
                <input type="range" min="-1" max="1" step="0.1" value="${ball.emotionalState.arousal}" 
                    onchange="window.levelEditor.updateBallState('arousal', this.value)">
                <span style="font-size: 10px; color: #888;">${parseFloat(ball.emotionalState.arousal).toFixed(1)}</span>
            </div>
            <div class="property-row">
                <label>Connectedness</label>
                <input type="range" min="-1" max="1" step="0.1" value="${ball.emotionalState.socialConnectedness}" 
                    onchange="window.levelEditor.updateBallState('connectedness', this.value)">
                <span style="font-size: 10px; color: #888;">${parseFloat(ball.emotionalState.socialConnectedness).toFixed(1)}</span>
            </div>
        `;

        // Add dialogue editor for NPCs
        if (ball.isNPC) {
            html += this.buildDialogueEditorHTML(ball);
        }

        html += '<button class="editor-btn" onclick="window.levelEditor.deleteSelectedObject()">Delete</button>';
        return html;
    }

    buildDialogueEditorHTML(npc) {
        if (!npc.dialogueData) {
            npc.dialogueData = {};
        }

        const nodeIds = Object.keys(npc.dialogueData);
        let html = `
            <div class="property-row" style="border-top: 1px solid #333; margin-top: 12px; padding-top: 12px;">
                <label>Dialogue Nodes (${nodeIds.length})</label>
                <div style="font-size: 10px; color: #888; margin-bottom: 8px;">
                    ${nodeIds.length === 0 ? 'No dialogue nodes. Create one to get started.' : nodeIds.join(', ')}
                </div>
                <button class="editor-btn" onclick="window.levelEditor.ui.showDialogueNodeEditor(window.levelEditor.selectedObject)">Edit Dialogue</button>
            </div>
        `;
        return html;
    }

    showDialogueNodeEditor(npc) {
        if (!npc.dialogueData) {
            npc.dialogueData = {};
        }

        const modal = document.createElement('div');
        modal.className = 'dialogue-editor-modal';
        modal.innerHTML = `
            <div class="dialogue-editor-panel">
                <div class="dialogue-editor-header">
                    <h3>Edit Dialogue</h3>
                    <button class="close-btn" onclick="this.closest('.dialogue-editor-modal').remove()">×</button>
                </div>
                <div class="dialogue-editor-content">
                    <div class="dialogue-node-list">
                        <h4>Nodes</h4>
                        <div id="node-list" style="max-height: 300px; overflow-y: auto; margin-bottom: 10px;">
                            ${this.buildNodeListHTML(npc)}
                        </div>
                        <button class="editor-btn" onclick="window.levelEditor.ui.addDialogueNode(window.levelEditor.selectedObject)">+ Add Node</button>
                    </div>
                    <div id="node-editor" style="display: none;">
                        <!-- Will be populated when a node is selected -->
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        window.currentDialogueNPC = npc;
    }

    buildNodeListHTML(npc) {
        const nodeIds = Object.keys(npc.dialogueData || {});
        if (nodeIds.length === 0) {
            return '<p style="color: #888; font-size: 11px;">No nodes yet</p>';
        }

        return nodeIds.map(id => `
            <div class="dialogue-node-item" onclick="window.levelEditor.ui.selectDialogueNode('${id}')">
                <span>${id}</span>
                <span style="color: #888; font-size: 10px;">${(npc.dialogueData[id].text || '').substring(0, 30)}...</span>
            </div>
        `).join('');
    }

    selectDialogueNode(nodeId) {
        const npc = window.currentDialogueNPC;
        if (!npc || !npc.dialogueData || !npc.dialogueData[nodeId]) return;

        const nodeEditor = document.getElementById('node-editor');
        const node = npc.dialogueData[nodeId];

        nodeEditor.innerHTML = `
            <div style="border-top: 1px solid #333; padding-top: 12px;">
                <h4>${nodeId}</h4>
                
                <div class="property-row">
                    <label>Node Text</label>
                    <textarea onchange="window.levelEditor.ui.updateDialogueNodeText('${nodeId}', this.value)" 
                        style="width: 100%; height: 60px; background: #111; color: #fff; border: 1px solid #333; padding: 6px; font-family: monospace; font-size: 11px;">
${node.text || ''}</textarea>
                </div>

                <div style="margin-top: 12px;">
                    <h4>Responses</h4>
                    <div id="responses-list" style="max-height: 200px; overflow-y: auto; margin-bottom: 8px;">
                        ${this.buildResponsesListHTML(nodeId, node)}
                    </div>
                    <button class="editor-btn" onclick="window.levelEditor.ui.addResponse('${nodeId}')">+ Add Response</button>
                </div>

                <div style="margin-top: 12px;">
                    <button class="editor-btn" onclick="window.levelEditor.ui.deleteDialogueNode('${nodeId}')" style="background: #944;">Delete Node</button>
                </div>
            </div>
        `;
        nodeEditor.style.display = 'block';
    }

    buildResponsesListHTML(nodeId, node) {
        const responses = node.responses || [];
        if (responses.length === 0) {
            return '<p style="color: #888; font-size: 11px;">No responses yet</p>';
        }

        return responses.map((resp, idx) => `
            <div class="dialogue-response-item" onclick="window.levelEditor.ui.editResponse('${nodeId}', ${idx})">
                <span>${resp.text || '(empty)'}</span>
                <span style="color: #888; font-size: 9px;">→ ${resp.nextNodeId || 'end'}</span>
            </div>
        `).join('');
    }

    editResponse(nodeId, responseIndex) {
        const npc = window.currentDialogueNPC;
        const node = npc.dialogueData[nodeId];
        const response = node.responses[responseIndex];

        const modal = document.createElement('div');
        modal.className = 'dialogue-editor-modal';
        modal.innerHTML = `
            <div class="dialogue-editor-panel" style="max-width: 500px;">
                <div class="dialogue-editor-header">
                    <h3>Edit Response</h3>
                    <button class="close-btn" onclick="this.closest('.dialogue-editor-modal').remove()">×</button>
                </div>
                <div class="dialogue-editor-content">
                    <div class="property-row">
                        <label>Response Text</label>
                        <input type="text" id="resp-text" value="${response.text || ''}" style="width: 100%; padding: 6px; background: #111; color: #fff; border: 1px solid #333;">
                    </div>

                    <div class="property-row">
                        <label>Next Node ID</label>
                        <input type="text" id="resp-next" value="${response.nextNodeId || 'end'}" style="width: 100%; padding: 6px; background: #111; color: #fff; border: 1px solid #333;" placeholder="end">
                    </div>

                    <h4>Effects</h4>
                    <div id="effects-list" style="max-height: 200px; overflow-y: auto; margin-bottom: 8px;">
                        ${this.buildEffectsListHTML(response)}
                    </div>
                    <button class="editor-btn" onclick="window.levelEditor.ui.addEffect('${nodeId}', ${responseIndex})">+ Add Effect</button>

                    <div style="margin-top: 12px; display: flex; gap: 8px;">
                        <button class="editor-btn" onclick="window.levelEditor.ui.saveResponse('${nodeId}', ${responseIndex}); this.closest('.dialogue-editor-modal').remove();">Save</button>
                        <button class="editor-btn" onclick="window.levelEditor.ui.deleteResponse('${nodeId}', ${responseIndex}); this.closest('.dialogue-editor-modal').remove();" style="background: #944;">Delete</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    buildEffectsListHTML(response) {
        const effects = response.effects || [];
        if (effects.length === 0) {
            return '<p style="color: #888; font-size: 11px;">No effects yet</p>';
        }

        return effects.map((eff, idx) => `
            <div class="dialogue-effect-item" onclick="event.stopPropagation()">
                <span>${eff.target} → ${eff.dimension}: ${eff.value > 0 ? '+' : ''}${eff.value}</span>
                <button style="background: #944; border: none; color: #fff; cursor: pointer; padding: 2px 8px; font-size: 10px;" onclick="window.levelEditor.ui.deleteEffect(this)">×</button>
            </div>
        `).join('');
    }

    addEffect(nodeId, responseIndex) {
        const npc = window.currentDialogueNPC;
        const effect = {
            target: 'npc',
            dimension: 'valence',
            value: 0.1
        };

        if (!npc.dialogueData[nodeId].responses[responseIndex].effects) {
            npc.dialogueData[nodeId].responses[responseIndex].effects = [];
        }
        npc.dialogueData[nodeId].responses[responseIndex].effects.push(effect);

        document.getElementById('effects-list').innerHTML = this.buildEffectsListHTML(npc.dialogueData[nodeId].responses[responseIndex]);
    }

    deleteEffect(button) {
        button.closest('.dialogue-effect-item').remove();
    }

    saveResponse(nodeId, responseIndex) {
        const npc = window.currentDialogueNPC;
        const textInput = document.getElementById('resp-text');
        const nextInput = document.getElementById('resp-next');

        npc.dialogueData[nodeId].responses[responseIndex].text = textInput.value;
        npc.dialogueData[nodeId].responses[responseIndex].nextNodeId = nextInput.value || 'end';

        // Collect effects from DOM
        const effectElements = document.querySelectorAll('.dialogue-effect-item span');
        const effects = [];
        effectElements.forEach(el => {
            const text = el.textContent;
            const match = text.match(/(\w+)\s*→\s*(\w+):\s*([+\-\d.]+)/);
            if (match) {
                effects.push({
                    target: match[1],
                    dimension: match[2],
                    value: parseFloat(match[3])
                });
            }
        });
        npc.dialogueData[nodeId].responses[responseIndex].effects = effects;

        this.selectDialogueNode(nodeId);
    }

    deleteResponse(nodeId, responseIndex) {
        const npc = window.currentDialogueNPC;
        npc.dialogueData[nodeId].responses.splice(responseIndex, 1);
        this.selectDialogueNode(nodeId);
    }

    addResponse(nodeId) {
        const npc = window.currentDialogueNPC;
        if (!npc.dialogueData[nodeId].responses) {
            npc.dialogueData[nodeId].responses = [];
        }

        npc.dialogueData[nodeId].responses.push({
            text: 'New response',
            effects: [],
            nextNodeId: 'end'
        });

        document.getElementById('responses-list').innerHTML = this.buildResponsesListHTML(nodeId, npc.dialogueData[nodeId]);
    }

    addDialogueNode(npc) {
        const nodeId = `node_${Object.keys(npc.dialogueData).length + 1}`;
        npc.dialogueData[nodeId] = {
            text: 'New dialogue',
            responses: []
        };

        document.getElementById('node-list').innerHTML = this.buildNodeListHTML(npc);
        this.selectDialogueNode(nodeId);
    }

    deleteDialogueNode(nodeId) {
        const npc = window.currentDialogueNPC;
        delete npc.dialogueData[nodeId];
        document.getElementById('node-editor').style.display = 'none';
        document.getElementById('node-list').innerHTML = this.buildNodeListHTML(npc);
    }

    updateDialogueNodeText(nodeId, text) {
        const npc = window.currentDialogueNPC;
        npc.dialogueData[nodeId].text = text;
    }

    buildZonePropertyHTML(zone) {
        const zoneTypes = Object.keys(ZonePresets);
        return `
            <div class="property-row">
                <label>Zone Type</label>
                <select onchange="window.levelEditor.updateZoneType(this.value)">
                    ${zoneTypes.map(t => `<option value="${t}" ${zone.name === t ? 'selected' : ''}>${t}</option>`).join('')}
                </select>
            </div>
            <div class="property-row">
                <label>Radius</label>
                <input type="number" step="0.5" value="${zone.radius.toFixed(1)}" 
                    onchange="window.levelEditor.updateZoneRadius(this.value)">
            </div>
            <button class="editor-btn" onclick="window.levelEditor.deleteSelectedObject()">Delete</button>
        `;
    }

    buildPropPropertyHTML(prop) {
        return `
            <div class="property-row">
                <label>Size X</label>
                <input type="number" step="0.1" value="${prop.mesh.scale.x.toFixed(1)}" 
                    onchange="window.levelEditor.updatePropScale(0, this.value)">
            </div>
            <div class="property-row">
                <label>Size Y</label>
                <input type="number" step="0.1" value="${prop.mesh.scale.y.toFixed(1)}" 
                    onchange="window.levelEditor.updatePropScale(1, this.value)">
            </div>
            <div class="property-row">
                <label>Size Z</label>
                <input type="number" step="0.1" value="${prop.mesh.scale.z.toFixed(1)}" 
                    onchange="window.levelEditor.updatePropScale(2, this.value)">
            </div>
            <button class="editor-btn" onclick="window.levelEditor.deleteSelectedObject()">Delete</button>
        `;
    }

    getTotalObjectCount() {
        const { objects } = this.levelEditor;
        return (objects.player ? 1 : 0) + objects.npcs.length + objects.zones.length + objects.props.length;
    }
}