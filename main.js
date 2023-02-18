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
    // console.log('fps opti for:', cur_fps);
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
