import P5 from 'p5';
import {Point} from './Point';
import './styles.scss';
import {Track} from './Track';
const config = require('./config.json');

const sketch = (p5: P5) => {
    const H = config.dimensions.height;
    const W = config.dimensions.width;
    let frameRateHistory = new Array(10).fill(0);

    let track;
    // The sketch setup method
    p5.setup = () => {
        // Creating and positioning the canvas
        const canvas = p5.createCanvas(W, H);
        canvas.parent('app');

        track = new Track(p5);
        resetTrack();
    };

    // The sketch draw method
    p5.draw = () => {
        // p5.background(0, 0, 0);
        p5.background('#085413');
        track.show();
        drawFPS();
    };

    p5.mousePressed = () => {
        // track.pushApart();
        // track.fixHullAngles();
    };

    const resetTrack = () => {
        track.reset();
        setTimeout(resetTrack, 1000);
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
