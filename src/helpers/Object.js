
/**
 * Is object
 * @param  {mixed} target
 * @return {bool}
 */
export function isObject(target) {
	return (target && typeof target === 'object');
}

/**
 * Deep object merge
 * @param  {object} target
 * @param  {object} source
 * @return {object}
 */
export function deepMerge(target, source) {
	if (!isObject(target) || !isObject(source)) {
		return source;
	}
	Object.keys(source).forEach(key => {
		const targetValue = target[key];
		const sourceValue = source[key];
		if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
			target[key] = targetValue.concat(sourceValue);
		} else if (isObject(targetValue) && isObject(sourceValue)) {
			target[key] = deepMerge(Object.assign({}, targetValue), sourceValue);
		} else {
			target[key] = sourceValue;
		}
	});
	return target;

}