// New: shader tuning constants extracted for clarity and reuse
export const PlasmaConstants = {
    baseAlpha: 0.3,
    emotionalAlphaRange: 0.7,
    noiseAlphaInfluence: 0.8,
    falloffStart: 0.65,                 // Increased from 0.4 - plasma fades sooner
    falloffEnd: 0.15,                   // Increased from 0.1 - sharper edge
    baseEmissive: 0.2,
    arousalEmissiveRange: 0.3,
    noiseFBMLayers: 4,
    colorSaturation: 0.5,
    arousalSaturation: 0.5,
    flowStrength: 2.5,
    flowVisualIntensity: 0.8,
    maxInfluencingBalls: 4
};