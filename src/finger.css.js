/**
 * Normally, this file would be a simple CSS file,
 * and webpack/rollup would take care of importing it.
 */
export default `
/*
:host {
	cursor: pointer;
} */

:host > svg {
	width: 100%;
	height: 100%;
}
:host .hidden {
	opacity: 0;
}
:host .faded {
	opacity: 0.2;
}

:host #keys > g {
	pointer-events: bounding-box;
}
:host #keys > g > path {
	stroke: #5E5F8F !important;
}
:host #keys .active > path {
	stroke: #DFD9FF !important;
	stroke-linecap: square !important;
}
/* Hit animation */
:host .hit {
	animation-name: hit;
	animation-duration: var(--beat-s);
	animation-iteration-count: infinite;
}
@keyframes hit {
	from {
		transform: translateY(3px);
	}
	50% {
		transform: translateY(0px);
	}
	to {
		transform: translateY(3px);
	}
}

/* Kick-drum hit animation */
:host #ad0.hit,
:host #ad1.hit,
:host #bd0.hit,
:host #bd1.hit {
	transform-box: fill-box;
	transform-origin: center;
	animation-name: kick-hit;
	transform: scale(1);
	opacity: 0;
}
@keyframes kick-hit {
	from {
		transform: scale(0.8);
		opacity:  1;
	}
	40% {
		transform: scale(0.3);
		opacity:  1;
	}
	99.999% {
		transform: scale(1.6);
		opacity:  1;
	}
	to {
		opacity:  0;
	}
}
:host #ad0.hit > line,
:host #ad1.hit > line,
:host #bd0.hit > line,
:host #bd1.hit > line{
	animation-name: kick-hit-line;
}
@keyframes kick-hit-line {
	from {
		stroke-width: 1.5;
	}
	40% {
		stroke-width: 2;
	}
	to {
		stroke-width: 0.8;
	}
}

/* Synth hand animation */
:host #hbld.hit,
:host #hbrd.hit {
	animation-name: hand-hit;
}
@keyframes hand-hit {
	from {
		transform: translate(var(--translate-x), -2.93px);
	}
	to {
		transform: translate(var(--translate-x), 0);
	}
}

/* Synth key animation */
:host #bk0.hit,
:host #bk1.hit,
:host #bk2.hit,
:host #bk3.hit,
:host #bk4.hit,
:host #bk5.hit,
:host #bk6.hit,
:host #bk7.hit,
:host #bk8.hit,
:host #bk9.hit,
:host #bk10.hit,
:host #bk11.hit {
	animation-name: key-hit;
}
@keyframes key-hit {
	from {
		transform: translateY(0);
	}
	to {
		transform: translateY(2.93px);
	}
}

`;
