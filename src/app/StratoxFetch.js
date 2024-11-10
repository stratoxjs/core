import * as UrlHelper from '../helpers/Url';
import * as ObjectHelper from '../helpers/Object';

export default class StratoxFetch {
  #uri = '';

  #method = 'GET';

  #queryStr = '';

  #config = {};

  #dataType = 'json';

  #prepare;

  #complete;

  #error;

  #fetch;

  /**
   * Init request
   * @param  {string} uri
   * @param  {object} config Fetch config
   * @return {self}
   */
  constructor(uri, config) {
    this.#uri = UrlHelper.trimTrailingSlashes(uri);
    if (typeof config === 'object') {
      this.#config = config;
    }
  }

  /**
   * Make GET request
   * @param  {string} url
   * @param  {object} config Fetch config
   * @return {self}
   */
  static get(url, config) {
    const fetch = new StratoxFetch(url, config);
    return fetch.execute();
  }

  /**
   * Make POST request
   * @param  {string} url
   * @param  {object} Post request items/data
   * @param  {object} config Fetch config
   * @return {self}
   */
  static post(url, data, config) {
    const fetch = new StratoxFetch(url, config);
    return fetch.setData(data).setMethod('POST').execute();
  }

  /**
   * Make PUT request
   * @param  {string} url
   * @param  {object} Put request items/data
   * @param  {object} config Fetch config
   * @return {self}
   */
  static put(url, data, config) {
    const fetch = new StratoxFetch(url, config);
    return fetch.setData(data).setMethod('PUT').execute();
  }

  /**
   * Make DELETE request
   * @param  {string} url
   * @param  {object} config Fetch config
   * @return {self}
   */
  static delete(url, config) {
    const fetch = new StratoxFetch(url, config);
    return fetch.setMethod('DELETE').execute();
  }

  /**
   * Set fetch config
   * @param {object} config
   */
  setConfig(config) {
    if (typeof config !== 'object') {
      throw new Error('Argument 1 has to be an object.');
    }

    this.#config = config;
    return this;
  }

  /**
   * Set response type
   * @param {string} type json, xml, text
   */
  setType(type) {
    this.#dataType = type;
    return this;
  }

  /**
   * Set request method
   * @param {string} method GET, POST, PUT, DELETE
   * @return {self}
   */
  setMethod(method) {
    this.#method = method;
    return this;
  }

  /**
   * Set data (post items or get items)
   * @param {string|object|URLSearchParams} data
   * @return {self}
   */
  setData(data) {
    if (this.#method === 'POST' && (typeof data === 'object')) {
      this.#config.body = ObjectHelper.objToFormData(data);
    }
    if (this.#method === 'GET') {
      this.#queryStr = UrlHelper.getQueryStr(data);
    }
    return this;
  }

  /**
   * Set Query string
   * @param {string|URLSearchParams} data
   * @return {self}
   */
  setQueryStr(data) {
    this.#queryStr = UrlHelper.getQueryStr(data);
    return this;
  }

  /**
   * Get current request url
   * @return {string}
   */
  getUrl() {
    return this.#uri + this.#queryStr;
  }

  /**
   * Get prepared result
   * @param  {callable} func [description]
   * @return {self}
   */
  prepare(func) {
    this.#prepare = func;
    return this;
  }

  /**
   * Get complete result
   * @param  {callable} func [description]
   * @return {self}
   */
  complete(func) {
    this.#complete = func;
    return this;
  }

  /**
   * Get fetch instance
   * @return {fetch}
   */
  fetch() {
    return this.#fetch;
  }

  /**
   * Get error response
   * @param  {callable} func
   * @return {self}
   */
  error(func) {
    this.#error = func;
    return this;
  }

  /**
   * Execute response
   * @param  {callable} call
   * @return {self}
   */
  execute(call) {
    this.#config.method = this.#method;

    const inst = this;
    this.#fetch = fetch(this.getUrl(), this.#config);
    this.#fetch.then((response) => {
      if (typeof inst.#prepare === 'function') {
        inst.#prepare(response);
      }

      if (typeof response[inst.#dataType] === 'function') {
        return response[inst.#dataType]();
      }
      return response.text();
    }).then((dataResponse) => {
      let response = dataResponse;
      if (inst.#dataType === 'xml') {
        const parser = new DOMParser();
        response = parser.parseFromString(dataResponse, 'application/xml');
        // Check for parsing errors
        if (response.getElementsByTagName('parsererror').length) {
          throw new Error('Error parsing XML in Ajax fetch response.');
        }
      }

      if (typeof call === 'function') {
        call(response);
      }
      if (typeof inst.#complete === 'function') {
        inst.#complete(response);
      }
    }).catch((error) => {
      if (typeof inst.#error === 'function') {
        inst.#error(error);
      }
      console.error('There was a problem with your fetch operation:', error);
    });
    return this;
  }
}
