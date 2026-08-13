import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    base: '/recipitator-app',
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                recipeDisplay: resolve(__dirname, 'src/recipe-display/index.html'),
                recipes: resolve(__dirname, 'src/recipe-display/recipes.html'),
                favorites: resolve(__dirname, 'src/recipe-display/favorites.html'),
            },
        },
    },
});