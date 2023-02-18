(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const { canvas, ctx, Point, Grid, CONFIG } = require('./objs.js');


const grid = new Grid(canvas.width, canvas.height);


for (let i = 0; i < CONFIG.point_count; i++) {
    grid.insert_point(new Point());
}

async function traverse() {
    for (let ci = 0; ; ci++) {
        let tasks = [];

        if (ci >= 0 && ci < CONFIG.X_CHUNK) tasks.push(calVerticalInteraction(ci));
        if (ci - 2 >= 0 && ci - 2 < CONFIG.X_CHUNK) tasks.push(evolveVerticalChunks(ci - 2));
        if (ci - 4 >= 0 && ci - 4 < CONFIG.X_CHUNK) tasks.push(updateChunk(ci - 4));
        if (tasks.length === 0) break;

        await Promise.all(tasks);
    }
}

async function calVerticalInteraction(ci) {
    for (let cj = 0; cj < CONFIG.Y_CHUNK; cj++) {
        const chunk = grid.chunks[ci][cj];

        // temp
        const right_x = chunk.x + chunk.w;
        const right_y = chunk.y + chunk.h;

        calLocalInteraction(chunk);

        // calculate interaction in surrounding chunk
        chunk.points.forEach(tar_p => {
            if (tar_p.lazy.sleep_frame > 0) {
                tar_p.lazy.sleep_frame--;
                return;
            }

            // compute chunks within interaction range
            let chunk_dx = 0, chunk_dy = 0;
            if (tar_p.x - CONFIG.max_d < chunk.x) chunk_dx = -1;
            else if (tar_p.x + CONFIG.max_d >= right_x) chunk_dx = 0;
            if (tar_p.y - CONFIG.max_d < chunk.y) chunk_dy = -1
            else if (tar_p.y + CONFIG.max_d >= right_y) chunk_dy = 0;

            for (let i = chunk_dx; i <= chunk_dx + 1; i++) {
                for (let j = chunk_dy; j <= chunk_dy + 1; j++) {
                    if (i === 0 && j === 0) continue;
                    if (ci + i < 0 || ci + i > CONFIG.X_CHUNK - 1 || cj + j < 0 || cj + j > CONFIG.Y_CHUNK - 1) continue;

                    calSurroundingInteraction(grid.chunks[ci + i][cj + j], tar_p, chunk.divergence);
                }
            }
        });
    }
}

function calLocalInteraction(chunk) {
    for (let i = 0; i < chunk.points.length - 1; i++) {
        const p = chunk.points[i];

        for (let j = i + 1; j < chunk.points.length; j++) {
            const tar_p = chunk.points[j];

            if (p.lazy.sleep_frame > 0) {
                p.lazy.sleep_frame--;
            } else p.cal_inter_with_point(tar_p, true);

            if (tar_p.lazy.sleep_frame > 0) {
                tar_p.lazy.sleep_frame--;
            } else tar_p.cal_inter_with_point(p, false);
        }
    }
}

function calSurroundingInteraction(chunk, local_p, local_div) {
    const need_draw = local_div || chunk.divergence === local_div;
    chunk.points.forEach(tar_p => {
        local_p.cal_inter_with_point(tar_p, need_draw);
    });
}

async function evolveVerticalChunks(ci) {
    ctx.strokeStyle = `rgb(0, 0, 0)`;
    for (let cj = 0; cj < CONFIG.Y_CHUNK; cj++) {
        grid.chunks[ci][cj].points.forEach(p => {
            ctx.fillRect(p.x, p.y, 1, 1);
            p.evolve();
        });
    }
}

async function updateChunk(ci) {
    for (let cj = 0; cj < CONFIG.Y_CHUNK; cj++) {
        const chunk = grid.chunks[ci][cj];

        // for temp
        const right_x = chunk.x + chunk.w;
        const right_y = chunk.y + chunk.h;

        let rmv_list = [];
        for (let i = 0; i < chunk.points.length; i++) {
            const cur_p = chunk.points[i];

            let chunk_dx = 0, chunk_dy = 0;
            if (cur_p.x < chunk.x) chunk_dx = -1;
            else if (cur_p.x >= right_x) chunk_dx = 1;

            if (cur_p.y < chunk.y) chunk_dy = -1;
            else if (cur_p.y >= right_y) chunk_dy = 1;

            if (chunk_dx === 0 && chunk_dy === 0) continue;

            const new_chunk_x = ci + chunk_dx;
            const new_chunk_y = cj + chunk_dy;

            if (new_chunk_x < 0 || new_chunk_x > CONFIG.X_CHUNK - 1) {
                cur_p.vx *= -1;
            } else if (new_chunk_y < 0 || new_chunk_y > CONFIG.Y_CHUNK - 1) {
                cur_p.vy *= -1;
            } else {
                rmv_list.push(i);

                const new_chunk = grid.chunks[new_chunk_x][new_chunk_y];
                if (new_chunk.points.length < CONFIG.chunk_capacity) new_chunk.points.push(cur_p);
                else grid.insert_point(new Point());
            }
        }

        let cur_rmv_ind = 0;
        chunk.points = chunk.points.filter((v, ind) => {
            if (cur_rmv_ind !== rmv_list.length && ind === rmv_list[cur_rmv_ind]) {
                cur_rmv_ind++;
                return false;
            } else {
                return true;
            }
        });
    }
}

function draw() {
    ctx.clearRect(-8, -8, canvas.width + 8, canvas.height + 8);
    traverse();
    if (max_fps <= 60) window.requestAnimationFrame(draw);
    else setTimeout(draw, 1000 / 60);
}

async function main() {
    await new Promise(r => setTimeout(r, 4000));
    console.log(canvas.width, canvas.height);
    traverse();

    window.requestAnimationFrame(draw);
}

setTimeout(main, 500);


let max_fps = 0, stable = 0;
function object_optimization(cur_fps) {
    if (cur_fps > max_fps * 0.9) {
        grid.increase_capacity(Math.ceil((cur_fps - max_fps * 0.9) / 6));

        const refill_count = Math.floor(grid.wait_refill_num / (10 - Math.min(stable / 5, 8)));
        for (let i = 0; i < refill_count; i++) {
            setTimeout(() => {
                grid.insert_point(new Point());
            }, Math.random() * 2000);
        }
        grid.wait_refill_num -= refill_count;

        stable++;
    } else {
        stable = 0;

        if (cur_fps <= max_fps * 0.7) {
            grid.decrease_capacity(Math.ceil((max_fps * 0.9 - cur_fps) / 6));
            grid.random_remove_points(grid.wait_refill_num);
            grid.wait_refill_num = 0;
        } else if (cur_fps <= max_fps * 0.8) {
            grid.decrease_capacity(Math.ceil((max_fps * 0.9 - cur_fps) / 6));
            grid.random_remove_points(Math.floor(grid.wait_refill_num / 3));
            grid.wait_refill_num -= Math.floor(grid.wait_refill_num / 3);
        } else if (cur_fps <= max_fps * 0.9) {
            grid.decrease_capacity(Math.ceil((max_fps * 0.9 - cur_fps) / 6));
        }
    }
    console.log('fps opti for:', cur_fps);
}

let fps = document.getElementById("fps");
let startTime = Date.now();
let frame = 0;

let max_set = 3;
let max_fps_3sum = 0;
function tick() {
    let time = Date.now();
    frame++;
    if (time - startTime > 1000) {
        const cur_fps = (frame / ((time - startTime) / 1000)).toFixed(1);
        if (max_set > 0) {
            max_fps_3sum += Number(cur_fps);

            if (max_set === 1) {
                max_fps = Math.round(max_fps_3sum / 3);
                console.log('avg max fps:', max_fps);
            }

            max_set--;
        } else {
            object_optimization(Number(cur_fps));
        }

        fps.innerHTML = cur_fps;
        startTime = time;
        frame = 0;
    }
    window.requestAnimationFrame(tick);
}
tick();

},{"./objs.js":2}],2:[function(require,module,exports){

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

},{}]},{},[1]);
