export class EmotionalState {
    constructor() {
        // Core emotional axes (range: -1 to 1)
        this.valence = 0;           // Positive ↔ Negative
        this.arousal = 0;           // High ↔ Low energy
        this.socialConnectedness = 0; // Connected ↔ Isolated
        
        // Decay rates (how fast emotions return to neutral)
        this.valenceDecay = 0.1;
        this.arousalDecay = 0.5;
        this.connectionDecay = 0.3;
    }
    
    update(deltaTime) {
        // Natural decay toward neutral state
        this.valence = this.decayTowardZero(this.valence, this.valenceDecay, deltaTime);
        this.arousal = this.decayTowardZero(this.arousal, this.arousalDecay, deltaTime);
        this.socialConnectedness = this.decayTowardZero(this.socialConnectedness, this.connectionDecay, deltaTime);
    }
    
    decayTowardZero(value, decayRate, deltaTime) {
        if (Math.abs(value) < 0.01) return 0;
        
        const sign = Math.sign(value);
        const decayed = Math.abs(value) - (decayRate * deltaTime);
        
        return decayed > 0 ? sign * decayed : 0;
    }
    
    modify(valenceChange, arousalChange, connectionChange) {
        this.valence = this.clamp(this.valence + valenceChange, -1, 1);
        this.arousal = this.clamp(this.arousal + arousalChange, -1, 1);
        this.socialConnectedness = this.clamp(this.socialConnectedness + connectionChange, -1, 1);
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

