import { drumPatterns, synthPatterns } from './patterns.js';
import drum, { HAND_LEFT, HAND_RIGHT, COWBELL, FACE } from './drum.js';
import {
	SYNTH_LEFT,
	SYNTH_BITS_LEFT,
	KEY_GUIDE_RIGHT,
	PLAY_HAND_LEFT,
	PLAY_HAND_RIGHT
} from './synth.js';
import MIDI, { whiteKeys, idxToMidi } from './midi.js';
import css from './finger.css.js';
import * as c from './constants.js';
import { asArrayLike, stringBool } from './utils.js';

export const [
	$playback,
	$drumPlayback,
	$synthPlayback,
	$hold,
	$drumPlayhead,
	$synthPlayhead,
	$timer,
	$drumPattern,
	$synthPattern,
	$displayPattern,
	$bpm,
	$stepDuration,
	$midi,
	$activeDrumNotes,
	$activeSynthNotes,
	$controlChannel,
	$drumChannel,
	$synthChannel
] = [
	Symbol('playback'),
	Symbol('drumPlayback'),
	Symbol('synthPlayback'),
	Symbol('hold'),
	Symbol('drumPlayhead'),
	Symbol('synthPlayhead'),
	Symbol('timer'),
	Symbol('drumPattern'),
	Symbol('synthPattern'),
	Symbol('displayPattern'),
	Symbol('bpm'),
	Symbol('stepDuration'),
	Symbol('midi'),
	Symbol('activeDrumNotes'),
	Symbol('activeSynthNotes'),
	Symbol('controlChannel'),
	Symbol('drumChannel'),
	Symbol('synthChannel')
];

class Finger extends HTMLElement {
	static get observedAttributes() {
		return [
			'playback',
			'drum-pattern',
			'synth-pattern',
			'control-channel',
			'drum-channel',
			'synth-channel',
			'bpm'
		];
	}
	constructor() {
		super();

		this[$playback] = false;
		this[$drumPlayback] = false;
		this[$synthPlayback] = false;
		this[$bpm] = parseFloat(40);
		this[$activeDrumNotes] = null;
		this[$activeSynthNotes] = null;
		this[$controlChannel] = 16;
		this[$drumChannel] = 1;
		this[$synthChannel] = 2;
		this[$displayPattern] = 'drum';

		this._initMIDI();

		this.shadow = this.attachShadow({ mode: 'open' });

		this.shadow.innerHTML = `
			<style>
				${css}
			</style>
		`;
		this.shadow.appendChild(
			document.getElementById('finger-svg').content.cloneNode(true)
		);
	}

	connectedCallback() {
		this._resetUI();

		this._resetDrums();
		this._idleDrums();

		this._resetSynths();
		this._idleSynths();

		this.addEventListener('click', () => {
			this.playback = !this.playback;
			this.hold = this.playback;
		});

		this.shadow.querySelector('#octhigh').addEventListener('click', () => {
			this._toggle('#octhigh', c.CLASS_HIDDEN, true);
			this._toggle('#octlow', c.CLASS_HIDDEN, false);
		});
		this.shadow.querySelector('#octlow').addEventListener('click', () => {
			this._toggle('#octhigh', c.CLASS_HIDDEN, false);
			this._toggle('#octlow', c.CLASS_HIDDEN, true);
		});

		for (let k = 0; k < 7; k++) {
			this.shadow.querySelector(`#p${k}`).addEventListener('click', evt => {
				evt.stopPropagation();
				if (
					this.shadow
						.querySelector('#octhigh')
						.classList.contains(c.CLASS_HIDDEN)
				) {
					this.drumPattern = k;
					this[$drumPlayback] = true;
				} else {
					this.synthPattern = k;
					this[$synthPlayback] = true;
				}
			});
		}
	}

	attributeChangedCallback(name, oldVal, newVal) {
		name = name.replace(/-([a-z])/g, function(g) {
			return g[1].toUpperCase();
		});
		this[name] = newVal;
	}

	set playback(playback) {
		playback = stringBool(playback);
		if (this[$playback] !== playback) {
			if (playback) {
				this[$drumPlayhead] = 0;
				this[$synthPlayhead] = 0;
				this[$timer] = null;
				requestAnimationFrame(this._playBeat.bind(this));
			}
			this[$playback] = playback;
			this.setAttribute('playback', playback);
		}
	}
	get playback() {
		return this[$playback];
	}

	set hold(hold) {
		hold = stringBool(hold);
		if (this[$hold] !== hold) {
			this._toggle('#hold', c.CLASS_FADED, !hold);
			this[$hold] = hold;
			this.setAttribute('hold', hold);
			if (!hold) {
				this.playback = false;
			}
		}
	}
	get hold() {
		return this[$hold];
	}

	set drumPattern(drumPattern) {
		if (this[$drumPattern] !== parseInt(drumPattern, 10)) {
			this[$drumPattern] = parseInt(drumPattern, 10);
			this.setAttribute('drum-pattern', drumPattern);
			this[$displayPattern] = 'drum';
			this._resetPatternUI();
		}
	}
	get drumPattern() {
		return this[$drumPattern];
	}

	set synthPattern(synthPattern) {
		if (this[$synthPattern] !== parseInt(synthPattern, 10)) {
			this[$synthPattern] = parseInt(synthPattern, 10);
			this.setAttribute('synth-pattern', synthPattern);
			this[$displayPattern] = 'synth';
			this._resetPatternUI();
		}
	}
	get synthPattern() {
		return this[$synthPattern];
	}

	set bpm(bpm) {
		if (Math.abs(parseFloat(this[$bpm]) - parseFloat(bpm)) > Number.EPSILON) {
			this[$bpm] = parseFloat(bpm);
			this[$stepDuration] = 60.0 / this[$bpm] / 4.0;
			this.setAttribute('bpm', parseFloat(bpm));
			this.style.setProperty('--beat-s', this[$stepDuration] + 's');
		}
	}
	get bpm() {
		return this[$bpm];
	}

	set controlChannel(controlChannel) {
		if (this[$controlChannel] !== parseInt(controlChannel, 10)) {
			this[$controlChannel] = parseInt(controlChannel, 10);
			this.setAttribute('control-channel', controlChannel);
		}
	}
	get controlChannel() {
		return this[$controlChannel];
	}

	set drumChannel(drumChannel) {
		if (this[$drumChannel] !== parseInt(drumChannel, 10)) {
			this[$drumChannel] = parseInt(drumChannel, 10);
			this.setAttribute('drum-channel', drumChannel);
		}
	}
	get drumChannel() {
		return this[$drumChannel];
	}

	set synthChannel(synthChannel) {
		if (this[$synthChannel] !== parseInt(synthChannel, 10)) {
			this[$synthChannel] = parseInt(synthChannel, 10);
			this.setAttribute('synth-channel', synthChannel);
		}
	}
	get synthChannel() {
		return this[$synthChannel];
	}

	_playBeat(timestamp) {
		let drumPattern = drumPatterns[this[$drumPattern]];
		let synthPattern = synthPatterns[this[$synthPattern]];

		if (!this[$timer]) {
			this[$timer] = timestamp;

			if (this[$drumPlayback]) {
				this._playDrumNotes(
					drumPattern[this[$drumPlayhead] % drumPattern.length]
				);
			}

			if (this[$synthPlayback]) {
				this._playSynthNotes(
					synthPattern[this[$synthPlayhead] % synthPattern.length]
				);
			}
		}

		// We need to add 2 frames to the progress,
		// because we schedule them in the current frame,
		// to be played back in the next frame
		const twoframes = (1000 / 60) * 2;
		const progress = timestamp - this[$timer] + twoframes;
		if (progress >= this[$stepDuration] * 1000.0) {
			this[$timer] = null;

			this[$drumPlayhead] = ++this[$drumPlayhead] % drumPattern.length;
			this[$synthPlayhead] = ++this[$synthPlayhead] % synthPattern.length;
		}
		if (this[$playback]) {
			requestAnimationFrame(this._playBeat.bind(this));
		} else {
			this._resetDrums();
			this._idleDrums();

			this._resetSynths();
			this._idleSynths();
		}
	}
	_playSynthNotes(notes) {
		this._resetPatternUI();
		this._resetSynths();

		const notesArr = asArrayLike(notes);

		const midi = this[$midi];

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

		if (notes !== null) {
			midi.send(this[$synthChannel], 'noteon', idxToMidi(notesArr[0]), 127);
			if (notesArr[1]) {
				midi.send(this[$synthChannel], 'noteon', idxToMidi(notesArr[1]), 127);
			}
		}

		if (notes === null) {
			this[$activeSynthNotes] = null;
			return this._idleSynths();
		}

		this[$activeSynthNotes] = [idxToMidi(notesArr[0])];
		if (notesArr[1]) {
			this[$activeSynthNotes].push(idxToMidi(notesArr[1]));
		}
	}
	_playDrumNotes(notes) {
		this._resetPatternUI();
		this._resetDrums();

		const notesArr = asArrayLike(notes);

		const midi = this[$midi];

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

		if (notes !== null) {
			midi.send(this[$drumChannel], 'noteon', idxToMidi(notesArr[0]), 127);
			if (notesArr[1]) {
				midi.send(this[$drumChannel], 'noteon', idxToMidi(notesArr[1]), 127);
			}
		}

		if (notes === null) {
			this[$activeDrumNotes] = null;
			return this._idleDrums();
		}

		this[$activeDrumNotes] = [idxToMidi(notesArr[0])];
		if (notesArr[1]) {
			this[$activeDrumNotes].push(idxToMidi(notesArr[1]));
		}

		const note0 = drum[notesArr[0] % drum.length];
		const note1 = drum[notesArr[1] % drum.length] || note0;

		this._show(FACE(note0.face));

		const layer0 = note0.layer;
		this._show(layer0);
		this._toggle(layer0, c.CLASS_HIT, true);

		const hideLeftHand = !(
			note0.hands.includes(c.SIDE_LEFT) && note1.hands.includes(c.SIDE_LEFT)
		);
		this._toggle(HAND_LEFT, c.CLASS_HIDDEN, hideLeftHand);

		const hideRightHand = !(
			note0.hands.includes(c.SIDE_RIGHT) && note1.hands.includes(c.SIDE_RIGHT)
		);
		this._toggle(HAND_RIGHT, c.CLASS_HIDDEN, hideRightHand);

		const hideCowbell = note0.cowbell === false || note1.cowbell === false;
		this._toggle(COWBELL, c.CLASS_HIDDEN, hideCowbell);

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
		this.hold = false;
	}

	_resetKeysUI() {
		for (let key = 0; key < 7; key++) {
			this._toggle(`#p${key}`, c.CLASS_ACTIVE, false);
		}
	}

	_resetPatternUI() {
		let pattern;
		let step = 0;
		if (this[$displayPattern] === 'drum') {
			pattern = drumPatterns[this[$drumPattern]];
			step = this[$drumPlayhead] || 0;
		} else {
			pattern = synthPatterns[this[$synthPattern]];
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
		this._toggle(`#p${this.drumPattern % 7}`, c.CLASS_ACTIVE, true);

		this._hide(['#octhigh', '#octlow']);
		if (this.drumPattern >= 7) {
			this._show('#octhigh');
		} else {
			this._show('#octlow');
		}
	}

	_resetDrums() {
		this._show('#drum');

		this._show('#druma');
		this._hide('#drumb');

		this._hide([HAND_LEFT, HAND_RIGHT, FACE(0), FACE(1)]);

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

	_resetSynths() {
		this._show('#synth');

		this._hide(
			['#syntha', '#hald', '#hard', '#haru', '#halu', KEY_GUIDE_RIGHT].concat(
				SYNTH_LEFT
			)
		);
		this.shadow.querySelectorAll(SYNTH_BITS_LEFT).forEach(bit => {
			bit.classList.add(c.CLASS_HIDDEN);
		});

		for (let k = 0; k < 12; k++) {
			this._hide(`#ak${k}`);
		}

		this._show('#synthb');
	}

	_idleDrums() {
		this._show([HAND_LEFT, HAND_RIGHT, FACE(0), COWBELL]);
	}

	_idleSynths() {
		this._hide([PLAY_HAND_LEFT, PLAY_HAND_RIGHT]);
	}

	_initMIDI() {
		let drumPatterns = [];
		let synthPatterns = [];

		this[$midi] = new MIDI();
		this[$midi].noteon = (channel, note) => {
			if (channel !== this[$controlChannel]) {
				return;
			}

			const patternIdx = whiteKeys[note];
			if (patternIdx === undefined) {
				return;
			}

			if (patternIdx < 7) {
				if (!this[$drumPlayback]) {
					this[$drumPlayhead] = 0;
				}
				this[$drumPlayback] = true;
				this.drumPattern = patternIdx;
				drumPatterns.push(this.drumPattern);
			} else {
				if (!this[$synthPlayback]) {
					this[$synthPlayhead] = 0;
				}
				this[$synthPlayback] = true;
				this.synthPattern = patternIdx;
				synthPatterns.push(this.synthPattern);
			}

			this.playback = true;
		};
		this[$midi].noteoff = (channel, note) => {
			if (channel !== this[$controlChannel]) {
				return;
			}

			const patternIdx = whiteKeys[note];
			if (patternIdx === undefined) {
				return;
			}
			this.playback = true;
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
				const idx = drumPatterns.lastIndexOf(patternIdx);
				if (idx !== -1) {
					drumPatterns.splice(idx, 1);
				}

				if (drumPatterns.length === 0) {
					if (synthPatterns.length === 0) {
						this.playback = false;
					}
					this[$drumPlayback] = false;
				} else {
					this.drumPattern = drumPatterns[drumPatterns.length - 1];
				}
			} else {
				const idx = synthPatterns.lastIndexOf(patternIdx);
				if (idx !== -1) {
					synthPatterns.splice(idx, 1);
				}

				if (synthPatterns.length === 0) {
					if (drumPatterns.length === 0) {
						this.playback = false;
					}
					this[$synthPlayback] = false;
				} else {
					this.synthPattern = synthPatterns[synthPatterns.length - 1];
				}
			}
		};
	}

	_hide(selector) {
		asArrayLike(selector).forEach(s => {
			this._toggle(s, c.CLASS_HIDDEN, true);
			this._toggle(s, c.CLASS_HIT, false);
		});
	}
	_show(selector) {
		asArrayLike(selector).forEach(s => this._toggle(s, c.CLASS_HIDDEN, false));
	}
	_toggle(selector, className, force) {
		this.shadow.querySelector(selector).classList.toggle(className, force);
	}
}

customElements.define('finger-sequencer', Finger);
