import { cancelAnimationFrame, canvasStyle } from './utils';
// const { CNCONFIG } = require('./config');
import { Simulator } from './simulator';
import { FPSManager } from './fps_manager';
import { Grid } from './objs';


export class CanvasNoice {
    constructor() {
        // this.el = el;
        this.canvas = undefined;
        this.initializeCanvas();
        this.ctx = this.canvas.getContext('2d');

        this.grid = undefined; // chunk manager
        this.fps_manager = undefined;
        this.simulator = undefined;

        this.pointer = {
            x: null,
            y: null,
            is_pointer: true
        };
        this.registerListener();

        this.render_info = {
            draw: true,
            need_initialize: true,
            delay_after: 0.2,
            last_changed_time: 0,
        };

        this.pendingRender();
    }

    updateCanvasSize() {
        this.canvas.width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        this.canvas.height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    }

    resetRenderInfo() {
        this.render_info.last_changed_time = Date.now();
        this.render_info.draw = false;
        this.render_info.need_initialize = true;
    }

    registerListener() {
        window.onresize = () => {
            cancelAnimationFrame(this.tid);

            this.updateCanvasSize();
            this.resetRenderInfo();
        };

        this.onmousemove = window.onmousemove;
        window.onmousemove = e => {
            this.pointer.x = e.clientX;
            this.pointer.y = e.clientY;
            // this.pointer.x = e.clientX - this.el.offsetLeft + document.scrollingElement.scrollLeft; // 当存在横向滚动条时，x坐标再往右移动滚动条拉动的距离
            // this.pointer.y = e.clientY - this.el.offsetTop + document.scrollingElement.scrollTop; // 当存在纵向滚动条时，y坐标再往下移动滚动条拉动的距离
            this.onmousemove && this.onmousemove(e);
        };

        this.onmouseout = window.onmouseout;
        window.onmouseout = () => {
            this.pointer.x = null;
            this.pointer.y = null;
            this.onmouseout && this.onmouseout();
        };
    }

    initializeCanvas() {
        // if (getComputedStyle(this.el).position === 'static') {
        //     this.el.style.position = 'relative';
        // }
        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = canvasStyle(CNCONFIG);
        this.updateCanvasSize();

        document.body.appendChild(this.canvas);
    }

    optimizeChunkSize() {
        const optimized_size_threshold = Math.round(CNCONFIG.max_d * Math.max(CNCONFIG.chunk_size_optimize_constant, 0.25));
        console.log('[c-noice.js] Optimized chunk size:', optimized_size_threshold);

        const calOpti = (dimension) => {
            const diff = (num_of_chunks) => {
                return Math.abs(dimension / num_of_chunks - optimized_size_threshold);
            };

            let test_num = dimension / optimized_size_threshold;
            if (diff(Math.floor(test_num)) < diff(Math.ceil(test_num))) return Math.floor(test_num);
            else return Math.ceil(test_num);
        };

        CNCONFIG.X_CHUNK = calOpti(this.canvas.width);
        CNCONFIG.Y_CHUNK = calOpti(this.canvas.height);

        console.log(`[c-noice.js] Chunk Number: ${CNCONFIG.X_CHUNK}*${CNCONFIG.Y_CHUNK}`);
    }

    async pendingRender() {
        if (this.render_info.draw) {
            if (this.render_info.need_initialize) {
                this.optimizeChunkSize();

                this.grid = new Grid(this.canvas.width, this.canvas.height);
                this.fps_manager = new FPSManager(this.grid);
                await this.fps_manager.initialize();
                // this.fps_manager = null;

                this.simulator = new Simulator(this.ctx, this.grid, this.pointer);

                this.render_info.need_initialize = false;
                console.log('[c-noice.js] Canvas Initialized!');
                console.log(`[c-noice.js] Canvas Size: ${this.canvas.width}*${this.canvas.height}`);
            }
            this.requestFrame();
        } else if (Date.now() - this.render_info.last_changed_time > 1000) {
            this.render_info.draw = true;
            this.pendingRender();
        } else { // wait until ready
            setTimeout(() => {
                this.pendingRender();
            }, this.render_info.delay_after * 1000);
        }
    }

    requestFrame() {
        this.simulator.draw();

        // if (this.fps_manager.avr_fps <= 60) {
        //     this.tid = requestAnimationFrame(() => { this.pendingRender(); }); // this thing is crashing the browser!
        // } else {
        this.tid = setTimeout(() => { this.pendingRender(); }, 1000 / 60);
        // }
    }

    destroy() {
        // set mouse event to default
        window.onmousemove = this.onmousemove;
        window.onmouseout = this.onmouseout;

        cancelAnimationFrame(this.tid);
        document.body.removeChild(this.canvas);
    }
}
