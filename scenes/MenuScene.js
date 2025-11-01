export class MenuScene {
    constructor(onLevelSelected) {
        this.onLevelSelected = onLevelSelected;
        this.container = null;
    }

    async onEnter() {
        this.container = document.getElementById('menu-scene');
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="scene-content">
                <div class="menu-header">
                    <h1>Emotional Plasma</h1>
                    <p>Navigate emotional spaces and forge connections</p>
                </div>
                <div class="menu-buttons">
                    <button class="menu-button" data-level="levels/level1.json">
                        Start Game
                    </button>
                    <button class="menu-button" id="open-editor">
                        Level Editor
                    </button>
                </div>
            </div>
        `;

        this.container.style.display = 'flex';
        document.getElementById('ui-overlay').style.display = 'none';

        this.attachListeners();
    }

    attachListeners() {
        const buttons = this.container.querySelectorAll('[data-level]');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const levelPath = e.target.dataset.level;
                this.onLevelSelected(levelPath);
            });
        });

        const editorBtn = this.container.querySelector('#open-editor');
        if (editorBtn) {
            editorBtn.addEventListener('click', () => {
                if (window.levelEditor) {
                    window.levelEditor.toggle();
                } else {
                    console.warn('LevelEditor not initialized');
                }
            });
        }
    }

    async onExit() {
        if (this.container) {
            this.container.style.display = 'none';
        }
        document.getElementById('ui-overlay').style.display = 'block';
    }

    update(deltaTime) {}
    render(renderer, camera) {}
}