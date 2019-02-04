## Welcome to the OP-1 Finger Sequencer simulator

[Live demo](https://finger.sampi.io/)

You can control the sequencer by connecting one or more MIDI devices to your computer.
Input will be taken from every connected MIDI device on the control channel _(default: MIDI channel 14)_,
Output will be sent to two separate channels for drums _(default: MIDI channel 1)_ and synths _(default: MIDI channel 8)_.

Best used with an OP-Z or OP-1, the left half of the musical keyboard will correspond to drum patterns, the right half will control the synth patterns.

To change the MIDI channels, you can use the UI:

- To set the Drum MIDI output channel: Click on the green drum icon on the bottom left of the screen.
- To set the Control MIDI input channel: Click on the white piano icon on the very bottom of the screen.
- To set the Synth MIDI output channel: Click on the blue synth icon on the bottom right of the screen.

Changing settings is possible by changing the attributes of the `<finger-sequencer>` element:

- To set the BPM: `document.querySelector('finger-sequencer').setAttribute('bpm', 125);`

Have fun playing!

> Browser Compatibility: Any browsers with support for the Web MIDI API (Google Chrome (desktop & Android), Android Browser, Samsung Internet)

> Copyright notice: All of the visual artwork and sequencer patterns were made by Teenage Engineering, I am just using it for fun here.
