export const TendrilConstants = {
    // Geometry & Shape
    tendrilWidth: 1.5,          // The width of the plane the tendril is drawn on.
    noiseScale: 4.0,            // How zoomed-in the plasma noise is. Higher is more detailed.
    edgeSoftness: 3.0,          // How soft the edges of the tendril are. Higher is softer.
    
    // Animation & Flow
    flowSpeed: 0.4,             // How fast noise flows through tendril
    wobbleAmount: 0.1,          // Base wobble intensity (no longer used for geometry)
    
    // Opacity & Blending
    baseOpacity: 0.03,          // Very low base alpha so background is mostly transparent
    centerPeakOpacity: 1.2,     // Peak opacity at connection center (applies to noise peaks)
    fadeExponent: 3.0,          // How sharply opacity fades at the connection points
    
    // Growth Animation
    growthDuration: 500,        // Milliseconds to fully grow
    
    // Visual Effects
    turbulenceStrength: 1.0,    // Multiplier for conflict flicker
    harmonyCohesion: 0.5,       // How much harmonious interactions blend
    drainingFlow: 1.5,          // Intensity of draining flow effect
    conflictFlicker: 10.0,      // Speed of conflict flicker
    
    // Color Blending
    colorBlendMode: 'mix',      // 'mix' for linear blend, could expand
    colorIntensity: 2.2,         // Boost to make colors more vibrant

    // Connection Logic
    connectionThreshold: 0.1,
    connectionDistance: 10
};