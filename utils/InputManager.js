export class InputManager {
    constructor() {
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            space: false
        };
        this.justPressed = {};
        
        this.setupKeyboardListeners();
    }
    
    setupKeyboardListeners() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase() === ' ' ? 'space' : e.key.toLowerCase();
            if (key in this.keys) {
                if (!this.keys[key]) {
                    this.justPressed[key] = true;
                }
                this.keys[key] = true;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase() === ' ' ? 'space' : e.key.toLowerCase();
            if (key in this.keys) {
                this.keys[key] = false;
            }
        });
    }

    update() {
        // Reset justPressed keys at the end of the frame
        this.justPressed = {};
    }
}