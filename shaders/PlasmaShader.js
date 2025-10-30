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
    arousalSaturation: 0.5       // Additional saturation from arousal
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

        // Radial noise that spirals outward from center
        float radialFBM(vec2 p, float timeOffset) {
            // Convert to polar coordinates centered at 0.5, 0.5
            vec2 center = p - vec2(0.5);
            float angle = atan(center.y, center.x);
            float dist = length(center);
            
            // Create spiraling effect
            float spiral = angle + dist * 3.0 - timeOffset * 0.5;
            
            // Sample noise in polar space
            vec2 polarCoord = vec2(spiral, dist);
            
            float value = 0.0;
            float amplitude = 0.6;
            float frequency = 1.2;

            for(int i = 0; i < 3; i++) {
                value += amplitude * snoise(polarCoord * frequency + vec2(timeOffset * 0.3, 0.0));
                frequency *= 1.8;
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

            // Use radial noise for billboards
            float radialNoise = radialFBM(vUv, timeScale);
            float noise1 = fbm(vUv * spread + vec2(timeScale * 0.5, 0.0), timeScale);
            
            // Blend radial (emanating) and flat noise
            float plasmaPattern = radialNoise * 0.6 + noise1 * 0.4;

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

        // Radial noise that spirals outward from center
        float radialFBM(vec2 p, float timeOffset) {
            // Convert to polar coordinates centered at 0.5, 0.5
            vec2 center = p - vec2(0.5);
            float angle = atan(center.y, center.x);
            float dist = length(center);
            
            // Create spiraling effect
            float spiral = angle + dist * 3.0 - timeOffset * 0.5;
            
            // Sample noise in polar space
            vec2 polarCoord = vec2(spiral, dist);
            
            float value = 0.0;
            float amplitude = 0.6;
            float frequency = 1.2;

            for(int i = 0; i < 3; i++) {
                value += amplitude * snoise(polarCoord * frequency + vec2(timeOffset * 0.3, 0.0));
                frequency *= 1.8;
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

            // Use radial noise for billboards
            float radialNoise = radialFBM(vUv, timeScale);
            float noise1 = fbm(vUv * 1.5 + vec2(timeScale * 0.5, 0.0), timeScale);
            
            // Blend radial (emanating) and flat noise for depth
            float plasmaPattern = radialNoise * 0.7 + noise1 * 0.3;

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
    ` : PlasmaShader.fragmentShader;

    return new THREE.ShaderMaterial({
        vertexShader: PlasmaShader.vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
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
        },
        side: THREE.FrontSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
}