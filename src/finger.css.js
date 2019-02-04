/**
 * Normally, this file would be a simple CSS file,
 * and webpack/rollup would take care of importing it.
 */
export default `

:host > svg {
	box-sizing: border-box;
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: var(--settings-height, 10%);
	width: 100%;
	height: calc(100% - var(--settings-height, 10%));
	cursor: default;
}
.hidden {
	opacity: 0;
}
.faded {
	opacity: 0.2;
}

#keys > g {
	pointer-events: bounding-box;
}
#keys > g > path {
	stroke: #5E5F8F !important;
}
#keys .active > path {
	stroke: #DFD9FF !important;
	stroke-linecap: square !important;
}
/* Hit animation */
.hit {
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
#ad0.hit,
#ad1.hit,
#bd0.hit,
#bd1.hit {
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
#ad0.hit > line,
#ad1.hit > line,
#bd0.hit > line,
#bd1.hit > line{
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
#hbld.hit,
#hbrd.hit {
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
#bk0.hit,
#bk1.hit,
#bk2.hit,
#bk3.hit,
#bk4.hit,
#bk5.hit,
#bk6.hit,
#bk7.hit,
#bk8.hit,
#bk9.hit,
#bk10.hit,
#bk11.hit {
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


finger-settings {
	position: absolute;
	right: 0;
	bottom: 0;
	left: 0;
	height: var(--settings-height, 10%);
	/* opacity:  0.5; */
}

`;
