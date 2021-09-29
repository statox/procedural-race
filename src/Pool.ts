import P5 from 'p5';
import {Car, NB_SENSORS} from './Car';
import {DNA, DNA_NN} from './DNA';
import {Track} from './Track';
const Dannjs = require('dannjs');
const Dann = Dannjs.dann;
const config = require('./config.json');

const showRandomCars = config.poolSetReferenceGroup;

const master_nn = new Dann(NB_SENSORS, 6);
master_nn.addHiddenLayer(NB_SENSORS * 3);
master_nn.outputActivation('sigmoid');
master_nn.makeWeights();
master_nn.lr = 0.0001;

export class Pool {
    p5: P5;
    cars: Car[];
    randomCars: Car[];
    allCarCrashed: boolean;
    size: number;
    dnas: (DNA | DNA_NN)[];
    generations: number;

    constructor(p5: P5, track: Track) {
        this.p5 = p5;
        this.size = 100;
        this.generations = 25;
        this.generateInitialDNA_NNs();
        // this.generateInitialDNAs();
        this.reset(track);
    }

    reset(track: Track) {
        console.log('generations', this.generations);
        this.generations--;
        this.allCarCrashed = false;
        this.cars = [];
        this.randomCars = [];

        // this.resetDNA(track);
        this.resetNN(track);
        if (showRandomCars) {
            this.resetRandomCars(track);
        }
    }

    resetRandomCars(track: Track) {
        if (!showRandomCars) {
            return;
        }
        for (let i = 0; i < this.size; i++) {
            const startingPosition = track.interpolatedHull[0].pos.copy();
            const randomOffset = this.p5.createVector();
            randomOffset.x = this.p5.random(-1, 1);
            randomOffset.y = this.p5.random(-1, 1);
            const randomOffsetMag = this.p5.random(1, track.pathWidth / 2);
            randomOffset.setMag(randomOffsetMag);
            startingPosition.add(randomOffset);

            const randomAngle = this.p5.random(-70, 70);
            const dna = new DNA(randomAngle);
            this.randomCars.push(
                new Car(this.p5, {
                    pos: startingPosition,
                    dna: dna,
                    direction: track.startingDirection,
                    driveMode: 'DNA',
                    color: this.p5.color('#29ce2e')
                })
            );
        }
    }

    resetNN(track: Track) {
        this.cars = [];
        for (let i = 0; i < this.size; i++) {
            const startingPosition = track.interpolatedHull[0].pos.copy();

            /*
             * const randomOffset = this.p5.createVector();
             * randomOffset.x = this.p5.random(-1, 1);
             * randomOffset.y = this.p5.random(-1, 1);
             * const randomOffsetMag = this.p5.random(1, track.pathWidth / 2);
             * randomOffset.setMag(randomOffsetMag);
             * startingPosition.add(randomOffset);
             */

            const dna = this.dnas[i];
            const c = new Car(this.p5, {
                pos: startingPosition,
                dna,
                direction: track.startingDirection,
                driveMode: 'NN'
                // debugRay: true
            });
            this.cars.push(c);
        }
    }

    resetDNA(track: Track) {
        this.cars = [];
        if (!this.dnas) {
            throw new Error("Can't reset pool without generated dnas");
        }
        for (let i = 0; i < this.size; i++) {
            const driveMode = 'DNA';
            const startingPosition = track.interpolatedHull[0].pos.copy();

            const randomOffset = this.p5.createVector();
            randomOffset.x = this.p5.random(-1, 1);
            randomOffset.y = this.p5.random(-1, 1);
            const randomOffsetMag = this.p5.random(1, track.pathWidth / 2);
            randomOffset.setMag(randomOffsetMag);
            startingPosition.add(randomOffset);

            const dna = this.dnas[i];

            const c = new Car(this.p5, {
                pos: startingPosition,
                dna,
                direction: track.startingDirection,
                driveMode: 'DNA'
            });
            this.cars.push(c);
        }

        let min = Infinity;
        let max = -Infinity;
        let avg = 0;
        for (let i = 0; i < this.cars.length; i++) {
            const car = this.cars[i];
            const angle = (car.dna as DNA).turnAngle;
            avg += angle / this.cars.length;
            if (angle < min) {
                min = angle;
            }
            if (angle > max) {
                max = angle;
            }
        }
        console.log({avg, min, max});
    }

    getAllCars() {
        return [...this.cars, ...this.randomCars];
    }

    show() {
        for (const car of this.cars) {
            car.show();
        }
        for (const car of this.randomCars) {
            car.show();
        }
    }

    update(track: Track) {
        this.allCarCrashed = true;
        let allLearningCarsCrashed = true;
        for (const car of this.cars) {
            car.update();
            car.updateTrackInfo(track);
            car.driveDecision();

            if (!car.crashed) {
                allLearningCarsCrashed = false;
            }
        }

        let allRandomCarsCrashed = true;
        for (const car of this.randomCars) {
            car.update();
            car.updateTrackInfo(track);
            car.driveDecision();

            if (!car.crashed) {
                allRandomCarsCrashed = false;
            }
        }

        this.allCarCrashed = allLearningCarsCrashed && allRandomCarsCrashed;
        if (this.allCarCrashed) {
            this.endOfGenerationComputation();
        }
    }

    endOfGenerationComputation() {
        const sortedCars = this.cars.sort((c1, c2) => {
            return c2.score - c1.score;
        });

        let totalScore = 0;
        const res = sortedCars.map((c, i) => {
            if (i < 10) {
                totalScore += c.score;
            }
            return {
                score: c.score,
                dna: c.dna
            };
        });

        if (res[0].dna instanceof DNA) {
            this.generateNextDNAs(res, totalScore);
        }
        if (res[0].dna instanceof DNA_NN) {
            this.generateNextDNA_NNs(res, totalScore);
        }
    }

    generateNextDNAs(res: {score: number; dna: DNA | DNA_NN}[], totalScore) {
        if (res[0] instanceof DNA_NN) {
            throw new Error('generateNextDNAs called with incorrect DNA type');
        }

        this.dnas = [];
        const parentIndices = [];
        for (let i = 0; i < this.size; i++) {
            let parent1Score = Math.random() * totalScore;
            let parent2Score = Math.random() * totalScore;
            let searchScore = 0;
            let i = 0;
            let parent1Index;
            let parent2Index;
            while (searchScore < parent1Score || searchScore < parent2Score) {
                searchScore += res[i].score;
                if (parent1Score <= searchScore) {
                    parent1Index = i;
                }
                if (parent2Score <= searchScore) {
                    parent2Index = i;
                }
                i++;
            }
            parentIndices.push(parent1Index);
            parentIndices.push(parent2Index);
            const parent1 = res[parent1Index].dna as DNA;
            const parent2 = res[parent2Index].dna as DNA;
            const dna = parent1.mix(parent2);
            dna.mutate();
            this.dnas.push(dna);
        }
    }

    generateNextDNA_NNs(res: {score: number; dna: DNA | DNA_NN}[], totalScore) {
        if (res[0] instanceof DNA) {
            throw new Error('generateNextDNA_NNs called with incorrect DNA type');
        }

        this.dnas = [];
        console.log('best score', res[0].score);
        const bestDNA = res[0].dna as DNA_NN;
        const bestNN = bestDNA.nn;
        const modelData = bestNN.toJSON();
        for (let i = 0; i < this.size; i++) {
            const newNN = new Dann();
            newNN.fromJSON(modelData);
            newNN.mutateRandom(0.1, 0.5);
            const newDNA = new DNA_NN(newNN);
            this.dnas.push(newDNA);
        }
    }

    generateInitialDNAs() {
        this.dnas = [];
        for (let i = 0; i < this.size; i++) {
            const randomAngle = this.p5.random(-70, 70);
            const dna = new DNA(randomAngle);
            this.dnas.push(dna);
        }
    }

    generateInitialDNA_NNs() {
        this.dnas = [];
        for (let i = 0; i < this.size; i++) {
            const nn = new Dann(NB_SENSORS, 6);
            nn.addHiddenLayer(NB_SENSORS * 3);
            nn.outputActivation('sigmoid');
            nn.makeWeights();
            nn.lr = 0.0001;

            const dna = new DNA_NN(nn);
            this.dnas.push(dna);
        }
    }
}
