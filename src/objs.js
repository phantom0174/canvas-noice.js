import { CONFIG } from './config';


export class Point {
    constructor(w, h) {
        this.x = w * Math.random();
        this.y = h * Math.random();
        this.vx = 2 * (2 * Math.random() - 1);
        this.vy = 2 * (2 * Math.random() - 1);

        this.lazy = {
            touched: 0,
            near: 0,
            sleep_frame: 0
        }

        this.pointer_inter = false;
    }

    evolve() {
        this.x += this.vx;
        this.y += this.vy;

        if (CONFIG.RANDOMNESS_ACTIVE && !this.pointer_inter) {
            this.vx += (Math.random() * 2 - 1) / 10;
            this.vy += (Math.random() * 2 - 1) / 10;
        }

        if (Math.abs(this.vx) > CONFIG.particle_max_speed) this.vx *= CONFIG.particle_slow_down_rate;
        if (Math.abs(this.vy) > CONFIG.particle_max_speed) this.vy *= CONFIG.particle_slow_down_rate;
        
        if (this.pointer_inter) this.pointer_inter = false;
        if (this.lazy.sleep_frame > 0) return;

        this.lazy.sleep_frame = Math.round(60 * CONFIG.tabu_index * Math.max(
            this.lazy.near / this.lazy.touched - CONFIG.lazy_overload_threshold,
            0
        ));
        this.lazy.touched = 0, this.lazy.near = 0;

    }

    draw_to_point(tar_p, ctx, alpha) {
        ctx.lineWidth = 2 * Number(alpha);
        ctx.strokeStyle = `rgba(${CONFIG.line_color},${alpha})`;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(tar_p.x, tar_p.y);
        ctx.stroke();
    }

    cal_alpha(distance) {
        return Math.min(1.2 - distance / CONFIG.max_d, 1).toFixed(1);
    }

    cal_inter_with_pointer(pt, ctx) {
        CONFIG.ops++;
        const dx = pt.x - this.x, dy = pt.y - this.y;
        const d = Math.hypot(dx, dy);

        if (d > CONFIG.max_d || d < 1) return;
        this.pointer_inter = true;

        //: interaction calculation

        // this.vx = 0, this.vy = 0;
        const direction = (d <= CONFIG.max_d / 1.5) ? -1 : 5;
        const force = Math.pow(d, -1) * CONFIG.gravity_constant * direction;
        const dv = {
            x: Math.sign(dx) * force,
            y: Math.sign(dy) * force
        };
        this.vx += dv.x, this.vy += dv.y;

        this.draw_to_point(pt, ctx, this.cal_alpha(d));
    }

    cal_inter_with_point(p, need_draw, ctx = undefined) {
        CONFIG.ops++;
        const dx = p.x - this.x, dy = p.y - this.y;
        const d = Math.hypot(dx, dy);

        if (d > CONFIG.max_d || d < 1) return;

        if (!this.lazy.sleep_frame) {
            this.lazy.touched++;
            if (d <= CONFIG.max_d / 3) this.lazy.near++;

            // simulate gravity
            if (CONFIG.GRAVITY_ACTIVE) {
                // const matter_type = Math.sign(2 * Math.random() - 1);
                const force = Math.pow(d, -2) * CONFIG.gravity_constant;
                const dv = {
                    x: Math.sign(dx) * force,
                    y: Math.sign(dy) * force
                };
                this.vx += dv.x, this.vy += dv.y;
            }
        } else {
            this.lazy.sleep_frame--;
        }

        if (!need_draw) return;
        this.draw_to_point(p, ctx, this.cal_alpha(d));
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

export class Grid {
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
        this.chunks = new Array(CONFIG.X_CHUNK).fill(null)
            .map(() => new Array(CONFIG.Y_CHUNK).fill(null));

        for (let i = 0; i < CONFIG.X_CHUNK; i++) {
            for (let j = 0; j < CONFIG.Y_CHUNK; j++) {
                this.chunks[i][j] = new Chunk(
                    this.chunk_w * i, this.chunk_h * j,
                    this.chunk_w, this.chunk_h,
                    (i + j) % 2
                );
            }
        }
    }

    // draw_chunks() {
    //     const c_canvas = document.getElementById("chunks");
    //     const c_ctx = c_canvas.getContext("2d");

    //     c_canvas.width = this.w;
    //     c_canvas.height = this.h;

    //     c_ctx.beginPath();
    //     for (let i = 0; i < CONFIG.X_CHUNK; i++) {
    //         c_ctx.moveTo(this.chunk_w * i, 0);
    //         c_ctx.lineTo(this.chunk_w * i, this.h);
    //     }

    //     for (let j = 0; j < CONFIG.Y_CHUNK; j++) {
    //         c_ctx.moveTo(0, this.chunk_h * j);
    //         c_ctx.lineTo(this.w, this.chunk_h * j);
    //     }
    //     c_ctx.stroke();
    // }

    insert_point(point) {
        const chunk_x_num = Math.floor(point.x / this.chunk_w);
        const chunk_y_num = Math.floor(point.y / this.chunk_h);

        const t_chunk = this.chunks[chunk_x_num][chunk_y_num];
        if (t_chunk.points.length < CONFIG.chunk_current_capacity) {
            t_chunk.points.push(point);
        } else {
            this.wait_refill_num++;
        }
    }

    random_remove_points(num) {
        const batch_num = Math.max(Math.floor(num / 10), 1);
        while (num > 0) {
            const ci = Math.floor(Math.random() * CONFIG.X_CHUNK);
            for (let cj = 0; cj < CONFIG.Y_CHUNK; cj++) {
                const chunk = this.chunks[ci][cj];

                let removed_num;
                if (chunk.points.length > batch_num) {
                    for (let i = 0; i < batch_num; i++) chunk.points.pop();
                    removed_num = batch_num;
                } else {
                    removed_num = chunk.points.length;
                    chunk.points = [];
                }

                num -= removed_num;
            }
        }
    }

    decrease_capacity(num) {
        CONFIG.chunk_current_capacity = Math.max(
            CONFIG.chunk_min_capacity,
            CONFIG.chunk_current_capacity - num
        );
    }

    increase_capacity(num) {
        CONFIG.chunk_current_capacity = Math.min(
            CONFIG.chunk_max_capacity,
            CONFIG.chunk_current_capacity + num
        );
    }
}
