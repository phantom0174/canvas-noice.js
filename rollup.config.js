import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from "rollup-plugin-terser";


export default {
    input: './src/main.js',
    output: {
        file: 'bundle.js',
        format: 'esm'
    },
    plugins: [
        resolve(),
        commonjs(),
        terser({
            parse: {
                html5_comments: false
            },
            compress: {
                ecma: 2018,
                arguments: true,
                keep_fargs: false,

            },
            format: {
                comments: false,
                ecma: 2018,
            }
        })
    ]
};
