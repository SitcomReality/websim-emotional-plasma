// Emotional decay and accrual constants for granular tuning
export const EmotionalConstants = {
    // Decay rates (how quickly emotions return to neutral when not influenced)
    // Lower = slower decay (emotions last longer)
    decay: {
        valence: 0.01,        // How fast positive/negative fades
        arousal: 0.01,        // How fast energy level normalizes
        connectedness: 0.02   // How fast connection feeling fades
    },
    
    // Accrual rates (how quickly emotions build up from interactions)
    // Higher = faster accumulation
    accrual: {
        valence: 1.0,         // How quickly valence changes from interactions
        arousal: 1.2,         // How quickly arousal spikes/drops
        connectedness: 0.8    // How quickly connection builds
    },
    
    // Separate rates for positive vs negative changes (optional fine-tuning)
    decayAsymmetry: {
        valencePositive: 1.0,  // Multiplier for positive valence decay (1.0 = same as negative)
        valenceNegative: 1.0,
        arousalPositive: 1.0,
        arousalNegative: 1.0,
        connectednessPositive: 1.0,
        connectednessNegative: 1.0
    },
    
    // Minimum threshold before emotions snap to zero
    minimumThreshold: 0.01
};

export class EmotionalState {
    constructor() {
        // Core emotional axes (range: -1 to 1)
        this.valence = 0;           // Positive ↔ Negative
        this.arousal = 0;           // High ↔ Low energy
        this.socialConnectedness = 0; // Connected ↔ Isolated
        
        // Individual decay rates (can be modified per-ball)
        this.valenceDecayRate = EmotionalConstants.decay.valence;
        this.arousalDecayRate = EmotionalConstants.decay.arousal;
        this.connectednessDecayRate = EmotionalConstants.decay.connectedness;
        
        // Individual accrual rates (can be modified per-ball)
        this.valenceAccrualRate = EmotionalConstants.accrual.valence;
        this.arousalAccrualRate = EmotionalConstants.accrual.arousal;
        this.connectednessAccrualRate = EmotionalConstants.accrual.connectedness;
    }
    
    update(deltaTime) {
        // Natural decay toward neutral state
        this.valence = this.decayTowardZero(
            this.valence,
            this.valenceDecayRate,
            deltaTime,
            EmotionalConstants.decayAsymmetry.valencePositive,
            EmotionalConstants.decayAsymmetry.valenceNegative
        );
        
        this.arousal = this.decayTowardZero(
            this.arousal,
            this.arousalDecayRate,
            deltaTime,
            EmotionalConstants.decayAsymmetry.arousalPositive,
            EmotionalConstants.decayAsymmetry.arousalNegative
        );
        
        this.socialConnectedness = this.decayTowardZero(
            this.socialConnectedness,
            this.connectednessDecayRate,
            deltaTime,
            EmotionalConstants.decayAsymmetry.connectednessPositive,
            EmotionalConstants.decayAsymmetry.connectednessNegative
        );
    }
    
    decayTowardZero(value, baseDecayRate, deltaTime, positiveMultiplier, negativeMultiplier) {
        if (Math.abs(value) < EmotionalConstants.minimumThreshold) return 0;
        
        const sign = Math.sign(value);
        const asymmetryMultiplier = sign > 0 ? positiveMultiplier : negativeMultiplier;
        const decayAmount = baseDecayRate * asymmetryMultiplier * deltaTime;
        const decayed = Math.abs(value) - decayAmount;
        
        return decayed > 0 ? sign * decayed : 0;
    }
    
    modify(valenceChange, arousalChange, connectionChange) {
        // Apply accrual rates to incoming changes for more control
        this.valence = this.clamp(this.valence + (valenceChange * this.valenceAccrualRate), -1, 1);
        this.arousal = this.clamp(this.arousal + (arousalChange * this.arousalAccrualRate), -1, 1);
        this.socialConnectedness = this.clamp(this.socialConnectedness + (connectionChange * this.connectednessAccrualRate), -1, 1);
    }
    
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    
    getColor() {
        // Map emotional state to color
        // Positive valence: warm colors (yellow-orange)
        // Negative valence: cool colors (blue-purple)
        const hue = this.valence > 0 
            ? 30 + (this.valence * 30)  // 30-60 (yellow-orange)
            : 240 - (this.valence * 60); // 180-240 (cyan-blue)
        
        const saturation = 50 + (Math.abs(this.arousal) * 50);
        const lightness = 50 + (this.socialConnectedness * 20);
        
        return { h: hue, s: saturation, l: lightness };
    }
}