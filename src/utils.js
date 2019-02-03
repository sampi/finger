export function asArrayLike(thing) {
	return Array.isArray(thing) || thing instanceof NodeList ? thing : [thing];
}
export function stringBool(thing) {
	return (
		(typeof thing === 'boolean' && thing) ||
		(typeof thing === 'string' && thing === 'true')
	);
}
