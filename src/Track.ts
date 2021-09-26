import P5 from 'p5';
import {generateBezierCurve} from './bezier';
import {Point} from './Point';
import {Screenshotter} from './Screenshotter';
import {angleToVertical, threePointsAngle, collideLineLine} from './utils';
const hull = require('hull.js');
const config = require('./config.json');

const offTrackColor = config.offTrackColor;

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
    heatmapImage: P5.Image;
    startingPosition: P5.Vector;
    startingDirection: P5.Vector;
    distance: number;
    debugBorders: boolean;
    debugInterpolatedHull: boolean;
    debugHeatmap: boolean;

    constructor(p5: P5) {
        this.p5 = p5;
        this.difficulty = 500; // 0 very hard (concave hull) - Infinity very easy (convex hull)
        this.maxNumberOfInitialPoints = 12;
        this.minDistanceBetweenInitialPoint = 10;
        this.minHullAngle = this.p5.radians(95);
        this.points = [];
        this.debugBorders = false;
        this.debugInterpolatedHull = false;
        this.debugHeatmap = false;

        this.reset();
    }

    reset() {
        this.image = null;
        this.heatmapImage = null;
        this.pathWidth = this.p5.random(30, 130);
        this.numberOfInitialPoints = this.p5.random(4, this.maxNumberOfInitialPoints);
        this.generateRandomPoints(this.numberOfInitialPoints);
        // this.generateSquare();
        // this.generate5Points();
        this.pushApart();
        this.calculateHull();
        this.fixHullAngles();
        if (this.checkForIntersection()) {
            return this.reset();
        }
        this.calculateInterpolatedHull();
        this.calculateDistance();
        this.calculateBorders();

        if (this.checkForBordersIntersection()) {
            return this.reset();
        }
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
                if (this.debugHeatmap && this.heatmapImage) {
                    this.p5.stroke('black');
                }
                this.p5.strokeWeight(this.pathWidth);
                this.p5.line(A.x, A.y, B.x, B.y);
            }

            const A = this.interpolatedHull[0];
            const B = this.interpolatedHull[1];
            const l = B.pos.copy().sub(A.pos);

            const left = l
                .copy()
                .setMag(this.pathWidth / 2)
                .rotate(this.p5.PI / 2)
                .add(A.pos);
            const right = l
                .copy()
                .setMag(this.pathWidth / 2)
                .rotate(-this.p5.PI / 2)
                .add(A.pos);

            this.p5.stroke('green');
            this.p5.strokeWeight(3);
            this.p5.line(left.x, left.y, right.x, right.y);

            if (this.debugInterpolatedHull) {
                for (let i = 0; i < this.interpolatedHull.length; i++) {
                    const A = this.interpolatedHull[i].pos;
                    const r = this.p5.map(i, 0, this.interpolatedHull.length, 1, 10);
                    this.p5.fill('red');
                    this.p5.noStroke();
                    this.p5.circle(A.x, A.y, r);
                }
            }
        }

        if (this.debugBorders) {
            if (this.rightBorder) {
                for (let i = 0; i <= this.rightBorder.length - 1; i++) {
                    const A = this.rightBorder[i].pos;
                    const B = this.rightBorder[(i + 1) % this.rightBorder.length].pos;
                    this.p5.stroke(i % 2 ? 'red' : 'white');
                    this.p5.strokeWeight(3);
                    this.p5.line(A.x, A.y, B.x, B.y);
                }
            }
            if (this.leftBorder) {
                for (let i = 0; i <= this.leftBorder.length - 1; i++) {
                    const A = this.leftBorder[i].pos;
                    const B = this.leftBorder[(i + 1) % this.leftBorder.length].pos;
                    this.p5.stroke(i % 2 ? 'red' : 'white');
                    this.p5.strokeWeight(3);
                    this.p5.line(A.x, A.y, B.x, B.y);
                }
            }
        }

        if (this.debugHeatmap && this.heatmapImage) {
            this.p5.image(this.heatmapImage, 0, 0);
        }
    }

    takeScreenshotIfNeeded() {
        if (!this.image) {
            const screenshotter = new Screenshotter(this.p5);
            this.image = screenshotter.screenshot();
            this.generateHeatmap();
        }
    }

    // Using the image generated by the screenshot
    // Create another image with color only on the road pixels
    // The color goes from [0, 0, 0] to [255, 0, 0] depending
    // on how close to the start of the track it is
    // /!\ this funciton only works if the first point in this.interpolatedHull
    // /!\ is the starting position of the cars
    generateHeatmap() {
        if (!this.image) {
            throw new Error("Can't generate heatmap without image");
        }
        if (!this.interpolatedHull) {
            throw new Error("Can't generate heatmap without interpolated hull");
        }
        let heatmapImg = this.p5.createImage(this.image.width, this.image.height);
        heatmapImg.loadPixels();
        for (let i = 0; i < this.image.width; i++) {
            for (let j = 0; j < this.image.height; j++) {
                const imageColor = this.image.get(i, j);
                // Skip the pixels which are not on the track
                if (
                    imageColor[0] === offTrackColor[0] &&
                    imageColor[1] === offTrackColor[1] &&
                    imageColor[2] === offTrackColor[2]
                ) {
                    continue;
                }
                // Check the index of the closest point on the hull for this pixel
                let minDistance = Infinity;
                let closestPointOnHull;
                for (let k = 0; k < this.interpolatedHull.length; k++) {
                    const pos = this.interpolatedHull[k].pos;
                    const sqrDist = (i - pos.x) * (i - pos.x) + (j - pos.y) * (j - pos.y);
                    const dist = Math.sqrt(sqrDist);
                    if (sqrDist < minDistance) {
                        minDistance = sqrDist;
                        closestPointOnHull = k;
                    }
                }
                // Set the color level depending on the position of the closest point on hull
                const colorLevel = this.p5.map(closestPointOnHull, 0, this.interpolatedHull.length, 0, 255);
                heatmapImg.set(i, j, this.p5.color([colorLevel, 0, 0, 150]));
            }
        }
        heatmapImg.updatePixels();
        this.heatmapImage = heatmapImg;
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

    // Check if the hull intersects itself
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

    // after fixing a hull and generating the borders check
    // that the left and right borders don't intersect
    checkForBordersIntersection() {
        if (!this.rightBorder || !this.leftBorder) {
            throw new Error("Can't check for border intersection without borders");
        }
        for (let i = 0; i < this.leftBorder.length; ++i) {
            const nextIndex = (i + 1) % this.leftBorder.length;
            const next = this.leftBorder[nextIndex];
            const current = this.leftBorder[i];

            const A = current;
            const B = next;

            for (let j = 0; j < this.rightBorder.length; ++j) {
                if (j === i) {
                    continue;
                }
                const C = this.rightBorder[j];
                const D = this.rightBorder[(j + 1) % this.rightBorder.length];

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
        const startingVertexIndex = Math.floor(this.p5.random(1, this.interpolatedHull.length - 2));
        this.startingPosition = this.interpolatedHull[startingVertexIndex].pos.copy();
        const randomDirection = Math.random() > 0.5 ? -1 : 1;
        this.startingDirection = this.startingPosition
            .copy()
            .sub(this.interpolatedHull[startingVertexIndex + randomDirection].pos);

        // Make sure the first point in the interpolatedHull is the one where the cars will start
        const sortedHull = [];
        let start = 0;
        let end = this.interpolatedHull.length - 1;
        let inc = 1;
        if (randomDirection > 0) {
            start = this.interpolatedHull.length - 1;
            end = 0;
            inc = -1;
        }

        for (let i = start; i !== end; i += inc) {
            const index = (i + startingVertexIndex) % this.interpolatedHull.length;
            sortedHull.push(this.interpolatedHull[index]);
        }
        this.interpolatedHull = sortedHull;
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

    // Given a position on the screen return a score between 0 and 1
    // 0: near start
    // 1: near end
    scorePosition(p: P5.Vector) {
        if (!this.heatmapImage) {
            throw new Error("Can't score a position without heatmap");
        }

        return this.heatmapImage.get(p.x, p.y)[0] / 255;
    }
}
