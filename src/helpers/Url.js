/**
 * URL - Library
 * Tree shakable structure
 */

/**
 * Get query string
 * @param  {string|URLSearchParams} get
 * @return {string}
 */
export function getQueryStr(getArg) {
  let get = getArg;
  if (get instanceof URLSearchParams) {
    get = get.toString();
  }
  if (typeof get === 'string' && get.length > 0) {
    return `?${get}`;
  }
  return '';
}

/**
 * Trim leading slashes
 * @param  {string} path
 * @return {string}
 */
export function trimLeadingSlashes(path) {
  return path.replace(/^\/+/, '');
}

/**
 * Get expected fetch path
 * @param  {string} path
 * @return {string}
 */
export function getPath(path, defaultValue) {
  let newPath = (typeof defaultValue === 'string' ? defaultValue : '');
  if (path.length > 0) {
    if (typeof path === 'string') {
      newPath = path;
    } else {
      newPath = path.join('/');
    }
  }
  return `/${trimLeadingSlashes(newPath)}`;
}

/**
 * Trim trailing slashes
 * @param  {string} path
 * @return {string}
 */
export function trimTrailingSlashes(path) {
  return path.replace(/\/+$/, '');
}

/**
 * Add leading slash to string
 * @param {string} path
 * @return {string}
 */
export function addLeadingSlash(pathArgs) {
  let path = pathArgs;
  if (!path.startsWith('/')) path = `/${path}`;
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
    "'": '&#39;',
  };
  const regex = /[&<>"']/g;
  return value.replace(regex, (match) => char[match]);
}

/**
 * HTML special characters decode
 * @param  {string} value
 * @return {string}
 */
export function htmlspecialcharsDecode(value) {
  const char = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
  };
  const regex = /&amp;|&lt;|&gt;|&quot;|&#39;/g;
  return value.replace(regex, (match) => char[match]);
}

/**
 * Query string to object
 * @param  {string|URLSearchParams} value
 * @return {object}
 */
export function parseStr(valueArg) {
  let value = valueArg;
  if (!(value instanceof URLSearchParams)) {
    value = new URLSearchParams(value);
  }
  const entries = value.entries();
  return [...entries].reduce((items, [key, val]) => Object.assign(items, { [key]: val }), {});
}
