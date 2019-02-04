import css from './settings.css.js';

class Settings extends HTMLElement {
	static get observedAttributes() {
		return ['step-duration'];
	}
	constructor() {
		super();

		this.drum = 1;
		this.control = 16;
		this.synth = 8;

		this.stepDuration = 0;

		this.shadow = this.attachShadow({ mode: 'open' });
		this.shadow.innerHTML = `
			<style>
				${css}
			</style>
			<section id="root"></section>
		`;
	}

	connectedCallback() {
		this.render();
		this.addEventListener('click', evt => {
			const target = evt.path
				.find(
					e =>
						e.classList &&
						(e.classList.contains('drum') ||
							e.classList.contains('control') ||
							e.classList.contains('synth'))
				)
				.classList.toString();
			this[target]++;
			if (this[target] === 17) {
				this[target] = 1;
			}
			this.dispatchEvent(
				new CustomEvent(`${target}-channel`, {
					detail: this[target]
				})
			);
			this.render();
		});

		// Light up the numbers if there is MIDI activity
		// this.addEventListener('noteon', evt => {
		// 	this.shadow
		// 		.querySelector(`.${evt.detail}`)
		// 		.animate(
		// 			[{ opacity: 0.5 }, { opacity: 1 }, { opacity: 0.5 }],
		// 			this.stepDuration * 1000.0
		// 		);
		// });
	}

	attributeChangedCallback(name, oldVal, newVal) {
		if (name === 'step-duration') {
			this.stepDuration = parseFloat(newVal);
		}
	}

	render() {
		this.shadow.getElementById('root').innerHTML = `
			<div class="drum">
				<span class="i">y</span>
				${this._numToSpans(this.drum)}
			</div>
			<div class="control">
				<span class="i">z</span>
				${this._numToSpans(this.control)}
			</div>
			<div class="synth">
				<span class="i">x</span>
				${this._numToSpans(this.synth)}
			</div>
		`;
	}
	_numToSpans(num) {
		if (num < 10) {
			num = `0${num}`;
		} else {
			num = num.toString();
		}
		return num
			.split('')
			.map(n => `<span class="n${n}">${n}</span>`)
			.join('');
	}
}

customElements.define('finger-settings', Settings);
