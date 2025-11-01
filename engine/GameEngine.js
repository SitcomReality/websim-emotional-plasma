import * as THREE from 'three';

export class GameEngine {
    constructor(renderer, scene, camera, player, entities, inputManager, zoneManager, connectionManager, dialogueManager) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.player = player;
        this.entities = entities;
        this.inputManager = inputManager;
        this.zoneManager = zoneManager;
        this.connectionManager = connectionManager;
        this.dialogueManager = dialogueManager;
        
        this.clock = new THREE.Clock();
        this.isRunning = false;
        this.dialogueInteractionDist = 3.0;
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
        if (this.dialogueManager.isActive) {
            if (this.inputManager.justPressed.space) {
                this.dialogueManager.handleInput();
            }
        } else {
             // Normal game updates only when not in dialogue
            this.updateEntities(deltaTime);
            this.checkForDialogueStart();
        }
        
        // Update dialogue bubbles (old system)
        if (this.dialogueManager) {
            this.dialogueManager.update();
        }

        // Update camera to follow player
        this.updateCamera(deltaTime);

        // Input manager late update
        this.inputManager.update();
    }

    updateEntities(deltaTime) {
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

        // When dialogue ends, unlock movement
        if (!this.dialogueManager.isActive && !this.player.canMove) {
            this.entities.forEach(e => e.canMove = true);
        }

        // Update dialogue bubbles
        if (this.dialogueManager) {
            this.dialogueManager.update();
        }

        // Update camera to follow player
        this.updateCamera(deltaTime);
    }

    checkForDialogueStart() {
        if (this.inputManager.justPressed.space) {
            const closestNPC = this.findClosestNPC();
            if (closestNPC) {
                this.dialogueManager.startDialogue(this.player, closestNPC);
                // Lock movement
                this.player.canMove = false;
                closestNPC.canMove = false;
            }
        }
    }
    
    findClosestNPC() {
        let closestDist = this.dialogueInteractionDist;
        let closestNPC = null;
        for (const entity of this.entities) {
            if (entity.isNPC && entity.dialogueData) {
                const dist = this.player.position.distanceTo(entity.position);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestNPC = entity;
                }
            }
        }
        return closestNPC;
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