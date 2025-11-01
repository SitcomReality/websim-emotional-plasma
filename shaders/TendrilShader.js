import * as THREE from 'three';
import { GLSL_SNOISE } from './PlasmaNoise.js';

export const TendrilShader = {
    vertexShader: `
        attribute vec3 tangent;
        varying vec2 vUv;
        varying float vDistortion;

        uniform float time;
        uniform float turbulence;

        ${GLSL_SNOISE}

        void main() {
            vUv = uv;

            // Add turbulence/flicker for conflicting states
            float displacement = snoise(vec2(position.x * 2.0 + time * 5.0, position.y * 2.0 + time * 5.0)) * 0.1 * turbulence;
            vec3 newPosition = position + normal * displacement;

            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        uniform float time;
        uniform vec3 colorA;
        uniform vec3 colorB;
        uniform float interactionType; // 0: harmonious, 1: draining A->B, 2: conflicting
        uniform float connectionStrength; // 0 to 1 for growth
        uniform float turbulence;
        uniform float distanceStrength; // 0 to 1 based on proximity (1 = closest, 0 = farthest)
        
        // Tunable constants exposed as uniforms
        uniform float flowSpeed;
        uniform float baseOpacity;
        uniform float centerPeakOpacity;
        uniform float fadeExponent;
        uniform float harmonyCohesion;
        uniform float drainingFlow;
        uniform float conflictFlicker;
        uniform float colorIntensity;
        uniform float noiseScale;
        uniform float edgeSoftness;

        // New controls for peak-based rendering
        uniform float peakThreshold;   // Noise value above which peaks begin to appear
        uniform float peakSoftness;    // Range above threshold to smooth peaks

        ${GLSL_SNOISE}

        vec3 hsl2rgb(vec3 c) {
            vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
            return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
        }

        void main() {
            // Growth animation: shortens the visible area of the tendril
            float halfLength = connectionStrength * 0.5;
            if (vUv.y < 0.5 - halfLength || vUv.y > 0.5 + halfLength) {
                discard;
            }

            // Create plasma noise (two opposing flows for internal movement)
            vec2 noiseCoord1 = vec2((vUv.x - 0.5) * noiseScale, vUv.y * noiseScale - time * flowSpeed);
            vec2 noiseCoord2 = vec2((0.5 - vUv.x) * noiseScale, vUv.y * noiseScale + time * flowSpeed * 0.8);

            float noise1 = fbm(noiseCoord1, time * 0.1);
            float noise2 = fbm(noiseCoord2, time * 0.1);
            float noisePattern = noise1 * 0.55 + noise2 * 0.45;

            // Shape the tendril and soften its edges using noise
            float distanceFromCenter = abs(vUv.x - 0.5) * 2.0; // 0 at center, 1 at edge
            float tendrilShape = 1.0 - pow(distanceFromCenter, edgeSoftness);
            float noisyEdge = tendrilShape - (fbm(vUv * 5.0, time * 0.2) * 0.15);

            // Fade ends of the tendril
            float lengthFade = pow(1.0 - abs(vUv.y - 0.5) * 2.0, fadeExponent);

            // Map noise into a peak mask: only high peaks produce visible alpha/color
            // peakMask goes from 0.0 to 1.0 where noisePattern > peakThreshold, smoothed by peakSoftness
            float peakMask = smoothstep(peakThreshold, peakThreshold + peakSoftness, noisePattern);

            // Combine shape, peak mask and length fade to compute final alpha
            float peakAlpha = peakMask * noisyEdge * lengthFade;

            // Add a tiny ambient base so very low glow can be seen if desired
            float ambient = baseOpacity * 0.5;
            float alpha = max(ambient * connectionStrength, peakAlpha * centerPeakOpacity * connectionStrength);

            // Distance strength modulates the overall opacity: closer = stronger
            alpha *= mix(0.2, 1.0, distanceStrength);

            // Color blending based on interaction type
            vec3 finalColor;
            if (interactionType < 0.5) { // Harmonious
                finalColor = mix(colorA, colorB, vUv.y);
                // increase coherence slightly
                finalColor = mix(finalColor, mix(colorA, colorB, 0.5), harmonyCohesion * peakMask);
            } else if (interactionType < 1.5) { // Draining A -> B
                finalColor = mix(colorA, colorB, vUv.y);
                // directional tint
                finalColor = mix(finalColor, colorB, drainingFlow * 0.2 * peakMask);
            } else { // Conflicting
                finalColor = mix(colorA, colorB, vUv.y);
                // flicker reduces alpha periodically for instability
                if (mod(time * conflictFlicker, 1.0) < 0.5) {
                    alpha *= 0.75;
                }
            }

            // Only color where peaks exist; scale color by noisePattern so higher peaks are brighter
            vec3 plasmaColor = finalColor * (0.5 + noisePattern * 0.8) * colorIntensity;

            // Tone down color away from center for soft edges
            plasmaColor *= smoothstep(1.0, 0.0, distanceFromCenter);

            gl_FragColor = vec4(plasmaColor, alpha);
        }
    `
};

export function createTendrilMaterial() {
    return new THREE.ShaderMaterial({
        vertexShader: TendrilShader.vertexShader,
        fragmentShader: TendrilShader.fragmentShader,
        uniforms: {
            time: { value: 0.0 },
            colorA: { value: new THREE.Color(0xffffff) },
            colorB: { value: new THREE.Color(0xffffff) },
            interactionType: { value: 0.0 }, // 0: harmonious, 1: draining, 2: conflicting
            connectionStrength: { value: 0.0 },
            turbulence: { value: 0.0 },
            distanceStrength: { value: 1.0 },
            // Tunable uniforms
            flowSpeed: { value: 1.5 },
            baseOpacity: { value: 0.03 },
            centerPeakOpacity: { value: 1.2 },
            fadeExponent: { value: 3.0 },
            harmonyCohesion: { value: 0.5 },
            drainingFlow: { value: 1.5 },
            conflictFlicker: { value: 10.0 },
            colorIntensity: { value: 2.2 },
            noiseScale: { value: 4.0 },
            edgeSoftness: { value: 3.0 },
            // Peak-specific controls
            peakThreshold: { value: 0.15 }, // tune between -1..1 (fbm typically in ~[-1,1], choose small positive)
            peakSoftness: { value: 0.18 }   // smooth width above threshold
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
}