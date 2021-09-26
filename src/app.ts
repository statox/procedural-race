import P5 from 'p5';
import {Car} from './Car';
import {showCarStats} from './drawingUtils';
import {Point} from './Point';
import {Pool} from './Pool';
import {Stats} from './Stats';
import './styles.scss';
import {Track} from './Track';
const config = require('./config.json');

const sketch = (p5: P5) => {
    const H = config.dimensions.height;
    const W = config.dimensions.width;
    const offTrackColor = config.offTrackColor;
    let frameRateHistory = new Array(10).fill(0);

    let track;
    let pool;
    let stats;

    // The sketch setup method
    p5.setup = () => {
        // Creating and positioning the canvas
        const canvas = p5.createCanvas(W, H);
        canvas.parent('app');

        stats = new Stats(p5);
        track = new Track(p5);
        pool = new Pool(p5, track);
        resetTrack();

        // startInfiniteGeneration();
    };

    // The sketch draw method
    p5.draw = () => {
        p5.background(offTrackColor);
        track.show();
        // The first time we draw the track we need to keep track of its image representation
        track.takeScreenshotIfNeeded();

        pool.update(track);
        pool.show();

        stats.update(pool.cars);
        stats.show();

        drawFPS();

        if (pool.allCarCrashed) {
            resetTrack();
        }
    };

    p5.mousePressed = () => {
        for (const car of pool.cars) {
            car.pos.x = p5.mouseX;
            car.pos.y = p5.mouseY;
        }
    };

    const driveCar = (car: Car) => {
        if (p5.keyIsDown(p5.LEFT_ARROW)) {
            car.turn('LEFT');
        }
        if (p5.keyIsDown(p5.RIGHT_ARROW)) {
            car.turn('RIGHT');
        }
        if (p5.keyIsDown(p5.UP_ARROW)) {
            car.accelerate();
        }
        if (p5.keyIsDown(p5.DOWN_ARROW)) {
            car.deccelerate();
        }
    };

    p5.keyPressed = () => {
        if (p5.keyCode === p5.RETURN) {
            resetTrack();
        }
    };

    const startInfiniteGeneration = () => {
        setTimeout(() => {
            console.clear();
            resetTrack();
            startInfiniteGeneration();
        }, 3000);
    };

    const resetTrack = () => {
        if (pool.generations === 0) {
            track.reset();
            pool = new Pool(p5, track);
        }
        pool.reset(track);
    };

    const drawFPS = () => {
        const fpsText = `${getFrameRate()} fps`;
        p5.stroke('white');
        p5.strokeWeight(1);
        p5.fill('white');
        p5.text(fpsText, 10, 10);
    };
    const getFrameRate = () => {
        frameRateHistory.shift();
        frameRateHistory.push(p5.frameRate());
        let total = frameRateHistory.reduce((a, b) => a + b) / frameRateHistory.length;
        return total.toFixed(0);
    };
};

new P5(sketch);
