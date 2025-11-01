export class SceneManager {
    constructor() {
        this.currentScene = null;
        this.scenes = {};
    }

    registerScene(name, scene) {
        this.scenes[name] = scene;
    }

    async transitionTo(sceneName) {
        if (!this.scenes[sceneName]) {
            console.error(`Scene "${sceneName}" not registered`);
            return;
        }

        // Cleanup old scene
        if (this.currentScene && this.currentScene.onExit) {
            await this.currentScene.onExit();
        }

        // Enter new scene
        this.currentScene = this.scenes[sceneName];
        if (this.currentScene.onEnter) {
            await this.currentScene.onEnter();
        }
    }

    update(deltaTime) {
        if (this.currentScene && this.currentScene.update) {
            this.currentScene.update(deltaTime);
        }
    }

    render(renderer, camera) {
        if (this.currentScene && this.currentScene.render) {
            this.currentScene.render(renderer, camera);
        }
    }
}