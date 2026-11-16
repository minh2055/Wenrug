# Emberfall

![best-game-01](https://make.fun/badge/best-game-01.svg)
![rank](https://make.fun/badge/best-game-01/minh2055/Wenrug/rank.svg)
![reward](https://make.fun/badge/best-game-01/minh2055/Wenrug/reward.svg)

An entry for [make.fun best-game-01](https://make.fun/c/best-game-01) — a neon
arcade survival game that runs entirely from static files, with no network
requests and no libraries.

## The game

You are a spark of light in a dark void. Glowing embers drift down through
the dark — collect them to score, and chain collects within two seconds to
build a combo multiplier up to **x5**. Shadow meteors and void wisps rain
from above: one hit costs a life (you have three) and breaks your combo.
Power-ups float down too — **Shield** absorbs one hit, **Slow** bends time
to 40% for five seconds, **Magnet** pulls nearby embers toward you for six
seconds. Every 25 seconds the void levels up: meteors fall faster and spawn
more often, and wisps start drifting in from level 2.

- **Move:** mouse, arrow keys, or WASD
- **Pause:** Esc / P
- **Mute:** M (or the SOUND button)
- **Start / restart:** click, or press Enter

Score chases a best score saved in your browser. Sound is synthesized live
with WebAudio — collect chimes that climb in pitch with your combo, a hit
thud, power-up arpeggios, level-up fanfares and a soft ambient pad. All art
is drawn in code on a Canvas 2D starfield: neon glow, particle trails,
explosions and screen shake, no images or audio files anywhere.

## Play it

Serve the `game/` folder with any static server and open `index.html`:

```sh
node serve.ts
# then open http://localhost:8080
```

Or open `game/index.html` through any static file server. The game needs
no build step and makes no network requests.

## Layout

- `game/index.html` — canvas + HUD + screens
- `game/css/style.css` — page, canvas, HUD, screens, buttons
- `game/js/main.js` — bootstrap, game loop, state machine
- `game/js/player.js` — the spark: movement, trail, shield ring
- `game/js/embers.js` — collectible embers and the combo chain
- `game/js/meteors.js` — falling meteors and drifting wisps
- `game/js/powerups.js` — Shield / Slow / Magnet
- `game/js/particles.js` — starfield, trails, bursts, explosions
- `game/js/audio.js` — WebAudio synth effects and ambient pad
- `game/js/input.js` — mouse, keyboard, touch
- `game/js/ui.js` — HUD, screens, buttons, banners
- `game/js/levels.js` — difficulty scaling
- `game/js/storage.js` — best score in localStorage
- `game/js/shot.js` — `?shot=title|play|power|over` staging for screenshots
- `main.ts` — hand-in program: copies `game/` + `screenshots/` to the
  output dir and writes `dossier.json` with the vendored make.fun library
- `vendor/makefun-game.ts` — the kit's library, unchanged
