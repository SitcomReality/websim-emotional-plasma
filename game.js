import * as THREE from 'three';
import { GameEngine } from './engine/GameEngine.js';
import { Player } from './entities/Player.js';
import { InputManager } from './utils/InputManager.js';
import { Ball } from './entities/Ball.js';
import { NPCBehavior } from './utils/NPCBehavior.js';
import { Zone } from './utils/Zone.js';
import { ZoneManager } from './utils/ZoneManager.js';
import { ConnectionManager } from './visuals/ConnectionManager.js';

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
    
    addZones() {
        // Peaceful sanctuary - increases valence and connectedness
        const peacefulZone = new Zone(
            new THREE.Vector3(10, 0.5, 10),
            4,
            {
                name: 'Peaceful Sanctuary',
                color: 0x4CAF50,
                valenceEffect: 0.5,
                connectednessEffect: 0.3,
                arousalEffect: -0.2
            }
        );
        this.zoneManager.addZone(peacefulZone);
        
        // Energy spike - increases arousal
        const energyZone = new Zone(
            new THREE.Vector3(-10, 0.5, 10),
            3.5,
            {
                name: 'Energy Surge',
                color: 0xFF9800,
                valenceEffect: 0.1,
                arousalEffect: 0.6,
                connectednessEffect: -0.1
            }
        );
        this.zoneManager.addZone(energyZone);
        
        // Isolation pit - decreases connectedness
        const isolationZone = new Zone(
            new THREE.Vector3(-10, 0.5, -10),
            4,
            {
                name: 'Isolation Pit',
                color: 0x2196F3,
                valenceEffect: -0.3,
                connectednessEffect: -0.5,
                arousalEffect: 0.2,
                forceMultiplier: 0.5 // Slight push away
            }
        );
        this.zoneManager.addZone(isolationZone);
        
        // Chaotic vortex - negative effects, pulls inward
        const chaosZone = new Zone(
            new THREE.Vector3(10, 0.5, -10),
            3,
            {
                name: 'Chaotic Vortex',
                color: 0x9C27B0,
                valenceEffect: -0.4,
                arousalEffect: 0.5,
                connectednessEffect: -0.2,
                forceMultiplier: -1 // Pull inward
            }
        );
        this.zoneManager.addZone(chaosZone);
    }
    
    addNPCs() {
        // Anxious NPC
        const npc1 = new Ball(this.scene, this.camera, new THREE.Vector3(5, 0.5, 5));
        npc1.setEmotionalState(-0.8, 0.7, -0.6); // anxious
        npc1.isNPC = true;
        npc1.behavior = new NPCBehavior();
        this.entities.push(npc1);

        // Calm NPC
        const npc2 = new Ball(this.scene, this.camera, new THREE.Vector3(-5, 0.5, -5));
        npc2.setEmotionalState(0.7, -0.5, 0.5); // calm
        npc2.isNPC = true;
        npc2.behavior = new NPCBehavior();
        this.entities.push(npc2);
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