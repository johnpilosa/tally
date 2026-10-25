# TALLY

A tiny counter app for keeping track of how often things happen. Black screen, thin white lines, dot-matrix numbers, inspired by Nothing OS dark mode.

Tap the big circle, the icon inside does its thing, and the count goes up.

## Features

- **Last used, front and center.** The app opens on the counter you touched last.
- **Animated icons.** Every counter gets an icon that plays when you tap:
  - **Roundabout:** a car laps a top-down roundabout.
  - **#$%&!:** comic-strip swear symbols jump in a wave and shake.
  - **Nerd:** pushes up his glasses, blinks, tilts his head.
  - **Star destroyer:** splits in half with a red flash and snaps back together.
- **Build your own icons.** Drop in circles, squares, triangles, stars and lines, drag them around, and give each one a motion (spin, pulse, float, blink, orbit, shake, bounce) with its own speed and delay.
- **Milestones.** Every 5th tap bursts pixels out of the button. Every 25th is a MEGA MILESTONE.
- **History.** Today, last 7 days, total, and every tap grouped by day.
- **Drag to reorder** your counters, rename them, undo the last tap.

## Run it

```bash
npm install
npx expo start
```

Then press `w` to open it in the browser, or scan the QR code with [Expo Go](https://expo.dev/go) on your phone.

## Tweak the animations

Every timing, spring and distance lives in one file, [`src/animations/config.ts`](src/animations/config.ts), with comments explaining each value. Change a number, save, and the app updates instantly.

## Project map

```
src/
  app/            screens (home, history, counter editor, icon editor)
  icons/          the built-in animated icons and the custom icon renderer
  components/     the counter button, chips row, milestone burst…
  animations/     config.ts: all the animation knobs
  lib/            storage for counters and custom icons, date helpers
```

Built with [Expo](https://expo.dev), React Native and Reanimated.
