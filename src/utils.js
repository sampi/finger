export function asArray(thing) {
	return Array.isArray(thing) ? thing : [thing];
}
export function stringBool(thing) {
	return (
		(typeof thing === 'boolean' && thing) ||
		(typeof thing === 'string' && thing === 'true')
	);
}
