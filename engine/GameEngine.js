import * as THREE from 'three';

export class GameEngine {
    constructor(renderer, scene, camera, player, entities, inputManager, zoneManager, connectionManager) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.player = player;
        this.entities = entities;
        this.inputManager = inputManager;
        this.zoneManager = zoneManager;
        this.connectionManager = connectionManager;
        
        this.clock = new THREE.Clock();
        this.isRunning = false;
    }
    
    start() {
        this.isRunning = true;
        this.clock.start();
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    gameLoop = () => {
        if (!this.isRunning) return;
        
        const deltaTime = this.clock.getDelta();
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(this.gameLoop);
    }
    
    update(deltaTime) {
        // Update entities
        for (const entity of this.entities) {
             if (entity.isPlayer) {
                entity.update(deltaTime, this.inputManager);
            } else {
                entity.update(deltaTime);
            }
        }
        
        // Update nearby balls tracking for plasma flow effects
        for (const entity of this.entities) {
            entity.updateNearbyBalls(this.entities);
        }
        
        // Apply zone effects
        if (this.zoneManager) {
            this.zoneManager.update(this.entities, deltaTime);
        }
        
        this.handleInteractions(deltaTime);

        // Update connection visuals
        if (this.connectionManager) {
            this.connectionManager.update(this.entities, this.camera);
        }

        // Update camera to follow player
        this.updateCamera(deltaTime);
    }

    handleInteractions(deltaTime) {
        const connectionDistance = 10.0; // Match ConnectionManager config
        
        for (let i = 0; i < this.entities.length; i++) {
            for (let j = i + 1; j < this.entities.length; j++) {
                const ballA = this.entities[i];
                const ballB = this.entities[j];

                const distance = ballA.position.distanceTo(ballB.position);
                
                // Only process interactions for connected balls
                if (distance < connectionDistance) {
                    // Scale interaction rate by proximity: closer = stronger effect
                    const distanceRatio = Math.max(0, 1.0 - (distance / connectionDistance));
                    this.processInteraction(ballA, ballB, deltaTime, distanceRatio);
                }
            }
        }
    }

    processInteraction(ballA, ballB, deltaTime, distanceRatio) {
        const stateA = ballA.stateMachine.currentState;
        const stateB = ballB.stateMachine.currentState;

        const baseInteractionRate = 0.5 * deltaTime;
        // Closer balls exchange emotions faster
        const interactionRate = baseInteractionRate * distanceRatio;

        const interactions = {
            'anxious-calm': () => {
                ballA.emotionalState.modify(0.1 * distanceRatio, -0.2 * distanceRatio, 0);
                ballB.emotionalState.modify(-0.05 * distanceRatio, 0.1 * distanceRatio, 0);
            },
            'depressed-joyous': () => {
                ballA.emotionalState.modify(0.2 * distanceRatio, 0.1 * distanceRatio, 0.1 * distanceRatio);
                ballB.emotionalState.modify(-0.1 * distanceRatio, -0.05 * distanceRatio, -0.05 * distanceRatio);
            },
            'agitated-anxious': () => {
                ballA.emotionalState.modify(-0.1 * distanceRatio, 0.1 * distanceRatio, 0);
                ballB.emotionalState.modify(-0.1 * distanceRatio, 0.1 * distanceRatio, 0);
            },
            'joyous-joyous': () => {
                ballA.emotionalState.modify(0.1 * distanceRatio, 0.05 * distanceRatio, 0.1 * distanceRatio);
                ballB.emotionalState.modify(0.1 * distanceRatio, 0.05 * distanceRatio, 0.1 * distanceRatio);
            }
        };

        const key1 = `${stateA}-${stateB}`;
        const key2 = `${stateB}-${stateA}`;

        if (interactions[key1]) {
            interactions[key1]();
        } else if (interactions[key2]) {
            if (key2 === 'anxious-calm') {
                ballB.emotionalState.modify(0.1 * distanceRatio, -0.2 * distanceRatio, 0);
                ballA.emotionalState.modify(-0.05 * distanceRatio, 0.1 * distanceRatio, 0);
            } else if (key2 === 'depressed-joyous') {
                ballB.emotionalState.modify(0.2 * distanceRatio, 0.1 * distanceRatio, 0.1 * distanceRatio);
                ballA.emotionalState.modify(-0.1 * distanceRatio, -0.05 * distanceRatio, -0.05 * distanceRatio);
            }
        }
    }
    
    updateCamera(deltaTime) {
        const targetPos = this.player.position.clone();
        targetPos.y += 10;
        targetPos.z += 15;
        
        this.camera.position.lerp(targetPos, deltaTime * 2);
        this.camera.lookAt(this.player.position);
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
}