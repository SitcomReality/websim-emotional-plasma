import * as THREE from 'three';

export class GameEngine {
    constructor(renderer, scene, camera, player, inputManager) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.player = player;
        this.inputManager = inputManager;
        
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
        // Update player
        this.player.update(deltaTime, this.inputManager);
        
        // Update camera to follow player
        this.updateCamera(deltaTime);
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