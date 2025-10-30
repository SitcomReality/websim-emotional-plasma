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

        ${GLSL_SNOISE}

        vec3 hsl2rgb(vec3 c) {
            vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
            return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
        }

        void main() {
            // Growth animation
            float halfLength = connectionStrength * 0.5;
            if (vUv.x < 0.5 - halfLength || vUv.x > 0.5 + halfLength) {
                discard;
            }

            // Opacity: peaks at center, fades towards ends
            float opacity = 1.0 - pow(abs(vUv.x - 0.5) * 2.0, 2.0);
            opacity = smoothstep(0.0, 1.0, opacity);

            // Internal flow noise
            float flowSpeed = 1.5;
            vec2 noiseCoord1 = vec2(vUv.x * 4.0 - time * flowSpeed, vUv.y * 2.0);
            vec2 noiseCoord2 = vec2(vUv.x * 4.0 + time * flowSpeed, vUv.y * 2.0);

            float noise1 = snoise(noiseCoord1);
            float noise2 = snoise(noiseCoord2);

            float combinedNoise = 0.0;
            vec3 finalColor;

            // Blend colors and noise based on interaction type
            if (interactionType < 0.5) { // Harmonious
                combinedNoise = (noise1 + noise2) * 0.5;
                finalColor = mix(colorA, colorB, vUv.x);
            } else if (interactionType < 1.5) { // Draining A -> B
                float flowProgress = smoothstep(0.0, 1.0, vUv.x);
                combinedNoise = mix(noise1, -noise2, flowProgress); // Flow from A to B
                finalColor = mix(colorA, colorB, vUv.x);
            } else { // Conflicting
                combinedNoise = (noise1 - noise2) * (snoise(vec2(time*10.0, 0.0)) * 0.5 + 0.5);
                finalColor = mix(colorA, colorB, vUv.x);
                // Flicker effect
                if (mod(time * 10.0, 1.0) < 0.5) {
                    finalColor *= 0.8;
                }
            }

            // Add noise to color
            finalColor += combinedNoise * 0.2;

            gl_FragColor = vec4(finalColor, opacity * 0.7);
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
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
}