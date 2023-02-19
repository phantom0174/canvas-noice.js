import { bind, clear } from 'size-sensor';
import { requestAnimationFrame, cancelAnimationFrame, canvasStyle } from './utils';
import { CONFIG } from './config';
import { Simulator } from './simulator';
import { FPSManager } from './fps_manager';
import { Grid } from './objs';


export class CanvasNoice {
    constructor(el) {
        this.el = el;

        this.canvas = this.newCanvas();
        this.ctx = this.canvas.getContext('2d');

        this.grid = undefined; // chunk manager
        this.fps_manager = undefined;
        this.simulator = undefined;

        this.pointer = {
            x: null,
            y: null,
            is_pointer: true
        };
        this.bindEvent();

        this.render_info = {
            draw: true,
            need_initialize: true,
            delay_after: 0.5,
            last_changed_time: 0,
        };

        this.pendingRender();
    }

    bindEvent() {
        bind(this.el, () => {
            this.canvas.width = this.el.clientWidth;
            this.canvas.height = this.el.clientHeight;

            this.render_info.last_changed_time = Date.now();
            this.render_info.draw = false;
            // this.ctx.clearRect(-8, -8, this.grid.w + 8, this.grid.h + 8);
            this.render_info.need_initialize = true;
            
            console.log('reset');
        });

        this.onmousemove = window.onmousemove;
        window.onmousemove = e => {
            this.pointer.x = e.clientX - this.el.offsetLeft + document.scrollingElement.scrollLeft; // 当存在横向滚动条时，x坐标再往右移动滚动条拉动的距离
            this.pointer.y = e.clientY - this.el.offsetTop + document.scrollingElement.scrollTop; // 当存在纵向滚动条时，y坐标再往下移动滚动条拉动的距离
            this.onmousemove && this.onmousemove(e);
        };

        this.onmouseout = window.onmouseout;
        window.onmouseout = () => {
            this.pointer.x = null;
            this.pointer.y = null;
            this.onmouseout && this.onmouseout();
        };
    }

    newCanvas() {
        if (getComputedStyle(this.el).position === 'static') {
            this.el.style.position = 'relative'
        }
        const canvas = document.createElement('canvas');
        canvas.style.cssText = canvasStyle(CONFIG);

        canvas.width = this.el.clientWidth;
        canvas.height = this.el.clientHeight;

        // dom
        this.el.appendChild(canvas);
        console.log(canvas);
        return canvas;
    }

    async optimize_chunk_size() {
        const optimized_size_threshold = CONFIG.max_d * Math.max(CONFIG.chunk_size_optimize_constant, 0.25);

        const calculate_optimization = (dimension) => {
            console.log('opti', optimized_size_threshold);

            const diff = (num_of_chunks) => {
                return Math.abs(dimension / num_of_chunks - optimized_size_threshold);
            };

            let test_num = dimension / optimized_size_threshold;
            if (diff(Math.floor(test_num)) < diff(Math.ceil(test_num))) return Math.floor(test_num);
            else return Math.ceil(test_num);
        };

        console.log(this.canvas.width, this.canvas.height);

        CONFIG.X_CHUNK = calculate_optimization(this.canvas.width);
        CONFIG.Y_CHUNK = calculate_optimization(this.canvas.height);

        console.log('x chunk num:', CONFIG.X_CHUNK);
        console.log('y chunk num:', CONFIG.Y_CHUNK);
    }

    async pendingRender() {
        if (this.render_info.draw) {
            if (this.render_info.need_initialize) {
                await this.optimize_chunk_size();

                this.grid = new Grid(this.canvas.width, this.canvas.height);
                this.fps_manager = new FPSManager(this.grid);
                this.simulator = new Simulator(this.ctx, this.grid, this.fps_manager, this.pointer);

                this.render_info.need_initialize = false;
                console.log('iniald!');
            }
            this.requestFrame();
        } else if (Date.now() - this.render_info.last_changed_time > 1000) {
            this.render_info.draw = true;
            this.requestFrame();
        } else {
            setTimeout(() => {
                this.pendingRender();
            }, this.render_info.delay_after * 1000);
        }
    }

    requestFrame() {
        this.simulator.draw();

        if (this.fps_manager.avr_fps <= 60) {
            this.tid = requestAnimationFrame(() => { this.pendingRender(); });
        } else {
            this.tid = setTimeout(() => { this.pendingRender(); }, 1000 / 60);
        }
    }

    destroy() {
        // 清除事件
        clear(this.el);

        // mouse 事件清除, set to default
        window.onmousemove = this.onmousemove;
        window.onmouseout = this.onmouseout;

        // 删除轮询
        cancelAnimationFrame(this.tid);

        // 删除 dom
        this.canvas.parentNode.removeChild(this.canvas);
    }
}
