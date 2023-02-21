# Info

Canvas-noice.js, a self-made particle rendering tool using chunks to speed up rendering process, inspired by [hustcc/canvas-nest.js](https://github.com/hustcc/canvas-nest.js).

## Details

Written below are several optimize methods that I use in this project with a grading for each from 1 to 5. (1 means slightly performance improvement while 5 means significant perf. improvement)

- chunks (5)
    - divergence property (3)
    - draw buffer (5)
    - size optimization (2~3)
- particle laziness (2)
- fps manager (4)

## How To Use

Please see `index.html` and `main.js`.

### Config parameters

```markdown
- basic property
max_d: the maximal line distance between particles. (in pixels)
point_count: number of points to render.
point_color: color of points. (in RGB)
line_color: color of lines. (in RGB)
zIndex: z-index of the canvas.
canvas_opacity: the opacity of the canvas. (0 means completely transparent while 1 means completely opaque)

- chunks
Each chunk has its own capacity. If the chunk is full, the points entering it will be randomly transported to other chunks.
FPS Manager will consistently monitor your current FPS. It will increase each chunk's capacity depending on the current FPS.

chunk_current_capacity: the default capacity that each chunk has in the beginning. (number of points)
chunk_min_capacity: the smallest capacity of a chunk.
chunk_max_capacity: the greatest capacity of a chunk.

chunk_size_optimize_constant: approximately the ratio of chunk-size / max_d. (recommended: 0.8)
lossless_computation: determine whether the computation between each particle is lossless or not. (in boolean) (false is recommended for a large amount of point_count)

- particles
particle_max_speed: the maximum speed of a particle in x or y direction. (in pixels)
particle_slow_down_rate: the slowdown rate of a over-speed particle.
gravity_constant: if option:GRAVITY_ACTIVE is set to true, it acts like the gravitational constant when calculating the force between particles.
pointer_gravity_constant: if option:GRAVITY_ACTIVE is set to true, it acts like the gravitational constant when calculating the force between a particle and the pointer.
pointer_interaction: the type of interaction between a point and the pointer.
    0: points stop moving when touched by cursor
    1: nearly the same effect as canvas-nest.js

- laziness (experimental)
Please see ./src/objs.js/ function: calInterWithPoint.

- simulation type
GRAVITY_ACTIVE: whether to activate gravity simulation (in boolean)
RANDOMNESS_ACTIVE: whether to activate random particle movement. (in boolean)
```

- Known issues
Some issues will occur when chunk_size_optimize_constant is too small or laziness is activated.

## Noice

![noice](https://i.imgflip.com/5msu2e.jpg)
