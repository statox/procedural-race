const Dannjs = require('dannjs');
const Dann = Dannjs.dann;
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

export class DNA_NN {
    nn: any; // dannjs is not typed
    constructor(nn: any) {
        this.nn = nn;
    }

    copy() {
        const nn = new Dann();
        nn.fromJSON(this.nn.toJSON());
        return new DNA_NN(nn);
    }

    // For now we will use only the best parrent from previous generation and mutate it
    mix(other: DNA_NN) {
        throw new Error('mix() is not implemented for DNA_NN');
    }

    mutate() {
        // adding (weight*random(-0.1, 0.1)) to 50% of the weights.
        this.nn.mutateRandom(0.1, 0.5);
    }
}
