/**
 * Return thing as an Array-like object
 * @param  {*} thing
 * @return {Array|NodeList}
 */
export function asArrayLike(thing) {
	return Array.isArray(thing) || thing instanceof NodeList ? thing : [thing];
}

/**
 * Turn a boolean-like string into a boolean
 * @param  {string|bool} thing
 * @return {bool}
 */
export function stringBool(thing) {
	return (
		(typeof thing === 'boolean' && thing) ||
		(typeof thing === 'string' && thing === 'true')
	);
}
