export class EmotionalStateMachine {
    constructor(emotionalState) {
        this.emotionalState = emotionalState;
        this.currentState = null;
        this.previousState = null;
        this.stateChangeTime = 0;

        // Define emotional states with their characteristics
        this.states = {
            joyous: { valence: [0.5, 1], arousal: [0.5, 1], connection: [0.3, 1] },
            anxious: { valence: [-1, -0.3], arousal: [0.5, 1], connection: [-1, -0.3] },
            depressed: { valence: [-1, -0.5], arousal: [-1, -0.3], connection: [-1, -0.3] },
            calm: { valence: [0.3, 1], arousal: [-1, -0.3], connection: [0.2, 1] },
            agitated: { valence: [-1, -0.2], arousal: [0.5, 1], connection: [0.2, 1] },
            melancholic: { valence: [-0.5, 0.3], arousal: [-1, -0.2], connection: [-0.5, 0.5] },
            energetic: { valence: [0.4, 1], arousal: [0.6, 1], connection: [-0.5, 0.5] },
            withdrawn: { valence: [-1, 0.5], arousal: [-1, -0.2], connection: [-1, -0.4] }
        };
    }

    update(deltaTime) {
        this.previousState = this.currentState;
        this.currentState = this.determineState();

        if (this.currentState !== this.previousState) {
            this.stateChangeTime = 0;
        } else {
            this.stateChangeTime += deltaTime;
        }

        // Apply state-specific modifiers
        this.applyStateModifiers(deltaTime);
    }

    determineState() {
        const v = this.emotionalState.valence;
        const a = this.emotionalState.arousal;
        const c = this.emotionalState.socialConnectedness;

        let bestMatch = null;
        let bestScore = -Infinity;

        for (const [stateName, ranges] of Object.entries(this.states)) {
            const score = this.calculateStateMatch(v, a, c, ranges);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = stateName;
            }
        }

        return bestMatch;
    }

    calculateStateMatch(valence, arousal, connection, ranges) {
        let score = 0;

        // Check if within valence range
        if (valence >= ranges.valence[0] && valence <= ranges.valence[1]) {
            score += 1;
        } else {
            const distance = Math.min(
                Math.abs(valence - ranges.valence[0]),
                Math.abs(valence - ranges.valence[1])
            );
            score -= distance;
        }

        // Check if within arousal range
        if (arousal >= ranges.arousal[0] && arousal <= ranges.arousal[1]) {
            score += 1;
        } else {
            const distance = Math.min(
                Math.abs(arousal - ranges.arousal[0]),
                Math.abs(arousal - ranges.arousal[1])
            );
            score -= distance;
        }

        // Check if within connection range
        if (connection >= ranges.connection[0] && connection <= ranges.connection[1]) {
            score += 1;
        } else {
            const distance = Math.min(
                Math.abs(connection - ranges.connection[0]),
                Math.abs(connection - ranges.connection[1])
            );
            score -= distance;
        }

        return score;
    }

    applyStateModifiers(deltaTime) {
        // State-specific modifiers that influence how emotions change
        const modifiers = {
            joyous: { valenceDecay: 0.3, arousalDecay: 0.6, connectionDecay: 0.2 },
            anxious: { valenceDecay: 0.9, arousalDecay: 0.4, connectionDecay: 0.5 },
            depressed: { valenceDecay: 0.2, arousalDecay: 0.3, connectionDecay: 0.1 },
            calm: { valenceDecay: 0.2, arousalDecay: 0.3, connectionDecay: 0.2 },
            agitated: { valenceDecay: 1.2, arousalDecay: 0.7, connectionDecay: 0.4 },
            melancholic: { valenceDecay: 0.4, arousalDecay: 0.2, connectionDecay: 0.2 },
            energetic: { valenceDecay: 0.5, arousalDecay: 1.0, connectionDecay: 0.3 },
            withdrawn: { valenceDecay: 0.2, arousalDecay: 0.15, connectionDecay: 0.1 }
        };

        if (this.currentState && modifiers[this.currentState]) {
            const mod = modifiers[this.currentState];
            this.emotionalState.valenceDecay = mod.valenceDecay;
            this.emotionalState.arousalDecay = mod.arousalDecay;
            this.emotionalState.connectionDecay = mod.connectionDecay;
        }
    }

    getStateInfo() {
        return {
            currentState: this.currentState,
            previousState: this.previousState,
            stateChangeTime: this.stateChangeTime
        };
    }
}