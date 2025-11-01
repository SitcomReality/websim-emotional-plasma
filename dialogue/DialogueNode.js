import { PlayerResponse } from './PlayerResponse.js';

export class DialogueNode {
    constructor(id, data) {
        this.id = id;
        this.text = data.text || '';
        this.conditions = data.conditions || [];
        this.responses = (data.responses || []).map(resData => new PlayerResponse(resData));
    }

    checkConditions(npc) {
        if (this.conditions.length === 0) {
            return true;
        }

        return this.conditions.every(cond => {
            switch (cond.type) {
                case 'state':
                    const stateValue = npc.emotionalState[cond.dimension];
                    return stateValue >= cond.range[0] && stateValue <= cond.range[1];
                // Add other condition types here later (e.g., quest progress)
                default:
                    return true;
            }
        });
    }
}