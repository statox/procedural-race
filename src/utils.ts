import P5 from 'p5';
import {Point} from './Point';

const PI = 3.141592653589793;
const verticalReference = new P5.Vector();
verticalReference.x = 0;
verticalReference.y = 1;

function threePointsAngle(center: Point, A: Point, B: Point) {
    const base = A.pos.copy().sub(center.pos);
    const target = B.pos.copy().sub(center.pos);
    const angle = base.angleBetween(target);
    return angle;
}

function angleToVertical(base: Point, mover: Point) {
    const diff = mover.pos.copy().sub(base.pos);
    const angleR = verticalReference.angleBetween(diff) + PI;
    return angleR;
}

export {angleToVertical, threePointsAngle};
