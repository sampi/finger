import { drumPatterns } from './patterns.js';
import drum, { HAND_LEFT, HAND_RIGHT, COWBELL, FACE } from './drum.js';
import { whiteKeys, n, m } from './notes.js';
import css from './finger.css.js';
import * as c from './constants.js';
import { asArray, stringBool } from './utils.js';

export const [
	$playback,
	$drumPlayhead,
	$drumTimer,
	$drumPattern,
	$bpm,
	$stepDuration,
	$midi,
	$activeNotes
] = [
	Symbol('playback'),
	Symbol('drumPlayhead'),
	Symbol('drumTimer'),
	Symbol('drumPattern'),
	Symbol('bpm'),
	Symbol('stepDuration'),
	Symbol('midi'),
	Symbol('activeNotes')
];

class Finger extends HTMLElement {
	static get observedAttributes() {
		return ['playback', 'drum-pattern', 'bpm'];
	}
	constructor() {
		super();

		this[$playback] = false;
		this[$bpm] = parseFloat(60);
		this[$activeNotes] = null;

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

		this._hide('#synth');

		this._resetDrums();
		this._idleDrums();

		this.addEventListener('click', () => (this.playback = !this.playback));

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
				} else {
					console.log('synthpattern', k);
				}
			});
		}
	}

	attributeChangedCallback(name, oldVal, newVal) {
		if (name === 'drum-pattern') {
			name = 'drumPattern';
		}
		this[name] = newVal;
	}

	set playback(playback) {
		playback = stringBool(playback);
		if (this[$playback] !== playback) {
			if (playback) {
				this[$drumPlayhead] = 0;
				this[$drumTimer] = null;
				requestAnimationFrame(this._playBeat.bind(this));
			}
			this[$playback] = playback;
			this.setAttribute('playback', playback);
		}
	}
	get playback() {
		return this[$playback];
	}

	set drumPattern(drumPattern) {
		if (this[$drumPattern] !== parseInt(drumPattern, 10)) {
			this[$drumPattern] = parseInt(drumPattern, 10);
			this.setAttribute('drumPattern', drumPattern);
			const currentdrumPattern = drumPatterns[this[$drumPattern]];
			this._resetDrumPatternUI();
			for (let step = 0; step < 32; step++) {
				// hide steps that aren't active
				if (step >= currentdrumPattern.length) {
					this._hide(`#x${step}`);
					this._hide(`#g${step}bg`);
					continue;
				} else {
					this._show(`#g${step}bg`);
				}

				// hide empty active steps
				if (currentdrumPattern[step] === null) {
					this._hide(`#x${step}`);
				} else {
					this._show(`#x${step}`);
				}
			}
		}
	}
	get drumPattern() {
		return this[$drumPattern];
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

	_playBeat(timestamp) {
		if (!this[$drumTimer]) {
			this[$drumTimer] = timestamp;
			const drumPattern = drumPatterns[this[$drumPattern]];
			this._playNotes(
				drumPattern[this[$drumPlayhead] % drumPattern.length],
				c.SIDE_A
			);
		}

		// We need to add 2 frames to the progress,
		// because we schedule them in the current frame,
		// to be played back in the next frame
		const twoframes = (1000 / 60) * 2;
		const progress = timestamp - this[$drumTimer] + twoframes;
		if (progress >= this[$stepDuration] * 1000.0) {
			this[$drumTimer] = null;

			this[$drumPlayhead] =
				++this[$drumPlayhead] % drumPatterns[this[$drumPattern]].length;
		}
		if (this[$playback]) {
			requestAnimationFrame(this._playBeat.bind(this));
		} else {
			this._resetDrums(c.SIDE_A);
			this._idleDrums(c.SIDE_A);
		}
	}
	_playNotes(notes, side) {
		this._resetDrumPatternUI();

		this._resetDrums(side);

		const notesArr = asArray(notes);

		if (this[$midi]) {
			for (var output of this[$midi].outputs.values()) {
				if (this[$activeNotes] !== null) {
					output.send([128, this[$activeNotes][0], 127]);
					if (this[$activeNotes][1]) {
						output.send([128, this[$activeNotes][1], 127]);
					}
				}

				if (notes !== null) {
					output.send([144, m(notesArr[0]), 127]);
					if (notesArr[1]) {
						output.send([144, m(notesArr[1]), 127]);
					}
				}
			}
		}

		if (notes === null) {
			this[$activeNotes] = null;
			return this._idleDrums(side);
		}

		this[$activeNotes] = [m(notesArr[0])];
		if (notesArr[1]) {
			this[$activeNotes].push(m(notesArr[1]));
		}

		const note0 = drum[notesArr[0] % drum.length];
		const note1 = drum[notesArr[1] % drum.length] || note0;

		this._show(FACE(note0.face)(side));

		const layer0 = note0.layer.replace('$', side);
		this._show(layer0);
		this._hit(layer0);

		const hideLeftHand = !(
			note0.hands.includes(c.SIDE_LEFT) && note1.hands.includes(c.SIDE_LEFT)
		);
		this._toggle(HAND_LEFT(side), c.CLASS_HIDDEN, hideLeftHand);

		const hideRightHand = !(
			note0.hands.includes(c.SIDE_RIGHT) && note1.hands.includes(c.SIDE_RIGHT)
		);
		this._toggle(HAND_RIGHT(side), c.CLASS_HIDDEN, hideRightHand);

		const hideCowbell = note0.cowbell === false || note1.cowbell === false;
		this._toggle(COWBELL(side), c.CLASS_HIDDEN, hideCowbell);

		if (
			note0.hands === 'lr' ||
			note1.hands === 'lr' ||
			(note0.cowbell === false || note1.cowbell === false)
		) {
			const layer1 = note1.layer.replace('$', side);
			this._show(layer1);
			this._hit(layer1);
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
		this._fade('#hold');
	}

	_resetKeysUI() {
		for (let key = 0; key < 7; key++) {
			this._toggle(`#p${key}`, c.CLASS_ACTIVE, false);
		}
	}

	_resetDrumPatternUI() {
		for (let step = 0; step < 32; step++) {
			// hide all outlines
			this._hide(`#g${step}${step >= 22 && step <= 29 ? '_1_' : ''}`);
		}
		let step =
			(this.playback ? (this[$drumPlayhead] || 0) + 1 : 0) %
			drumPatterns[this[$drumPattern]].length;
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

	_resetDrums(side) {
		const resetA = !side || side === c.SIDE_A;
		const resetB = !side || side === c.SIDE_B;

		this._show('#drum');

		if (resetA) {
			this._show('#druma');
			this._hide([
				HAND_LEFT(c.SIDE_A),
				HAND_RIGHT(c.SIDE_A),
				FACE(0)(c.SIDE_A),
				FACE(1)(c.SIDE_A)
			]);

			this._toggle(COWBELL(c.SIDE_A), c.CLASS_FADED, !this.playback);
		}

		if (resetB) {
			this._show('#drumb');
			this._hide([
				HAND_LEFT(c.SIDE_B),
				HAND_RIGHT(c.SIDE_B),
				FACE(0)(c.SIDE_B),
				FACE(1)(c.SIDE_B)
			]);

			this._toggle(COWBELL(c.SIDE_B), c.CLASS_FADED, !this.playback);
		}

		for (let i = 0; i <= 11; i++) {
			if (i > 1 && i <= 5) {
				resetA && this._hide(`#face0${i}`);
				resetB && this._hide(`#face1${i}`);
			}
			if (i === 10) {
				// Hide cowbell
				resetA && this._hide('#ad10_1_');
				resetB && this._hide('#bd10_1_');
				continue;
			}

			resetA && this._hide(`#ad${i}`);
			resetB && this._hide(`#bd${i}`);
		}
	}

	_idleDrums(side) {
		const idleA = !side || side === c.SIDE_A;
		const idleB = !side || side === c.SIDE_B;

		if (idleA) {
			this._show([
				HAND_LEFT(c.SIDE_A),
				HAND_RIGHT(c.SIDE_A),
				FACE(0)(c.SIDE_A),
				COWBELL(c.SIDE_A)
			]);
		}

		if (idleB) {
			this._show([
				HAND_LEFT(c.SIDE_B),
				HAND_RIGHT(c.SIDE_B),
				FACE(0)(c.SIDE_B),
				COWBELL(c.SIDE_B)
			]);
		}
	}

	_initMIDI() {
		if (navigator.requestMIDIAccess) {
			const onMIDISuccess = midiAccess => {
				this[$midi] = midiAccess;

				for (var input of midiAccess.inputs.values()) {
					console.log(`MIDI IN: ${input.manufacturer} - ${input.name}`);
					input.onmidimessage = getMIDIMessage;
				}

				for (var output of midiAccess.outputs.values()) {
					console.log(`MIDI OUT: ${input.manufacturer} - ${input.name}`);
				}
			};

			const drumPatterns = [];

			const getMIDIMessage = message => {
				var command = message.data[0];
				var note = message.data[1];
				var velocity = message.data.length > 2 ? message.data[2] : 0; // a velocity value might not be included with a noteOff command

				if (
					command === 144 &&
					velocity !== 0 &&
					whiteKeys[note] !== undefined
				) {
					this.drumPattern = whiteKeys[note];
					this.playback = true;
					drumPatterns.push(this.drumPattern);
				} else if ((command === 144 && !velocity) || command === 128) {
					const idx = drumPatterns.lastIndexOf(whiteKeys[note]);
					if (idx !== -1) {
						drumPatterns.splice(idx, 1);
					}

					if (drumPatterns.length === 0) {
						this.playback = false;
					} else {
						this.drumPattern = drumPatterns[drumPatterns.length - 1];
					}
				}
			};

			function onMIDIFailure() {
				console.log('Could not access your MIDI devices.');
			}

			navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
		} else {
			console.log('Web MIDI API is required.');
		}
	}

	_hit(selector) {
		asArray(selector).forEach(s => this._toggle(s, c.CLASS_HIT, true));
	}
	_hide(selector) {
		asArray(selector).forEach(s => {
			this._toggle(s, c.CLASS_HIDDEN, true);
			this._toggle(s, c.CLASS_HIT, false);
		});
	}
	_show(selector) {
		asArray(selector).forEach(s => this._toggle(s, c.CLASS_HIDDEN, false));
	}
	_fade(selector) {
		asArray(selector).forEach(s => this._toggle(s, c.CLASS_FADED, true));
	}
	_active(selector) {
		asArray(selector).forEach(s => this._toggle(s, c.CLASS_ACTIVE, true));
	}
	_inactive(selector) {
		asArray(selector).forEach(s => this._toggle(s, c.CLASS_ACTIVE, false));
	}
	_toggle(selector, className, force) {
		this.shadow.querySelector(selector).classList.toggle(className, force);
	}
}

customElements.define('finger-sequencer', Finger);
