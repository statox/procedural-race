import P5 from 'p5';

let generatedPoints = 0;

export class Point {
    id: number;
    p5: P5;
    pos: P5.Vector;
    color: P5.Color;
    r: number;

    constructor(
        p5: P5,
        params?: {pos?: P5.Vector | {x: number; y: number}; color?: P5.Color; r?: number; skipContrain?: boolean}
    ) {
        generatedPoints++;
        this.id = generatedPoints;
        this.p5 = p5;
        this.color = params?.color || this.p5.color(255);
        this.r = params?.r || 20;

        if (!params?.pos) {
            this.pos = this.p5.createVector(10, 10);
        } else if (params.pos instanceof P5.Vector) {
            this.pos = params.pos;
        } else {
            this.pos = this.p5.createVector(params.pos.x, params.pos.y);
        }

        if (!params.skipContrain) {
            this.constrain();
        }
    }

    show(disableId?: boolean) {
        this.p5.stroke(this.color);
        this.p5.strokeWeight(1);
        disableId ? this.p5.fill(this.color) : this.p5.noFill();
        this.p5.circle(this.pos.x, this.pos.y, this.r);

        if (!disableId) {
            this.p5.fill(250);
            this.p5.noStroke();
            const textW = this.p5.textWidth(this.id.toString());
            const textH = this.p5.textSize();
            this.p5.text(this.id, this.pos.x - textW / 2, this.pos.y + textH / 2);
        }
    }

    constrain() {
        // const margin = this.r * 2;
        const margin = 50;
        const w = this.p5.width;
        const h = this.p5.height;

        const minX = margin;
        const maxX = w - margin;
        const minY = margin;
        const maxY = h - margin;

        this.pos.x = this.p5.constrain(this.pos.x, minX, maxX);
        this.pos.y = this.p5.constrain(this.pos.y, minY, maxY);
    }
}
