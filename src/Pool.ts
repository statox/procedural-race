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
        this.cars.push(
            new Car(this.p5, {
                pos: track.startingPosition.copy(),
                direction: track.startingDirection,
                driveMode: 'BASIC'
            })
        );
        this.cars.push(
            new Car(this.p5, {
                pos: track.startingPosition.copy(),
                direction: track.startingDirection,
                driveMode: 'PERCENTAGE'
            })
        );
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
