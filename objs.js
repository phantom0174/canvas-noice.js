
let canvas = document.getElementById("myCanvas");
let ctx = canvas.getContext("2d");

canvas.width = window.innerWidth - 100;
canvas.height = window.innerHeight - 100;

const max_d = 30 + 5 * Math.pow(Math.log10(canvas.width), 2);

console.log('dis:', max_d);

const PROD = canvas.width * canvas.height;
const GM = PROD * Math.log10(canvas.width) / (Math.PI * Math.pow(max_d, 2) * Math.log10(PROD) * 2);

const ratio = canvas.height / canvas.width;
const X_CHUNK = Math.floor(GM);
const Y_CHUNK = Math.floor(GM * ratio);


console.log('chunk:', X_CHUNK, Y_CHUNK);
console.log('chunk total:', X_CHUNK * Y_CHUNK);

class Point {
    constructor() {
        this.x = canvas.width * Math.random();
        this.y = canvas.height * Math.random();
        this.vx = 5 * (2 * Math.random() - 1);
        this.vy = 5 * (2 * Math.random() - 1);

        this.lazy = {
            touched: 0,
            near: 0,
            sleep_frame: 0
        }
    }

    evolve() {
        this.x += this.vx;
        this.y += this.vy;

        this.vx += (Math.random() * 2 - 1) / 5;
        this.vy += (Math.random() * 2 - 1) / 5;

        if (Math.abs(this.vx) > 5) this.vx -= 4 * Math.sign(this.vx);
        if (Math.abs(this.vy) > 5) this.vy -= 4 * Math.sign(this.vy);

        if (this.lazy.sleep_frame > 0) return;

        const tabu_index = 10 * Math.max(this.near / this.touched - 0.3, 0);
        this.lazy.sleep_frame += 30 * tabu_index;
        this.touched = 0, this.near = 0;
    }

    cal_inter_with_point(p, need_draw) {
        // simulate gravity
        const dx = p.x - this.x, dy = p.y - this.y;
        const d = Math.hypot(dx, dy);

        if (d > max_d || d === 0) return;

        this.touched++;
        if (d <= max_d / 2) this.near++;

        const dV = {
            x: dx / Math.pow(d + 0.01, 2) / 2,
            y: dy / Math.pow(d + 0.01, 2) / 2
        };
        this.vx += dV.x, this.vy += dV.y;

        if (!need_draw) return;

        // draw line
        const c = Math.floor(d * (255 / max_d));
        ctx.strokeStyle = `rgb(${c}, ${c}, ${c})`; //TODO: rgba

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
    }
}

class Chunk {
    constructor(xn, yn, w, h) {
        this.xn = xn; this.yn = yn;
        this.w = w, this.h = h;

        this.max_point_num = 10;
        this.points = [];
    }
}


class Grid {
    constructor(w, h) {
        this.w = w;
        this.h = h;

        this.chunk_w = this.w / X_CHUNK;
        this.chunk_h = this.h / Y_CHUNK;

        this.chunks = [];
        this.generate_chunks();

        this.wait_refill_num = 0;
    }

    generate_chunks() {
        this.chunks = new Array(X_CHUNK).fill(null).map(() => new Array(Y_CHUNK).fill(null));

        for (let i = 0; i < X_CHUNK; i++) {
            for (let j = 0; j < Y_CHUNK; j++) {
                this.chunks[i][j] = new Chunk(i, j, this.chunk_w, this.chunk_h);
            }
        }

        for (let i = 0; i < X_CHUNK; i++) {
            ctx.beginPath();
            ctx.moveTo(this.chunk_w * i, 0);
            ctx.lineTo(this.chunk_w * i, this.h);
            ctx.stroke();
        }

        for (let j = 0; j < Y_CHUNK; j++) {
            ctx.beginPath();
            ctx.moveTo(0, this.chunk_h * j);
            ctx.lineTo(this.w, this.chunk_h * j);
            ctx.stroke();
        }
    }

    insert_point(point) {
        const t_chunk = this.chunks[Math.floor(point.x / this.chunk_w)][Math.floor(point.y / this.chunk_h)];
        if (t_chunk.points.length < t_chunk.max_point_num) t_chunk.points.push(point);
        else this.wait_refill_num++;
    }
}


module.exports = {
    canvas,
    ctx,
    Point,
    Grid,
    X_CHUNK,
    Y_CHUNK
};
