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
        return `
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
            <button class="editor-btn" onclick="window.levelEditor.deleteSelectedObject()">Delete</button>
        `;
    }

    buildZonePropertyHTML(zone) {
        const { ZonePresets } = await import('../levels/ZonePresets.js');
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

