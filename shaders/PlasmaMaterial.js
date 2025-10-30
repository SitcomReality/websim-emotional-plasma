import * as THREE from 'three';
import { PlasmaConstants } from './PlasmaConstants.js';
import { GLSL_SNOISE } from './PlasmaNoise.js';

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
    fragmentShader: null
};

function buildBillboardFragment() {
    return `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;

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
        uniform vec3 nearbyBalls[${PlasmaConstants.maxInfluencingBalls}];
        uniform int nearbyBallCount;
        uniform float flowStrength;
        uniform float flowVisualIntensity;

        ${GLSL_SNOISE}

        vec3 hsl2rgb(vec3 c) {
            vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0);
            return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
        }

        void main() {
            vec2 center = vec2(0.5, 0.5);
            vec2 toCenter = vUv - center;
            float dist = length(toCenter);
            float angle = atan(toCenter.y, toCenter.x);
            float speed = 0.3 + abs(arousal) * 0.7;
            float timeScale = time * speed;
            vec2 ballSeed = ballWorldPos.xz * 0.1;

            // --- REMOVED RADIAL HIGHLIGHT EFFECT ---
            // The flow vector logic is being disabled to feature the new tendrils.
            vec2 flowVector = vec2(0.0);
            float totalFlowStrength = 0.0;
            vec2 strongestFlowDirection = vec2(0.0);
            float maxFlowStrength = 0.0;

            /*
            for(int i = 0; i < ${PlasmaConstants.maxInfluencingBalls}; i++) {
                if(i >= nearbyBallCount) break;
                vec3 nearbyPos = nearbyBalls[i];
                vec2 toBall = nearbyPos.xz - ballWorldPos.xz;
                float ballDist = length(toBall);
                if(ballDist > 0.1 && ballDist < 10.0) {
                    vec2 direction = normalize(toBall);
                    float distFactor = 1.0 - (ballDist / 10.0);
                    float strength = pow(distFactor, 2.0) * 2.0;
                    float edgePull = smoothstep(0.1, 0.5, dist);
                    float flowContribution = strength * edgePull;
                    flowVector += direction * flowContribution;
                    totalFlowStrength += flowContribution;
                    if(flowContribution > maxFlowStrength) {
                        maxFlowStrength = flowContribution;
                        strongestFlowDirection = direction;
                    }
                }
            }
            */

            if(totalFlowStrength > 0.0) {
                flowVector = normalize(flowVector) * min(totalFlowStrength, 3.0);
            }

            float radius = dist * 2.0;
            float spiral = angle + radius * 3.0;
            vec2 flowDistortion = flowVector * flowStrength;

            vec2 radialCoord1 = toCenter * 3.0 + ballSeed - flowDistortion * 1.5;
            float noise1 = fbm(radialCoord1 - vec2(timeScale * 0.6, 0.0), timeScale + ballSeed.x);

            vec2 spiralCoord = vec2(spiral + timeScale * 0.8, radius * 2.0) + ballSeed - flowDistortion * 2.0;
            float noise2 = fbm(spiralCoord, timeScale * 1.2 + ballSeed.y);

            vec2 streamCoord = toCenter * 5.0 + strongestFlowDirection * maxFlowStrength * 3.0 + ballSeed;
            float noise3 = fbm(streamCoord + vec2(timeScale * 0.4), timeScale * 0.9 + ballSeed.x * 2.0);

            float flowLayerStrength = min(totalFlowStrength, 1.0);
            vec2 flowLayerCoord = vUv * 4.0 + flowVector * 0.5;
            float flowNoise = fbm(flowLayerCoord, timeScale * 1.5) * flowLayerStrength;

            float centerWeight = 1.0 - smoothstep(0.0, 0.5, dist);
            float edgeWeight = smoothstep(0.3, 0.8, dist);
            float plasmaPattern = 
                noise1 * 0.3 * (1.0 + centerWeight * 0.3) +
                noise2 * 0.3 * (1.0 + edgeWeight * 0.2) +
                noise3 * 0.25 +
                flowNoise * 0.15;

            if(totalFlowStrength > 0.3) {
                float streakIntensity = totalFlowStrength * edgeWeight;
                plasmaPattern += streakIntensity * 0.4;
            }

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

            float emotionalStrength = (abs(valence) + abs(arousal) + abs(connectedness)) / 3.0;
            float radialFalloff = smoothstep(falloffStart, falloffEnd, dist);
            float plasmaAlpha = radialFalloff * (baseAlpha + emotionalStrength * emotionalAlphaRange);
            float noiseAlpha = mix(plasmaAlpha, plasmaAlpha * (plasmaPattern + 1.0) * 0.5, noiseAlphaInfluence);

            if(totalFlowStrength > 0.2) {
                float flowBoost = pow(totalFlowStrength, 1.5) * flowVisualIntensity;
                noiseAlpha += flowBoost * radialFalloff;
                rgbColor *= 1.0 + flowBoost * 1.5;
            }

            float alpha = noiseAlpha * plasmaIntensity;
            float emissive = baseEmissive + abs(arousal) * arousalEmissiveRange;
            rgbColor = mix(rgbColor, rgbColor * 1.8, emissive);

            if(totalFlowStrength > 0.3) {
                float glowBoost = pow(totalFlowStrength, 2.0);
                rgbColor *= 1.0 + glowBoost * 0.8;
            }

            gl_FragColor = vec4(rgbColor, alpha);
        }
    `;
}

export function createPlasmaShaderMaterial(emotionalState, isBillboard = false) {
    const fragment = isBillboard ? buildBillboardFragment() : `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;

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

        ${GLSL_SNOISE}

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

            float dist = distance(vUv, vec2(0.5));
            float emotionalStrength = (abs(valence) + abs(arousal) + abs(connectedness)) / 3.0;
            float plasmaAlpha = smoothstep(falloffStart, falloffEnd, dist) * (baseAlpha + emotionalStrength * emotionalAlphaRange);
            float noiseAlpha = (plasmaPattern * noiseAlphaInfluence + (1.0 - noiseAlphaInfluence)) * plasmaAlpha;
            float alpha = noiseAlpha * plasmaIntensity;
            float emissive = baseEmissive + abs(arousal) * arousalEmissiveRange;
            rgbColor = mix(rgbColor, rgbColor * 1.5, emissive);
            gl_FragColor = vec4(rgbColor, alpha);
        }
    `;

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

    if (isBillboard) {
        uniforms.ballWorldPos = { value: new THREE.Vector3(0, 0, 0) };
        uniforms.nearbyBalls = { value: Array.from({length: PlasmaConstants.maxInfluencingBalls}, () => new THREE.Vector3(9999,9999,9999)) };
        uniforms.nearbyBallCount = { value: 0 };
        uniforms.flowStrength = { value: PlasmaConstants.flowStrength };
        uniforms.flowVisualIntensity = { value: PlasmaConstants.flowVisualIntensity };
    }

    return new THREE.ShaderMaterial({
        vertexShader: PlasmaShader.vertexShader,
        fragmentShader: fragment,
        uniforms: uniforms,
        side: THREE.FrontSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
}