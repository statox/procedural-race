import P5 from 'p5';
import {generateBezierCurve} from './bezier';
import {Point} from './Point';
import {Screenshotter} from './Screenshotter';
import {angleToVertical, threePointsAngle, collideLineLine} from './utils';
const hull = require('hull.js');

export class Track {
    p5: P5;
    points: Point[];
    hull: Point[];
    interpolatedHull: Point[];
    rightBorder: Point[];
    leftBorder: Point[];
    maxNumberOfInitialPoints: number;
    numberOfInitialPoints: number;
    minDistanceBetweenInitialPoint: number;
    difficulty: number;
    minHullAngle: number;
    pathWidth: number;
    image: P5.Image;
    startingPosition: P5.Vector;
    startingDirection: P5.Vector;
    distance: number;

    constructor(p5: P5) {
        this.p5 = p5;
        this.difficulty = 500; // 0 very hard (concave hull) - Infinity very easy (convex hull)
        this.maxNumberOfInitialPoints = 12;
        this.minDistanceBetweenInitialPoint = 10;
        this.minHullAngle = this.p5.radians(95);
        this.points = [];

        this.reset();
    }

    reset() {
        this.image = null;
        this.pathWidth = this.p5.random(30, 130);
        this.pathWidth = 100;
        this.numberOfInitialPoints = this.p5.random(4, this.maxNumberOfInitialPoints);
        this.generateRandomPoints(this.numberOfInitialPoints);
        // this.generateSquare();
        // this.generate5Points();
        this.pushApart();
        this.calculateHull();
        this.fixHullAngles();
        if (this.checkForIntersection()) {
            this.reset();
        }
        this.calculateInterpolatedHull();
        this.calculateDistance();
        this.calculateBorders();
    }

    show() {
        if (!this.hull) {
            this.points.forEach((p) => p.show());
        }

        if (this.hull && !this.interpolatedHull) {
            for (let i = 0; i < this.hull.length - 1; i++) {
                // this.hull[i].show();
                const A = this.hull[i].pos;
                const B = this.hull[i + 1].pos;
                this.p5.stroke('green');
                this.p5.line(A.x, A.y, B.x, B.y);
            }
            // this.hull[this.hull.length - 1].show();
        }

        if (this.rightBorder) {
            for (let i = 0; i <= this.rightBorder.length - 1; i++) {
                const A = this.rightBorder[i].pos;
                const B = this.rightBorder[(i + 1) % this.rightBorder.length].pos;
                this.p5.stroke(i % 2 ? 'red' : 'white');
                this.p5.strokeWeight(5);
                this.p5.line(A.x, A.y, B.x, B.y);
            }
        }
        if (this.leftBorder) {
            for (let i = 0; i <= this.leftBorder.length - 1; i++) {
                const A = this.leftBorder[i].pos;
                const B = this.leftBorder[(i + 1) % this.leftBorder.length].pos;
                this.p5.stroke(i % 2 ? 'red' : 'white');
                this.p5.strokeWeight(5);
                this.p5.line(A.x, A.y, B.x, B.y);
            }
        }

        if (this.interpolatedHull) {
            for (let i = 0; i < this.interpolatedHull.length - 1; i++) {
                const A = this.interpolatedHull[i].pos;
                const B = this.interpolatedHull[i + 1].pos;
                this.p5.stroke('#222226');
                this.p5.strokeWeight(this.pathWidth);
                this.p5.line(A.x, A.y, B.x, B.y);
            }
        }
    }

    takeScreenshotIfNeeded() {
        if (!this.image) {
            const screenshotter = new Screenshotter(this.p5);
            this.image = screenshotter.screenshot();
        }
    }

    generateRandomPoints(n: number) {
        this.points = [];
        for (let _ = 0; _ < n; _++) {
            const pos = this.p5.createVector();
            pos.x = this.p5.random(this.p5.width);
            pos.y = this.p5.random(this.p5.height);
            const p = new Point(this.p5, {pos});
            this.points.push(p);
        }
    }

    generateSquare() {
        this.points = [];
        const w = this.p5.width;
        const h = this.p5.height;
        const topLeft = this.p5.createVector(w * 0.1, h * 0.1);
        const topRight = this.p5.createVector(w * 0.9, h * 0.1);
        const bottomLeft = this.p5.createVector(w * 0.1, h * 0.9);
        const bottomRight = this.p5.createVector(w * 0.9, h * 0.9);
        this.points = [
            new Point(this.p5, {pos: topLeft}),
            new Point(this.p5, {pos: topRight}),
            new Point(this.p5, {pos: bottomLeft}),
            new Point(this.p5, {pos: bottomRight})
        ];
    }

    generate5Points() {
        this.points = [];
        const w = this.p5.width;
        const h = this.p5.height;
        const topLeft = this.p5.createVector(w * 0.2, h * 0.5);
        const topMiddle = this.p5.createVector(w * 0.5, h * 0.1);
        const topRight = this.p5.createVector(w * 0.8, h * 0.5);
        const bottomLeft = this.p5.createVector(w * 0.2, h * 0.8);
        const bottomRight = this.p5.createVector(w * 0.8, h * 0.8);
        this.points = [
            new Point(this.p5, {pos: topLeft}),
            new Point(this.p5, {pos: topMiddle}),
            new Point(this.p5, {pos: topRight}),
            new Point(this.p5, {pos: bottomLeft}),
            new Point(this.p5, {pos: bottomRight})
        ];
    }

    pushApart() {
        const maxIteration = 100;
        let i = 0;
        let pushedPoints = this._pushApart();
        while (i < maxIteration && pushedPoints > 0) {
            pushedPoints = this._pushApart();
            i++;
        }

        return i;
    }

    _pushApart() {
        const dst = this.minDistanceBetweenInitialPoint;
        const dst2 = dst * dst;
        let pushedApart = 0;
        for (let i = 0; i < this.points.length; i++) {
            for (let j = 0; j < this.points.length; j++) {
                const p1 = this.points[i];
                const p2 = this.points[j];
                if (p1.id === p2.id) {
                    continue;
                }
                const hl = p1.pos.dist(p2.pos);
                if (hl < dst2) {
                    pushedApart++;
                    let hx = p2.pos.x - p1.pos.x;
                    let hy = p2.pos.y - p1.pos.y;
                    const hl = Math.sqrt(hx * hx + hy * hy);
                    hx /= hl;
                    hy /= hl;
                    const diff = dst - hl;
                    hx *= diff;
                    hy *= diff;
                    p2.pos.x -= hx;
                    p2.pos.y -= hy;
                    p1.pos.x += hx;
                    p1.pos.y += hy;

                    p1.constrain();
                    p2.constrain();
                }
            }
        }
        return pushedApart;
    }

    calculateHull() {
        if (!this.points) {
            throw new Error("Can't generate convex hull with no points");
        }

        let leftMostPoint = this.points[0];
        for (let i = 1; i < this.points.length; i++) {
            if (this.points[i].pos.x < leftMostPoint.pos.x) {
                leftMostPoint = this.points[i];
            }
        }

        leftMostPoint.color = this.p5.color('green');

        const points = this.points.map((p) => [p.pos.x, p.pos.y]);
        const H = hull(points, this.difficulty);
        this.hull = [];
        for (const p of H) {
            const point = new Point(this.p5, {pos: {x: p[0], y: p[1]}, color: this.p5.color('green'), r: 10});
            this.hull.push(point);
        }
        return 0;
    }

    // http://blog.meltinglogic.com/2013/12/how-to-generate-procedural-racetracks/
    fixHullAngles() {
        const maxIteration = 10;
        let i = 0;
        let fixedAngles = this._fixHullAngles();
        while (i < maxIteration && fixedAngles > 0) {
            fixedAngles = this._fixHullAngles();
            i++;
        }
        return i;
    }
    _fixHullAngles() {
        if (!this.hull) {
            throw new Error("Can't fix hull angles with no hull");
        }
        this.hull.pop(); // this.calculateHull() adds the first point as the last one, remove it for now
        let anglesFixed = 0;
        for (let i = 0; i < this.hull.length; ++i) {
            const previousIndex = i - 1 < 0 ? this.hull.length - 1 : i - 1;
            const nextIndex = (i + 1) % this.hull.length;
            const previous = this.hull[previousIndex];
            const next = this.hull[nextIndex];
            const current = this.hull[i];

            // Get vectors from the current point to the previous one and to the next one
            const vp = previous.pos.copy().sub(current.pos);
            const vn = next.pos.copy().sub(current.pos);

            // Save the magnitude of the current->next vector that we will move
            const vnSavedMag = vn.mag();

            // Normalize the vectors to compute the angle
            vp.normalize();
            vn.normalize();
            const angle = vp.angleBetween(vn);

            // If the angle is more than the minimum configured we can skip this point
            if (angle >= this.minHullAngle) {
                continue;
            }
            anglesFixed++;

            // Take the current-> next vector and rotate it to have a wider angle
            // Then reuse its magnitude and set the new position of the next point
            const headingDiff = this.minHullAngle - angle;
            vn.setMag(vnSavedMag);
            vn.rotate(-headingDiff);
            vn.add(current.pos);
            next.pos.x = vn.x;
            next.pos.y = vn.y;
            next.constrain();
        }

        // Make sure the add the point we had removed at the beginning of the function
        this.hull.push(this.hull[0]);
        return anglesFixed;
    }

    checkForIntersection() {
        for (let i = 0; i < this.hull.length; ++i) {
            const nextIndex = (i + 1) % this.hull.length;
            const next = this.hull[nextIndex];
            const current = this.hull[i];

            const A = current;
            const B = next;

            for (let j = 0; j < this.hull.length; ++j) {
                if (j === i) {
                    continue;
                }
                const C = this.hull[j];
                const D = this.hull[(j + 1) % this.hull.length];

                const intersection = collideLineLine(A, B, C, D);
                if (intersection) {
                    return true;
                }
            }
        }

        return false;
    }

    calculateInterpolatedHull() {
        if (!this.hull) {
            throw new Error("Can't calculate curve with no hull");
        }

        this.hull.pop(); // this.calculateHull() adds the first point as the last one, remove it for now
        const points = this.hull.map((p) => p.pos);
        const H = generateBezierCurve(points, 5);
        this.interpolatedHull = H.map((pos) => new Point(this.p5, {pos, color: this.p5.color('blue'), r: 3}));
        this.startingPosition = this.interpolatedHull[0].pos.copy();
        this.startingDirection = this.startingPosition.copy().sub(this.interpolatedHull[1].pos);
    }
    calculateDistance() {
        if (!this.interpolatedHull) {
            throw new Error("Can't calculate distance without interpolated hull");
        }
        this.distance = 0;
        for (let i = 0; i < this.interpolatedHull.length - 1; i++) {
            const a = this.interpolatedHull[i];
            const b = this.interpolatedHull[i + 1];
            const delta = a.pos.dist(b.pos);
            this.distance += delta;
        }
    }

    calculateBorders() {
        const segments = 50;
        const step = Math.floor(this.interpolatedHull.length / segments);
        const lefts = [];
        const rights = [];
        for (let i = 0; i < this.interpolatedHull.length - 1; i += step) {
            const anchor = this.interpolatedHull[i].pos;
            const mover = this.interpolatedHull[i + 1].pos;
            const diff = mover.copy().sub(anchor);

            const left = diff
                .copy()
                .setMag(this.pathWidth / 2)
                .rotate(this.p5.PI / 2)
                .add(anchor);
            const right = diff
                .copy()
                .setMag(this.pathWidth / 2)
                .rotate(-this.p5.PI / 2)
                .add(anchor);

            rights.push(right);
            lefts.push(left);
        }
        this.rightBorder = rights.map(
            (pos) => new Point(this.p5, {pos, color: this.p5.color('rgba(250, 0, 0, 0.4)'), r: 3, skipContrain: true})
        );
        this.leftBorder = lefts.map(
            (pos) => new Point(this.p5, {pos, color: this.p5.color('rgba(0, 250, 0, 0.4)'), r: 3, skipContrain: true})
        );

        this.removeBorderIntersection();
    }

    removeBorderIntersection() {
        const maxIteration = 100;
        let removedPoints = 1;
        let i = 1;
        // while (i < maxIteration && removedPoints > 0) {
        while (i < maxIteration) {
            removedPoints = this._removeBorderIntersection();
            i++;
        }

        // Bug fix to make sure we didn't remove the last point which
        // would create a hole in the borders
        this.leftBorder.push(this.leftBorder[0]);
        this.rightBorder.push(this.rightBorder[0]);

        return i;
    }

    // The left border tends to have intersections when the track angle is too sharp
    // this is a small hack which iterates through the segments (AB),
    // search for an intersecting other segments (CD)
    // And if an intersection happens move B to the intersection point and
    // removes the points between B and C
    _removeBorderIntersection() {
        let stop = false;
        let i = 0;
        let pointsRemoved = 0;
        let intersectionFound = 0;
        while (!stop && i < this.leftBorder.length) {
            const indexA = i % this.leftBorder.length;
            const indexB = (i + 1) % this.leftBorder.length;
            const A = this.leftBorder[indexA];
            const B = this.leftBorder[indexB];

            let j = indexB;
            let intersection = null as boolean | P5.Vector;
            let indexC = j;
            let indexD = (j + 1) % this.leftBorder.length;
            // while (!intersection && j < this.leftBorder.length) {
            // Hack to avoid cutting between points 1 and 50 when the loop is placed badly
            // while (!intersection && j < Math.min(i + 10, this.leftBorder.length)) {
            while (!intersection && j < i + 10) {
                indexC = j % this.leftBorder.length;
                indexD = (j + 1) % this.leftBorder.length;
                const C = this.leftBorder[indexC];
                const D = this.leftBorder[indexD];

                intersection = collideLineLine(A, B, C, D);
                j++;
            }

            if (intersection) {
                intersectionFound++;
                stop = true;
                B.pos.x = (intersection as P5.Vector).x;
                B.pos.y = (intersection as P5.Vector).y;

                for (let k = indexB; k < indexC; k++) {
                    this.leftBorder.splice(indexB + 1, 1);
                    pointsRemoved++;
                }
                i--;
            }

            i++;
        }

        return pointsRemoved;
    }
}
