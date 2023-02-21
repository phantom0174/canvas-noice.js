const CNCONFIG = {
    max_d: 50,
    point_count: 1500,
    point_color: '100,100,100',
    line_color: '180,180,180',
    zIndex: 0,
    canvas_opacity: 1,
    chunk_current_capacity: 15,
    chunk_min_capacity: 5,
    chunk_max_capacity: 20,
    chunk_size_optimize_constant: 0.5, // recommended
    lossless_computation: 0, // 0 is recommended for large amount of points
    particle_max_speed: 1, // pixel in each dimension per frame
    particle_slow_down_rate: 0.8, // decrease function
    gravity_constant: 0.1,
    pointer_gravity_constant: 10,
    pointer_interaction: 1, // ; 1: same effect as canvas-nest.js
    lazy_overload_threshold: 1.1, // <= 1: active, >1: disabled
    tabu_index: 1, // in seconds
    GRAVITY_ACTIVE: false,
    RANDOMNESS_ACTIVE: true,
};

new CanvasNoice();
