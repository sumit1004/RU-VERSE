# RU VERSE

A React + Vite cinematic techfest landing experience using one persistent React Three Fiber canvas, GSAP ScrollTrigger navigation, adaptive rendering, and mobile-first layout.

## Run

```bash
npm install
npm run dev
```

## Production model paths

Place the provided optimized GLBs in these locations before enabling model loading:

- `public/models/ship/droid_tri_fighter.glb`
- `public/models/planets/earth__astroriah.glb`
- `public/models/planets/planet_afroditi.glb`
- `public/models/planets/saturn_-_ringed_planet.glb`
- `public/models/planets/saturn_planet.glb`
- `public/models/transitions/solar_eclipse.glb`

The current scene uses lightweight procedural stand-ins because no source assets were present in the workspace. The model paths are already defined in `src/data/universeData.js`.
