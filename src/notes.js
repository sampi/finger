export const whiteKeys = {
	53: 0,
	55: 1,
	57: 2,
	59: 3,
	60: 4,
	62: 5,
	64: 6,
	65: 7,
	67: 8,
	69: 9,
	71: 10,
	72: 11,
	74: 12,
	76: 13
};

export const n = note => (note ? note - 53 : null);
export const m = note => note + 53;
