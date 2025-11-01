export class LevelEditorExport {
    constructor(editor) {
        this.editor = editor;
    }

    exportLevel() {
        const levelData = {
            name: prompt('Level name:', 'New Level') || 'New Level',
            player: null,
            npcs: [],
            zones: [],
            staticProps: []
        };

        if (this.editor.objects.player) {
            levelData.player = {
                position: [this.editor.objects.player.position.x, this.editor.objects.player.position.y, this.editor.objects.player.position.z],
                state: {
                    valence: this.editor.objects.player.emotionalState.valence,
                    arousal: this.editor.objects.player.emotionalState.arousal,
                    connectedness: this.editor.objects.player.emotionalState.socialConnectedness
                }
            };
        }

        this.editor.objects.npcs.forEach(npc => {
            levelData.npcs.push({
                position: [npc.position.x, npc.position.y, npc.position.z],
                state: {
                    valence: npc.emotionalState.valence,
                    arousal: npc.emotionalState.arousal,
                    connectedness: npc.emotionalState.socialConnectedness
                }
            });
        });

        this.editor.objects.zones.forEach(zone => {
            levelData.zones.push({
                type: zone.name,
                position: [zone.position.x, zone.position.y, zone.position.z],
                radius: zone.radius
            });
        });

        this.editor.objects.props.forEach(prop => {
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
}