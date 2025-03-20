import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Define the build configuration
  build: {
    // Output directory for the built files
    outDir: 'public',
    
    // Use ESM format
    target: 'esnext',
    
    // Define the entry point
    lib: {
      entry: resolve(__dirname, 'src/client/index.ts'),
      name: 'AuthClient',
      fileName: 'auth-client-bundle',
      formats: ['es'],
    },
    
    // Minimize the output for production
    minify: true,
    
    // Skip CSS bundling for this build
    cssCodeSplit: false,
  },
  
  // Define process environment variables for the browser
  define: {
    'process.env': {},
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.browser': true,
    'process': {
      env: {},
      browser: true
    },
  },
  
  // Define any plugins needed
  plugins: [],
  
  // Base path for assets
  base: '/',
});
