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
        // Smoothly map emotional state to HSL color to avoid abrupt switches.
        // Hue: interpolate from blue (~240) at valence=-1 through neutral (~120) at valence=0 to warm (~45) at valence=+1.
        // This creates a continuous gradient across the valence axis.
        const hueNegative = 240; // cool
        const hueNeutral = 120;  // neutral midpoint (teal/greenish)
        const huePositive = 45;  // warm

        let hue;
        if (this.valence < 0) {
            const t = (this.valence + 1) / 1.0; // map [-1,0) -> [0,1)
            // interpolate from hueNegative -> hueNeutral
            hue = hueNegative * (1 - t) + hueNeutral * t;
        } else {
            const t = this.valence / 1.0; // map [0,1] -> [0,1]
            // interpolate from hueNeutral -> huePositive
            hue = hueNeutral * (1 - t) + huePositive * t;
        }

        // Saturation increases with absolute arousal for more vivid colors when energized
        const baseSaturation = 40;
        const sat = baseSaturation + Math.min(60, Math.abs(this.arousal) * 60);

        // Lightness adjusted by social connectedness for perceived warmth/brightness
        const baseLightness = 45;
        const light = baseLightness + (this.socialConnectedness * 20);

        return { h: hue, s: sat, l: light };
    }
}