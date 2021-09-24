import P5 from 'p5';
import {Point} from './Point';
import {Ray} from './Ray';
const config = require('./config.json');

const offTrackColor = config.offTrackColor;

export class Car {
    p5: P5;
    pos: P5.Vector;
    speed: P5.Vector;
    crashed: boolean;
    rays: Ray[];

    constructor(p5: P5, params?: {pos?: P5.Vector | {x: number; y: number}}) {
        this.p5 = p5;
        this.crashed = false;
        if (!params?.pos) {
            this.pos = this.p5.createVector(10, 10);
        } else if (params.pos instanceof P5.Vector) {
            this.pos = params.pos;
        } else {
            this.pos = this.p5.createVector(params.pos.x, params.pos.y);
        }
        this.speed = this.p5.createVector(2, 0);

        this.rays = [];
        this.crashed = false;
        for (let a = -45; a < 45; a += 10) {
            this.rays.push(new Ray(this.p5, this.pos, this.p5.radians(a)));
        }
    }

    show() {
        if (this.crashed) {
            this.p5.stroke('red');
            this.p5.fill('red');
        } else {
            this.p5.stroke('white');
            this.p5.fill('white');
        }
        this.p5.strokeWeight(1);
        this.p5.circle(this.pos.x, this.pos.y, 15);
    }

    update() {
        // if (!this.crashed) {
        this.pos.add(this.speed);

        this.pos.x = this.p5.constrain(this.pos.x, 0, this.p5.width);
        this.pos.y = this.p5.constrain(this.pos.y, 0, this.p5.height);

        // }
    }

    turn(dir: 'LEFT' | 'RIGHT') {
        // let angle = this.p5.PI / 5;
        let angle = 8;
        if (dir === 'LEFT') {
            angle = -angle;
        }
        this.speed.rotate(this.p5.radians(angle));

        for (const ray of this.rays) {
            ray.dir.rotate(this.p5.radians(angle));
        }
    }

    look(points: Point[]) {
        const walls = [];
        for (let i = 0; i < points.length - 1; i++) {
            walls.push([points[i], points[i + 1]]);
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
                this.p5.stroke(255, 100);
                this.p5.line(this.pos.x, this.pos.y, closest.x, closest.y);
                distances.push(this.p5.dist(this.pos.x, this.pos.y, closest.x, closest.y));
            } else {
                distances.push(-1.0);
            }
        }
    }

    // Given the image representing the track and the color of the background
    // update this.crashed testing if the color in the image at the current position
    // is the same as the background color
    checkIsOnTrack(trackImage: P5.Image) {
        const currentColor = trackImage.get(this.pos.x, this.pos.y);
        const colorMatch =
            currentColor[0] === offTrackColor[0] &&
            currentColor[1] === offTrackColor[1] &&
            currentColor[2] === offTrackColor[2];
        this.crashed = colorMatch;
        return this.crashed;
    }
}
