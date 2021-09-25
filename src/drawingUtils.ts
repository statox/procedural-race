import P5 from 'p5';
import {Car} from './Car';

function showCarStats(p5: P5, car: Car, lastSpeed: number, maxSpeed: number) {
    const speed = car.speed.mag();
    const speedText = `Speed: ${speed.toFixed(0)}`;
    p5.stroke(255);
    p5.noFill();
    p5.strokeWeight(1);
    p5.text(speedText, 20, p5.height - 50);

    const last = lastSpeed || 0;
    const lastText = `last:\t\t ${last.toFixed(0)}`;
    p5.stroke(255);
    p5.noFill();
    p5.strokeWeight(1);
    p5.text(lastText, 20, p5.height - 30);

    const max = maxSpeed || 0;
    const maxText = `max:\t\t ${max.toFixed(0)}`;
    p5.stroke(255);
    p5.noFill();
    p5.strokeWeight(1);
    p5.text(maxText, 20, p5.height - 10);
}

export {showCarStats};
