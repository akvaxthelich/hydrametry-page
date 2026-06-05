import { resolve } from 'path'

export default {
    root: 'src/', // Source files are here
    publicDir: '../static/', 
    server:
    {
        host: true, 
        open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env) 
    },
    build:
    {
        outDir: '../dist', 
        emptyOutDir: true, 
        sourcemap: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/index.html'),
                // By naming the key 'aboutUs', Vite outputs it directly as aboutUs.html
                aboutUs: resolve(__dirname, 'src/aboutUs.html'),
            },
        },
    },
}