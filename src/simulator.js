// const { CNCONFIG } = require('./config');
import { Point } from './objs';


export class Simulator {
    constructor(ctx, grid, pointer) {
        this.ctx = ctx;
        this.ctx.fillStyle = `rgb(${CNCONFIG.point_color})`;

        this.grid = grid;
        this.pointer = pointer;

        // initialize points
        for (let i = 0; i < CNCONFIG.point_count; i++) {
            this.grid.insertPoint(new Point(this.grid.w, this.grid.h));
        }

        // index: 10 * opacity(0.2 ~ 1) - 2
        // inverse: (index + 2) / 10
        this.draw_buffer = new Array(9).fill(null).map(() => []);
    }

    async traverse() {
        for (let ci = 0; ; ci++) {
            let tasks = [];

            if (ci >= 0 && ci < CNCONFIG.X_CHUNK) tasks.push(this.calVerticalInteraction(ci));
            if (ci - 2 >= 0 && ci - 2 < CNCONFIG.X_CHUNK) tasks.push(this.evolveVerticalChunks(ci - 2));
            if (ci - 4 >= 0 && ci - 4 < CNCONFIG.X_CHUNK) tasks.push(this.updateVerticalChunks(ci - 4));
            if (tasks.length === 0) {
                this.drawLinesInBuffer();
                break;
            }

            await Promise.all(tasks);
        }
    }

    loadInfoIntoDrawBuffer(d_info) {
        if (!d_info) return;
        this.draw_buffer[10 * d_info.a - 2].push(d_info.pos_info);
    }

    drawLinesInBufferSlot(slot_num) {
        const info = this.draw_buffer[slot_num];

        this.ctx.beginPath();

        const alpha = (slot_num + 2) / 10;
        this.ctx.lineWidth = alpha;
        this.ctx.strokeStyle = `rgba(${CNCONFIG.line_color},${alpha})`;

        for (let i = 0, I = info.length; i < I; i++) {
            const pos_info = info[i];

            this.ctx.moveTo(pos_info[0], pos_info[1]);
            this.ctx.lineTo(pos_info[2], pos_info[3]);
        }
        this.ctx.stroke();

        this.draw_buffer[slot_num] = [];
    }

    drawLinesInBuffer() {
        this.buffer_cur_size = 0;
        for (let i = 0; i < 9; i++) this.drawLinesInBufferSlot(i);
    }

    computeInteractionRange(p, chunk) {
        const base_x = chunk.x - p.x;
        // chunks on the left hand side have already been traversed
        let right_x = Math.ceil((CNCONFIG.max_d - base_x) / chunk.w - 1);

        const base_y = chunk.y - p.y;
        let left_y = Math.ceil((CNCONFIG.max_d + base_y) / chunk.h);
        let right_y = Math.ceil((CNCONFIG.max_d - base_y) / chunk.h);

        if (!CNCONFIG.lossless_computation) {
            right_x = Math.min(right_x, 1);
            left_y = Math.max(left_y, -1);
            right_y = Math.min(right_y, 1);
        }

        return {
            c_dx: [right_x],
            c_dy: [left_y, right_y]
        };
    }

    async calVerticalInteraction(ci) {
        for (let cj = 0; cj < CNCONFIG.Y_CHUNK; cj++) {
            const chunk = this.grid.chunks[ci][cj];

            this.calLocalInteraction(chunk);

            // calculate interaction in surrounding chunk
            chunk.points.forEach(loc_p => {
                if (this.pointer.x !== null) this.loadInfoIntoDrawBuffer(
                    loc_p.calInterWithPointer(this.pointer)
                );

                const rangeData = this.computeInteractionRange(loc_p, chunk);
                for (let i = 0; i <= rangeData.c_dx[0]; i++) {
                    for (let j = -rangeData.c_dy[0]; j <= rangeData.c_dy[1]; j++) {
                        if (i === 0 && j === 0) continue; // do not compute local chunk
                        if (
                            ci + i >= CNCONFIG.X_CHUNK
                            || cj + j < 0 || cj + j >= CNCONFIG.Y_CHUNK
                        ) continue; // out of range

                        const tar_chunk = this.grid.chunks[ci + i][cj + j];
                        if (tar_chunk.traversed) continue;

                        this.calSurroundingInteraction(tar_chunk, loc_p);
                    }
                }
            });
            chunk.traversed = true;
        }
    }

    calLocalInteraction(chunk) {
        for (let i = 0; i < chunk.points.length - 1; i++) {
            const p = chunk.points[i];

            for (let j = i + 1; j < chunk.points.length; j++) {
                const tar_p = chunk.points[j];

                this.loadInfoIntoDrawBuffer(
                    p.calInterWithPoint(tar_p, true)
                );
                tar_p.calInterWithPoint(p, false);
            }
        }
    }

    calSurroundingInteraction(tar_chunk, local_p) {
        tar_chunk.points.forEach(tar_p => {
            this.loadInfoIntoDrawBuffer(
                local_p.calInterWithPoint(tar_p, true)
            );
            tar_p.calInterWithPoint(local_p, false);
        });
    }

    async evolveVerticalChunks(ci) {
        for (let cj = 0; cj < CNCONFIG.Y_CHUNK; cj++) {
            const chunk = this.grid.chunks[ci][cj];
            chunk.points.forEach(p => {
                this.ctx.fillRect(p.x - 0.5, p.y - 0.5, 1, 1);
                p.evolve();
            });
        }
    }

    // update what chunk is point currently in after evolving
    async updateVerticalChunks(ci) {
        for (let cj = 0; cj < CNCONFIG.Y_CHUNK; cj++) {
            const chunk = this.grid.chunks[ci][cj];
            chunk.traversed = false; // reset status for next frame

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

                // boundary check
                if (new_chunk_x < 0) {
                    cur_p.x = 0.1;
                    cur_p.vx *= -1;
                } else if (new_chunk_x >= CNCONFIG.X_CHUNK) {
                    cur_p.x = this.grid.w - 0.1;
                    cur_p.vx *= -1;
                } else if (new_chunk_y < 0) {
                    cur_p.y = 0.1;
                    cur_p.vy *= -1;
                } else if (new_chunk_y >= CNCONFIG.Y_CHUNK) {
                    cur_p.y = this.grid.h - 0.1;
                    cur_p.vy *= -1;
                } else { // move to new chunk, or to random location if full
                    rmv_list.push(i);

                    const new_chunk = this.grid.chunks[new_chunk_x][new_chunk_y];
                    if (new_chunk.points.length < CNCONFIG.chunk_current_capacity) new_chunk.points.push(cur_p);
                    else this.grid.insertPoint(new Point(this.grid.w, this.grid.h));
                }
            }

            // remove in O(N) time
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

    draw() {
        this.ctx.clearRect(0, 0, this.grid.w, this.grid.h);
        this.traverse();
    }
}
