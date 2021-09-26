import P5 from 'p5';
import {Car} from './Car';
import {DNA} from './DNA';
import {Track} from './Track';

export class Pool {
    p5: P5;
    cars: Car[];
    allCarCrashed: boolean;

    constructor(p5: P5, track: Track) {
        this.p5 = p5;
        this.reset(track);
    }

    reset(track: Track) {
        this.allCarCrashed = false;
        this.cars = [];
        for (let i = 0; i < 100; i++) {
            const driveMode = i % 2 ? 'BASIC' : 'PERCENTAGE';
            const startingPosition = track.interpolatedHull[0].pos.copy();
            // const startingPosition = track.interpolatedHull[(i * 10) % track.interpolatedHull.length].pos.copy();

            const randomOffset = this.p5.createVector();
            randomOffset.x = this.p5.random(-1, 1);
            randomOffset.y = this.p5.random(-1, 1);
            const randomOffsetMag = this.p5.random(1, track.pathWidth / 2);
            randomOffset.setMag(randomOffsetMag);
            startingPosition.add(randomOffset);

            const randomAngle = this.p5.random(-40, 40);
            const dna = new DNA(randomAngle);

            const c = new Car(this.p5, {
                pos: startingPosition,
                dna,
                direction: track.startingDirection,
                driveMode: 'DNA'
            });
            this.cars.push(c);
        }
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
}
