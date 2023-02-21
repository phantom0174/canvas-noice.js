// const { CNCONFIG } = require('./config');


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
        if (!CNCONFIG.pointer_interaction && this.pointer_inter) {
            this.pointer_inter = false;
            return;
        }

        this.x += this.vx;
        this.y += this.vy;

        if (CNCONFIG.RANDOMNESS_ACTIVE && !this.pointer_inter) {
            this.vx += (Math.random() * 2 - 1) / 10;
            this.vy += (Math.random() * 2 - 1) / 10;
        }

        if (Math.abs(this.vx) > CNCONFIG.particle_max_speed) this.vx *= CNCONFIG.particle_slow_down_rate;
        if (Math.abs(this.vy) > CNCONFIG.particle_max_speed) this.vy *= CNCONFIG.particle_slow_down_rate;

        if (this.lazy.sleep_frame > 0) return;

        this.lazy.sleep_frame = Math.round(60 * CNCONFIG.tabu_index * Math.max(
            this.lazy.near / this.lazy.touched - CNCONFIG.lazy_overload_threshold,
            0
        ));
        this.lazy.touched = 0, this.lazy.near = 0;

    }

    calAlpha(distance) {
        return Number(Math.min(1.2 - distance / CNCONFIG.max_d, 1).toFixed(1));
    }

    // force to interact with pointer, no matter the lazy status
    calInterWithPointer(pt) {
        const dx = pt.x - this.x, dy = pt.y - this.y;
        const d = Math.hypot(dx, dy);

        if (d > CNCONFIG.max_d || d < 1) return;
        this.pointer_inter = true;

        //: interaction calculation

        if (!CNCONFIG.pointer_interaction) {
            this.vx = 0, this.vy = 0;
        } else {
            let direction;
            if (d > CNCONFIG.max_d / 1.3) {
                direction = 2;
            } else if (d < CNCONFIG.max_d) {
                direction = -2;
            }
            const force = Math.pow(d - CNCONFIG.max_d / 4, -1) * CNCONFIG.pointer_gravity_constant * direction / 10;
            const dv = {
                x: Math.sign(dx) * force,
                y: Math.sign(dy) * force
            };
            this.vx += dv.x, this.vy += dv.y;
        }

        return {
            a: this.calAlpha(d),
            pos_info: [this.x, this.y, pt.x, pt.y]
        };
    }

    calInterWithPoint(p, need_draw) {
        if (!this.lazy.sleep_frame) {
            const dx = p.x - this.x, dy = p.y - this.y;
            const d = Math.hypot(dx, dy);

            if (d > CNCONFIG.max_d || d < 1) return;

            this.lazy.touched++;
            if (d <= CNCONFIG.max_d / 3) this.lazy.near++;

            if (!CNCONFIG.pointer_interaction && CNCONFIG.GRAVITY_ACTIVE) {
                const force = Math.pow(d, -2) * CNCONFIG.gravity_constant;
                const dv = {
                    x: Math.sign(dx) * force,
                    y: Math.sign(dy) * force
                };
                this.vx += dv.x, this.vy += dv.y;
            }

            if (need_draw) return {
                a: this.calAlpha(d),
                pos_info: [this.x, this.y, p.x, p.y]
            };
        } else {
            this.lazy.sleep_frame--;
        }
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
        this.ready = false;
        
        this.w = w;
        this.h = h;
        
        this.chunk_w = this.w / CNCONFIG.X_CHUNK;
        this.chunk_h = this.h / CNCONFIG.Y_CHUNK;
        
        this.chunks = [];
        this.genChunks();

        this.wait_refill_num = 0;
    }

    genChunks() {
        this.chunks = new Array(CNCONFIG.X_CHUNK).fill(null)
            .map(() => new Array(CNCONFIG.Y_CHUNK).fill(null));

        for (let i = 0; i < CNCONFIG.X_CHUNK; i++) {
            for (let j = 0; j < CNCONFIG.Y_CHUNK; j++) {
                this.chunks[i][j] = new Chunk(
                    this.chunk_w * i, this.chunk_h * j,
                    this.chunk_w, this.chunk_h,
                    (i + j) % 2
                );
            }
        }
        this.ready = true;
    }

    insertPoint(point) {
        if (!this.ready) return;

        const chunk_x_num = Math.floor(point.x / this.chunk_w);
        const chunk_y_num = Math.floor(point.y / this.chunk_h);

        const t_chunk = this.chunks[chunk_x_num][chunk_y_num];
        if (t_chunk.points.length < CNCONFIG.chunk_current_capacity) {
            t_chunk.points.push(point);
        } else {
            this.wait_refill_num++;
        }
    }

    randomRemovePoints(num) {
        if (!this.ready) return;

        const batch_num = Math.max(Math.floor(num / 10), 1);
        while (num > 0) {
            const ci = Math.floor(Math.random() * CNCONFIG.X_CHUNK);
            for (let cj = 0; cj < CNCONFIG.Y_CHUNK; cj++) {
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

    decCapacity(num) {
        CNCONFIG.chunk_current_capacity = Math.max(
            CNCONFIG.chunk_min_capacity,
            CNCONFIG.chunk_current_capacity - num
        );
    }

    incCapacity(num) {
        CNCONFIG.chunk_current_capacity = Math.min(
            CNCONFIG.chunk_max_capacity,
            CNCONFIG.chunk_current_capacity + num
        );
    }
}
