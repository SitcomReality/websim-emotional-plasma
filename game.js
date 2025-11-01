import * as THREE from 'three';
import { SceneManager } from './engine/SceneManager.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { LevelCompleteScene } from './scenes/LevelCompleteScene.js';
import { LevelEditor } from './utils/LevelEditor.js';

class EmotionalPlasmaGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.initRenderer();
        this.initScene();
        this.initCamera();
        this.initLights();
        
        this.sceneManager = new SceneManager();
        this.setupScenes();
        this.setupEventListeners();
        
        // Initialize level editor
        this.levelEditor = new LevelEditor(this.scene, this.camera, this.renderer);
        window.levelEditor = this.levelEditor; // Expose for UI callbacks
        
        // Setup import confirmation
        this.setupImportUI();
        
        this.gameLoop();
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

    setupScenes() {
        const menuScene = new MenuScene((levelPath) => this.startLevel(levelPath));
        
        const gameScene = new GameScene(
            this.renderer,
            this.scene,
            this.camera,
            (success) => this.levelComplete(success)
        );
        
        const levelCompleteScene = new LevelCompleteScene(
            () => this.returnToMenu(),
            () => this.nextLevel()
        );
        
        this.sceneManager.registerScene('menu', menuScene);
        this.sceneManager.registerScene('game', gameScene);
        this.sceneManager.registerScene('levelComplete', levelCompleteScene);
        
        this.gameScene = gameScene;
        this.levelCompleteScene = levelCompleteScene;
    }

    async startLevel(levelPath) {
        this.gameScene.currentLevelPath = levelPath;
        await this.sceneManager.transitionTo('game');
    }

    levelComplete(success) {
        this.levelCompleteScene.setLevelData({ name: 'First Steps' });
        this.sceneManager.transitionTo('levelComplete');
    }

    returnToMenu() {
        this.sceneManager.transitionTo('menu');
    }

    nextLevel() {
        // TODO: Load next level or return to menu
        this.sceneManager.transitionTo('menu');
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onResize());
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    setupImportUI() {
        const importBtn = document.getElementById('import-level-btn');
        const confirmBtn = document.getElementById('import-confirm-btn');
        const textarea = document.getElementById('json-import');
        
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                textarea.style.display = textarea.style.display === 'none' ? 'block' : 'none';
                confirmBtn.style.display = textarea.style.display;
                if (textarea.style.display === 'block') {
                    textarea.focus();
                }
            });
        }
        
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.levelEditor.importLevel();
            });
        }
    }

    gameLoop = () => {
        const deltaTime = 0.016; // Fixed timestep approximation
        
        this.sceneManager.update(deltaTime);
        this.sceneManager.render(this.renderer, this.camera);
        
        requestAnimationFrame(this.gameLoop);
    }
}

const game = new EmotionalPlasmaGame();
game.sceneManager.transitionTo('menu');