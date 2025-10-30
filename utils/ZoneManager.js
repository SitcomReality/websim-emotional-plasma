export class ZoneManager {
    constructor(scene) {
        this.scene = scene;
        this.zones = [];
    }

    addZone(zone) {
        this.zones.push(zone);
        zone.addToScene(this.scene);
    }

    removeZone(zone) {
        const index = this.zones.indexOf(zone);
        if (index > -1) {
            this.zones.splice(index, 1);
            zone.destroy(this.scene);
        }
    }

    update(entities, deltaTime) {
        for (const zone of this.zones) {
            for (const entity of entities) {
                zone.applyEffect(entity, deltaTime);
            }
        }
    }

    getZonesAtPoint(point) {
        return this.zones.filter(zone => zone.isPointInZone(point));
    }

    clear() {
        for (const zone of this.zones) {
            zone.destroy(this.scene);
        }
        this.zones = [];
    }
}