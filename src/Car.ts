import P5 from 'p5';
const config = require('./config.json');

const offTrackColor = config.offTrackColor;

export class Car {
    p5: P5;
    pos: P5.Vector;
    speed: P5.Vector;
    crashed: boolean;

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
        this.speed = this.p5.createVector(1, 0);
    }

    show() {
        this.p5.noFill();
        if (this.crashed) {
            this.p5.stroke('red');
        } else {
            this.p5.stroke('white');
        }
        this.p5.strokeWeight(1);
        this.p5.circle(this.pos.x, this.pos.y, 20);
    }

    update() {
        // this.pos.add(this.speed);
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
