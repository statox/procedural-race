import P5 from 'p5';
const config = require('./config.json');

const offTrackColor = config.offTrackColor;

export class Car {
    p5: P5;
    pos: P5.Vector;
    crashed: boolean;

    constructor(p5: P5) {
        this.p5 = p5;
        this.pos = p5.createVector(p5.width / 2, p5.height / 2);
        this.crashed = false;
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
        const x = this.p5.constrain(this.p5.mouseX, 0, this.p5.width);
        const y = this.p5.constrain(this.p5.mouseY, 0, this.p5.height);
        this.pos.x = x;
        this.pos.y = y;
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
