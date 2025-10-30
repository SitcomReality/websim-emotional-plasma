import * as THREE from 'three';

export class GameEngine {
    constructor(renderer, scene, camera, player, entities, inputManager, zoneManager) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.player = player;
        this.entities = entities;
        this.inputManager = inputManager;
        this.zoneManager = zoneManager;
        
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
        
        // Apply zone effects
        if (this.zoneManager) {
            this.zoneManager.update(this.entities, deltaTime);
        }
        
        this.handleInteractions(deltaTime);

        // Update camera to follow player
        this.updateCamera(deltaTime);
    }

    handleInteractions(deltaTime) {
        for (let i = 0; i < this.entities.length; i++) {
            for (let j = i + 1; j < this.entities.length; j++) {
                const ballA = this.entities[i];
                const ballB = this.entities[j];

                const distance = ballA.position.distanceTo(ballB.position);
                const interactionDistance = ballA.size + ballB.size + 3; // Aura range

                if (distance < interactionDistance) {
                    this.processInteraction(ballA, ballB, deltaTime);
                }
            }
        }
    }

    processInteraction(ballA, ballB, deltaTime) {
        const stateA = ballA.stateMachine.currentState;
        const stateB = ballB.stateMachine.currentState;

        const interactionRate = 0.5 * deltaTime; // Base rate of emotional change

        const interactions = {
            'anxious-calm': () => {
                ballA.emotionalState.modify(0.1, -0.2, 0); // anxious -> calmer
                ballB.emotionalState.modify(-0.05, 0.1, 0); // calm -> slightly disturbed
            },
            'depressed-joyous': () => {
                ballA.emotionalState.modify(0.2, 0.1, 0.1); // depressed -> uplifted
                ballB.emotionalState.modify(-0.1, -0.05, -0.05); // joyous -> drained
            },
            'agitated-anxious': () => {
                ballA.emotionalState.modify(-0.1, 0.1, 0); // agitated -> more negative
                ballB.emotionalState.modify(-0.1, 0.1, 0); // anxious -> more negative
            },
            'joyous-joyous': () => {
                ballA.emotionalState.modify(0.1, 0.05, 0.1); // mutually reinforcing joy
                ballB.emotionalState.modify(0.1, 0.05, 0.1);
            }
        };

        const key1 = `${stateA}-${stateB}`;
        const key2 = `${stateB}-${stateA}`;

        if (interactions[key1]) {
            interactions[key1]();
        } else if (interactions[key2]) {
            // Swap ball references for the mirrored case
            const tempInteraction = interactions[key2];
            const swappedInteraction = () => tempInteraction(ballB, ballA);
            swappedInteraction();
             if (key2 === 'anxious-calm') {
                ballB.emotionalState.modify(0.1, -0.2, 0); 
                ballA.emotionalState.modify(-0.05, 0.1, 0);
            } else if (key2 === 'depressed-joyous') {
                ballB.emotionalState.modify(0.2, 0.1, 0.1);
                ballA.emotionalState.modify(-0.1, -0.05, -0.05);
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