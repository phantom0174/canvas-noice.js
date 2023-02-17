const { canvas, ctx, Point, Grid, X_CHUNK, Y_CHUNK } = require('./objs.js');


// ctx.translate(0.5, 0.5);


const grid = new Grid(canvas.width, canvas.height);

const point_count = 50;
for (let i = 0; i < point_count; i++) {
    grid.insert_point(new Point());
}

function cal_gravity_in_cur_chunk(chunk) {
    for (let i = 0; i < chunk.points.length - 1; i++) {
        const p = chunk.points[i];

        for (let j = i + 1; j < chunk.points.length; j++) {
            const tar_p = chunk.points[j];

            p.cal_inter_with_point(tar_p, true);
            tar_p.cal_inter_with_point(p, false);
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
                setTimeout(grid.insert_point(new Point()), Math.random() * 700);
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
