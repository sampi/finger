/**
 * Normally, this file would be a simple CSS file,
 * and webpack/rollup would take care of importing it.
 */
export default `

:host #root {
	/* font-family: 'OP-1';
	line-height: calc(0.5 * var(--settings-height));
	font-size: calc(0.5 * var(--settings-height));
	padding: calc(0.25 * var(--settings-height));
	color: white; */

	box-sizing: border-box;
	position: absolute;
	top: 0;
	right: 0;
	bottom: 0;
	left: 0;
	width: var(--settings-width);
	margin-left: auto;
	margin-right: auto;
	height: 100%;
	/* background: #698EFF; */
}

.drum,
.control,
.synth {
	position: absolute;
	top: 0;
	bottom: 0;
	width: 33%;
	font-family: 'OP-1';
	line-height: calc(0.6 * var(--settings-height));
	font-size: calc(0.6 * var(--settings-height));
	font-kerning: auto;
	opacity: 0.5;
	cursor: pointer;
}
.drum {
	left: 0;
	color: #00ED95;
	text-align: left;
	padding-left: 7.5%;
}
.control {
	left: 33%;
	color: white;
	text-align: center;
}
.synth {
	right: 0;
	color: #698EFF;
	text-align: right;
	padding-right: 7.5%;
}

.drum .i,
.control .i,
.synth .i {
	display: inline-block;
}

.n0 + .n4 {
	margin: 0 -3%;
}

.n0 + .n5,
.n0 + .n6,
.n0 + .n8,
.n0 + .n9 {
	margin: 0 -3.5%;
}

.n0 + .n2,
.n0 + .n3,
.n0 + .n7 {
	margin: 0 -4%;
}

.n0 + .n1,
.n1 + .n0,
.n1 + .n2,
.n1 + .n3,
.n1 + .n4,
.n1 + .n5,
.n1 + .n6 {
	margin: 0 -6%;
}

.n1 + .n1 {
	margin: 0 -7.5%;
}

`;
