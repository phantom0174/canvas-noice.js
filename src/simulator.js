import { CONFIG } from './config';
import { Point } from './objs';


export class Simulator {
    constructor(ctx, grid, fps_manager, pointer) {
        this.ctx = ctx;
        this.grid = grid;
        this.fps_manager = fps_manager;
        this.pointer = pointer;

        // initialize points
        for (let i = 0; i < CONFIG.point_count; i++) {
            this.grid.insert_point(new Point(this.grid.w, this.grid.h));
        }
    }

    async traverse() {
        for (let ci = 0; ; ci++) {
            let tasks = [];

            if (ci >= 0 && ci < CONFIG.X_CHUNK) tasks.push(this.calVerticalInteraction(ci));
            if (ci - 2 >= 0 && ci - 2 < CONFIG.X_CHUNK) tasks.push(this.evolveVerticalChunks(ci - 2));
            if (ci - 4 >= 0 && ci - 4 < CONFIG.X_CHUNK) tasks.push(this.updateChunk(ci - 4));
            if (tasks.length === 0) break;

            await Promise.all(tasks);
        }
    }

    async calVerticalInteraction(ci) {
        const grid = this.grid;

        for (let cj = 0; cj < CONFIG.Y_CHUNK; cj++) {
            const chunk = grid.chunks[ci][cj];

            // temp
            const right_x = chunk.x + chunk.w;
            const right_y = chunk.y + chunk.h;

            this.calLocalInteraction(chunk);

            // calculate interaction in surrounding chunk
            chunk.points.forEach(tar_p => {
                // compute chunks within interaction range
                let chunk_left_x = 0, chunk_right_x = 0;
                let chunk_left_y = 0, chunk_right_y = 0;
                if (tar_p.x - CONFIG.max_d < chunk.x) chunk_left_x = -1;
                if (tar_p.x + CONFIG.max_d >= right_x) chunk_right_x = 1;
                if (tar_p.y - CONFIG.max_d < chunk.y) chunk_left_y = -1;
                if (tar_p.y + CONFIG.max_d >= right_y) chunk_right_y = 1;

                for (let i = chunk_left_x; i <= chunk_right_x; i++) {
                    for (let j = chunk_left_y; j <= chunk_right_y; j++) {
                        if (i === 0 && j === 0) continue;
                        if (ci + i < 0 || ci + i > CONFIG.X_CHUNK - 1 || cj + j < 0 || cj + j > CONFIG.Y_CHUNK - 1) continue;

                        this.calSurroundingInteraction(grid.chunks[ci + i][cj + j], tar_p, chunk.divergence);
                    }
                }

                // compute interaction with pointer, x && y !== null
                if (this.pointer.x !== null) tar_p.cal_inter_with_point(this.pointer, true, this.ctx);
            });
        }
    }

    calLocalInteraction(chunk) {
        for (let i = 0; i < chunk.points.length - 1; i++) {
            const p = chunk.points[i];

            for (let j = i + 1; j < chunk.points.length; j++) {
                const tar_p = chunk.points[j];

                p.cal_inter_with_point(tar_p, true, this.ctx);
                tar_p.cal_inter_with_point(p, false, this.ctx);
            }
        }
    }

    calSurroundingInteraction(tar_chunk, local_p, local_div) {
        const need_draw = local_div || tar_chunk.divergence === local_div;
        tar_chunk.points.forEach(tar_p => {
            local_p.cal_inter_with_point(tar_p, need_draw, this.ctx);
        });
    }

    async evolveVerticalChunks(ci) {
        this.ctx.strokeStyle = `rgb(0, 0, 0)`;
        for (let cj = 0; cj < CONFIG.Y_CHUNK; cj++) {
            this.grid.chunks[ci][cj].points.forEach(p => {
                this.ctx.fillRect(p.x, p.y, 2, 2);
                p.evolve();
            });
        }
    }

    async updateChunk(ci) {
        const grid = this.grid;

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
                    cur_p.x += cur_p.vx;
                    if (cur_p.x <= 0) cur_p.x = 0.1;
                    else if (cur_p.x > grid.w) cur_p.x = grid.w - 0.1;
                } else if (new_chunk_y < 0 || new_chunk_y > CONFIG.Y_CHUNK - 1) {
                    cur_p.vy *= -1;
                    cur_p.y += cur_p.vy;
                    if (cur_p.y <= 0) cur_p.y = 0.1;
                    else if (cur_p.y > grid.h) cur_p.y = grid.h - 0.1;
                } else { // move to new chunk, or to random location if full
                    rmv_list.push(i);

                    const new_chunk = grid.chunks[new_chunk_x][new_chunk_y];
                    if (new_chunk.points.length < CONFIG.chunk_current_capacity) new_chunk.points.push(cur_p);
                    else grid.insert_point(new Point(this.grid.w, this.grid.h));
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

    draw() {
        this.ctx.clearRect(-8, -8, this.grid.w + 8, this.grid.h + 8);
        this.traverse();
    }
}
