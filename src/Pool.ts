import P5 from 'p5';
import {Car} from './Car';
import {DNA} from './DNA';
import {Track} from './Track';

export class Pool {
    p5: P5;
    cars: Car[];
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
        if (!this.dnas) {
            throw new Error("Can't reset pool without generated dnas");
        }
        this.allCarCrashed = false;
        this.cars = [];
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
        /*
         * this.cars.push(
         *     new Car(this.p5, {
         *         pos: track.interpolatedHull[0].pos.copy(),
         *         dna: new DNA(0),
         *         direction: track.startingDirection,
         *         driveMode: 'BASIC'
         *     })
         * );
         */
    }

    show() {
        for (const car of this.cars) {
            car.show();
        }
    }

    update(track: Track) {
        this.allCarCrashed = true;
        for (const car of this.cars) {
            car.update();
            car.updateTrackInfo(track);
            car.driveDecision();

            if (!car.crashed) {
                this.allCarCrashed = false;
            }
        }
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
