import P5 from 'p5';
import {Point} from './Point';

function myBezierPoint(a, b, c, d, t) {
    const t3 = t * t * t,
        t2 = t * t,
        f1 = -0.5 * t3 + t2 - 0.5 * t,
        f2 = 1.5 * t3 - 2.5 * t2 + 1.0,
        f3 = -1.5 * t3 + 2.0 * t2 + 0.5 * t,
        f4 = 0.5 * t3 - 0.5 * t2;
    return a * f1 + b * f2 + c * f3 + d * f4;
}

function indexMod(index: number, totalLength: number) {
    if (index < 0) {
        return indexMod(totalLength + index, totalLength);
    }
    if (index >= totalLength) {
        return indexMod(index - totalLength, totalLength);
    }
    return index;
}

function generateBezierCurve(points: P5.Vector[], step: number) {
    const curve = [];
    for (let i = 0; i < points.length; i++) {
        const a = points[indexMod(i - 1, points.length)];
        const b = points[indexMod(i, points.length)];
        const c = points[indexMod(i + 1, points.length)];
        const d = points[indexMod(i + 2, points.length)];

        const x = myBezierPoint(a.x, b.x, c.x, d.x, 0.5);
        const y = myBezierPoint(a.y, b.y, c.y, d.y, 0.5);
        const pos = new P5.Vector();
        pos.x = x;
        pos.y = y;

        curve.push(points[indexMod(i, points.length)]);
        curve.push(pos);
    }
    if (!step || step === 0) {
        curve.push(curve[0]);
        return curve;
    }
    return generateBezierCurve(curve, step - 1);
}

export {generateBezierCurve};
