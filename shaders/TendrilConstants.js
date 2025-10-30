export const TendrilConstants = {
    // Geometry
    tubeRadius: 0.4,           // Increase to make tendrils thicker
    tubeSegments: 16,           // Segments along the tube length
    radialSegments: 8,          // Radial segments (quality)
    curvePoints: 10,            // Number of midpoints for wobble
    
    // Animation & Flow
    flowSpeed: 1.5,             // How fast noise flows through tendril
    wobbleAmount: 0.2,          // Base wobble intensity
    
    // Opacity & Blending
    baseOpacity: 0.8,           // Base alpha value (0-1)
    centerPeakOpacity: 1.0,     // Peak opacity at connection center
    fadeExponent: 2.0,          // How sharply opacity fades at edges
    
    // Growth Animation
    growthDuration: 500,        // Milliseconds to fully grow
    
    // Visual Effects
    turbulenceStrength: 1.0,    // Multiplier for conflict flicker
    harmonyCohesion: 0.5,       // How much harmonious interactions blend
    drainingFlow: 2.0,          // Intensity of draining flow effect
    conflictFlicker: 10.0,      // Speed of conflict flicker
    
    // Color Blending
    colorBlendMode: 'mix',      // 'mix' for linear blend, could expand
    colorIntensity: 2.5,         // Boost to make colors more vibrant

    // Connection Logic
    connectionThreshold: 0.3,
    connectionDistance: 30
};