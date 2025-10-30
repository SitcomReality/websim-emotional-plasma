import * as THREE from 'three';

// Shader tuning constants for easier adjustment
export const PlasmaConstants = {
    // Alpha/Opacity
    baseAlpha: 0.3,              // Minimum alpha when emotional strength is low
    emotionalAlphaRange: 0.7,    // Additional alpha based on emotional strength (0.3 + 0.7 = 1.0 max)
    noiseAlphaInfluence: 0.8,    // How much noise pattern affects alpha variation
    
    // Radial falloff
    falloffStart: 0.4,           // Where radial gradient begins (0 = center, 1 = edge)
    falloffEnd: 0.1,             // Where radial gradient ends
    
    // Emissive/Brightness
    baseEmissive: 0.2,           // Base emission intensity
    arousalEmissiveRange: 0.3,   // Additional emission based on arousal
    
    // Noise/Plasma motion
    noiseFBMLayers: 4,           // Number of noise octaves (quality vs performance)
    
    // Color intensity
    colorSaturation: 0.5,        // Base saturation multiplier
    arousalSaturation: 0.5,      // Additional saturation from arousal
    
    // Inter-ball flow - SIGNIFICANTLY INCREASED
    flowStrength: 2.5,           // Increased from 0.8 to 2.5
    flowVisualIntensity: 0.8,    // How much to brighten flow regions
    maxInfluencingBalls: 4
};

export { PlasmaConstants } from './PlasmaConstants.js';
export { snoise, fbm } from './PlasmaNoise.js';
export { createPlasmaShaderMaterial, PlasmaShader } from './PlasmaMaterial.js';