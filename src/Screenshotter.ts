import P5 from 'p5';

export class Screenshotter {
    p5: P5;

    constructor(p5: P5) {
        this.p5 = p5;
    }

    screenshot() {
        let img = this.p5.createImage(this.p5.width, this.p5.height);
        img.loadPixels();
        for (let i = 0; i < img.width; i++) {
            for (let j = 0; j < img.height; j++) {
                const canvasColor = this.p5.get(i, j);
                img.set(i, j, this.p5.color([...canvasColor]));
            }
        }
        img.updatePixels();
        return img;
    }
}
