import * as THREE from 'three';
import { GameEngine } from './engine/GameEngine.js';
import { Player } from './entities/Player.js';
import { InputManager } from './utils/InputManager.js';

class EmotionalPlasmaGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.initRenderer();
        this.initScene();
        this.initCamera();
        this.initLights();
        
        this.inputManager = new InputManager();
        this.player = new Player(this.scene);
        
        this.engine = new GameEngine(
            this.renderer,
            this.scene,
            this.camera,
            this.player,
            this.inputManager
        );
        
        this.setupEventListeners();
    }
    
    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 1);
    }
    
    initScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000000, 20, 50);
    }
    
    initCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 10, 15);
        this.camera.lookAt(0, 0, 0);
    }
    
    initLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        this.scene.add(directionalLight);
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.onResize());
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    start() {
        this.engine.start();
    }
}

// Initialize and start the game
const game = new EmotionalPlasmaGame();
game.start();

