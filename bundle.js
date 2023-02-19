(function () {
  'use strict';

  var lib = {};

  var sensorPool = {};

  var id = {};

  (function (exports) {

  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports["default"] = void 0;

  	/**
  	 * Created by hustcc on 18/6/9.
  	 * Contract: i@hust.cc
  	 */
  	var id = 1;
  	/**
  	 * generate unique id in application
  	 * @return {string}
  	 */

  	var _default = function _default() {
  	  return "".concat(id++);
  	};

  	exports["default"] = _default;
  } (id));

  var sensors = {};

  var object = {};

  var debounce = {};

  (function (exports) {

  	Object.defineProperty(exports, "__esModule", {
  	  value: true
  	});
  	exports["default"] = void 0;

  	/**
  	 * Created by hustcc on 18/6/9.
  	 * Contract: i@hust.cc
  	 */
  	var _default = function _default(fn) {
  	  var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 60;
  	  var timer = null;
  	  return function () {
  	    var _this = this;

  	    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
  	      args[_key] = arguments[_key];
  	    }

  	    clearTimeout(timer);
  	    timer = setTimeout(function () {
  	      fn.apply(_this, args);
  	    }, delay);
  	  };
  	};

  	exports["default"] = _default;
  } (debounce));

  var constant = {};

  Object.defineProperty(constant, "__esModule", {
    value: true
  });
  constant.SensorTabIndex = constant.SensorClassName = constant.SizeSensorId = void 0;

  /**
   * Created by hustcc on 18/6/9.
   * Contract: i@hust.cc
   */
  var SizeSensorId = 'size-sensor-id';
  constant.SizeSensorId = SizeSensorId;
  var SensorClassName = 'size-sensor-object';
  constant.SensorClassName = SensorClassName;
  var SensorTabIndex = '-1';
  constant.SensorTabIndex = SensorTabIndex;

  Object.defineProperty(object, "__esModule", {
    value: true
  });
  object.createSensor = void 0;

  var _debounce$1 = _interopRequireDefault$2(debounce);

  var _constant$1 = constant;

  function _interopRequireDefault$2(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  /**
   * Created by hustcc on 18/6/9.
   * Contract: i@hust.cc
   */
  var createSensor$2 = function createSensor(element) {
    var sensor = undefined; // callback

    var listeners = [];
    /**
     * create object DOM of sensor
     * @returns {HTMLObjectElement}
     */

    var newSensor = function newSensor() {
      // adjust style
      if (getComputedStyle(element).position === 'static') {
        element.style.position = 'relative';
      }

      var obj = document.createElement('object');

      obj.onload = function () {
        obj.contentDocument.defaultView.addEventListener('resize', resizeListener); // 直接触发一次 resize

        resizeListener();
      };

      obj.style.display = 'block';
      obj.style.position = 'absolute';
      obj.style.top = '0';
      obj.style.left = '0';
      obj.style.height = '100%';
      obj.style.width = '100%';
      obj.style.overflow = 'hidden';
      obj.style.pointerEvents = 'none';
      obj.style.zIndex = '-1';
      obj.style.opacity = '0';
      obj.setAttribute('class', _constant$1.SensorClassName);
      obj.setAttribute('tabindex', _constant$1.SensorTabIndex);
      obj.type = 'text/html'; // append into dom

      element.appendChild(obj); // for ie, should set data attribute delay, or will be white screen

      obj.data = 'about:blank';
      return obj;
    };
    /**
     * trigger listeners
     */


    var resizeListener = (0, _debounce$1["default"])(function () {
      // trigger all listener
      listeners.forEach(function (listener) {
        listener(element);
      });
    });
    /**
     * listen with one callback function
     * @param cb
     */

    var bind = function bind(cb) {
      // if not exist sensor, then create one
      if (!sensor) {
        sensor = newSensor();
      }

      if (listeners.indexOf(cb) === -1) {
        listeners.push(cb);
      }
    };
    /**
     * destroy all
     */


    var destroy = function destroy() {
      if (sensor && sensor.parentNode) {
        if (sensor.contentDocument) {
          // remote event
          sensor.contentDocument.defaultView.removeEventListener('resize', resizeListener);
        } // remove dom


        sensor.parentNode.removeChild(sensor); // initial variable

        sensor = undefined;
        listeners = [];
      }
    };
    /**
     * cancel listener bind
     * @param cb
     */


    var unbind = function unbind(cb) {
      var idx = listeners.indexOf(cb);

      if (idx !== -1) {
        listeners.splice(idx, 1);
      } // no listener, and sensor is exist
      // then destroy the sensor


      if (listeners.length === 0 && sensor) {
        destroy();
      }
    };

    return {
      element: element,
      bind: bind,
      destroy: destroy,
      unbind: unbind
    };
  };

  object.createSensor = createSensor$2;

  var resizeObserver = {};

  Object.defineProperty(resizeObserver, "__esModule", {
    value: true
  });
  resizeObserver.createSensor = void 0;

  var _debounce = _interopRequireDefault$1(debounce);

  function _interopRequireDefault$1(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  /**
   * Created by hustcc on 18/7/5.
   * Contract: i@hust.cc
   */
  var createSensor$1 = function createSensor(element) {
    var sensor = undefined; // callback

    var listeners = [];
    /**
     * trigger listeners
     */

    var resizeListener = (0, _debounce["default"])(function () {
      // trigger all
      listeners.forEach(function (listener) {
        listener(element);
      });
    });
    /**
     * create ResizeObserver sensor
     * @returns
     */

    var newSensor = function newSensor() {
      var s = new ResizeObserver(resizeListener); // listen element

      s.observe(element); // trigger once

      resizeListener();
      return s;
    };
    /**
     * listen with callback
     * @param cb
     */


    var bind = function bind(cb) {
      if (!sensor) {
        sensor = newSensor();
      }

      if (listeners.indexOf(cb) === -1) {
        listeners.push(cb);
      }
    };
    /**
     * destroy
     */


    var destroy = function destroy() {
      sensor.disconnect();
      listeners = [];
      sensor = undefined;
    };
    /**
     * cancel bind
     * @param cb
     */


    var unbind = function unbind(cb) {
      var idx = listeners.indexOf(cb);

      if (idx !== -1) {
        listeners.splice(idx, 1);
      } // no listener, and sensor is exist
      // then destroy the sensor


      if (listeners.length === 0 && sensor) {
        destroy();
      }
    };

    return {
      element: element,
      bind: bind,
      destroy: destroy,
      unbind: unbind
    };
  };

  resizeObserver.createSensor = createSensor$1;

  Object.defineProperty(sensors, "__esModule", {
    value: true
  });
  sensors.createSensor = void 0;

  var _object = object;

  var _resizeObserver = resizeObserver;

  /**
   * Created by hustcc on 18/7/5.
   * Contract: i@hust.cc
   */

  /**
   * sensor strategies
   */
  // export const createSensor = createObjectSensor;
  var createSensor = typeof ResizeObserver !== 'undefined' ? _resizeObserver.createSensor : _object.createSensor;
  sensors.createSensor = createSensor;

  Object.defineProperty(sensorPool, "__esModule", {
    value: true
  });
  sensorPool.removeSensor = sensorPool.getSensor = void 0;

  var _id = _interopRequireDefault(id);

  var _sensors = sensors;

  var _constant = constant;

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  /**
   * Created by hustcc on 18/6/9.
   * Contract: i@hust.cc
   */

  /**
   * all the sensor objects.
   * sensor pool
   */
  var Sensors = {};
  /**
   * get one sensor
   * @param element
   * @returns {*}
   */

  var getSensor = function getSensor(element) {
    var sensorId = element.getAttribute(_constant.SizeSensorId); // 1. if the sensor exists, then use it

    if (sensorId && Sensors[sensorId]) {
      return Sensors[sensorId];
    } // 2. not exist, then create one


    var newId = (0, _id["default"])();
    element.setAttribute(_constant.SizeSensorId, newId);
    var sensor = (0, _sensors.createSensor)(element); // add sensor into pool

    Sensors[newId] = sensor;
    return sensor;
  };
  /**
   * 移除 sensor
   * @param sensor
   */


  sensorPool.getSensor = getSensor;

  var removeSensor = function removeSensor(sensor) {
    var sensorId = sensor.element.getAttribute(_constant.SizeSensorId); // remove attribute

    sensor.element.removeAttribute(_constant.SizeSensorId); // remove event, dom of the sensor used

    sensor.destroy(); // exist, then remove from pool

    if (sensorId && Sensors[sensorId]) {
      delete Sensors[sensorId];
    }
  };

  sensorPool.removeSensor = removeSensor;

  Object.defineProperty(lib, "__esModule", {
    value: true
  });
  lib.ver = clear_1 = lib.clear = bind_1 = lib.bind = void 0;

  var _sensorPool = sensorPool;

  /**
   * Created by hustcc on 18/6/9.[高考时间]
   * Contract: i@hust.cc
   */

  /**
   * bind an element with resize callback function
   * @param {*} element
   * @param {*} cb
   */
  var bind = function bind(element, cb) {
    var sensor = (0, _sensorPool.getSensor)(element); // listen with callback

    sensor.bind(cb); // return unbind function

    return function () {
      sensor.unbind(cb);
    };
  };
  /**
   * clear all the listener and sensor of an element
   * @param element
   */


  var bind_1 = lib.bind = bind;

  var clear = function clear(element) {
    var sensor = (0, _sensorPool.getSensor)(element);
    (0, _sensorPool.removeSensor)(sensor);
  };

  var clear_1 = lib.clear = clear;
  var ver = "1.0.1";
  lib.ver = ver;

  /**
   * Created by hustcc on 18/6/23.
   * Contract: i@hust.cc
   */

  const requestAnimationFrame = window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      function (func) {
          return window.setTimeout(func, 1000 / 60);
      };

  const cancelAnimationFrame = window.cancelAnimationFrame ||
      window.webkitCancelAnimationFrame ||
      window.mozCancelAnimationFrame ||
      window.msCancelAnimationFrame ||
      window.oCancelAnimationFrame ||
      window.clearTimeout;

  const canvasStyle = config =>
      `display:block;position:absolute;top:0;left:0;height:100%;width:100%;overflow:hidden;pointer-events:none;z-index:${config.zIndex};opacity:${config.opacity}`;

  const CONFIG = {
      max_d: 100,
      point_count: 50,
      point_color: '180,180,180',
      line_color: '180,180,180',
      chunk_current_capacity: 5,
      chunk_min_capacity: 15,
      chunk_max_capacity: 20,
      chunk_size_optimize_constant: 1, // recommended
      particle_max_speed: 1, // pixel in each dimension per frame
      particle_slow_down_rate: 0.8, // decrease function
      gravity_constant: 1,
      pointer_gravity_constant: 10,
      lazy_overload_threshold: 0.7, // <= 1: active, >=1: disabled
      tabu_index: 0.4, // in seconds
      GRAVITY_ACTIVE: true,
      RANDOMNESS_ACTIVE: true,
      zIndex: 0,
      canvas_opacity: 0.5,
  };

  class Point {
      constructor(w, h) {
          this.x = w * Math.random();
          this.y = h * Math.random();
          this.vx = 2 * (2 * Math.random() - 1);
          this.vy = 2 * (2 * Math.random() - 1);

          this.lazy = {
              touched: 0,
              near: 0,
              sleep_frame: 0
          };
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

  class Grid {
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

  class Simulator {
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

  class FPSManager {
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

  class CanvasNoice {
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
          bind_1(this.el, () => {
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
              this.el.style.position = 'relative';
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
          clear_1(this.el);

          // mouse 事件清除, set to default
          window.onmousemove = this.onmousemove;
          window.onmouseout = this.onmouseout;

          // 删除轮询
          cancelAnimationFrame(this.tid);

          // 删除 dom
          this.canvas.parentNode.removeChild(this.canvas);
      }
  }

  new CanvasNoice(document.body);

})();
