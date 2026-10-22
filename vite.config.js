import { defineConfig } from 'vite'

// Project Pages site: https://sketchzlab.github.io/chibi-office/
// Set BASE_PATH to override (use BASE_PATH=/ for a local root preview).
const base = process.env.BASE_PATH ?? '/chibi-office/'

export default defineConfig({
  base,
})
