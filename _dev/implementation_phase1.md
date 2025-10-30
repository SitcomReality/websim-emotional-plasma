### **Phase 1: Foundation & Core Mechanics**

This initial phase focuses on establishing the project structure and implementing the fundamental gameplay systems. The goal is to create a playable prototype with core functionalities.

**Step 1: Project Scaffolding & Initial Setup**
*   **1.1. Directory Structure:** Create a well-organized directory structure. For example:
    *   `/src` for all source code.
    *   `/src/components` or `/src/entities` for game objects like the 'ball'.
    *   `/src/systems` for managing game logic (e.g., physics, emotion).
    *   `/src/graphics` for rendering and visual effects code.
    *   `/src/levels` for level data.
    *   `/src/assets` for images, sounds, and other media.
    *   `/styles` for CSS or other styling files.
*   **1.2. Basic Game Loop:** Implement a fundamental game loop (update, render) that will serve as the heartbeat of the application.
*   **1.3. Canvas/Rendering Context:** Set up the primary rendering surface (e.g., an HTML canvas) where the game will be drawn.
*   **1.4. Input Handling:** Create a basic system to handle player input (e.g., mouse movement, keyboard presses, or touch events).

**Step 2: The 'Ball' Entity & Core Attributes**
*   **2.1. Ball Class/Object:** Define a 'Ball' class or factory function. This will be the blueprint for the player and other non-player character (NPC) balls.
*   **2.2. Dimensional Model Implementation:** Within the Ball entity, implement the core emotional axes as numerical properties:
    *   `valence`: A value from -1 (Negative) to 1 (Positive).
    *   `arousal`: A value from -1 (Low) to 1 (High).
    *   `connectedness`: A value from -1 (Isolated) to 1 (Connected).
*   **2.3. Physics & Movement:** Give the ball basic physical properties like position, velocity, and size. Implement a system that allows the player to control their ball's movement within the game world.
*   **2.4. Initial State:** Set a default or starting emotional state for the player's ball.

**Step 3: Emotional State Dynamics & Interactions**
*   **3.1. Emotion State Machine:** Create a system that manages how a ball's emotional state changes over time based on its current energy or other factors. For instance, high energy could map to a 'joyous' state (high valence, high arousal).
*   **3.2. Proximity Detection:** Implement a mechanism to detect when balls are close to each other (e.g., using distance checks or a simple collision detection system).
*   **3.3. Interaction Logic:** Develop the core interaction mechanics based on proximity and emotional states:
    *   **Leeching/Sapping:** If Ball A is near Ball B, and their states trigger a leeching effect, create functions that decrease one ball's emotional values while increasing the other's.
    *   **Mutual Benefit/Detriment:** If the states are compatible for mutual gain or loss, implement logic to modify both balls' emotional values accordingly.
    *   **State-Based Modifiers:** Factor in different emotional states to modify the rate of change (e.g., 'rage' mode leaches more aggressively than 'healing' mode).
*   **3.4. AI for NPC Balls:** For non-player balls, create simple AI behaviors. This could start with basic movement patterns and predefined emotional states.

**Step 4: Environmental Factors**
*   **4.1. Event Zones:** Define a system for creating zones or events on the map. These can be simple geometric shapes (circles, rectangles) with associated effects.
*   **4.2. Zone Effects:** Implement the logic for what happens when a ball enters one of these zones. This could involve:
    *   **Positive Boosts:** Increasing `valence` or `connectedness`.
    *   **Negative Knocks:** Decreasing emotional values or applying a force to push the ball.
*   **4.3. Radius of Effect:** Ensure that these zones can have variable sizes, affecting a single ball or a larger area.
