export const CONFIG = {
    max_d: 100,
    point_count: 500,
    point_color: '180,180,180',
    line_color: '180,180,180',
    chunk_current_capacity: 15,
    chunk_min_capacity: 5,
    chunk_max_capacity: 20,
    chunk_size_optimize_constant: 1, // recommended
    particle_max_speed: 1, // pixel in each dimension per frame
    particle_slow_down_rate: 0.8, // decrease function
    gravity_constant: 0.1,
    pointer_gravity_constant: 10,
    lazy_overload_threshold: 1.1, // <= 1: active, >1: disabled
    tabu_index: 1, // in seconds
    GRAVITY_ACTIVE: true,
    RANDOMNESS_ACTIVE: false,
    zIndex: 0,
    canvas_opacity: 1,
    pointer_interaction: 1, // 0: points stop moving when touched by cursor; 1: same effect as canvas-nest.js
};
