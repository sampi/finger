import * as c from './constants.js';

/**
 * Mappings of the gorilla's states for each key
 */
export default [
	// 0 F kick:
	{ face: 5, hands: 'lr', layer: '#ad0' },
	// 1 F# 'kick-alt':
	{ face: 0, hands: 'lr', layer: '#ad1' },
	// 2 G snare:
	{ face: 1, hands: 'r', layer: '#ad2' },
	// 3 G# 'snare-alt':
	{ face: 2, hands: 'l', layer: '#ad3' },
	// 4 A rimshot:
	{ face: 3, hands: 'r', layer: '#ad4' },
	// 5 A# 'hand-clap':
	{ face: 4, hands: 'l', layer: '#ad5' },
	// 6 B tambourine:
	{ face: 5, hands: 'r', layer: '#ad6' },

	// 7 C '08':
	{ face: 0, hands: 'l', layer: '#ad7' },
	// 8 C# 'closed-hihat':
	{ face: 1, hands: 'r', layer: '#ad8' },
	// 9 D '09':
	{ face: 2, hands: 'l', layer: '#ad9' },
	// 10 D# 'open-hihat':
	{ face: 3, cowbell: false, hands: 'r', layer: '#ad10_1_' },
	// 11 E '10':
	{ face: 4, hands: '', layer: '#ad11' },
	//
	////
	///
	// 0 F kick:
	{ face: 5, hands: 'lr', layer: '#ad0' },
	// 1 F# 'kick-alt':
	{ face: 0, hands: 'lr', layer: '#ad1' },
	// 2 G snare:
	{ face: 1, hands: 'r', layer: '#ad2' },
	// 3 G# 'snare-alt':
	{ face: 2, hands: 'l', layer: '#ad3' },
	// 4 A rimshot:
	{ face: 3, hands: 'r', layer: '#ad4' },
	// 5 A# 'hand-clap':
	{ face: 4, hands: 'l', layer: '#ad5' },
	// 6 B tambourine:
	{ face: 5, hands: 'r', layer: '#ad6' },

	// 7 C '08':
	{ face: 0, hands: 'l', layer: '#ad7' },
	// 8 C# 'closed-hihat':
	{ face: 1, hands: 'r', layer: '#ad8' },
	// 9 D '09':
	{ face: 2, hands: 'l', layer: '#ad9' },
	// 10 D# 'open-hihat':
	{ face: 3, cowbell: false, hands: 'r', layer: '#ad10_1_' },
	// 11 E '10':
	{ face: 4, hands: '', layer: '#ad11' }
];

export const DRUM_HAND_LEFT = '#ahand_x5F_left';
export const DRUM_HAND_RIGHT = '#ahand_x5F_right';
export const COWBELL = '#cowbella';
export const FACE = type => {
	switch (type) {
		case 1:
			return '#face01_1_';
		default:
			return `#face0${type}`;
	}
};
