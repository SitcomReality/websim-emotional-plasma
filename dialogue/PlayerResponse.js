export class PlayerResponse {
    constructor(data) {
        this.text = data.text || '(Continue)';
        this.effects = data.effects || [];
        this.nextNodeId = data.nextNodeId || 'end';
    }

    applyEffects(player, npc) {
        this.effects.forEach(effect => {
            const target = effect.target === 'player' ? player : npc;
            if (target && target.emotionalState) {
                const current = target.emotionalState[effect.dimension] || 0;
                const change = effect.value;
                
                let newValue = current + change;
                if (effect.operation === 'set') {
                    newValue = change;
                }

                target.emotionalState[effect.dimension] = Math.max(-1, Math.min(1, newValue));
            }
        });
    }
}