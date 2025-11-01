export class LevelEditorUI {
    constructor(editor) {
        this.editor = editor;
        this.setupUI();
    }

    setupUI() {
        // Mode buttons
        const modeButtons = document.querySelectorAll('[data-mode]');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.editor.mode = btn.dataset.mode;
            });
        });

        // File operations
        const exportBtn = document.getElementById('export-level-btn');
        const importBtn = document.getElementById('import-level-btn');
        const clearBtn = document.getElementById('clear-level-btn');

        if (exportBtn) exportBtn.addEventListener('click', () => this.editor.export.exportLevel());
        if (importBtn) importBtn.addEventListener('click', () => this.showImportUI());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearLevel());
    }

    togglePanel() {
        const panel = document.getElementById('level-editor-panel');
        if (panel) {
            panel.classList.toggle('level-editor-hidden');
        }
    }

    update() {
        this.updateObjectCount();
        this.updatePropertiesPanel();
    }

    updateObjectCount() {
        const countInfo = document.getElementById('object-count');
        if (countInfo) {
            const total = (this.editor.objects.player ? 1 : 0) + 
                         this.editor.objects.npcs.length + 
                         this.editor.objects.zones.length + 
                         this.editor.objects.props.length;
            countInfo.textContent = `Objects: ${total}`;
        }
    }

    updatePropertiesPanel() {
        const panel = document.getElementById('properties-panel');
        if (!panel) return;

        if (!this.editor.selectedObject) {
            panel.innerHTML = '<p style="color: #aaa; font-size: 12px;">Select an object to edit</p>';
            return;
        }

        panel.innerHTML = this.generatePropertiesHTML();
    }

    generatePropertiesHTML() {
        const obj = this.editor.selectedObject;
        let html = '<div class="property-panel">';

        if (obj.isPlayer || obj.isNPC) {
            html += this.generateBallPropertiesHTML(obj);
        } else if (obj.radius !== undefined) {
            html += this.generateZonePropertiesHTML(obj);
        } else if (obj.mesh) {
            html += this.generatePropPropertiesHTML(obj);
        }

        html += '</div>';
        return html;
    }

    generateBallPropertiesHTML(ball) {
        return `
            <div class="property-row">
                <label>Position X</label>
                <input type="number" step="0.1" value="${ball.position.x.toFixed(1)}" 
                    onchange="window.levelEditor.placement.updateBallPosition(0, this.value)">
            </div>
            <div class="property-row">
                <label>Position Z</label>
                <input type="number" step="0.1" value="${ball.position.z.toFixed(1)}" 
                    onchange="window.levelEditor.placement.updateBallPosition(2, this.value)">
            </div>
            <div class="property-row">
                <label>Valence</label>
                <input type="range" min="-1" max="1" step="0.1" value="${ball.emotionalState.valence}" 
                    onchange="window.levelEditor.placement.updateBallState('valence', this.value)">
                <span style="font-size: 10px; color: #888;">${parseFloat(ball.emotionalState.valence).toFixed(1)}</span>
            </div>
            <div class="property-row">
                <label>Arousal</label>
                <input type="range" min="-1" max="1" step="0.1" value="${ball.emotionalState.arousal}" 
                    onchange="window.levelEditor.placement.updateBallState('arousal', this.value)">
                <span style="font-size: 10px; color: #888;">${parseFloat(ball.emotionalState.arousal).toFixed(1)}</span>
            </div>
            <div class="property-row">
                <label>Connectedness</label>
                <input type="range" min="-1" max="1" step="0.1" value="${ball.emotionalState.socialConnectedness}" 
                    onchange="window.levelEditor.placement.updateBallState('connectedness', this.value)">
                <span style="font-size: 10px; color: #888;">${parseFloat(ball.emotionalState.socialConnectedness).toFixed(1)}</span>
            </div>
            <button class="editor-btn" onclick="window.levelEditor.selection.deleteSelectedObject()">Delete</button>
        `;
    }

    generateZonePropertiesHTML(zone) {
        const zoneTypes = Object.keys(ZonePresets);
        return `
            <div class="property-row">
                <label>Zone Type</label>
                <select onchange="window.levelEditor.placement.updateZoneType(this.value)">
                    ${zoneTypes.map(t => `<option value="${t}" ${zone.name === t ? 'selected' : ''}>${t}</option>`).join('')}
                </select>
            </div>
            <div class="property-row">
                <label>Radius</label>
                <input type="number" step="0.5" value="${zone.radius.toFixed(1)}" 
                    onchange="window.levelEditor.placement.updateZoneRadius(this.value)">
            </div>
            <button class="editor-btn" onclick="window.levelEditor.selection.deleteSelectedObject()">Delete</button>
        `;
    }

    generatePropPropertiesHTML(prop) {
        return `
            <div class="property-row">
                <label>Size X</label>
                <input type="number" step="0.1" value="${prop.mesh.scale.x.toFixed(1)}" 
                    onchange="window.levelEditor.placement.updatePropScale(0, this.value)">
            </div>
            <div class="property-row">
                <label>Size Y</label>
                <input type="number" step="0.1" value="${prop.mesh.scale.y.toFixed(1)}" 
                    onchange="window.levelEditor.placement.updatePropScale(1, this.value)">
            </div>
            <div class="property-row">
                <label>Size Z</label>
                <input type="number" step="0.1" value="${prop.mesh.scale.z.toFixed(1)}" 
                    onchange="window.levelEditor.placement.updatePropScale(2, this.value)">
            </div>
            <button class="editor-btn" onclick="window.levelEditor.selection.deleteSelectedObject()">Delete</button>
        `;
    }

    showImportUI() {
        const textarea = document.getElementById('json-import');
        const confirmBtn = document.getElementById('import-confirm-btn');
        
        if (textarea) {
            textarea.style.display = textarea.style.display === 'none' ? 'block' : 'none';
            if (confirmBtn) confirmBtn.style.display = textarea.style.display;
            if (textarea.style.display === 'block') {
                textarea.focus();
            }
        }
    }

    clearLevel() {
        if (confirm('Clear all level objects?')) {
            this.editor.import.clearLevel();
        }
    }
}

