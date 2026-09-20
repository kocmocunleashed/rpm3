# Validation

Checked 20 September 2026 in `network-studio`, after the guided-presentation navigation revision.

## Technical checks

| Check | Result |
| --- | --- |
| `bun run build` | Passed: TypeScript and Vite production bundle. |
| `bun run lint` | Passed. |
| Prettier check of changed source and tests | Passed. |
| `bun test src/simulation.test.ts` | 14 passed, 52 assertions. |
| `bun run test:e2e` | 27 passed in 3.0 minutes, one Chromium worker. |
| Content integrity | Ten distinct chapters, twenty sources; all takeaway/example fields and source references resolve. |

The separately loaded Three.js bundle is approximately 968 kB minified / 258 kB gzip and produces Vite's size warning. The shell and interactive labs remain separate chunks. WebGL is required for the clay scenes; a fallback preserves the lesson text and controls when it is unavailable.

## Correctness checks

- Spotify's request physically travels through the illustrated internet route to the audio service. Returning audio is in transit while the buffer is empty. Only the next stage shows a partial buffer and playback. Pausing preserves the stage and received-buffer state. The phone texture and accessible controls use the same stage.
- Prepared Counter-Strike LAN clients send inputs to a local server through a switch. Observable positions progress from server/client/client A/A/A to B/A/A, then B/B/B. The geometry and accessible outputs receive the same state. The example's disconnected internet does not prevent the local exchange; modeled match WAN traffic is zero.
- Wi-Fi shows a device-to-access-point request and the opposite response, with geometry arrowheads that turn with the model. Reduced-motion operation still produces meaningful state changes.
- DNS marks the first answer cached after completion and uses a two-step warm response on a repeat. The reserved example domain and IP are explicitly simulated, not Spotify's live address.
- The firewall first permits or blocks connection establishment. Only an allowed request reveals the application's fictional password or encrypted payload. Blocking 443 does not block the intentionally open HTTP/80 route. HTTPS is not a guarantee that a site is honest.
- Routing, TCP buffering/retransmission, bandwidth/one-way delay, quiz feedback, dialog focus, source access, direct navigation, and resets pass their behavioral checks.

The Spotify and game-server principles were checked against Spotify Engineering, Valve's Source multiplayer documentation, and Steam Support. The presentation notes distinguish the teaching abstractions from current service internals, game setup/authentication requirements, real protocols, and physical scale.

## Presentation behavior

Next/Right/Page Down/Space executes the current model’s next meaningful cue before moving to the following chapter. Back/Left/Page Up/Shift+Space reverses a cue; a backward chapter crossing enters the previous model’s final state. Overview, progress buttons, Home/End, and direct hashes remain explicit jumps. The footer previews the next action.

The guided sequences contain 4 Spotify steps, 14 network-scope/LAN steps, 5 hardware steps, 8 media steps, 4 routing steps, 10 DNS steps, 7 packet steps, 3 speed steps, 3 security steps, and 5 question/explanation steps. Animation within a guided cue does not advance the presentation on its own. Manual playback retains its own automatic behavior.

Forward actions use the visible model state, including manually edited routes and pending speed/security settings. Back reconstructs a deterministic preceding demonstration. Quiz explanation-only steps do not select learner answers; partial scores use only actual selections. Lazy lab-module loading disables cue navigation, dialogs block shortcuts, native inputs retain their keys, and held arrow keys cannot accidentally consume multiple cues.

## Rendered review

Inspected all ten chapters at 390×844 in meaningful states, plus the 1440×900 desktop introduction. Both 390×844 and 980×1900 automated matrices verify all ten chapters, real canvas pixels, sticky takeaways, reachable controls, and absence of horizontal or nested lab overflow.

The final pass fixed two observed layout defects: cloned highlight padding could extend beyond a wrapped line, and the phone security diagram's wrapping left an arrow pointing away from its server. The highlight now reserves its padding; the firewall, down arrow, and server align on one path. Selected quiz answers remain readable after their buttons become disabled.

The guided-navigation release was also inspected through its public forwarded URL at 390×844 and 1440×900. Spotify steps remain on the current chapter until the last cue, Next then enters LAN, Back restores the final Spotify cue, and Next explodes the hardware model. The served HTML and all five production JavaScript/CSS assets match `dist` byte for byte; the public browser session reported no JavaScript errors.

These checks validate the bounded teaching models and tested Chromium viewports. They do not establish full network-stack fidelity or educational effectiveness through a learner study.
