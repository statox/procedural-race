import P5 from 'p5';
import {Car, DriveMode} from './Car';

type Data = {
    lap: number;
    currentDistance: number;
    currentSpeed: number;
    maxSpeed: number;
    lastSpeed: number;
    color: string;
    score: number;
};

export class Stats {
    p5: P5;
    data: {[k in DriveMode]: Data};

    constructor(p5: P5) {
        this.p5 = p5;
        const basicDataObject = {
            lap: 0,
            currentDistance: 0,
            currentSpeed: 0,
            maxSpeed: 0,
            lastSpeed: 0,
            color: 'white',
            score: 0
        };
        this.data = {
            BASIC: {...basicDataObject},
            PERCENTAGE: {...basicDataObject},
            DNA: {...basicDataObject}
        };
    }

    update(cars: Car[]) {
        let bestScores = {};
        for (const type of Object.keys(this.data)) {
            bestScores[type] = {score: -Infinity, index: -1};
        }
        for (let i = 0; i < cars.length; i++) {
            const car = cars[i];
            const {score, driveMode} = car;
            if (car.score > bestScores[driveMode].score) {
                bestScores[driveMode].score = car.score;
                bestScores[driveMode].index = i;
            }
        }

        for (const driveMode of Object.keys(this.data)) {
            const score = bestScores[driveMode];
            if (score.index === -1) {
                continue;
            }
            const car = cars[score.index];
            const type = car.driveMode;
            const typeData = this.data[type];

            if (car.speed.mag() > typeData.maxSpeed) {
                typeData.maxSpeed = car.speed.mag();
            }
            if (car.crashed) {
                typeData.lastSpeed = car.speed.mag();
            }
            typeData.currentDistance = car.traveledDistance;
            typeData.currentSpeed = car.speed.mag();
            typeData.lap = car.lap;
            typeData.color = car.color.toString();
            typeData.score = car.score;
        }
    }

    show() {
        let i = 0;
        this.p5.fill(255);
        this.p5.noStroke();
        for (const type of Object.keys(this.data)) {
            const data = this.data[type];
            if (!data.score) {
                continue;
            }
            const color = this.p5.color(data.color);
            const lap = data.lap;
            const speed = data.currentSpeed.toFixed(0);
            const score = data.score.toFixed(0);
            const dist = data.currentDistance.toFixed(0);
            const lastSpeed = data.lastSpeed.toFixed(0);
            const maxSpeed = data.maxSpeed.toFixed(0);
            const line = `Lap: ${lap} - Speed: ${speed} - Score: ${score} - Dist: ${dist} - Max speed: ${maxSpeed} - Last turn speed ${lastSpeed}`;
            this.p5.fill(color);
            this.p5.text(type, 10, this.p5.height - (2 * i + 1) * this.p5.textSize());
            this.p5.fill(255);
            this.p5.text(line, 10, this.p5.height - 2 * i * this.p5.textSize());
            i++;
        }
    }
}
