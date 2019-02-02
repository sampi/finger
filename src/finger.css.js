/**
 * Normally, this file would be a simple CSS file,
 * and webpack/rollup would take care of importing it.
 */
export default `

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
:host .hit {
	animation-name: hit;
	animation-duration: var(--beat-s);
	/* animation-timing-function: ease-in-out; */
}

:host #ad0,
:host #ad1,
:host #bd0,
:host #bd1 {
	transform-box: fill-box;
	transform-origin: center;
	transform: scale(1);
	opacity: 0;
}
:host #ad0.hit,
:host #ad1.hit,
:host #bd0.hit,
:host #bd1.hit {
	animation-name: kick-hit;
	animation-duration: var(--beat-s);
	animation-timing-function: /* ease-in */;
}
:host #ad0.hit > line,
:host #ad1.hit > line,
:host #bd0.hit > line,
:host #bd1.hit > line{
	animation-name: kick-hit-line;
	animation-duration: var(--beat-s);
	animation-direction: normal;
	animation-iteration-count: 1;
	/* animation-timing-function: ease-in; */
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

@keyframes kick-hit {
	from {
		transform: scale(0.8);
		opacity:  1;
	}
	30% {
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
@keyframes kick-hit-line {
	from {
		stroke-width: 1.5;
	}
	30% {
		stroke-width: 2;
	}
	to {
		stroke-width: 0.1;
	}
}

`;
