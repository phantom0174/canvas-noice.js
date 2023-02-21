import { Point } from './objs';
// const { CNCONFIG } = require('./config');
import { requestAnimationFrame } from './utils';


export class FPSManager {
    constructor(grid) {
        this.el = document.getElementById('fps');
        this.grid = grid;

        this.startTime = undefined;
        this.frame = 0;

        this.avr_fps = 0;
        this.avr_counter = 3;

        this.stable_counter = 0;
        this.batch = Math.round(CNCONFIG.X_CHUNK * CNCONFIG.Y_CHUNK / 30);
    }

    async initialize() {
        await new Promise(r => setTimeout(r, 300));

        this.startTime = Date.now();
        this.tick();

        await new Promise(r => setTimeout(r, 1000));
    }

    tick() {
        this.frame++;

        const time = Date.now();
        const period = this.avr_counter ? 300 : 1000;
        if (time - this.startTime >= period) {
            const cur_fps = (this.frame / ((time - this.startTime) / 1000)).toFixed(1); //str
            if (this.avr_counter) {
                this.avr_counter--;
                this.avr_fps += Number(cur_fps);

                if (!this.avr_counter) {
                    this.avr_fps = Math.round(this.avr_fps / 3);
                    console.log('[c-noice.js] Avr. FPS:', this.avr_fps);
                }
            } else {
                this.objectOptimization(Number(cur_fps));
                if (this.el) this.el.innerText = cur_fps;
            }

            this.startTime = time;
            this.frame = 0;
        }
        requestAnimationFrame(() => { this.tick(); });
    }

    objectOptimization(cur_fps) {
        const performance = cur_fps / this.avr_fps;
        if (performance > 0.9) {
            this.grid.incCapacity(Math.round((cur_fps - this.avr_fps * 0.9) / 6));

            const refill_count = Math.round(this.grid.wait_refill_num / (10 - Math.min(this.stable_counter / 5, 8)));
            for (let i = 0; i < refill_count; i++) {
                setTimeout(() => {
                    this.grid.insertPoint(new Point(this.grid.w, this.grid.h));
                }, Math.random() * 2000);
            }
            this.grid.wait_refill_num -= refill_count;

            this.stable_counter++;
        } else {
            this.stable_counter = 0;

            if (performance <= 0.7) {
                this.grid.decCapacity(3);
                this.grid.randomRemovePoints(this.batch * 3);
                this.grid.wait_refill_num = 0;
            } else if (performance <= 0.8) {
                this.grid.decCapacity(2);
                this.grid.randomRemovePoints(this.batch * 2);
                this.grid.wait_refill_num = Math.floor(this.grid.wait_refill_num / 3);
            } else if (performance <= 0.9) {
                this.grid.decCapacity(1);
                this.grid.randomRemovePoints(this.batch);
            }
        }
    }
}
