# Welcome to the OP-1 Finger Sequencer simulator

## Try it out!
[https://finger.sampi.io](https://finger.sampi.io/)

## YouTube video
[![YouTube demo](https://img.youtube.com/vi/AizpaaGNmSk/maxresdefault.jpg)](https://www.youtube.com/watch?v=AizpaaGNmSk)

## Quick start instructions

1) Plug an OP-Z into your computer or Android phone
2) Open https://finger.sampi.io in Google Chrome
3) Play some notes on the `module` track

## Instructions

You can control the sequencer by connecting one or more MIDI devices to your computer.
Input will be taken from every connected MIDI device on the control channel _(default: MIDI channel 14)_,
Output will be sent to two separate channels for drums _(default: MIDI channel 1)_ and synths _(default: MIDI channel 8)_.

Best used with an OP-Z or OP-1, the left half of the musical keyboard will correspond to drum patterns, the right half will control the synth patterns.

To change the MIDI channels, you can use the UI:

- To change the Drum MIDI output channel: Click on the green drum icon on the bottom left of the screen.
- To change the Control MIDI input channel: Click on the white piano icon on the very bottom of the screen.
- To change the Synth MIDI output channel: Click on the blue synth icon on the bottom right of the screen.

Changing settings is possible by changing the attributes of the `<finger-sequencer>` element:

- To set the BPM: `document.querySelector('finger-sequencer').setAttribute('bpm', 125);`

Have fun playing!

> Browser Compatibility: Any browsers with support for the Web MIDI API (Google Chrome (desktop & Android), Android Browser, Samsung Internet)

> Copyright notice: All of the visual artwork and sequencer patterns were made by Teenage Engineering, I am just using it for fun here.

### Troubleshooting

If nothing happens when you play notes, try to reload the page. MIDI devices are only recognized during load.

## Technical info

The code itself is chaotic, because this is a prototype made over a couple of days.

### Important/interesting files

* `/index.html`

Contains the main SVG and imports all the necessary files.

* `/src/finger.js`

This is the main script, handling the incoming notes and animating the gorilla and the synth dude, as well as the sequencer.

* `/src/settings.js`

This script displays and controls the MIDI channel settings on the bottom of the page.

* `/src/midi.js`

This script makes it easier to listen to MIDI notes and send them.

* `/src/pattern-printer.html`

This is a very basic quick script that captures MIDI input and prints it out as an Array.

* `/src/patterns.js`

These are the factory preset patterns of the Finger Sequencer from the OP-1.

* `/sw.js`

This is the Service Worker that makes the app work offline. (PWA!)

### (Some of the) Web APIs used
* Web Components (Custom Elements, Shadow DOM, HTML Templates)
* Web MIDI
* Web Animations
* CSS Custom Properties
* ES Modules
* Custom Events
* Service Workers
* Cache
* Web App Manifest
