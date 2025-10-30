export class NPCBehavior {
    constructor() {
        this.behaviorType = 'wander'; // 'wander', 'idle', 'approach', 'flee'
        this.behaviorTimer = 0;
        this.behaviorDuration = 3; // seconds
        this.targetPosition = null;
    }

    update(ball, deltaTime) {
        this.behaviorTimer += deltaTime;

        // Switch behavior periodically
        if (this.behaviorTimer >= this.behaviorDuration) {
            this.switchBehavior();
            this.behaviorTimer = 0;
        }

        // Execute current behavior
        switch (this.behaviorType) {
            case 'wander':
                this.wander(ball, deltaTime);
                break;
            case 'idle':
                this.idle(ball, deltaTime);
                break;
            case 'approach':
                this.approach(ball, deltaTime);
                break;
            case 'flee':
                this.flee(ball, deltaTime);
                break;
        }
    }

    switchBehavior() {
        // Choose behavior based on emotional state and randomness
        const random = Math.random();
        
        if (random < 0.4) {
            this.behaviorType = 'wander';
            this.behaviorDuration = 2 + Math.random() * 3;
        } else if (random < 0.7) {
            this.behaviorType = 'idle';
            this.behaviorDuration = 1 + Math.random() * 2;
        } else if (random < 0.85) {
            this.behaviorType = 'approach';
            this.behaviorDuration = 3 + Math.random() * 2;
        } else {
            this.behaviorType = 'flee';
            this.behaviorDuration = 2 + Math.random() * 1.5;
        }
    }

    wander(ball, deltaTime) {
        // Generate a new target if needed
        if (!this.targetPosition) {
            this.targetPosition = {
                x: (Math.random() - 0.5) * 20,
                z: (Math.random() - 0.5) * 20
            };
        }

        const direction = {
            x: this.targetPosition.x - ball.position.x,
            z: this.targetPosition.z - ball.position.z
        };

        const distance = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        
        if (distance < 0.5) {
            this.targetPosition = null;
            return;
        }

        const normalized = {
            x: direction.x / distance,
            z: direction.z / distance
        };

        ball.velocity.x += normalized.x * ball.speed * 0.5 * deltaTime;
        ball.velocity.z += normalized.z * ball.speed * 0.5 * deltaTime;
    }

    idle(ball, deltaTime) {
        // Slowly decay velocity to standstill
        ball.velocity.multiplyScalar(0.9);
    }

    approach(ball, deltaTime) {
        // For now, similar to wander but with a fixed destination
        if (!this.targetPosition) {
            this.targetPosition = {
                x: (Math.random() - 0.5) * 15,
                z: (Math.random() - 0.5) * 15
            };
        }

        const direction = {
            x: this.targetPosition.x - ball.position.x,
            z: this.targetPosition.z - ball.position.z
        };

        const distance = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        
        if (distance < 0.5) {
            this.targetPosition = null;
            return;
        }

        const normalized = {
            x: direction.x / distance,
            z: direction.z / distance
        };

        ball.velocity.x += normalized.x * ball.speed * 0.7 * deltaTime;
        ball.velocity.z += normalized.z * ball.speed * 0.7 * deltaTime;
    }

    flee(ball, deltaTime) {
        // Move away from center
        const direction = {
            x: ball.position.x,
            z: ball.position.z
        };

        const distance = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        
        if (distance < 0.1) {
            // Pick a random direction if at origin
            const angle = Math.random() * Math.PI * 2;
            ball.velocity.x += Math.cos(angle) * ball.speed * 0.6 * deltaTime;
            ball.velocity.z += Math.sin(angle) * ball.speed * 0.6 * deltaTime;
        } else {
            const normalized = {
                x: direction.x / distance,
                z: direction.z / distance
            };

            ball.velocity.x += normalized.x * ball.speed * 0.6 * deltaTime;
            ball.velocity.z += normalized.z * ball.speed * 0.6 * deltaTime;
        }
    }
}