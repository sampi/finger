const [$elem, $svg] = [Symbol('elem'), Symbol('svg')];

class GFX {
	constructor() {
		fetch('./finger.svg')
			.then(response => response.text())
			.then(svg => (this[$svg] = svgx));
	}
	async load() {
		return;
	}
	get elem() {
		return this[$elem];
	}
	set elem(elem) {
		elem.innerHTML = this[$svg];
		this[$elem] = elem;
	}
}

export default new GFX();
