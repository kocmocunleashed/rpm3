# Presentation design contract

A Mongolian lesson about computer networks, using familiar examples and a single highlighted idea per chapter.

## Reading order

Each chapter has a short title, one highlighted takeaway, one real-life example, and a working model. Detailed explanations, limitations, and primary sources live behind the labeled explanation button. The overview collects all ten takeaways in one place.

On portrait screens, the short summary stays visible while the user scrolls through the model. The model and its controls form one group. There is one main scroller and no independently scrolling portrait lab. On landscape screens, the summary and example sit beside the model within the presentation frame.

## Visual language

Warm paper, dark green text, a quiet yellow highlight for the core idea, and softly lit clay devices. Sage, peach, blue, lilac, rose, and butter remain chapter accents. Rounded 3D objects show device roles and physical media; diagrams show abstract routes, DNS, ordered delivery, and timing.

Remove duplicate headings, prediction cards, explanatory paragraphs, and generic experiment labels from the main slide. Use natural sentence case and direct, brief Mongolian prose. Keep labeled controls, keyboard navigation, focus, loading, error, and reset states.

## Demonstrations

- Spotify: a teaching abstraction of requesting and buffering audio chunks, then playing while further chunks arrive. It is not a Spotify integration or an exact reproduction of its current infrastructure.
- Counter-Strike LAN: prepared clients join a local server. Inputs travel to the server; updated game state returns to both clients. Local match traffic remains on the LAN even when the example's internet connection is disconnected. Setup, authentication, and downloads are separate prerequisites.
- Wi-Fi: alternate a device-to-access-point request with a return response. Decorative arcs identify radio; moving markers represent data flow, not literal physical packets or wave speed.
- DNS and security: visible states must reflect cache changes and successful or blocked connection establishment. An encrypted application payload must not appear as delivered when a firewall prevented the connection.

Next is a presentation cue, not an unconditional chapter jump. It runs a bounded sequence of real model actions, covers the chapter’s main alternatives, then opens the next chapter. Back reverses the cue; crossing backward opens the previous chapter’s final demonstration. Deliberate manual selections update the cue so the presenter can continue from the visible state. The footer displays cue progress and the next action. Direct chapter selection remains in the overview and desktop progress bar.

Quiz presentation steps reveal explanations without choosing answers for the learner or adding to their score. Keyboard shortcuts respect native inputs, sliders, buttons, and open dialogs. Loading a model cannot accidentally skip it.

Each model owns its playback control. Visibility pauses work; reduced-motion preference must preserve a meaningful static or stepped result. Do not add a global toggle that makes a running model appear frozen.

## Finish gate

Apply the anti-ui-slop distillation playbook. Inspect desktop, a normal phone, and a tall portrait viewport. Verify actual action outcomes, model pixels, highlighted takeaways, reachable controls, and the overview. Run build, lint, pure model tests, and browser checks. Verify the served public build matches the local release.
