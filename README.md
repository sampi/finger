# finger
Recreation of the OP-1's Finger sequencer using Web MIDI

## Welcome to the OP-1 Finger Sequencer simulator

You can control the sequencer by connecting one or more MIDI devices to your computer.
Input will be taken from every connected MIDI device on the control channel _(default: MIDI channel 16)_,
Output will be sent to two separate channels for drums _(default: MIDI channel 1)_ and synths _(default: MIDI channel 8)_.
 
Changing settings is possible by changing the attributes of the `<finger-sequencer>` element:
* To set the Control MIDI input channel: `document.querySelector('finger-sequencer').setAttribute('control-channel', 16);`
* To set the Drum MIDI output channel: `document.querySelector('finger-sequencer').setAttribute('drum-channel', 1);`
* To set the Synth MIDI output channel: `document.querySelector('finger-sequencer').setAttribute('drum-channel', 8);`
* To set the BPM: `document.querySelector('finger-sequencer').setAttribute('drum-channel', 1);`

Have fun playing!


> Copyright notice: All of the visual artwork was made by Teenage Engineering, I am just using it for fun here.
