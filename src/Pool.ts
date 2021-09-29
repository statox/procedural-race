import P5 from 'p5';
import {Car} from './Car';
import {DNA} from './DNA';
import {Track} from './Track';
const config = require('./config.json');

const showRandomCars = config.poolSetReferenceGroup;

export class Pool {
    p5: P5;
    cars: Car[];
    randomCars: Car[];
    allCarCrashed: boolean;
    size: number;
    dnas: DNA[];
    generations: number;

    constructor(p5: P5, track: Track) {
        this.p5 = p5;
        this.size = 100;
        this.generations = 5;
        this.generateInitialDNAs();
        this.reset(track);
    }

    reset(track: Track) {
        this.generations--;
        this.allCarCrashed = false;
        this.cars = [];
        this.randomCars = [];

        this.resetDNA(track);
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
            const angle = car.dna.turnAngle;
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
            const parent1 = res[parent1Index].dna;
            const parent2 = res[parent2Index].dna;
            const dna = parent1.mix(parent2);
            dna.mutate();
            this.dnas.push(dna);
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
}
