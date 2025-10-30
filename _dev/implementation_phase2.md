### **Phase 2: Visual & Audio Systems**

This phase focuses on creating the distinctive "emotional plasma" effect and integrating sound to provide feedback to the player.

**Step 1: The "Emotional Plasma" Visuals**
*   **1.1. Shader Development Environment:** Set up a system for writing and integrating custom shaders (e.g., GLSL) into your rendering pipeline.
*   **1.2. Mapping Emotions to Visuals:** Create a system that translates the ball's emotional state (valence, arousal, connectedness) into shader-uniforms or visual parameters:
    *   **Valence (Hue):** Map the -1 to 1 range to a color gradient (e.g., cool blues to warm yellows).
    *   **Arousal (Motion):** Use this value to control the speed and turbulence of a noise function within the shader, creating the swirling effect. Higher arousal means faster, more chaotic movement.
    *   **Connectedness (Density/Spread):** This will influence the size and opacity of the aura. High connectedness could result in a larger, more diffuse glow that extends outwards.
*   **1.3. Liquid/Smoke Effect:** Develop the core shader logic for the plasma effect. This will likely involve using noise functions (like Perlin or Simplex noise) and manipulating them over time to create a fluid, smoky appearance.
*   **1.4. Performance Optimization:** From the start, focus on writing efficient shaders. Profile the performance and ensure the game runs smoothly, even with multiple balls on screen.

**Step 2: Visualizing Interactions**
*   **2.1. Aura Blending:** When two balls are close, their auras should visually interact. This can be achieved through blending modes in your rendering or by having the shaders of nearby balls influence each other.
*   **2.2. Tendrils and Bridges:** For the 'Connected' state, implement a visual effect of tendrils reaching out from one ball to another. This could be a separate particle effect or a shader-based distortion.
*   **2.3. Leeching/Sapping Visuals:** Create visual feedback for energy transfer. This might be represented by particles flowing from one ball to another or one aura "pulling" color from the other.
*   **2.4. Accent Effects:** Add smaller, particle-based effects for specific emotional spikes, like sparkles for a moment of pride or a darkening pulse for shame.

**Step 3: Audio Integration**
*   **3.1. Audio Engine:** Integrate a basic audio library or use the browser's native audio capabilities to manage sound.
*   **3.2. Background Ambiance:** Create looping background audio that changes based on the player's dominant emotional state (e.g., a calming melody for low arousal, a more intense track for high arousal).
*   **3.3. Sound Effects:** Design and implement sound effects for key interactions:
    *   A subtle "chime" for positive interactions.
    *   A low "draining" sound for leeching.
    *   Sounds for entering different environmental zones.

**Step 4: User Interface (UI) & Accessibility**
*   **4.1. Basic HUD:** Design a minimalist Heads-Up Display. This might not be necessary if the emotional state is purely communicated through visuals, but consider it for debugging.
*   **4.2. Accessibility Considerations:** Ensure the game is playable for everyone.
    *   **Colorblind Mode:** Offer a mode that relies more heavily on motion, shape, and density rather than just hue to communicate emotional states.
    *   **Clear Visual Language:** Prioritize readability so players can quickly understand the emotional state of other balls.
