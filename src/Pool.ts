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

    constructor(p5: P5, track: Track) {
        this.p5 = p5;
        this.size = 100;
        this.generateInitialDNAs();
        this.reset(track);
    }

    reset(track: Track) {
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
        /*
         * console.log(this.cars.map((c) => Number(c.dna.turnAngle.toFixed(2))).sort((a, b) => a - b));
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

        const res = sortedCars.map((c) => {
            return {
                score: c.score,
                angle: c.dna.turnAngle,
                diff: Math.abs(c.dna.turnAngle - sortedCars[0].dna.turnAngle)
            };
        });
        console.log(res);
    }

    generateInitialDNAs() {
        this.dnas = [];
        /*
         * const randomAngle = this.p5.random(-40, 40);
         * const dna = new DNA(randomAngle);
         * dna.mutate();
         */

        /*
         * const dna1 = new DNA(8);
         * const dna2 = new DNA(11);
         * const dna = dna1.mix(dna2);
         */

        for (let i = 0; i < this.size; i++) {
            const dna = new DNA(11);
            this.dnas.push(dna);
        }
    }
}
