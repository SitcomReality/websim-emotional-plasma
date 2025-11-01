export class LevelCompleteScene {
    constructor(onReturnToMenu, onNextLevel) {
        this.onReturnToMenu = onReturnToMenu;
        this.onNextLevel = onNextLevel;
        this.container = null;
        this.levelData = null;
    }

    setLevelData(data) {
        this.levelData = data;
    }

    async onEnter() {
        this.container = document.getElementById('level-complete-scene');
        if (!this.container) return;

        const levelName = this.levelData?.name || 'Level Complete';
        
        this.container.innerHTML = `
            <div class="scene-content">
                <div class="completion-header">
                    <h1>Level Complete!</h1>
                    <p>${levelName}</p>
                </div>
                <div class="completion-stats">
                    <div class="stat">
                        <span class="stat-label">Final Valence</span>
                        <span class="stat-value" id="final-valence">--</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Final Arousal</span>
                        <span class="stat-value" id="final-arousal">--</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Connections Made</span>
                        <span class="stat-value" id="connections-made">--</span>
                    </div>
                </div>
                <div class="completion-buttons">
                    <button class="menu-button" id="return-menu">Return to Menu</button>
                    <button class="menu-button" id="next-level">Next Level</button>
                </div>
            </div>
        `;

        this.container.style.display = 'flex';
        document.getElementById('ui-overlay').style.display = 'none';

        this.attachListeners();
    }

    attachListeners() {
        const returnBtn = this.container.querySelector('#return-menu');
        const nextBtn = this.container.querySelector('#next-level');

        if (returnBtn) {
            returnBtn.addEventListener('click', () => this.onReturnToMenu());
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.onNextLevel());
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

