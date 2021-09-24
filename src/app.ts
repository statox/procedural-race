import P5 from 'p5';
import {Car} from './Car';
import {Point} from './Point';
import {Screenshotter} from './Screenshotter';
import './styles.scss';
import {Track} from './Track';
const config = require('./config.json');

const sketch = (p5: P5) => {
    const H = config.dimensions.height;
    const W = config.dimensions.width;
    const offTrackColor = config.offTrackColor;
    let frameRateHistory = new Array(10).fill(0);

    let track;
    let car;
    let screenshotter;
    let trackImage;

    // The sketch setup method
    p5.setup = () => {
        // Creating and positioning the canvas
        const canvas = p5.createCanvas(W, H);
        canvas.parent('app');

        track = new Track(p5);
        car = new Car(p5, {pos: track.startingPosition.copy()});
        screenshotter = new Screenshotter(p5);

        startInfiniteGeneration();
    };

    // The sketch draw method
    p5.draw = () => {
        p5.background(offTrackColor);
        track.show();
        // The first time we draw the track we need to keep track of its image representation
        track.takeScreenshotIfNeeded();
        // car.update();
        car.checkIsOnTrack(track.image);
        car.show();
        drawFPS();

        driveCar();
    };

    p5.mousePressed = () => {
        track.removeBorderIntersection();
    };

    const driveCar = () => {
        if (p5.keyIsDown(p5.LEFT_ARROW)) {
            car.turn('LEFT');
        }
        if (p5.keyIsDown(p5.RIGHT_ARROW)) {
            car.turn('RIGHT');
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
        trackImage = null;
        track.reset();
        car.pos = track.startingPosition.copy();
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
