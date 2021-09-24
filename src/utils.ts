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

function collideLineLine(A: Point, B: Point, C: Point, D: Point) {
    const {x: x1, y: y1} = A.pos;
    const {x: x2, y: y2} = B.pos;
    const {x: x3, y: y3} = C.pos;
    const {x: x4, y: y4} = D.pos;

    // Avoid considering collision if one point is in common
    if (A.id === C.id || A.id === D.id || B.id === C.id || B.id === D.id) {
        return false;
    }

    // calculate the distance to intersection point
    const uA = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
    const uB = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

    // if uA and uB are between 0-1, lines are colliding
    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
        const intersection = new P5.Vector();
        intersection.x = x1 + uA * (x2 - x1);
        intersection.y = y1 + uA * (y2 - y1);
        return intersection;
    }

    return false;
}
export {angleToVertical, threePointsAngle, collideLineLine};
