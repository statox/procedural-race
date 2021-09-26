import P5 from 'p5';
import {Car} from './Car';
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

            const c = new Car(this.p5, {
                pos: startingPosition,
                direction: track.startingDirection,
                driveMode: driveMode
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
    }
}
