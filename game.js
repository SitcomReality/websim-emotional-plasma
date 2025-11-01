import * as THREE from 'three';
import { GameEngine } from './engine/GameEngine.js';
import { Player } from './entities/Player.js';
import { InputManager } from './utils/InputManager.js';
import { Ball } from './entities/Ball.js';
import { NPCBehavior } from './utils/NPCBehavior.js';
import { Zone } from './utils/Zone.js';
import { ZoneManager } from './utils/ZoneManager.js';
import { ConnectionManager } from './visuals/ConnectionManager.js';
import { LevelLoader } from './levels/LevelLoader.js';

class EmotionalPlasmaGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.initRenderer();
        this.initScene();
        this.initCamera();
        this.initLights();
        
        this.inputManager = new InputManager();
        this.player = new Player(this.scene, this.camera);
        this.entities = [this.player];
        
        this.zoneManager = new ZoneManager(this.scene);
        this.addZones();

        this.addNPCs();

        this.connectionManager = new ConnectionManager(this.scene);
        
        this.engine = new GameEngine(
            this.renderer,
            this.scene,
            this.camera,
            this.player,
            this.entities,
            this.inputManager,
            this.zoneManager,
            this.connectionManager
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

    async loadLevel(levelPath) {
        const levelLoader = new LevelLoader(this.scene, this.camera);
        try {
            const { playerStartData, entities, zones } = await levelLoader.load(levelPath);
            
            // Initialize Player
            this.player = new Player(this.scene, this.camera);
            this.player.position.copy(playerStartData.position);
            if (playerStartData.state) {
                this.player.setEmotionalState(
                    playerStartData.state.valence || 0,
                    playerStartData.state.arousal || 0,
                    playerStartData.state.connectedness || 0
                );
            }
            
            // Initialize Entities
            this.entities = [this.player, ...entities];
            
            // Initialize Zones
            this.zoneManager = new ZoneManager(this.scene);
            zones.forEach(zone => this.zoneManager.addZone(zone));

            // Initialize Connection Manager
            this.connectionManager = new ConnectionManager(this.scene);

            // Setup Engine
            this.engine = new GameEngine(
                this.renderer,
                this.scene,
                this.camera,
                this.player,
                this.entities,
                this.inputManager,
                this.zoneManager,
                this.connectionManager
            );
            
            this.start();

        } catch (error) {
            console.error("Failed to load and initialize level:", error);
        }
    }
    
    // DEPRECATED METHODS
    addZones() { /* ... This is now handled by LevelLoader ... */ }
    addNPCs() { /* ... This is now handled by LevelLoader ... */ }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.onResize());
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    start() {
        if (this.engine) {
            this.engine.start();
        } else {
            console.error("Game engine not initialized. Cannot start game.");
        }
    }
}

// Initialize and start the game
const game = new EmotionalPlasmaGame();
game.loadLevel('levels/level1.json');