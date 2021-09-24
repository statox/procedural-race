import P5 from 'p5';
import {Point} from './Point';

// 2D Ray Casting
// https://editor.p5js.org/codingtrain/sketches/Nqsq3DFv-
export class Ray {
    p5: P5;
    pos: P5.Vector;
    dir: P5.Vector;

    constructor(p5: P5, pos: P5.Vector, angle: number) {
        this.p5 = p5;
        this.pos = pos;
        this.dir = P5.Vector.fromAngle(angle);
    }

    show() {
        this.p5.stroke(255);
        this.p5.push();
        this.p5.translate(this.pos.x, this.pos.y);
        this.p5.line(0, 0, this.dir.x * 10, this.dir.y * 10);
        this.p5.pop();
    }

    cast([A, B]: Point[]) {
        const x1 = A.pos.x;
        const y1 = A.pos.y;
        const x2 = B.pos.x;
        const y2 = B.pos.y;

        const x3 = this.pos.x;
        const y3 = this.pos.y;
        const x4 = this.pos.x + this.dir.x;
        const y4 = this.pos.y + this.dir.y;

        const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (den == 0) {
            return;
        }

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
        if (t > 0 && t < 1 && u > 0) {
            const pt = this.p5.createVector();
            pt.x = x1 + t * (x2 - x1);
            pt.y = y1 + t * (y2 - y1);
            return pt;
        } else {
            return;
        }
    }
}
