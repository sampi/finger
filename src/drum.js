import * as c from './constants.js';

export default [
	// 0 F kick:
	{ face: 5, hands: 'lr', layer: '#$d0' },
	// 1 F# 'kick-alt':
	{ face: 0, hands: 'lr', layer: '#$d1' },
	// 2 G snare:
	{ face: 1, hands: 'r', layer: '#$d2' },
	// 3 G# 'snare-alt':
	{ face: 2, hands: 'l', layer: '#$d3' },
	// 4 A rimshot:
	{ face: 3, hands: 'r', layer: '#$d4' },
	// 5 A# 'hand-clap':
	{ face: 4, hands: 'l', layer: '#$d5' },
	// 6 B tambourine:
	{ face: 5, hands: 'r', layer: '#$d6' },

	// 7 C '08':
	{ face: 0, hands: 'l', layer: '#$d7' },
	// 8 C# 'closed-hihat':
	{ face: 1, hands: 'r', layer: '#$d8' },
	// 9 D '09':
	{ face: 2, hands: 'l', layer: '#$d9' },
	// 10 D# 'open-hihat':
	{ face: 3, cowbell: false, hands: 'r', layer: '#$d10_1_' },
	// 11 E '10':
	{ face: 4, hands: '', layer: '#$d11' },
	//
	////
	///
	// 0 F kick:
	{ face: 5, hands: 'lr', layer: '#$d0' },
	// 1 F# 'kick-alt':
	{ face: 0, hands: 'lr', layer: '#$d1' },
	// 2 G snare:
	{ face: 1, hands: 'r', layer: '#$d2' },
	// 3 G# 'snare-alt':
	{ face: 2, hands: 'l', layer: '#$d3' },
	// 4 A rimshot:
	{ face: 3, hands: 'r', layer: '#$d4' },
	// 5 A# 'hand-clap':
	{ face: 4, hands: 'l', layer: '#$d5' },
	// 6 B tambourine:
	{ face: 5, hands: 'r', layer: '#$d6' },

	// 7 C '08':
	{ face: 0, hands: 'l', layer: '#$d7' },
	// 8 C# 'closed-hihat':
	{ face: 1, hands: 'r', layer: '#$d8' },
	// 9 D '09':
	{ face: 2, hands: 'l', layer: '#$d9' },
	// 10 D# 'open-hihat':
	{ face: 3, cowbell: false, hands: 'r', layer: '#$d10_1_' },
	// 11 E '10':
	{ face: 4, hands: '', layer: '#$d11' }
	// 12 F '11': '',
	// 13 F# ride: '',
	// 14 G '12': '',
	// 15 G# crash: '',
	// 16 A '13': '',
	// 17 A# '?': '',
	// 18 B '14': '',
	// 19 C 'bass-1': '',

	// 20 C# 'bass-2': '',
	// 21 D 'bass-3': '',
	// 22 D# 'bass-4': '',
	// 23 E 'bass-5': ''
];

export const HAND_LEFT = side => '#$hand_x5F_left'.replace('$', side);
export const HAND_RIGHT = side => '#$hand_x5F_right'.replace('$', side);
export const COWBELL = side => '#cowbell$'.replace('$', side);
export const FACE = type => side => {
	switch (type) {
		case 0:
			return '#' + (side === c.SIDE_A ? 'face00' : 'face10_1_');
		case 1:
			return '#' + (side === c.SIDE_A ? 'face01_1_' : 'face11');
		default:
			return `#face${side === c.SIDE_A ? 0 : 1}${type}`;
	}
};
