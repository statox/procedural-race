import P5 from 'p5';
import {DNA} from './DNA';
import {Point} from './Point';
import {Ray} from './Ray';
import {Track} from './Track';
const config = require('./config.json');

const offTrackColor = config.offTrackColor;
const initialCarSpeed = config.initialCarSpeed;
const maxSpeed = config.carMaxSpeed;

export type DriveMode = 'BASIC' | 'PERCENTAGE' | 'DNA';

export class Car {
    p5: P5;
    pos: P5.Vector;
    speed: P5.Vector;
    maxSpeedMag: number;
    crashed: boolean;
    rays: Ray[];
    sensorDistances: number[];
    sensorPoints: P5.Vector[];
    trail: P5.Vector[];
    traveledDistance: number;
    lap: number;
    color: P5.Color;
    driveMode: DriveMode;
    score: number;
    debugRay: boolean;
    debugTrail: boolean;
    dna: DNA;

    constructor(
        p5: P5,
        params: {
            pos: P5.Vector | {x: number; y: number};
            direction: P5.Vector;
            driveMode: DriveMode;
            dna: DNA;
            color?: P5.Color;
            debugRay?: boolean;
            debugTrail?: boolean;
        }
    ) {
        this.p5 = p5;
        this.crashed = false;
        if (!params?.pos) {
            this.pos = this.p5.createVector(10, 10);
        } else if (params.pos instanceof P5.Vector) {
            this.pos = params.pos;
        } else {
            this.pos = this.p5.createVector(params.pos.x, params.pos.y);
        }
        this.speed = params.direction.copy().setMag(initialCarSpeed);

        this.rays = [];
        this.crashed = false;
        for (let a = -45; a < 45; a += 10) {
            this.rays.push(new Ray(this.p5, this.pos, this.p5.radians(a) + this.speed.heading()));
        }
        this.trail = [this.pos.copy()];
        this.traveledDistance = 0;
        this.lap = 0;

        this.driveMode = params.driveMode;
        this.color = this.p5.color('white');
        if (this.driveMode === 'BASIC') {
            this.color = this.p5.color('#bfb91e');
        }
        if (this.driveMode === 'PERCENTAGE') {
            this.color = this.p5.color('#1ebfac');
        }
        if (this.driveMode === 'DNA') {
            this.color = this.p5.color('#8048f9');
        }
        if (params.color) {
            this.color = params.color;
        }
        this.score = 0;

        this.debugRay = params.debugRay || false;
        this.debugTrail = params.debugTrail || false;

        this.dna = params.dna;
        this.maxSpeedMag = maxSpeed;
    }

    show() {
        let color = this.color;
        const secondaryColor = this.p5.color(color.toString());
        secondaryColor.setAlpha(50);

        this.p5.stroke(color);
        this.p5.fill(color);
        this.p5.strokeWeight(1);
        if (this.crashed) {
            this.p5.stroke('red');
        }
        this.p5.circle(this.pos.x, this.pos.y, 15);

        this.p5.stroke(secondaryColor);
        if (this.debugRay) {
            for (const sensorPoint of this.sensorPoints) {
                this.p5.line(this.pos.x, this.pos.y, sensorPoint.x, sensorPoint.y);
            }
        }

        if (this.debugTrail) {
            for (let i = 0; i < this.trail.length - 1; i++) {
                const p = this.trail[i];
                const q = this.trail[i + 1];
                this.p5.noStroke();
                const alpha = this.p5.map(i, 0, this.trail.length, 50, 250);
                this.p5.fill(secondaryColor);
                this.p5.circle(p.x, p.y, 3);
                this.p5.stroke(secondaryColor);
                this.p5.line(p.x, p.y, q.x, q.y);
            }
        }
    }

    update() {
        if (this.crashed) {
            return;
        }
        this.pos.add(this.speed);
        this.pos.x = this.p5.constrain(this.pos.x, 0, this.p5.width);
        this.pos.y = this.p5.constrain(this.pos.y, 0, this.p5.height);

        if (!this.trail) {
            return;
        }
        const lastTrail = this.trail[this.trail.length - 1];
        const distanceToLastTrail = this.pos.dist(lastTrail);
        if (distanceToLastTrail > 50) {
            this.traveledDistance += distanceToLastTrail;
            this.trail.push(this.pos.copy());
            if (this.trail.length > 200) {
                this.trail.shift();
            }
        }
    }

    updateTrackInfo(track) {
        this.countLap(track.distance);
        this.checkIsOnTrack(track.image);
        this.scoreCurrentPosition(track);
        this.look([track.rightBorder, track.leftBorder]);
    }

    countLap(trackDistance: number) {
        const current = Math.floor(this.traveledDistance / trackDistance);
        if (current > this.lap) {
            this.lap = current;
            this.accelerate();
        }
    }

    scoreCurrentPosition(track: Track) {
        const positionScore = track.scorePosition(this.pos);
        this.score += positionScore;
    }

    driveDecision() {
        if (this.driveMode === 'BASIC') {
            this.driveDecisionBasic();
            return;
        }
        if (this.driveMode === 'PERCENTAGE') {
            this.driveDecisionPercentage();
            return;
        }
        if (this.driveMode === 'DNA') {
            this.driveDecisionDNA();
        }
    }

    driveDecisionPercentage() {
        let right = 0;
        let left = 0;
        for (let i = 0; i < this.sensorDistances.length / 2; i++) {
            left += this.sensorDistances[i];
            right += this.sensorDistances[this.sensorDistances.length - 1 - i];
        }

        const total = right + left;
        const rightPercentage = right / total;
        const leftPercentage = left / total;
        const percentage = leftPercentage - rightPercentage;
        if (percentage > -1 && percentage < 1) {
            this.turnByPercentage(rightPercentage);
            this.turnByPercentage(-leftPercentage);
        }
    }

    driveDecisionBasic() {
        let right = 0;
        let left = 0;
        for (let i = 0; i < this.sensorDistances.length / 2; i++) {
            left += this.sensorDistances[i];
            right += this.sensorDistances[this.sensorDistances.length - 1 - i];
        }
        if (right > left) {
            this.turn('RIGHT');
        } else {
            this.turn('LEFT');
        }
    }

    driveDecisionDNA() {
        let right = 0;
        let left = 0;
        for (let i = 0; i < this.sensorDistances.length / 2; i++) {
            left += this.sensorDistances[i];
            right += this.sensorDistances[this.sensorDistances.length - 1 - i];
        }
        const angle = this.dna.turnAngle;
        if (right > left) {
            this.turnByAngleDeg(angle);
        } else {
            this.turnByAngleDeg(-angle);
        }
    }

    accelerate() {
        if (this.speed.mag() === this.maxSpeedMag) {
            return;
        }
        if (this.speed.mag() > this.maxSpeedMag) {
            this.speed.setMag(this.maxSpeedMag);
            return;
        }
        // TODO: Fix the algorithm for progressive acceleration
        const coef = 1 + 1 / ((this.lap * this.lap) % (5 * 5));
        this.speed.mult(coef);
        // this.speed.mult(1.1);
    }

    deccelerate() {
        this.speed.mult(0.9);
    }

    // Percentage: [-1, 1]
    // -1: Full left, 1: Full right, 0: no turn
    turnByPercentage(percentage: number) {
        if (percentage < -1 || percentage > 1) {
            throw new Error(`Out of range percentage ${percentage}`);
        }
        const maxAngle = this.p5.radians(40);
        const angle = this.p5.map(percentage, -1, 1, -maxAngle, maxAngle);

        this.speed.rotate(angle);
        for (const ray of this.rays) {
            ray.dir.rotate(angle);
        }
    }

    turnByAngleDeg(angleDeg: number) {
        this.speed.rotate(this.p5.radians(angleDeg));

        for (const ray of this.rays) {
            ray.dir.rotate(this.p5.radians(angleDeg));
        }
    }

    turn(dir: 'LEFT' | 'RIGHT') {
        // let angle = this.p5.PI / 5;
        let angle = 10;
        if (dir === 'LEFT') {
            angle = -angle;
        }
        this.speed.rotate(this.p5.radians(angle));

        for (const ray of this.rays) {
            ray.dir.rotate(this.p5.radians(angle));
        }
    }

    look(borders: Point[][]) {
        const walls = [];
        this.sensorDistances = [];
        this.sensorPoints = [];
        for (const points of borders) {
            for (let i = 0; i < points.length - 1; i++) {
                walls.push([points[i], points[i + 1]]);
            }
        }
        let distances = [];
        for (let i = 0; i < this.rays.length; i++) {
            const ray = this.rays[i];
            let closest = null;
            let record = Infinity;
            for (let wall of walls) {
                const pt = ray.cast(wall);
                if (pt) {
                    const d = this.pos.dist(pt);
                    if (d < record) {
                        record = d;
                        closest = pt;
                    }
                }
            }
            if (closest) {
                this.sensorPoints.push(closest);
                distances.push(this.p5.dist(this.pos.x, this.pos.y, closest.x, closest.y));
            } else {
                distances.push(-1.0);
            }
        }
        this.sensorDistances = distances;
    }

    // Given the image representing the track and the color of the background
    // update this.crashed testing if the color in the image at the current position
    // is the same as the background color
    checkIsOnTrack(trackImage: P5.Image) {
        // Hacky hack
        if (this.pos.x < 0 || this.pos.y < 0 || this.pos.x >= trackImage.width || this.pos.y >= trackImage.height) {
            this.crashed = true;
            return true;
        }
        const currentColor = trackImage.get(this.pos.x, this.pos.y);
        const colorMatch =
            currentColor[0] === offTrackColor[0] &&
            currentColor[1] === offTrackColor[1] &&
            currentColor[2] === offTrackColor[2];
        this.crashed = colorMatch;
        return this.crashed;
    }
}
