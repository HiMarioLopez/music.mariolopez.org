# music-vue

Vue implementation of `music.mariolopez.org`, built with Vue 3 + TypeScript + Vite.

## Scripts

- `bun run dev` - start local dev server
- `bun run build` - type-check and build for production
- `bun run preview` - preview production build locally
- `bun run lint` - run Biome linting
- `bun run lint:fix` - auto-fix Biome lint issues
- `bun run format` - format code with Biome

## Notes

- The app proxies `/api/*` to `https://music.mariolopez.org` in local development.
- Production builds are configured with the `/vue` base path.
