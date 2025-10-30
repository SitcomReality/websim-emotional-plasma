export class InputManager {
    constructor() {
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false
        };
        
        this.setupKeyboardListeners();
    }
    
    setupKeyboardListeners() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key in this.keys) {
                this.keys[key] = true;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (key in this.keys) {
                this.keys[key] = false;
            }
        });
    }
}

