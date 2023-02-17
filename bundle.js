(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const { canvas, ctx, Point, Grid, X_CHUNK, Y_CHUNK } = require('./objs.js');


// ctx.translate(0.5, 0.5);


const grid = new Grid(canvas.width, canvas.height);

const point_count = 1000;
for (let i = 0; i < point_count; i++) {
    grid.insert_point(new Point());
}

function cal_gravity_in_cur_chunk(chunk) {
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

function cal_gravity_in_other_chunk(chunk, tar_p) {
    chunk.points.forEach(p => {
        tar_p.cal_inter_with_point(p, true);
    });
}

function traverse() {
    for (let ci = 0; ci < X_CHUNK; ci++) {
        for (let cj = 0; cj < Y_CHUNK; cj++) {
            const chunk = grid.chunks[ci][cj];

            cal_gravity_in_cur_chunk(chunk);

            // calculate gravity in surrounding chunk
            chunk.points.forEach(tar_p => {
                if (tar_p.lazy.sleep_frame > 0) {
                    tar_p.lazy.sleep_frame--;
                    return;
                }

                ctx.strokeStyle = `rgb(0, 0, 0)`;
                ctx.fillRect(tar_p.x, tar_p.y, 2, 2);
                
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (i === 0 && j === 0) continue;
                        if (ci + i < 0 || ci + i > X_CHUNK - 1 || cj + j < 0 || cj + j > Y_CHUNK - 1) continue;

                        const tar_chunk = grid.chunks[ci + i][cj + j];
                        // if (!tar_chunk) continue;

                        cal_gravity_in_other_chunk(tar_chunk, tar_p);
                    }
                }
            });
        }
    }

    for (let ci = 0; ci < X_CHUNK; ci++) {
        for (let cj = 0; cj < Y_CHUNK; cj++) {
            grid.chunks[ci][cj].points.forEach(p => {
                p.evolve();
            });
        }
    }

    for (let ci = 0; ci < X_CHUNK; ci++) {
        for (let cj = 0; cj < Y_CHUNK; cj++) {
            const chunk = grid.chunks[ci][cj];

            let rmv_list = [];
            for (let i = 0; i < chunk.points.length; i++) {
                const cur_p = chunk.points[i];

                let chunk_dx = 0, chunk_dy = 0;
                if (cur_p.x < ci * chunk.w) chunk_dx = -1;
                else if (cur_p.x >= (ci + 1) * chunk.w) chunk_dx = 1;

                if (cur_p.y < cj * chunk.h) chunk_dy = -1;
                else if (cur_p.y >= (cj + 1) * chunk.h) chunk_dy = 1;

                if (chunk_dx === 0 && chunk_dy === 0) continue;

                const new_chunk_x = ci + chunk_dx;
                const new_chunk_y = cj + chunk_dy;

                if (new_chunk_x < 0 || new_chunk_x > X_CHUNK - 1) {
                    cur_p.vx *= -1;
                } else if (new_chunk_y < 0 || new_chunk_y > Y_CHUNK - 1) {
                    cur_p.vy *= -1;
                } else {
                    rmv_list.push(i);

                    const new_chunk = grid.chunks[new_chunk_x][new_chunk_y];
                    if (new_chunk.points.length < new_chunk.max_point_num) {
                        new_chunk.points.push(cur_p);
                    } else {
                        grid.insert_point(new Point());
                    }
                }
            }
            
            let cur_ind = 0;
            chunk.points = chunk.points.filter((v, ind) => {
                if (cur_ind !== rmv_list.length && ind === rmv_list[cur_ind]) {
                    cur_ind++;
                    return false;
                } else {
                    return true;
                }
            });
        }
    }
}

function draw() {
    ctx.clearRect(-10, -10, canvas.width + 50, canvas.height + 50);
    traverse();
    setTimeout(draw, 25);
}

async function main() {
    console.log(canvas.width, canvas.height);
    traverse();

    await new Promise(r => setTimeout(r, 2000));

    draw();
}

setTimeout(main, 500);

var fps = document.getElementById("fps");
var startTime = Date.now();
var frame = 0;

let stable = 0;
function tick() {
    var time = Date.now();
    frame++;
    if (time - startTime > 1000) {
        const cur_fps = (frame / ((time - startTime) / 1000)).toFixed(1);
        console.log(grid.wait_refill_num);
        if (cur_fps > 55) {
            const refill_count = Math.floor(grid.wait_refill_num / (10 - Math.min(stable / 5, 8)));
            console.log('refill:', refill_count)
            for (let i = 0; i < refill_count; i++) {
                setTimeout(grid.insert_point(new Point()), Math.random() * 2000);
            }
            grid.wait_refill_num -= refill_count;
            stable++;
        } else {
            stable = 0;
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

},{}]},{},[1]);
