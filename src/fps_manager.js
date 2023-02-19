import { Point } from './objs';


export class FPSManager {
    constructor(grid) {
        this.grid = grid;

        this.fps_el = document.getElementById("fps");
        this.startTime = Date.now();
        this.frame = 0;

        this.avr_fps = 0;
        this.avr_counter = 3;

        this.stable_counter = 0;

        this.tick();
    }

    tick() {
        this.frame++;

        let time = Date.now();
        if (time - this.startTime >= 1000) {
            const cur_fps = (this.frame / ((time - this.startTime) / 1000)).toFixed(1); //str
            if (this.avr_counter > 0) {
                this.avr_counter--;
                this.avr_fps += Number(cur_fps);

                if (this.avr_counter === 0) {
                    this.avr_fps = Math.round(this.avr_fps / 3);
                    console.log('avg fps:', this.avr_fps);
                }
            } else {
                this.object_optimization(Number(cur_fps));
            }

            this.fps_el.innerHTML = cur_fps;
            this.startTime = time;
            this.frame = 0;
        }
        window.requestAnimationFrame(() => { this.tick(); });
    }

    object_optimization(cur_fps) {
        if (cur_fps > this.avr_fps * 0.9) {
            this.grid.increase_capacity(Math.ceil((cur_fps - this.avr_fps * 0.9) / 6));

            const refill_count = Math.floor(this.grid.wait_refill_num / (10 - Math.min(this.stable_counter / 5, 8)));
            for (let i = 0; i < refill_count; i++) {
                setTimeout(() => {
                    this.grid.insert_point(new Point(this.grid.w, this.grid.h));
                }, Math.random() * 2000);
            }
            this.grid.wait_refill_num -= refill_count;

            this.stable_counter++;
        } else {
            this.stable_counter = 0;

            if (cur_fps <= this.avr_fps * 0.7) {
                this.grid.decrease_capacity(3);
                this.grid.random_remove_points(this.grid.wait_refill_num);
                this.grid.wait_refill_num = 0;
            } else if (cur_fps <= this.avr_fps * 0.8) {
                this.grid.decrease_capacity(2);
                const remove_points_num = Math.floor(this.grid.wait_refill_num / 3);
                this.grid.random_remove_points(remove_points_num);
                this.grid.wait_refill_num -= remove_points_num;
            } else if (cur_fps <= this.avr_fps * 0.9) {
                this.grid.decrease_capacity(1);
            }
        }
    }
}
