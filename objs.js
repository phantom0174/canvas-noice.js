
let canvas = document.getElementById("myCanvas");
let ctx = canvas.getContext("2d");

// ctx.translate(0.5, 0.5);

canvas.width = window.innerWidth - 100;
canvas.height = window.innerHeight - 100;

// // Get the DPR and size of the canvas
// const dpr = window.devicePixelRatio;
// const rect = canvas.getBoundingClientRect();

// // Set the "actual" size of the canvas
// canvas.width = rect.width * dpr;
// canvas.height = rect.height * dpr;

// // Scale the context to ensure correct drawing operations
// ctx.scale(dpr, dpr);

// // Set the "drawn" size of the canvas
// canvas.style.width = `${rect.width}px`;
// canvas.style.height = `${rect.height}px`;

const CONFIG = {
    point_count: 100,
    chunk_capacity: 20
};

CONFIG.max_d = Math.floor(
    30
    + 5 * Math.pow(Math.log10(canvas.width), 2)
    - 3 * Math.pow(Math.log10(CONFIG.point_count), 2)
);

console.log('dis:', CONFIG.max_d);

const PROD = canvas.width * canvas.height;
const GM = PROD * Math.log10(canvas.width) / (Math.pow(CONFIG.max_d, 2) * Math.log10(PROD) * 2);
const ratio = canvas.height / canvas.width;

CONFIG.X_CHUNK = Math.floor(GM);
CONFIG.Y_CHUNK = Math.floor(GM * ratio);

while (canvas.width / CONFIG.X_CHUNK < CONFIG.max_d * 1.5) CONFIG.X_CHUNK--;
while (canvas.height / CONFIG.Y_CHUNK < CONFIG.max_d * 1.5) CONFIG.Y_CHUNK--;

console.log('chunk:', CONFIG.X_CHUNK, CONFIG.Y_CHUNK);
console.log('chunk total:', CONFIG.X_CHUNK * CONFIG.Y_CHUNK);

class Point {
    constructor() {
        this.x = canvas.width * Math.random();
        this.y = canvas.height * Math.random();
        this.vx = 2 * (2 * Math.random() - 1);
        this.vy = 2 * (2 * Math.random() - 1);

        this.lazy = {
            touched: 0,
            near: 0,
            sleep_frame: 0
        }
    }

    evolve() {
        this.x += this.vx;
        this.y += this.vy;

        this.vx += (Math.random() * 2 - 1) / 10;
        this.vy += (Math.random() * 2 - 1) / 10;

        if (Math.abs(this.vx) > 4) this.vx -= 2 * Math.sign(this.vx);
        if (Math.abs(this.vy) > 4) this.vy -= 2 * Math.sign(this.vy);

        if (this.lazy.sleep_frame > 0) return;

        const tabu_index = 10 * Math.max(this.lazy.near / this.lazy.touched - 0.3, 0);
        this.lazy.sleep_frame += 30 * tabu_index;
        this.lazy.touched = 0, this.lazy.near = 0;
    }

    cal_inter_with_point(p, need_draw) {
        const dx = p.x - this.x, dy = p.y - this.y;
        const d = Math.hypot(dx, dy);

        if (d > CONFIG.max_d || d === 0) return;

        this.lazy.touched++;
        if (d <= CONFIG.max_d / 2) this.lazy.near++;

        // simulate gravity
        const dV = {
            x: dx / Math.pow(d + 0.01, 2) / 2,
            y: dy / Math.pow(d + 0.01, 2) / 2
        };
        this.vx += dV.x, this.vy += dV.y;

        if (!need_draw) return;

        // draw line
        const c = Math.floor(d * (255 / CONFIG.max_d));
        // const alpha = (d / CONFIG.max_d).toFixed(1);
        ctx.strokeStyle = `rgb(${c}, ${c}, ${c})`; //TODO: rgba
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
    }
}

class Chunk {
    constructor(x, y, w, h, div) {
        this.x = x; this.y = y;
        this.w = w, this.h = h;

        this.divergence = div;

        this.points = [];
    }
}


class Grid {
    constructor(w, h) {
        this.w = w;
        this.h = h;

        this.chunk_w = this.w / CONFIG.X_CHUNK;
        this.chunk_h = this.h / CONFIG.Y_CHUNK;

        this.chunks = [];
        this.generate_chunks();

        this.wait_refill_num = 0;
    }

    generate_chunks() {
        this.chunks = new Array(CONFIG.X_CHUNK).fill(null).map(() => new Array(CONFIG.Y_CHUNK).fill(null));

        for (let i = 0; i < CONFIG.X_CHUNK; i++) {
            for (let j = 0; j < CONFIG.Y_CHUNK; j++) {
                this.chunks[i][j] = new Chunk(
                    this.chunk_w * i, this.chunk_h * j,
                    this.chunk_w, this.chunk_h,
                    (i + j) % 2
                );
            }
        }

        let c_canvas = document.getElementById("chunks");
        let c_ctx = c_canvas.getContext("2d");

        c_canvas.width = window.innerWidth - 100;
        c_canvas.height = window.innerHeight - 100;

        c_ctx.beginPath();
        for (let i = 0; i < CONFIG.X_CHUNK; i++) {
            c_ctx.moveTo(this.chunk_w * i, 0);
            c_ctx.lineTo(this.chunk_w * i, this.h);
        }

        for (let j = 0; j < CONFIG.Y_CHUNK; j++) {
            c_ctx.moveTo(0, this.chunk_h * j);
            c_ctx.lineTo(this.w, this.chunk_h * j);
        }
        c_ctx.stroke();
    }

    insert_point(point) {
        const t_chunk = this.chunks[Math.floor(point.x / this.chunk_w)][Math.floor(point.y / this.chunk_h)];
        if (t_chunk.points.length < CONFIG.chunk_capacity) t_chunk.points.push(point);
        else this.wait_refill_num++;
    }

    random_remove_points(num) {
        while (num > 0) {
            const random_chunk_x = Math.floor(Math.random() * CONFIG.X_CHUNK);
            const random_chunk_y = Math.floor(Math.random() * CONFIG.Y_CHUNK);

            const chunk = this.chunks[random_chunk_x][random_chunk_y];
            const remove_num = Math.max(Math.floor((num / 10) * Math.random()), 2);
            // console.log('rmv:', remove_num);

            for (let i = 0; i < remove_num; i++) chunk.points.pop();
            num -= remove_num;
        }
    }

    decrease_capacity(num) {
        CONFIG.chunk_capacity = Math.max(5, CONFIG.chunk_capacity - num);
        // console.log('dec:', num);
        // console.log('cur cap:', CONFIG.chunk_capacity);
        // console.log('max_point:', CONFIG.X_CHUNK * CONFIG.Y_CHUNK * CONFIG.chunk_capacity);
    }

    increase_capacity(num) {
        CONFIG.chunk_capacity = Math.min(20, CONFIG.chunk_capacity + num);
        // console.log('inc:', num);
        // console.log('cur cap:', CONFIG.chunk_capacity);
        // console.log('max_point:', CONFIG.X_CHUNK * CONFIG.Y_CHUNK * CONFIG.chunk_capacity);
    }
}


module.exports = {
    canvas,
    ctx,
    Point,
    Grid,
    CONFIG
};
