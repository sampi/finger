const css = `
	<style>
		:host > svg {
			width: 100%;
			height: 100%;
		}
		:host .hidden {
			display: none;
		}
		:host .faded {
			opacity: 0.2;
		}
	</style>
`;

const [__instrument] = [Symbol('instrument')];

const CLASS_HIDDEN = 'hidden';
const CLASS_FADED = 'faded';

const SIDE_A = 'a';
const SIDE_B = 'b';

const HAND_LEFT = '$hand_x5F_left';
const HAND_RIGHT = '$hand_x5F_right';
const COWBELL = 'cowbell$';
const face = type => side => {
	switch (type) {
		case 0:
			return side === SIDE_A ? 'face00' : 'face10_1_';
		case 1:
			return side === SIDE_A ? 'face01_1_' : 'face11';
		default:
			return `face${side === SIDE_A ? 0 : 1}${type}`;
	}
};

const drum = {
	kick: ['$d0', HAND_LEFT, HAND_RIGHT, COWBELL, face(5)],
	'kick-alt': ['$d1', HAND_LEFT, HAND_RIGHT, COWBELL, face(0)],
	snare: ['$d2', HAND_RIGHT, COWBELL, face(1)],
	'snare-alt': ['$d3', HAND_LEFT, COWBELL, face(2)],
	rimshot: ['$d4', HAND_RIGHT, COWBELL, face(3)],
	'hand-clap': ['$d5', HAND_LEFT, COWBELL, face(4)],
	tambourine: ['$d6', HAND_RIGHT, COWBELL, face(5)],

	'08': ['$d7', HAND_LEFT, COWBELL, face(0)],
	'closed-hihat': ['$d8', HAND_RIGHT, COWBELL, face(1)],
	'09': ['$d9', HAND_LEFT, COWBELL, face(2)],
	'open-hihat': ['$d10_1_', HAND_RIGHT, face(3)],
	'10': ['$d11', COWBELL, face(4)]

	// '11': '',
	// ride: '',
	// '12': '',
	// crash: '',
	// '13': '',
	// '?': '',
	// '14': '',
	// 'bass-1': '',
	// 'bass-2': '',
	// 'bass-3': '',
	// 'bass-4': '',
	// 'bass-5': ''
};

class Finger extends HTMLElement {
	static get observedAttributes() {
		return ['instrument'];
	}
	constructor() {
		super();

		this.addEventListener('load', this);

		this.shadow = this.attachShadow({ mode: 'open' });

		this.shadow.innerHTML = css;
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

					const tmp = Object.keys(drum);
					let i = 0;
					// setInterval(() => {
					// 	this._resetDrums(SIDE_A);
					// 	drum[tmp[i]].forEach(layer => {
					// 		if (typeof layer === 'function') {
					// 			return show(`#${layer(SIDE_A)}`);
					// 		}
					// 		show(`#${layer.replace('$', SIDE_A)}`);
					// 	});

					// 	this._resetDrums(SIDE_B);
					// 	drum[tmp[i]].forEach(layer => {
					// 		if (typeof layer === 'function') {
					// 			return show(`#${layer(SIDE_B)}`);
					// 		}
					// 		show(`#${layer.replace('$', SIDE_B)}`);
					// 	});
					// 	i++;
					// 	if (i >= tmp.length) {
					// 		i = 0;
					// 	}
					// 	console.log(i);
					// }, 250);
					// drum.kick.forEach(layer => {
					// 	if (typeof layer === 'function') {
					// 		return show(`#${layer('a')}`);
					// 	}
					// 	show(`#${layer.replace('$', 'a')}`);
					// });
					break;
				case 'synth':
					break;
			}
		}
		this[__instrument] = instrument;
	}
	get instrument() {
		return this[__instrument];
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

	_resetDrums(side) {
		const [show, hide] = [this._show.bind(this), this._hide.bind(this)];

		const resetA = !side || side === SIDE_A;
		const resetB = !side || side === SIDE_B;

		show('#drum');

		resetA && show('#druma');
		resetB && show('#drumb');

		resetA && hide(['#ahand_x5F_left', '#ahand_x5F_right']);
		resetB && hide(['#bhand_x5F_left', '#bhand_x5F_right']);

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

		idleA && show(['#ahand_x5F_left', '#ahand_x5F_right', '#face00']);
		idleA && fade(`#${COWBELL.replace('$', 'a')}`);
		idleB && show(['#bhand_x5F_left', '#bhand_x5F_right', '#face10_1_']);
		idleB && fade(`#${COWBELL.replace('$', 'b')}`);
	}

	_hide(selector) {
		asArray(selector).forEach(s => this._toggle(s, CLASS_HIDDEN, true));
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
		console.log(`_toggle(${selector}, ${force})`);
		this.shadow.querySelector(selector).classList.toggle(className, force);
	}
}

customElements.define('finger-sequencer', Finger);

function asArray(thing) {
	return Array.isArray(thing) ? thing : [thing];
}
