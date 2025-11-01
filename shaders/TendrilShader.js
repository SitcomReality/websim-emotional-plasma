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

            // Create plasma noise
            vec2 noiseCoord1 = vec2(vUv.x * noiseScale * 0.5, vUv.y * noiseScale - time * flowSpeed);
            vec2 noiseCoord2 = vec2(vUv.x * noiseScale * 0.5, vUv.y * noiseScale + time * flowSpeed * 0.8);

            float noisePattern = fbm(noiseCoord1, time * 0.1) * 0.6 + fbm(noiseCoord2, time * 0.1) * 0.4;

            // Shape the tendril and soften its edges using noise
            float distanceFromCenter = abs(vUv.x - 0.5) * 2.0; // 0 at center, 1 at edge
            float tendrilShape = 1.0 - pow(distanceFromCenter, edgeSoftness);
            float noisyEdge = tendrilShape - (fbm(vUv * 5.0, time * 0.2) * 0.2);
            float alpha = smoothstep(0.0, 0.3, noisyEdge);
            
            // Fade ends of the tendril
            float lengthFade = pow(1.0 - abs(vUv.y - 0.5) * 2.0, fadeExponent);
            alpha *= lengthFade;

            // Final opacity
            alpha = mix(baseOpacity, centerPeakOpacity, alpha);

            vec3 finalColor;

            // Blend colors and noise based on interaction type
            if (interactionType < 0.5) { // Harmonious
                finalColor = mix(colorA, colorB, vUv.y);
            } else if (interactionType < 1.5) { // Draining A -> B
                finalColor = mix(colorA, colorB, vUv.y);
            } else { // Conflicting
                finalColor = mix(colorA, colorB, vUv.y);
                // Flicker effect
                if (mod(time * conflictFlicker * 2.0, 1.0) < 0.5) {
                    alpha *= 0.7;
                }
            }
            
            // Add plasma pattern to color and brightness
            vec3 plasmaColor = finalColor + (noisePattern * 0.3);
            plasmaColor *= 1.0 + (noisePattern * 0.5);

            gl_FragColor = vec4(plasmaColor * colorIntensity, alpha * connectionStrength);
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
            // NEW: Tunable uniforms
            flowSpeed: { value: 1.5 },
            baseOpacity: { value: 0.9 },
            centerPeakOpacity: { value: 1.0 },
            fadeExponent: { value: 2.0 },
            harmonyCohesion: { value: 0.5 },
            drainingFlow: { value: 2.0 },
            conflictFlicker: { value: 10.0 },
            colorIntensity: { value: 1.2 },
            noiseScale: { value: 2.0 },
            edgeSoftness: { value: 2.0 }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
}