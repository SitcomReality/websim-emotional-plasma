import * as THREE from 'three';

// Shader tuning constants for easier adjustment
export const PlasmaConstants = {
    // Alpha/Opacity
    baseAlpha: 0.3,              // Minimum alpha when emotional strength is low
    emotionalAlphaRange: 0.7,    // Additional alpha based on emotional strength (0.3 + 0.7 = 1.0 max)
    noiseAlphaInfluence: 0.8,    // How much noise pattern affects alpha variation
    
    // Radial falloff
    falloffStart: 0.5,           // Where radial gradient begins (0 = center, 1 = edge)
    falloffEnd: 0.3,             // Where radial gradient ends
    
    // Emissive/Brightness
    baseEmissive: 0.2,           // Base emission intensity
    arousalEmissiveRange: 0.3,   // Additional emission based on arousal
    
    // Noise/Plasma motion
    noiseFBMLayers: 4,           // Number of noise octaves (quality vs performance)
    
    // Color intensity
    colorSaturation: 0.5,        // Base saturation multiplier
    arousalSaturation: 0.5,      // Additional saturation from arousal
    
    // Inter-ball flow
    flowStrength: 0.8,           // How strongly plasma flows toward nearby balls
    maxInfluencingBalls: 4       // Maximum number of nearby balls to consider
};

export const PlasmaShader = {
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
            vUv = uv;
            vPosition = position;
            vNormal = normal;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    fragmentShader: `
        uniform float time;
        uniform float valence;
        uniform float arousal;
        uniform float connectedness;
        uniform vec3 baseColor;
        uniform float plasmaIntensity;
        uniform float baseAlpha;
        uniform float emotionalAlphaRange;
        uniform float noiseAlphaInfluence;
        uniform float falloffStart;
        uniform float falloffEnd;
        uniform float baseEmissive;
        uniform float arousalEmissiveRange;
        uniform float colorSaturation;
        uniform float arousalSaturation;

        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;

        // Simplex noise function
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187,
                                0.366025403784439,
                               -0.577350269189626,
                                0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod289(i);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m ;
            m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        float fbm(vec2 p, float timeOffset) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;

            for(int i = 0; i < 4; i++) {
                value += amplitude * snoise(p * frequency + timeOffset);
                frequency *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        vec3 hsl2rgb(vec3 c) {
            vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
            return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
        }

        void main() {
            float speed = 0.3 + abs(arousal) * 0.7;
            float timeScale = time * speed;
            float spread = 1.0 + (connectedness * 0.5 + 0.5) * 2.0;

            vec2 noiseCoord = vUv * spread;
            float noise1 = fbm(noiseCoord + vec2(timeScale * 0.5, 0.0), timeScale);
            float noise2 = fbm(noiseCoord + vec2(0.0, timeScale * 0.3), timeScale * 1.3);
            float noise3 = fbm(noiseCoord * 2.0 - vec2(timeScale * 0.2), timeScale * 0.7);

            float plasmaPattern = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;

            float hue;
            if (valence > 0.0) {
                hue = (30.0 + valence * 30.0) / 360.0;
            } else {
                hue = (240.0 + valence * 60.0) / 360.0;
            }

            float saturation = colorSaturation + abs(arousal) * arousalSaturation;
            float lightness = 0.5 + connectedness * 0.2;

            hue += plasmaPattern * 0.05;
            lightness += plasmaPattern * 0.1;

            vec3 hslColor = vec3(hue, saturation, lightness);
            vec3 rgbColor = hsl2rgb(hslColor);

            // Radial falloff from center
            float dist = distance(vUv, vec2(0.5));
            
            // Emotional strength affects overall opacity
            float emotionalStrength = (abs(valence) + abs(arousal) + abs(connectedness)) / 3.0;
            
            // Plasma swirls with intensity control
            float plasmaAlpha = smoothstep(falloffStart, falloffEnd, dist) * (baseAlpha + emotionalStrength * emotionalAlphaRange);
            
            // Add noise-based variation to alpha
            float noiseAlpha = (plasmaPattern * noiseAlphaInfluence + (1.0 - noiseAlphaInfluence)) * plasmaAlpha;
            
            float alpha = noiseAlpha * plasmaIntensity;

            float emissive = baseEmissive + abs(arousal) * arousalEmissiveRange;
            rgbColor = mix(rgbColor, rgbColor * 1.5, emissive);

            gl_FragColor = vec4(rgbColor, alpha);
        }
    `
};

export function createPlasmaShaderMaterial(emotionalState, isBillboard = false) {
    const fragmentShader = isBillboard ? `
        uniform float time;
        uniform float valence;
        uniform float arousal;
        uniform float connectedness;
        uniform vec3 baseColor;
        uniform float plasmaIntensity;
        uniform float baseAlpha;
        uniform float emotionalAlphaRange;
        uniform float noiseAlphaInfluence;
        uniform float falloffStart;
        uniform float falloffEnd;
        uniform float baseEmissive;
        uniform float arousalEmissiveRange;
        uniform float colorSaturation;
        uniform float arousalSaturation;
        uniform vec3 ballWorldPos;
        uniform vec3 nearbyBalls[4];
        uniform int nearbyBallCount;
        uniform float flowStrength;

        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;

        // Simplex noise function
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187,
                                0.366025403784439,
                               -0.577350269189626,
                                0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod289(i);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m ;
            m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
        }

        float fbm(vec2 p, float timeOffset) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 1.0;

            for(int i = 0; i < 4; i++) {
                value += amplitude * snoise(p * frequency + timeOffset);
                frequency *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        vec3 hsl2rgb(vec3 c) {
            vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
            return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
        }

        void main() {
            // Center point in UV space
            vec2 center = vec2(0.5, 0.5);
            vec2 toCenter = vUv - center;
            float dist = length(toCenter);
            float angle = atan(toCenter.y, toCenter.x);
            
            // Speed based on arousal
            float speed = 0.3 + abs(arousal) * 0.7;
            float timeScale = time * speed;
            
            // Unique seed per ball based on world position
            vec2 ballSeed = ballWorldPos.xz * 0.1;
            
            // Radial coordinate system - emanating from center
            float radius = dist * 2.0;
            
            // Spiral pattern - combines angle and radius
            float spiral = angle + radius * 3.0;
            
            // Multiple noise layers with radial/spiral motion
            // Layer 1: Outward expansion
            vec2 radialCoord1 = toCenter * 3.0 + ballSeed;
            float noise1 = fbm(radialCoord1 - vec2(timeScale * 0.6, 0.0), timeScale + ballSeed.x);
            
            // Layer 2: Spiral swirl
            vec2 spiralCoord = vec2(spiral + timeScale * 0.8, radius * 2.0) + ballSeed;
            float noise2 = fbm(spiralCoord, timeScale * 1.2 + ballSeed.y);
            
            // Layer 3: Turbulent expansion
            vec2 radialCoord2 = toCenter * 5.0 + vec2(timeScale * 0.4) + ballSeed;
            float noise3 = fbm(radialCoord2, timeScale * 0.9 + ballSeed.x * 2.0);
            
            // Calculate flow toward nearby balls
            vec2 flowVector = vec2(0.0);
            float totalFlowStrength = 0.0;
            
            for(int i = 0; i < 4; i++) {
                if(i >= nearbyBallCount) break;
                
                vec3 nearbyPos = nearbyBalls[i];
                // Project nearby ball direction onto billboard plane
                vec2 toBall = nearbyPos.xz - ballWorldPos.xz;
                float ballDist = length(toBall);
                
                if(ballDist > 0.1 && ballDist < 10.0) {
                    vec2 direction = normalize(toBall);
                    // Stronger pull when closer
                    float strength = 1.0 - (ballDist / 10.0);
                    // More pull at edges of billboard
                    float edgePull = smoothstep(0.2, 0.6, dist);
                    flowVector += direction * strength * edgePull;
                    totalFlowStrength += strength * edgePull;
                }
            }
            
            // Apply flow to noise coordinates
            if(totalFlowStrength > 0.0) {
                flowVector = normalize(flowVector) * min(totalFlowStrength, 1.0) * flowStrength;
                radialCoord1 += flowVector * 2.0;
                spiralCoord += flowVector * 1.5;
                
                // Recalculate noise with flow
                noise1 = fbm(radialCoord1 - vec2(timeScale * 0.6, 0.0), timeScale + ballSeed.x);
                noise2 = fbm(spiralCoord, timeScale * 1.2 + ballSeed.y);
            }
            
            // Combine noise layers with radial weighting
            float centerWeight = 1.0 - smoothstep(0.0, 0.5, dist);
            float edgeWeight = smoothstep(0.3, 0.8, dist);
            
            float plasmaPattern = 
                noise1 * 0.4 * (1.0 + centerWeight * 0.5) +
                noise2 * 0.35 * (1.0 + edgeWeight * 0.3) +
                noise3 * 0.25;
            
            // Enhanced flow regions
            if(totalFlowStrength > 0.2) {
                plasmaPattern += totalFlowStrength * 0.3;
            }

            // Color based on emotional state
            float hue;
            if (valence > 0.0) {
                hue = (30.0 + valence * 30.0) / 360.0;
            } else {
                hue = (240.0 + valence * 60.0) / 360.0;
            }

            float saturation = colorSaturation + abs(arousal) * arousalSaturation;
            float lightness = 0.5 + connectedness * 0.2;

            hue += plasmaPattern * 0.05;
            lightness += plasmaPattern * 0.15;

            vec3 hslColor = vec3(hue, saturation, lightness);
            vec3 rgbColor = hsl2rgb(hslColor);
            
            // Emotional strength affects overall opacity
            float emotionalStrength = (abs(valence) + abs(arousal) + abs(connectedness)) / 3.0;
            
            // Radial falloff - stronger at center
            float radialFalloff = smoothstep(falloffStart, falloffEnd, dist);
            
            // Combine plasma pattern with radial falloff
            float plasmaAlpha = radialFalloff * (baseAlpha + emotionalStrength * emotionalAlphaRange);
            
            // Add noise-based variation
            float noiseAlpha = mix(plasmaAlpha, plasmaAlpha * (plasmaPattern + 1.0) * 0.5, noiseAlphaInfluence);
            
            // Brighten flow regions
            if(totalFlowStrength > 0.1) {
                noiseAlpha += totalFlowStrength * 0.2 * radialFalloff;
            }
            
            float alpha = noiseAlpha * plasmaIntensity;

            // Emissive glow
            float emissive = baseEmissive + abs(arousal) * arousalEmissiveRange;
            rgbColor = mix(rgbColor, rgbColor * 1.8, emissive);
            
            // Extra brightness in flow regions
            if(totalFlowStrength > 0.15) {
                rgbColor *= 1.0 + totalFlowStrength * 0.4;
            }

            gl_FragColor = vec4(rgbColor, alpha);
        }
    ` : PlasmaShader.fragmentShader;

    const uniforms = {
        time: { value: 0.0 },
        valence: { value: emotionalState.valence },
        arousal: { value: emotionalState.arousal },
        connectedness: { value: emotionalState.socialConnectedness },
        baseColor: { value: new THREE.Color(0xffffff) },
        plasmaIntensity: { value: 1.5 },
        baseAlpha: { value: PlasmaConstants.baseAlpha },
        emotionalAlphaRange: { value: PlasmaConstants.emotionalAlphaRange },
        noiseAlphaInfluence: { value: PlasmaConstants.noiseAlphaInfluence },
        falloffStart: { value: PlasmaConstants.falloffStart },
        falloffEnd: { value: PlasmaConstants.falloffEnd },
        baseEmissive: { value: PlasmaConstants.baseEmissive },
        arousalEmissiveRange: { value: PlasmaConstants.arousalEmissiveRange },
        colorSaturation: { value: PlasmaConstants.colorSaturation },
        arousalSaturation: { value: PlasmaConstants.arousalSaturation }
    };

    // Add billboard-specific uniforms
    if (isBillboard) {
        uniforms.ballWorldPos = { value: new THREE.Vector3(0, 0, 0) };
        uniforms.nearbyBalls = { value: [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0)
        ]};
        uniforms.nearbyBallCount = { value: 0 };
        uniforms.flowStrength = { value: PlasmaConstants.flowStrength };
    }

    return new THREE.ShaderMaterial({
        vertexShader: PlasmaShader.vertexShader,
        fragmentShader: fragmentShader,
        uniforms: uniforms,
        side: THREE.FrontSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
}