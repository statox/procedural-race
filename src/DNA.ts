const config = require('./config.json');

const {mutationRate} = config;
export class DNA {
    turnAngle: number;
    constructor(turnAngle: number) {
        this.turnAngle = turnAngle;
    }

    mix(other: DNA) {
        const avg = (this.turnAngle + other.turnAngle) / 2;
        return new DNA(avg);
    }

    mutate() {
        const factor = Math.random() * mutationRate * 2 - mutationRate;
        const prevAngle = this.turnAngle;
        this.turnAngle = this.turnAngle + this.turnAngle * factor;
    }
}
