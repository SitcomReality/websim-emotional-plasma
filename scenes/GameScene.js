import * as THREE from 'three';
import { GameEngine } from '../engine/GameEngine.js';
import { Player } from '../entities/Player.js';
import { InputManager } from '../utils/InputManager.js';
import { Ball } from '../entities/Ball.js';
import { NPCBehavior } from '../utils/NPCBehavior.js';
import { ZoneManager } from '../utils/ZoneManager.js';
import { ConnectionManager } from '../visuals/ConnectionManager.js';
import { LevelLoader } from '../levels/LevelLoader.js';

export class GameScene {
    constructor(renderer, scene, camera, onLevelComplete) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.onLevelComplete = onLevelComplete;

        this.inputManager = new InputManager();
        this.player = null;
        this.entities = [];
        this.zoneManager = null;
        this.connectionManager = null;
        this.engine = null;
        this.currentLevelPath = null;
    }

    async loadLevel(levelPath) {
        this.currentLevelPath = levelPath;
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

            return true;
        } catch (error) {
            console.error("Failed to load level:", error);
            return false;
        }
    }

    async onEnter() {
        if (this.currentLevelPath) {
            const loaded = await this.loadLevel(this.currentLevelPath);
            if (loaded && this.engine) {
                this.engine.start();
            }
        }
    }

    async onExit() {
        if (this.engine) {
            this.engine.stop();
        }

        // Clean up entities
        for (const entity of this.entities) {
            if (entity.destroy) {
                entity.destroy();
            }
        }

        // Clean up zones
        if (this.zoneManager) {
            this.zoneManager.clear();
        }

        this.entities = [];
        this.player = null;
    }

    completeLevel(success = true) {
        this.onLevelComplete(success);
    }

    update(deltaTime) {
        if (this.engine) {
            this.engine.update(deltaTime);
        }
    }

    render(renderer, camera) {
        if (this.engine) {
            this.engine.render();
        }
    }
}