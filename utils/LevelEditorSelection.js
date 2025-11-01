export class LevelEditorSelection {
    constructor(editor) {
        this.editor = editor;
    }

    selectObject(position) {
        // Raycast to find nearest object
        this.editor.raycaster.setFromCamera(this.editor.mouse, this.editor.camera);

        const allMeshes = [];
        if (this.editor.objects.player) allMeshes.push(this.editor.objects.player.mesh);
        this.editor.objects.npcs.forEach(npc => allMeshes.push(npc.mesh));
        this.editor.objects.zones.forEach(zone => {
            if (zone.mesh) allMeshes.push(zone.mesh);
        });
        this.editor.objects.props.forEach(prop => {
            if (prop.mesh) allMeshes.push(prop.mesh);
        });

        const intersects = this.editor.raycaster.intersectObjects(allMeshes);
        if (intersects.length > 0) {
            const mesh = intersects[0].object;
            this.editor.selectedObject = this.findObjectByMesh(mesh);
        }
    }

    findObjectByMesh(mesh) {
        if (this.editor.objects.player?.mesh === mesh) return this.editor.objects.player;
        for (const npc of this.editor.objects.npcs) {
            if (npc.mesh === mesh) return npc;
        }
        for (const zone of this.editor.objects.zones) {
            if (zone.mesh === mesh) return zone;
        }
        for (const prop of this.editor.objects.props) {
            if (prop.mesh === mesh) return prop;
        }
        return null;
    }

    deleteSelectedObject() {
        if (!this.editor.selectedObject) return;

        if (this.editor.selectedObject.isPlayer && this.editor.selectedObject === this.editor.objects.player) {
            this.editor.objects.player.destroy();
            this.editor.objects.player = null;
        } else if (this.editor.selectedObject.isNPC) {
            const idx = this.editor.objects.npcs.indexOf(this.editor.selectedObject);
            if (idx > -1) {
                this.editor.objects.npcs[idx].destroy();
                this.editor.objects.npcs.splice(idx, 1);
            }
        } else if (this.editor.selectedObject.radius !== undefined) {
            const idx = this.editor.objects.zones.indexOf(this.editor.selectedObject);
            if (idx > -1) {
                this.editor.objects.zones[idx].destroy(this.editor.scene);
                this.editor.objects.zones.splice(idx, 1);
            }
        } else if (this.editor.selectedObject.mesh) {
            const idx = this.editor.objects.props.indexOf(this.editor.selectedObject);
            if (idx > -1) {
                this.editor.objects.props[idx].destroy();
                this.editor.objects.props.splice(idx, 1);
            }
        }

        this.editor.selectedObject = null;
        this.editor.updateUI();
    }
}