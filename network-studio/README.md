# холбоо. — Network Studio

A new, full-browser Mongolian networking presentation, scaffolded with `bun create vite network-studio --template react-ts`. This is independent of the previous Next.js project in the parent folder.

## Run

```sh
cd network-studio
bun install
bun run dev --port 5173 --strictPort
```

Open <http://localhost:5173>. Every chapter has one highlighted takeaway, one familiar example, and a working model. The takeaway stays visible while scrolling on a phone. The **Хураангуй** overview gathers all ten ideas; use it to jump directly to a chapter. **→ / Page Down / Space** advances the current demonstration one step, then moves to the next chapter after its final step. **← / Page Up / Shift+Space** reverses a step; crossing a chapter boundary opens the previous chapter at its last demonstration. **Home / End** jumps to the first or last chapter, and **F** toggles fullscreen. Native controls keep their own keys while focused. Direct links work, including `/#intro` for Spotify and `/#scale` for the Counter-Strike LAN example. Dialogs support Escape, and reduced-motion users can still operate the demonstrations.

## Deploy to Vercel

Import this repository with Root Directory set to the repository root (`.`).
The root `vercel.json` selects Vite, installs this app's locked dependencies,
builds inside `network-studio`, and publishes `network-studio/dist`. These
settings override a previously detected Next.js preset.

The root Next.js starter is a separate application. Running its build would
type-check the nested presentation without installing this app's dependencies.
Use the committed Vercel configuration to deploy the presentation.

## Ten chapters

1. Spotify streaming: request audio, watch chunks return through the network, then play from a partial buffer while more arrive.
2. Counter-Strike LAN: join a local server, move a player, and see the server update both clients even with the example's internet connection disconnected. Compare PAN, LAN, campus, metropolitan, and wide-area settings.
3. Hardware: rotate and explode a clay router; inspect its processor, memory, Ethernet interface, and radio.
4. Media: explore twisted copper pairs, fiber layers, and a bidirectional Wi-Fi request/response.
5. Routing: break links, observe a valid alternate path, or disconnect the destination.
6. DNS: follow resolver queries and compare first lookups with a learned per-name cache.
7. Packets: observe reordering, a gap, acknowledgements, and automatic retransmission.
8. Speed: compare bandwidth and propagation delay with a displayed mathematical model.
9. Security: allow or block a fictional login request; application data appears only after an allowed connection.
10. Prediction practice: answer three questions and inspect the explanation.

## Content and model boundaries

The supplied PDF is available in the source drawer and at `public/source.pdf`. The prose was rewritten and checked against primary technical references. [AUDIT.md](AUDIT.md) records textbook corrections, issues in the earlier demonstrations, and the teaching purpose and limits of each new interaction.

These are educational models, not live network measurements or protocol implementations. The topology uses equally weighted links; DNS uses reserved example names and documentation addresses; the packet lesson follows a fixed event sequence; the speed lesson models one ideal link. The displayed formula and playback use the same calculation. Clay hardware is a stylized explanation of component roles, not a manufacturing teardown.

## Verify

```sh
bun run lint
bun run build
bun test src/simulation.test.ts
bunx playwright install chromium
# Keep the development server running on port 5173 in another terminal.
bun run test:e2e
```

Unit tests cover routing, cache behavior, packet reconstruction, transfer-time arithmetic, and filtering/encryption independence. Browser tests exercise all chapters, dialogs, mobile layout, reduced motion, and observable simulation outcomes. Browser tests run sequentially to limit WebGL memory use. [VALIDATION.md](VALIDATION.md) records the latest completed checks.

## Code map

- `src/App.tsx`, `src/App.css`: presentation shell, navigation, dialogs, and responsive layout.
- `src/presentation.tsx`: shared registration for real model actions and cue metadata.
- `src/content.ts`: Mongolian prose and source references.
- `src/demos.tsx`, `src/clay-scene.tsx`: controls and real Three.js geometry for four interactive 3D chapters.
- `src/labs.tsx`, `src/labs.css`: six interactive learning screens.
- `src/simulation.ts`: pure simulation calculations, separate from rendering.
- `tests/presentation.spec.ts`, `tests/guided-navigation.spec.ts`: model behavior, guided navigation, keyboard, and responsive checks.

The 3D renderer and labs are loaded separately from the presentation shell. Nunito Sans is self-hosted; its license is in `public/fonts/OFL.txt`.
