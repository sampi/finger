import { drumPatterns, synthPatterns } from './patterns.js';
import drum, {
	DRUM_HAND_LEFT,
	DRUM_HAND_RIGHT,
	COWBELL,
	FACE
} from './drum.js';
import {
	SYNTH_LEFT,
	SYNTH_BITS_LEFT,
	KEY_GUIDE,
	SYNTH_IDLE_HAND_LEFT,
	SYNTH_IDLE_HAND_RIGHT,
	SYNTH_PLAY_HAND_LEFT,
	SYNTH_PLAY_HAND_RIGHT
} from './synth.js';
import MIDI, { whiteKeys, idxToMidi } from './midi.js';
import css from './finger.css.js';
import * as c from './constants.js';
import { asArrayLike, stringBool } from './utils.js';

// Private symbols to not expose every variable to the outside
const [
	$playback,
	$hold,
	$timer,
	$displayInstrument,
	$bpm,
	$stepDuration,
	$midi,
	$controlChannel,
	$resizeTimeout
] = [
	Symbol('playback'),
	Symbol('hold'),
	Symbol('timer'),
	Symbol('displayInstrument'),
	Symbol('bpm'),
	Symbol('stepDuration'),
	Symbol('midi'),
	Symbol('controlChannel'),
	Symbol('resizeTimeout')
];

const [
	$drumPlayback,
	$drumPlayhead,
	$drumPattern,
	$activeDrumNotes,
	$drumChannel
] = [
	Symbol('drumPlayback'),
	Symbol('drumPlayhead'),
	Symbol('drumPattern'),
	Symbol('activeDrumNotes'),
	Symbol('drumChannel')
];

const [
	$synthPlayback,
	$synthPlayhead,
	$synthPattern,
	$activeSynthNotes,
	$synthChannel,
	$synthKeyX
] = [
	Symbol('synthPlayback'),
	Symbol('synthPlayhead'),
	Symbol('synthPattern'),
	Symbol('activeSynthNotes'),
	Symbol('synthChannel'),
	Symbol('synthKeyX')
];

class Finger extends HTMLElement {
	static get observedAttributes() {
		return ['control-channel', 'drum-channel', 'synth-channel', 'bpm'];
	}
	constructor() {
		super();

		this._printWelcomeText();

		// Set some defaults
		this[$playback] = false;
		this[$drumPlayback] = false;
		this[$synthPlayback] = false;
		this[$bpm] = parseFloat(40);
		this[$drumPattern] = 0;
		this[$synthPattern] = 0;
		this[$activeDrumNotes] = null;
		this[$activeSynthNotes] = null;
		this[$controlChannel] = 16;
		this[$drumChannel] = 1;
		this[$synthChannel] = 2;
		this[$displayInstrument] = 'drum';

		// Look for MIDI devices
		this._initMIDI();

		// Show the SVG
		this.shadow = this.attachShadow({ mode: 'open' });

		const style = document.createElement('style');
		style.appendChild(document.createTextNode(css));
		this.shadow.appendChild(style);

		this.shadow.appendChild(
			document.getElementById('finger-svg').content.cloneNode(true)
		);

		this.shadow.appendChild(document.createElement('finger-settings'));
	}

	// We're in the DOM
	connectedCallback() {
		// Reset the UI
		this._resetUI();

		this._resetDrums();
		this._idleDrums();

		this._resetSynths();
		this._idleSynths();

		this._updatePatternUI();

		// Resize the settings bar and the SVG together
		setTimeout(() => this._sendSettingSizing());
		window.addEventListener('resize', () => {
			clearTimeout(this[$resizeTimeout]);
			this[$resizeTimeout] = setTimeout(() => {
				this._sendSettingSizing();
			}, 100);
		});

		// Adjust the MIDI channels if they are sent from the settings
		const settings = this.shadow.querySelector('finger-settings');
		settings.addEventListener(
			'drum-channel',
			evt => (this.drumChannel = evt.detail)
		);
		settings.addEventListener(
			'control-channel',
			evt => (this.controlChannel = evt.detail)
		);
		settings.addEventListener(
			'synth-channel',
			evt => (this.synthChannel = evt.detail)
		);

		// Allow use of the UI without MIDI keyboards (too buggy right now)
		// this.addEventListener('click', () => {
		// 	this.playback = !this.playback;
		// 	this.hold = this.playback;
		// });

		// this.shadow.querySelector('#octhigh').addEventListener('click', evt => {
		// 	evt.stopPropagation();
		// 	this._toggle('#octhigh', c.CLASS_HIDDEN, true);
		// 	this._toggle('#octlow', c.CLASS_HIDDEN, false);
		// });
		// this.shadow.querySelector('#octlow').addEventListener('click', evt => {
		// 	evt.stopPropagation();
		// 	this._toggle('#octhigh', c.CLASS_HIDDEN, false);
		// 	this._toggle('#octlow', c.CLASS_HIDDEN, true);
		// });

		// for (let k = 0; k < 7; k++) {
		// 	this.shadow.querySelector(`#p${k}`).addEventListener('click', evt => {
		// 		evt.stopPropagation();
		// 		if (
		// 			this.shadow
		// 				.querySelector('#octhigh')
		// 				.classList.contains(c.CLASS_HIDDEN)
		// 		) {
		// 			this.drumPattern = k;
		// 			this[$drumPlayback] = true;
		// 		} else {
		// 			this.synthPattern = k;
		// 			this[$synthPlayback] = true;
		// 		}
		// 	});
		// }
	}

	attributeChangedCallback(name, oldVal, newVal) {
		// Replace `something-name` with `somethingName`
		name = name.replace(/-([a-z])/g, function(g) {
			return g[1].toUpperCase();
		});
		this[name] = newVal;
	}

	/**
	 * Start or stop playback
	 * @param  {boolean} playback
	 */
	set playback(playback) {
		playback = stringBool(playback);
		if (this[$playback] !== playback) {
			// Reset all playheads and start playback
			// (won't do anything unless there's a pattern started on drums or synth)
			if (playback) {
				this[$drumPlayhead] = 0;
				this[$synthPlayhead] = 0;
				this[$timer] = null;
				// Start the main loop
				requestAnimationFrame(this._playBeat.bind(this));
			} else {
				// Send noteoff to all held notes when stopping playback
				if (this[$activeDrumNotes] !== null) {
					this[$activeDrumNotes].forEach(n =>
						this[$midi].send(this[$drumChannel], 'noteoff', n, 127)
					);
				}
				if (this[$activeSynthNotes] !== null) {
					this[$activeSynthNotes].forEach(n =>
						this[$midi].send(this[$synthChannel], 'noteoff', n, 127)
					);
				}
			}
			this[$playback] = playback;
		}
	}
	get playback() {
		return this[$playback];
	}

	// set hold(hold) {
	// 	hold = stringBool(hold);
	// 	if (this[$hold] !== hold) {
	// 		this._toggle('#hold', c.CLASS_FADED, !hold);
	// 		this[$hold] = hold;
	// 		this.setAttribute('hold', hold);
	// 		if (!hold) {
	// 			this.playback = false;
	// 		}
	// 	}
	// }
	// get hold() {
	// 	return this[$hold];
	// }

	/**
	 * Set the current drum pattern
	 * @param  {int|string} drumPattern
	 */
	set drumPattern(drumPattern) {
		if (this[$drumPattern] !== parseInt(drumPattern, 10)) {
			this[$drumPattern] = parseInt(drumPattern, 10);
			// Make the drums show up in the middle pattern view
			this[$displayInstrument] = 'drum';
			this._updatePatternUI();
		}
	}
	get drumPattern() {
		return this[$drumPattern];
	}

	/**
	 * Set the current synth pattern
	 * @param  {int|string} synthPattern
	 */
	set synthPattern(synthPattern) {
		if (this[$synthPattern] !== parseInt(synthPattern, 10)) {
			this[$synthPattern] = parseInt(synthPattern, 10);
			// Make the synth show up in the middle pattern view
			this[$displayInstrument] = 'synth';
			this._updatePatternUI();
		}
	}
	get synthPattern() {
		return this[$synthPattern];
	}

	/**
	 * Set the BPM
	 * @param  {int|string} bpm
	 */
	set bpm(bpm) {
		if (Math.abs(parseFloat(this[$bpm]) - parseFloat(bpm)) > Number.EPSILON) {
			this[$bpm] = parseFloat(bpm);
			this[$stepDuration] = 60.0 / this[$bpm] / 4.0;
			this.setAttribute('bpm', parseFloat(bpm));
			this.shadow
				.querySelector('svg')
				.style.setProperty('--beat-s', this[$stepDuration] + 's');
			this.shadow
				.querySelector('finger-settings')
				.setAttribute('step-duration', this[$stepDuration]);
		}
	}
	get bpm() {
		return this[$bpm];
	}

	/**
	 * Set the channel of the control input
	 * @param  {int|string} controlChannel
	 */
	set controlChannel(controlChannel) {
		if (this[$controlChannel] !== parseInt(controlChannel, 10)) {
			this[$controlChannel] = parseInt(controlChannel, 10);
			this.setAttribute('control-channel', controlChannel);
		}
	}
	get controlChannel() {
		return this[$controlChannel];
	}

	/**
	 * Set the channel of the drum output
	 * @param  {int|string} drumChannel
	 */
	set drumChannel(drumChannel) {
		if (this[$drumChannel] !== parseInt(drumChannel, 10)) {
			this[$drumChannel] = parseInt(drumChannel, 10);
			this.setAttribute('drum-channel', drumChannel);
		}
	}
	get drumChannel() {
		return this[$drumChannel];
	}

	/**
	 * Set the channel of the synth output
	 * @param  {int|string} synthChannel
	 */
	set synthChannel(synthChannel) {
		if (this[$synthChannel] !== parseInt(synthChannel, 10)) {
			this[$synthChannel] = parseInt(synthChannel, 10);
			this.setAttribute('synth-channel', synthChannel);
		}
	}
	get synthChannel() {
		return this[$synthChannel];
	}

	/**
	 * The main loop to play the patterns
	 * @param  {DOMHighResTimeStamp} timestamp Passed by requestAnimationFrame()
	 */
	_playBeat(timestamp) {
		let drumPattern = drumPatterns[this[$drumPattern]];
		let synthPattern = synthPatterns[this[$synthPattern]];

		if (!this[$timer]) {
			this[$timer] = timestamp;

			// Time to play a note, because the timer has been reset
			if (this[$drumPlayback]) {
				this._playDrumNotes(
					drumPattern[this[$drumPlayhead] % drumPattern.length]
				);
			} else {
				this._resetDrums();
				this._idleDrums();
			}

			if (this[$synthPlayback]) {
				this._playSynthNotes(
					synthPattern[this[$synthPlayhead] % synthPattern.length]
				);
			} else {
				this._resetSynths();
				this._idleSynths();
			}
		}

		// We need to add 2 frames to the progress,
		// because we schedule them in the current frame,
		// to be played back in the next frame
		const twoframes = (1000 / 60) * 2;
		const progress = timestamp - this[$timer] + twoframes;
		if (progress >= this[$stepDuration] * 1000.0) {
			// Whenever it's time to play a note, we will reset the timer
			this[$timer] = null;

			this[$drumPlayhead] = ++this[$drumPlayhead] % drumPattern.length;
			this[$synthPlayhead] = ++this[$synthPlayhead] % synthPattern.length;
		}
		if (this[$playback]) {
			// Continue playback
			requestAnimationFrame(this._playBeat.bind(this));
		} else {
			// Reset the UI if we're not playing
			this._resetDrums();
			this._idleDrums();

			this._resetSynths();
			this._idleSynths();
		}
	}

	/**
	 * Read notes to play for the synth and show them in the UI
	 * @param  {int|Array} notes
	 */
	_playSynthNotes(notes) {
		// Reset the synth UI
		this._updatePatternUI();
		this._resetSynths();

		const notesArr = asArrayLike(notes);

		const midi = this[$midi];

		// Stop playing the previous notes
		if (this[$activeSynthNotes] !== null) {
			midi.send(
				this[$synthChannel],
				'noteoff',
				this[$activeSynthNotes][0],
				127
			);
			if (this[$activeSynthNotes][1]) {
				midi.send(
					this[$synthChannel],
					'noteoff',
					this[$activeSynthNotes][1],
					127
				);
			}
		}

		// Send new notes to MIDI out
		if (notes !== null) {
			this.shadow
				.querySelector('finger-settings')
				.dispatchEvent(new CustomEvent('noteon', { detail: 'synth' }));
			midi.send(this[$synthChannel], 'noteon', idxToMidi(notesArr[0]), 127);
			if (notesArr[1]) {
				midi.send(this[$synthChannel], 'noteon', idxToMidi(notesArr[1]), 127);
			}
		} else {
			// Stay idle if no notes should be played
			this[$activeSynthNotes] = null;
			return this._idleSynths();
		}

		// Store played notes, so we can stop them the next time anything is played
		this[$activeSynthNotes] = [idxToMidi(notesArr[0])];
		if (notesArr[1]) {
			this[$activeSynthNotes].push(idxToMidi(notesArr[1]));
		}

		if (notesArr.length === 1) {
			// Play single notes with the appropriate hand
			const relNote = idxToMidi(notesArr[0]) % 12;
			if (relNote < 6) {
				this._hide(SYNTH_IDLE_HAND_LEFT);
				this._hitSynthKey(SYNTH_PLAY_HAND_LEFT, relNote);
			} else {
				this._hide(SYNTH_IDLE_HAND_RIGHT);
				this._hitSynthKey(SYNTH_PLAY_HAND_RIGHT, relNote);
			}
		} else {
			// Play multiple notes with two hands
			this._hide([SYNTH_IDLE_HAND_LEFT, SYNTH_IDLE_HAND_RIGHT]);
			const relNotesArr = [
				idxToMidi(notesArr[0]) % 12,
				idxToMidi(notesArr[1]) % 12
			];
			this._hitSynthKey(SYNTH_PLAY_HAND_LEFT, Math.min(...relNotesArr));
			this._hitSynthKey(SYNTH_PLAY_HAND_RIGHT, Math.max(...relNotesArr));
		}
	}

	/**
	 * Animate hitting a key with a hand
	 * @param  {string} hand DOM selector
	 * @param  {int} relNote Relative note position
	 */
	_hitSynthKey(hand, relNote) {
		// Memoize the key positions to improve performance
		if (!this[$synthKeyX]) {
			this[$synthKeyX] = [];
		}
		if (!this[$synthKeyX][0]) {
			this[$synthKeyX][0] = this.shadow
				.querySelector('#bk0')
				.getAttribute('x1');
		}
		if (!this[$synthKeyX][relNote]) {
			this[$synthKeyX][relNote] = this.shadow
				.querySelector(`#bk${relNote}`)
				.getAttribute('x1');
		}

		this._show(hand);

		// Calculate the x-offset of the hand and set it in a CSS custom property
		// (it will be used in the CSS keyframe animation)
		const xDiff = this[$synthKeyX][relNote] - this[$synthKeyX][0];
		this.shadow
			.querySelector(hand)
			.style.setProperty('--translate-x', `${xDiff}px`);

		// Animate the hand and the key using CSS
		this._toggle([`#bk${relNote}`, hand], c.CLASS_HIT, true);

		this._toggle('#synthb', c.CLASS_FADED, false);
	}

	/**
	 * Read notes for the drums to play and show them in the UI
	 * @param  {int|Array} notes
	 */
	_playDrumNotes(notes) {
		// Reset the drums UI
		this._updatePatternUI();
		this._resetDrums();

		const notesArr = asArrayLike(notes);

		const midi = this[$midi];

		// Stop playing the previous notes
		if (this[$activeDrumNotes] !== null) {
			midi.send(this[$drumChannel], 'noteoff', this[$activeDrumNotes][0], 127);
			if (this[$activeDrumNotes][1]) {
				midi.send(
					this[$drumChannel],
					'noteoff',
					this[$activeDrumNotes][1],
					127
				);
			}
		}

		// Send new notes to MIDI out
		if (notes !== null) {
			this.shadow
				.querySelector('finger-settings')
				.dispatchEvent(new CustomEvent('noteon', { detail: 'drum' }));
			midi.send(this[$drumChannel], 'noteon', idxToMidi(notesArr[0]), 127);
			if (notesArr[1]) {
				midi.send(this[$drumChannel], 'noteon', idxToMidi(notesArr[1]), 127);
			}
		}

		if (notes === null) {
			// Stay idle if no notes should be played
			this[$activeDrumNotes] = null;
			return this._idleDrums();
		}

		// Store played notes, so we can stop them the next time anything is played
		this[$activeDrumNotes] = [idxToMidi(notesArr[0])];
		if (notesArr[1]) {
			this[$activeDrumNotes].push(idxToMidi(notesArr[1]));
		}

		// Show the appropriate state in the UI
		const note0 = drum[notesArr[0] % drum.length];
		const note1 = drum[notesArr[1] % drum.length] || note0;

		this._show(FACE(note0.face));

		const layer0 = note0.layer;
		this._show(layer0);
		this._toggle(layer0, c.CLASS_HIT, true);

		const hideLeftHand = !(
			note0.hands.includes(c.SIDE_LEFT) && note1.hands.includes(c.SIDE_LEFT)
		);
		this._toggle(DRUM_HAND_LEFT, c.CLASS_HIDDEN, hideLeftHand);

		const hideRightHand = !(
			note0.hands.includes(c.SIDE_RIGHT) && note1.hands.includes(c.SIDE_RIGHT)
		);
		this._toggle(DRUM_HAND_RIGHT, c.CLASS_HIDDEN, hideRightHand);

		const hideCowbell = note0.cowbell === false || note1.cowbell === false;
		this._toggle(COWBELL, c.CLASS_HIDDEN, hideCowbell);

		// When two notes are played, only show both
		// if the gorilla can pull it off
		if (
			note0.hands === 'lr' ||
			note1.hands === 'lr' ||
			(note0.cowbell === false || note1.cowbell === false)
		) {
			const layer1 = note1.layer;
			this._show(layer1);
			this._toggle(layer1, c.CLASS_HIT, true);
		}
	}

	/**
	 * Reset shared parts of the UI
	 */
	_resetUI() {
		this._hide([
			'#replace',
			'#fillin_1_',
			'#chain',
			'#octhigh',
			'#rubber',
			'#octdown',
			'#octup'
		]);
		this._toggle('#hold', c.CLASS_FADED, true);
	}

	/**
	 * Reset the piano keys UI
	 */
	_resetKeysUI() {
		for (let key = 0; key < 7; key++) {
			this._toggle(`#p${key}`, c.CLASS_ACTIVE, false);
		}
	}

	/**
	 * Update the pattern view UI, show currently displayed pattern
	 */
	_updatePatternUI() {
		let pattern;
		let patternIdx;
		let step = 0;
		if (this[$displayInstrument] === 'drum') {
			patternIdx = this[$drumPattern];
			pattern = drumPatterns[patternIdx];
			step = this[$drumPlayhead] || 0;
		} else {
			patternIdx = this[$synthPattern];
			pattern = synthPatterns[patternIdx];
			step = this[$synthPlayhead] || 0;
		}
		if (this.playback) {
			step++;
		}

		step = parseInt(step, 10) % pattern.length;

		for (let step = 0; step < 32; step++) {
			// hide all outlines
			this._hide(`#g${step}${step >= 22 && step <= 29 ? '_1_' : ''}`);

			// hide steps that aren't active
			if (step >= pattern.length) {
				this._hide(`#x${step}`);
				this._hide(`#g${step}bg`);
				continue;
			} else {
				this._show(`#g${step}bg`);
			}

			// hide empty active steps
			if (pattern[step] === null) {
				this._hide(`#x${step}`);
			} else {
				this._show(`#x${step}`);
			}
		}

		this._show(`#g${step}${step >= 22 && step <= 29 ? '_1_' : ''}`);

		this._resetKeysUI();
		this._toggle(`#p${patternIdx % 7}`, c.CLASS_ACTIVE, true);

		this._hide(['#octhigh', '#octlow']);
		if (patternIdx >= 7) {
			this._show('#octhigh');
		} else {
			this._show('#octlow');
		}
	}

	/**
	 * Hide unused parts of the drum UI
	 * @return {[type]} [description]
	 */
	_resetDrums() {
		this._show('#drum');

		this._show('#druma');
		this._hide('#drumb');

		this._hide([DRUM_HAND_LEFT, DRUM_HAND_RIGHT, FACE(0), FACE(1)]);

		this._toggle(COWBELL, c.CLASS_FADED, !this.playback);

		for (let i = 0; i <= 11; i++) {
			if (i > 1 && i <= 5) {
				this._hide(`#face0${i}`);
			}
			if (i === 10) {
				// Hide cowbell
				this._hide('#ad10_1_');
				continue;
			}

			this._hide(`#ad${i}`);
		}
	}

	/**
	 * Set the drum gorilla to stay idle
	 */
	_idleDrums() {
		this._show([DRUM_HAND_LEFT, DRUM_HAND_RIGHT, FACE(0), COWBELL]);
		this._toggle(COWBELL, c.CLASS_FADED, !this[$drumPlayback]);
	}

	_resetSynths() {
		this._show('#synth');

		this._hide(
			[
				'#syntha',
				'#hald',
				'#hard',
				'#haru',
				'#halu',
				KEY_GUIDE,
				SYNTH_PLAY_HAND_LEFT,
				SYNTH_PLAY_HAND_RIGHT
			].concat(SYNTH_LEFT)
		);
		this.shadow.querySelectorAll(SYNTH_BITS_LEFT).forEach(bit => {
			bit.classList.add(c.CLASS_HIDDEN);
		});

		for (let k = 0; k < 12; k++) {
			this._hide(`#ak${k}`);
		}

		this._show('#synthb');
		this._toggle('#synthb', c.CLASS_FADED, true);
		this._show([SYNTH_IDLE_HAND_LEFT, SYNTH_IDLE_HAND_RIGHT]);

		for (let k = 0; k < 12; k++) {
			this._toggle(`#bk${k}`, c.CLASS_HIT, false);
		}
	}

	/**
	 * Set the synth dude to idle
	 */
	_idleSynths() {
		this._hide([SYNTH_PLAY_HAND_LEFT, SYNTH_PLAY_HAND_RIGHT]);
		this._show([SYNTH_IDLE_HAND_LEFT, SYNTH_IDLE_HAND_RIGHT]);
		this._toggle('#synthb', c.CLASS_FADED, !this[$synthPlayback]);
	}

	/**
	 * Connect to all possible MIDI devices and set up message listeners
	 */
	_initMIDI() {
		let drumPatterns = [];
		let synthPatterns = [];

		this[$midi] = new MIDI();
		/**
		 * Handle incoming MIDI note presses
		 * @param  {int} channel
		 * @param  {int} note
		 */
		this[$midi].noteon = (channel, note) => {
			// Only handle input on the control channel
			if (channel !== this[$controlChannel]) {
				return;
			}

			// Only handle input of the middle white keys F-E (OP-1/Z style)
			const patternIdx = whiteKeys[note];
			if (patternIdx === undefined) {
				return;
			}

			this.shadow
				.querySelector('finger-settings')
				.dispatchEvent(new CustomEvent('noteon', { detail: 'control' }));

			if (patternIdx < 7) {
				// Left side is for drums
				// Start playback and show pattern
				if (!this[$drumPlayback]) {
					this[$drumPlayhead] = 0;
				}
				this[$displayInstrument] = 'drum';
				this[$drumPlayback] = true;
				this.drumPattern = patternIdx;
				drumPatterns.push(this.drumPattern);
			} else {
				// Right side is for synths
				// Start playback and show pattern
				if (!this[$synthPlayback]) {
					this[$synthPlayhead] = 0;
				}
				this[$displayInstrument] = 'synth';
				this[$synthPlayback] = true;
				this.synthPattern = patternIdx;
				synthPatterns.push(this.synthPattern);
			}

			// Whatever input we get, playback should be started
			this.playback = true;
		};
		/**
		 * Handle incoming MIDI note releases
		 * @param  {int} channel
		 * @param  {int} note
		 */
		this[$midi].noteoff = (channel, note) => {
			// Only handle input on the control channel
			if (channel !== this[$controlChannel]) {
				return;
			}

			// Only handle input of the middle white keys F-E (OP-1/Z style)
			const patternIdx = whiteKeys[note];
			if (patternIdx === undefined) {
				return;
			}

			// When the HOLD feature is enabled, playback shouldn't stop when the keys are released (super buggy right now)
			// if (this.hold) {
			// 	if (patternIdx < 7) {
			// 		drumPatterns = [patternIdx];
			// 		this.drumPattern = drumPatterns[0];
			// 	} else {
			// 		synthPatterns = [patternIdx];
			// 		this.synthPattern = synthPatterns[0];
			// 	}
			// 	return;
			// }

			if (patternIdx < 7) {
				// Left side is for drums
				// Either jump back to another pattern still being held down,
				// or stop playback of drums
				const idx = drumPatterns.lastIndexOf(patternIdx);
				if (idx !== -1) {
					drumPatterns.splice(idx, 1);
				}

				if (drumPatterns.length === 0) {
					// Send noteoff to all held notes when stopping playback
					if (this[$activeDrumNotes] !== null) {
						this[$activeDrumNotes].forEach(n =>
							this[$midi].send(this[$drumChannel], 'noteoff', n, 127)
						);
					}
					if (synthPatterns.length === 0) {
						// If there would be no drums and synths played, we stop playback
						this.playback = false;
					} else {
						// If there are still synths playing, we show that pattern
						this[$displayInstrument] = 'synth';
					}
					this[$drumPlayback] = false;
				} else {
					// There is another drum key held down, so we'll start playing that
					this.drumPattern = drumPatterns[drumPatterns.length - 1];
				}
			} else {
				const idx = synthPatterns.lastIndexOf(patternIdx);
				if (idx !== -1) {
					synthPatterns.splice(idx, 1);
				}

				if (synthPatterns.length === 0) {
					if (this[$activeSynthNotes] !== null) {
						// Send noteoff to all held notes when stopping playback
						this[$activeSynthNotes].forEach(n =>
							this[$midi].send(this[$synthChannel], 'noteoff', n, 127)
						);
					}
					if (drumPatterns.length === 0) {
						// If there would be no drums and synths played, we stop playback
						this.playback = false;
					} else {
						// If there are still drums playing, we show that pattern
						this[$displayInstrument] = 'drum';
					}
					this[$synthPlayback] = false;
				} else {
					// There is another synth key held down, so we'll start playing that
					this.synthPattern = synthPatterns[synthPatterns.length - 1];
				}
			}
		};
	}

	/**
	 * Hide element
	 * @param  {string|Array} selector
	 */
	_hide(selector) {
		this._toggle(selector, c.CLASS_HIDDEN, true);
		this._toggle(selector, c.CLASS_HIT, false);
	}
	/**
	 * Show element
	 * @param  {string|Array} selector
	 */
	_show(selector) {
		this._toggle(selector, c.CLASS_HIDDEN, false);
	}
	/**
	 * classList.toggle shorthand
	 * @param  {string|Array} selector
	 */
	_toggle(selector, className, force) {
		asArrayLike(selector).forEach(s => {
			this.shadow.querySelector(s).classList.toggle(className, force);
		});
	}

	_sendSettingSizing() {
		const holdRect = this.shadow.querySelector('#hold').getBoundingClientRect();
		const drumRect = this.shadow.querySelector('#drum').getBoundingClientRect();

		const settingsStyle = this.shadow.querySelector('finger-settings').style;
		settingsStyle.setProperty('--settings-height', `${holdRect.height}px`);
		settingsStyle.setProperty('--settings-width', `${drumRect.width}px`);

		this.shadow
			.querySelector('svg')
			.style.setProperty('--settings-height', `${holdRect.height}px`);
	}

	_printWelcomeText() {
		console.log(
			'%cWelcome to the OP-1 Finger Sequencer simulator',
			'font-size: 18px;'
		);
		console.log('');
		console.log(
			'%cYou can control the sequencer by connecting one or more MIDI devices to your computer.',
			''
		);
		console.log(
			'Input will be taken from every connected MIDI device on the control channel %c(default: MIDI channel 16),',
			'color: gray'
		);
		console.log(
			'Output will be sent to two separate channels for drums %c(default: MIDI channel 1)%c and synths %c(default: MIDI channel 8)%c.',
			'color: gray',
			'color: black',
			'color: gray',
			'color: black'
		);
		console.log('');
		console.log(
			'Best controlled from an OP-Z or OP-1, the left half of the musical keyboard will correspond to drum patterns, the right half will control the synth patterns.'
		);
		console.log('');
		console.log(
			'Changing settings is possible by changing the attributes of the %c<finger-sequencer>%c element:',
			'color: slate',
			'color: black'
		);
		console.log(
			"* To set the Control MIDI input channel: %cdocument.querySelector('finger-sequencer').setAttribute('control-channel', 16);",
			'color: gray'
		);
		console.log(
			"* To set the Drum MIDI output channel: %cdocument.querySelector('finger-sequencer').setAttribute('drum-channel', 1);",
			'color: gray'
		);
		console.log(
			"* To set the Synth MIDI output channel: %cdocument.querySelector('finger-sequencer').setAttribute('drum-channel', 8);",
			'color: gray'
		);
		console.log(
			"* To set the BPM: %cdocument.querySelector('finger-sequencer').setAttribute('drum-channel', 1);",
			'color: gray'
		);
		console.log('');
		console.log('Have fun playing!');
		console.log('');
		console.log(
			'%cMade by: %cDaniel Spitzer <github.com/sampi>',
			'color: grey',
			'color: slate'
		);
		console.log('');
		console.log(
			'%cCopyright notice: All of the visual artwork was made by Teenage Engineering, I am just using it for fun here.',
			'color: gray; font-size: 8px'
		);
		console.log('');
	}
}

customElements.define('finger-sequencer', Finger);
