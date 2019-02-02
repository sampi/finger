import patterns from './patterns.js';
import drum from './drum.js';
import { whiteKeys, n, m } from './notes.js';
import css from './finger.css.js';

const [
	__instrument,
	__playback,
	__playhead,
	__playstart,
	__pattern,
	__bpm,
	__stepduration,
	__midi,
	__prevnotes
] = [
	Symbol('instrument'),
	Symbol('playback'),
	Symbol('playhead'),
	Symbol('playstart'),
	Symbol('playpattern'),
	Symbol('bpm'),
	Symbol('stepduration'),
	Symbol('midi'),
	Symbol('prevnotes')
];

const CLASS_HIDDEN = 'hidden';
const CLASS_HIT = 'hit';
const CLASS_FADED = 'faded';

const SIDE_A = 'a';
const SIDE_B = 'b';

const SIDE_LEFT = 'l';
const SIDE_RIGHT = 'r';

const HAND_LEFT = side => '#$hand_x5F_left'.replace('$', side);
const HAND_RIGHT = side => '#$hand_x5F_right'.replace('$', side);
const COWBELL = side => '#cowbell$'.replace('$', side);
const FACE = type => side => {
	switch (type) {
		case 0:
			return '#' + (side === SIDE_A ? 'face00' : 'face10_1_');
		case 1:
			return '#' + (side === SIDE_A ? 'face01_1_' : 'face11');
		default:
			return `#face${side === SIDE_A ? 0 : 1}${type}`;
	}
};

class Finger extends HTMLElement {
	static get observedAttributes() {
		return ['instrument', 'playback', 'pattern', 'bpm'];
	}
	constructor() {
		super();

		this[__playback] = false;
		this[__bpm] = parseFloat(1000);
		this[__prevnotes] = null;

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
		this._idleDrums();
	}

	attributeChangedCallback(name, oldVal, newVal) {
		this[name] = newVal;
	}

	set instrument(instrument) {
		const [show, hide] = [this._show.bind(this), this._hide.bind(this)];

		if (instrument !== this[__instrument]) {
			switch (instrument) {
				case 'drum':
					hide('#synth');
					this._resetDrums();
					break;
				case 'synth':
					alert('unsupported feature :(');
					break;
			}
		}
		this[__instrument] = instrument;
	}
	get instrument() {
		return this[__instrument];
	}

	set playback(playback) {
		playback = playback === 'true';
		if (this[__playback] !== playback) {
			if (playback) {
				this[__playhead] = 0;
				this[__playstart] = null;
				requestAnimationFrame(this._playBeat.bind(this));
			}
			this[__playback] = playback;
			this.setAttribute('playback', playback);
		}
	}
	get playback() {
		return this[__playback];
	}

	set pattern(pattern) {
		const [show, hide] = [this._show.bind(this), this._hide.bind(this)];
		if (this[__pattern] !== pattern) {
			this[__pattern] = pattern;
			this.setAttribute('pattern', pattern);
			const currentPattern = patterns[this[__pattern]];
			this._resetPatternUI();
			for (let step = 0; step < 32; step++) {
				// hide steps that aren't active
				if (step >= currentPattern.length) {
					hide(`#x${step}`);
					hide(`#g${step}bg`);
					continue;
				} else {
					show(`#g${step}bg`);
				}

				// hide empty active steps
				if (currentPattern[step] === null) {
					hide(`#x${step}`);
				} else {
					show(`#x${step}`);
				}
			}
		}
	}

	set bpm(bpm) {
		if (Math.abs(parseFloat(this[__bpm]) - parseFloat(bpm)) > Number.EPSILON) {
			this[__bpm] = parseFloat(bpm);
			this[__stepduration] = (60.0 / this[__bpm] / 4.0) * 1000.0;
			this.setAttribute('bpm', parseFloat(bpm));
			this.style.setProperty('--beat-s', this[__stepduration] / 1000.0 + 's');
		}
	}

	get bpm() {
		return this[__bpm];
	}

	_playBeat(timestamp) {
		if (!this[__playstart]) {
			this[__playstart] = timestamp;
			this._playNotes(patterns[this[__pattern]][this[__playhead]], SIDE_A);
		}
		const progress = timestamp - this[__playstart];
		if (progress >= this[__stepduration]) {
			this[__playstart] = null;
			this[__playhead] = ++this[__playhead] % patterns[this[__pattern]].length;
		}
		if (this[__playback]) {
			requestAnimationFrame(this._playBeat.bind(this));
		} else {
			this._resetDrums(SIDE_A);
			this._idleDrums(SIDE_A);
		}
	}
	_playNotes(notes, side) {
		const [show, hide, fade, unfade, hit] = [
			this._show.bind(this),
			this._hide.bind(this),
			this._fade.bind(this),
			this._unfade.bind(this),
			this._hit.bind(this)
		];

		this._resetPatternUI();

		this._resetDrums(side);

		const notesArr = asArray(notes);

		if (this[__midi]) {
			for (var output of this[__midi].outputs.values()) {
				if (this[__prevnotes] !== null) {
					console.log('STOP', this[__prevnotes][0]);
					output.send([128, this[__prevnotes][0], 127]);
					if (this[__prevnotes][1]) {
						console.log('STOP', this[__prevnotes][1]);
						output.send([128, this[__prevnotes][1], 127]);
					}
				}

				if (notes !== null) {
					console.log('SEND', m(notesArr[0]));
					output.send([144, m(notesArr[0]), 127]);
					if (notesArr[1]) {
						console.log('SEND', m(notesArr[1]));
						output.send([144, m(notesArr[1]), 127]);
					}
				}
			}
		}

		if (notes === null) {
			this[__prevnotes] = null;
			return this._idleDrums(side);
		}

		this[__prevnotes] = [m(notesArr[0])];
		if (notesArr[1]) {
			this[__prevnotes].push(m(notesArr[1]));
		}

		const note0 = drum[notesArr[0] % drum.length];
		const note1 = drum[notesArr[1] % drum.length] || note0;

		show(FACE(note0.face)(side));

		const layer0 = note0.layer.replace('$', side);
		show(layer0);
		hit(layer0);

		note0.hands.includes(SIDE_LEFT) && note1.hands.includes(SIDE_LEFT)
			? show(HAND_LEFT(side))
			: hide(HAND_LEFT(side));
		note0.hands.includes(SIDE_RIGHT) && note1.hands.includes(SIDE_RIGHT)
			? show(HAND_RIGHT(side))
			: hide(HAND_RIGHT(side));
		note0.cowbell === false || note1.cowbell === false
			? hide(COWBELL(side))
			: show(COWBELL(side));

		if (
			note0.hands === 'lr' ||
			note1.hands === 'lr' ||
			(note0.cowbell === false || note1.cowbell === false)
		) {
			const layer1 = note1.layer.replace('$', side);
			show(layer1);
			hit(layer1);
		}
	}

	_resetUI() {
		const [hide, fade] = [this._hide.bind(this), this._fade.bind(this)];
		hide([
			'#replace',
			'#fillin_1_',
			'#chain',
			'#octhigh',
			'#rubber',
			'#octdown',
			'#octup'
		]);
		fade('#hold');
	}

	_resetPatternUI() {
		const [show, hide] = [this._show.bind(this), this._hide.bind(this)];
		for (let step = 0; step < 32; step++) {
			// hide all outlines
			hide(`#g${step}${step >= 22 && step <= 29 ? '_1_' : ''}`);
		}
		let step =
			(this.playback ? (this[__playhead] || 0) + 1 : 0) %
			patterns[this[__pattern]].length;
		show(`#g${step}${step >= 22 && step <= 29 ? '_1_' : ''}`);
	}

	_resetDrums(side) {
		const [show, hide] = [this._show.bind(this), this._hide.bind(this)];

		const resetA = !side || side === SIDE_A;
		const resetB = !side || side === SIDE_B;

		show('#drum');

		resetA && show('#druma');
		resetB && show('#drumb');

		resetA && hide([HAND_LEFT(SIDE_A), HAND_RIGHT(SIDE_A)]);
		resetB && hide([HAND_LEFT(SIDE_B), HAND_RIGHT(SIDE_B)]);

		resetA && hide(['#face00', '#face01_1_']);
		resetB && hide(['#face10_1_', '#face11']);

		for (let i = 0; i <= 11; i++) {
			if (i > 1 && i <= 5) {
				resetA && hide(`#face0${i}`);
				resetB && hide(`#face1${i}`);
			}
			if (i === 10) {
				// Hide cowbell
				resetA && hide('#ad10_1_');
				resetB && hide('#bd10_1_');
				continue;
			}

			resetA && hide(`#ad${i}`);
			resetB && hide(`#bd${i}`);
		}
	}

	_idleDrums(side) {
		const [show, hide, fade] = [
			this._show.bind(this),
			this._hide.bind(this),
			this._fade.bind(this)
		];

		const idleA = !side || side === SIDE_A;
		const idleB = !side || side === SIDE_B;

		idleA &&
			show([HAND_LEFT(SIDE_A), HAND_RIGHT(SIDE_A), '#face00', COWBELL(SIDE_A)]);
		!this.playback && idleA && fade(COWBELL(SIDE_A));
		idleB &&
			show([
				HAND_LEFT(SIDE_B),
				HAND_RIGHT(SIDE_B),
				'#face10_1_',
				COWBELL(SIDE_B)
			]);
		!this.playback && idleB && fade(COWBELL(SIDE_B));
	}

	_initMIDI() {
		if (navigator.requestMIDIAccess) {
			const onMIDISuccess = midiAccess => {
				this[__midi] = midiAccess;

				for (var input of midiAccess.inputs.values()) {
					console.log(`MIDI IN: ${input.manufacturer} - ${input.name}`);
					input.onmidimessage = getMIDIMessage;
				}

				for (var output of midiAccess.outputs.values()) {
					console.log(`MIDI OUT: ${input.manufacturer} - ${input.name}`);
				}
			};

			const getMIDIMessage = message => {
				var command = message.data[0];
				var note = message.data[1];
				var velocity = message.data.length > 2 ? message.data[2] : 0; // a velocity value might not be included with a noteOff command

				if (command === 144 && whiteKeys[note] !== undefined) {
					console.log('getMIDIMessage', { note });
					this.setAttribute('pattern', whiteKeys[note]);
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
		asArray(selector).forEach(s => this._toggle(s, CLASS_HIT, true));
	}
	_hide(selector) {
		asArray(selector).forEach(s => {
			this._toggle(s, CLASS_HIDDEN, true);
			this._toggle(s, CLASS_HIT, false);
		});
	}
	_show(selector) {
		asArray(selector).forEach(s => this._toggle(s, CLASS_HIDDEN, false));
	}
	_fade(selector) {
		asArray(selector).forEach(s => this._toggle(s, CLASS_FADED, true));
	}
	_unfade(selector) {
		asArray(selector).forEach(s => this._toggle(s, CLASS_FADED, false));
	}
	_toggle(selector, className, force) {
		this.shadow.querySelector(selector).classList.toggle(className, force);
	}
}

customElements.define('finger-sequencer', Finger);

function asArray(thing) {
	return Array.isArray(thing) ? thing : [thing];
}
