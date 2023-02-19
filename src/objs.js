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
    }

    evolve() {
        this.x += this.vx;
        this.y += this.vy;

        if (CONFIG.RANDOMNESS_ACTIVE) {
            this.vx += (Math.random() * 2 - 1) / 10;
            this.vy += (Math.random() * 2 - 1) / 10;
        }

        if (Math.abs(this.vx) > CONFIG.particle_max_speed) this.vx *= CONFIG.particle_slow_down_rate;
        if (Math.abs(this.vy) > CONFIG.particle_max_speed) this.vy *= CONFIG.particle_slow_down_rate;

        if (this.lazy.sleep_frame > 0) return;

        this.lazy.sleep_frame = Math.round(60 * CONFIG.tabu_index * Math.max(
            this.lazy.near / this.lazy.touched - CONFIG.lazy_overload_threshold,
            0
        ));
        this.lazy.touched = 0, this.lazy.near = 0;
    }

    cal_inter_with_point(p, need_draw, ctx) {
        const dx = p.x - this.x, dy = p.y - this.y;
        const d = Math.hypot(dx, dy);

        if (d > CONFIG.max_d || d < 0.01) return;

        if (!p?.is_pointer && this.lazy.sleep_frame === 0) {
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
        } else if (!p?.is_pointer && this.lazy.sleep_frame > 0) {
            this.lazy.sleep_frame--;
        } else if (p?.is_pointer) {
            this.vx = 0, this.vy = 0;
            // const direction = (d <= CONFIG.max_d / 1.5) ? -1 : 1;
            // const force = Math.pow(d, 0) * CONFIG.gravity_constant * direction;
            // const dv = {
            //     x: Math.sign(dx) * force,
            //     y: Math.sign(dy) * force
            // };
            // this.vx += dv.x, this.vy += dv.y;
        }

        if (!need_draw) return;

        // draw line
        const c = Math.floor(d * (255 / CONFIG.max_d));
        // const alpha = (d / CONFIG.max_d).toFixed(1);
        ctx.strokeStyle = `rgba(${c}, ${c}, ${c})`; //TODO: rgba
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

    draw_chunks() {
        const c_canvas = document.getElementById("chunks");
        const c_ctx = c_canvas.getContext("2d");

        c_canvas.width = this.w;
        c_canvas.height = this.h;

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
