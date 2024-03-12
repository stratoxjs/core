/**
 * URL - Library
 * Tree shakable structure
 */

/**
 * Get query string
 * @param  {string|URLSearchParams} get
 * @return {string}
 */
export function getQueryStr(get) {
	if(get instanceof URLSearchParams) {
		get = get.toString();
	}
	if(typeof get === "string" && get.length > 0) {
		return "?"+get;
	}
	return "";
}

/**
 * Get expected fetch path
 * @param  {string} path
 * @return {string}
 */
export function getPath(path, defaultValue) {
	let newPath = (typeof defaultValue === "string" ? defaultValue : "");
	if(path.length > 0) {
		newPath = path.join("/")
	}
	return "/"+trimLeadingSlashes(newPath);
}

/**
 * Trim leading slahses
 * @param  {string} path
 * @return {string}
 */
export function trimLeadingSlashes(path) {
	return path.replace(/^\/+/, "");
}

/**
 * Trim trailing slahses
 * @param  {string} path
 * @return {string}
 */
export function trimTrailingSlashes(path) {
	return path.replace(/\/+$/, "");
}

/**
 * Add leading slash to string
 * @param {string} path
 * @return {string}
 */
export function addLeadingSlash(path) {
    if(!path.startsWith("/")) path = "/"+path;
    return path;
}

/**
 * HTML special characters encode
 * @param  {string} value
 * @return {string}
 */
export function htmlspecialchars(value) {
	const char = {
	    '&': '&amp;',
	    '<': '&lt;',
	    '>': '&gt;',
	    '"': '&quot;',
	    "'": '&#39;'
	};
    const keys = Object.keys(char);
    const regex = new RegExp('[&|<|>|"|\']', 'g');
    return value.replace(regex, match => char[match]);
}

/**
 * HTML special characters decode
 * @param  {string} value
 * @return {string}
 */
export function htmlspecialchars_decode(value) {
    const char = {
	    '&amp;': '&',
	    '&lt;': '<',
	    '&gt;': '>',
	    '&quot;': '"',
	    '&#39;': "'"
	};
    const keys = Object.keys(char);
    const regex = new RegExp('[&|<|>|"|\']', 'g');
    return value.replace(regex, match => char[match]);
}

/**
 * Query string to object
 * @param  {string|URLSearchParams} value
 * @return {object}
 */
export function parseStr(value) {
    if(!(value instanceof URLSearchParams)) {
        value = new URLSearchParams(value);
    }
    return [...value.entries()].reduce((items, [key, val]) => Object.assign(items, { [key]: val }), {})
}
