const CNCONFIG = {
    max_d: 76,
    point_count: 500,
    point_color: '120,120,120',
    line_color: '180,180,180',
    zIndex: 0,
    canvas_opacity: 1,
    render_rate: 60, // in fps
    chunk_current_capacity: 15,
    chunk_min_capacity: 5,
    chunk_max_capacity: 20,
    chunk_size_optimize_constant: 0.8,
    lossless_computation: 0,
    particle_max_speed: 1,
    particle_slow_down_rate: 0.8,
    gravity_constant: 10,
    pointer_gravity_constant: 10,
    pointer_interaction: 0,
    lazy_overload_threshold: 1.1,
    tabu_index: 1,
    GRAVITY_ACTIVE: 0,
    RANDOMNESS_ACTIVE: 1,
};

new CanvasNoice();
