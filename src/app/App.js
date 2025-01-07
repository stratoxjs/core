import Stratox from 'stratox/src/Stratox';
import { Dispatcher } from '@stratox/pilot';
import StratoxExtend from './StratoxExtend';
import StratoxFetch from './StratoxFetch';
import * as UrlHelper from '../helpers/Url';
import * as ObjectHelper from '../helpers/Object';

export default class App {
  #stratox;

  #dispatcher;

  #router;

  #config = {};

  #elem;

  constructor(configuration) {
    const inst = this;
    const config = configuration;
    if (!config?.prepAsyncViews) {
      config.prepAsyncViews = import.meta.glob('@/templates/views/**/*.js');
    }

    inst.#config = ObjectHelper.deepMerge({
      prepAsyncViews: {},
      directory: '/src/templates/views/',
      fields: {},
      helper: {},
      responder: null,
      dispatcher: {
        catchForms: true,
      },
      ready() {

      },
      request: {
        startPath: '',
        path: false,
        url: false,
        dataType: 'json',
        get(searchParams) {
          return searchParams;
        },
        post(object) {
          return (typeof object === 'object') ? object : {};
        },
        config: {
          method: 'GET',
          headers: {
            // Indicates that the client expects JSON data
            Accept: 'application/json',
          },
        },
      },
    }, config);

    Stratox.setConfigs({
      cache: false,
      popegation: false,
      directory: inst.setViewDirectory(inst.#config.directory),
      handlers: {
        fields: inst.#config.fields,
        helper: inst.#config.helper,
      },
    });
  }

  /**
   * Man view response handler
   * @param  {object} data
   * @param  {Container} container
   * @param  {object} helper
   * @param  {StrtoxBuilder} builder
   * @return {string}
   */
  main(data, container, helper, builder) {
    let response;
    let method;
    let inst = this.clone();

    // Exclude dispatch from reset
    inst.container().resetAll(['dispatch']);

    // Pass dispatcher to the views
    inst.container().set('http', data.meta, true);
    inst.container().set('request', data.meta?.request, true);
    if (!container.has('dispatch')) {
      inst.container().set('dispatch', container.get('dispatch'));
    }

    inst.container().set('state', container.get('dispatch').getStateHandler());

    // Controller
    if (typeof data.meta.controller === 'function') {
      method = data.meta.controller;
    } else {
      const controllerClass = App.getClass(data.meta);
      if (controllerClass) method = controllerClass[data.meta.controller[1]];
    }

    if (typeof method !== 'function') {
      console.group('Missing controller');
      console.error('Could not find the controller that has been specified in the router:');
      console.error(data.meta.controller);
      console.groupEnd();
      return '';
    }

    // Response

    // The destructured validation check will be removed in version 4?
    const fnParams = method.toString().match(/\(([^)]*)\)/)[1];
    const isNewStyle = typeof method === 'function' && method.length === 1 && /\{.*\}/.test(fnParams);
    const args = isNewStyle
      ? [
        {
          services: inst.container(),
          helper,
          context: builder,
          view: inst,
          ...inst.container().list(),
        },
      ]
      : [data.meta, inst.container(), helper, builder, data.app];


    const createResponse = method.apply(inst, args);
    if (createResponse instanceof Stratox) {
      if (createResponse.getViews().length > 0) {
        inst = createResponse.getViews();
      } else {
        inst = Array(createResponse);
      }
    } else if (typeof createResponse === 'string' || typeof createResponse === 'object') {
      if (typeof createResponse[0] === 'object') {
        inst = createResponse;
      } else {
        if (createResponse?.clone === true) {
          inst = this.clone();
        }
        response = (createResponse?.output ?? (typeof createResponse === 'string' ? createResponse : ''));

        Stratox.setComponent('StratoxPlaceholderView', (placeholder) => placeholder.response);
        inst.view('StratoxPlaceholderView', {
          response,
        });

        inst = Array(inst);
      }
    }

    // Pass response to builder
    if (createResponse?.type !== 'takeover') {
      const obj = App.createResponse(inst);
      if (response === undefined) {
        response = '';
      }
      if (typeof response !== 'string') {
        throw new Error('The controller response needs to be string or an instance of Stratox');
      }

      if (typeof data.callable === 'function') {
        if (obj.inst === undefined) {
          obj.inst = inst;
        }
        const call = data.callable.apply(obj.inst, [obj.response, data.meta]);
        return call;
      }
    }

    return response;
  }

  /**
   * Create the stratox view response
   * @param  {Stratox} response
   * @return {object}
   */
  static createResponse(response) {
    let i;
    let output = '';
    for (i = 0; i < response.length; i++) {
      const inst = response[i]; let carrot = false; let uniqueIDA;
      const uniqueIDB = `stratox-el-${App.genRandStr(10)}`;
      let out = '';

      out = inst.execute(() => {
        if (carrot) {
          const el = document.getElementById(uniqueIDA);
          if (el) {
            el.outerHTML = inst.getResponse();
          }
        }
        inst.setElement(`#${uniqueIDB}`);
      });
      if (inst.hasView() === false) {
        // Create a valid DOM shadow tag as a reference to view.
        carrot = true;
        uniqueIDA = `stratox-node-${App.genRandStr(10)}`;
        out = `<template id="${uniqueIDA}"></template>`;
      }
      out = `<div id="${uniqueIDB}">${out}</div>`;
      output += out;
    }

    return {
      response: output,
      inst: response[0],
    };
  }

  /**
   * Get the Dispatcher instance
   * @return {Dispatcher}
   */
  getDispatcher() {
    return this.#dispatcher;
  }

  /**
   * Dynamic function for collecting Server requests
   * @param  {string} type
   * @return {function}
   */
  serverParams(type) {
    return this.#dispatcher.serverParams(type);
  }

  /**
   * Dynamic function for collecting common js requests
   * @param  {string} type
   * @return {function}
   */
  request(type) {
    return this.#dispatcher.request(type);
  }

  /**
   * Set app main element
   * @param {string} elem  Set elem Query element string
   * @return {self}
   */
  setElement(elem) {
    this.#elem = elem;
    return this;
  }

  /**
   * Set app main element
   * @param {string} elem  Set elem Query element string
   * @return {self}
   */
  getElement() {
    return this.#elem;
  }

  /**
   * Setup / init app
   * @param  {string} elem Query element string
   * @return {self}
   */
  setup(elem) {
    this.setElement(elem);
    this.#dispatcher = new Dispatcher(this.#config.dispatcher);
    return this;
  }

  /**
   * Mount app to dispatcher
   * @param  {Router} routeCollection Instance of Router (@Stratox/Pilot Router)
   * @param  {Function} serverParams Dynamic function for collecting server requests
   *                                 (App.serverParams("hash") or App.request("path"))
   * @param  {Function} fn Set index view
   * @return {self}
   */
  mount(routeCollection, serverParams, fn) {
    const elem = this.getElement();
    const name = (typeof elem === 'string' ? elem : 'main');
    const stratox = new StratoxExtend(elem, this.#config);

    if (typeof window?.Alpine?.initTree === 'function') {
      if (!window.Alpine.started) {
        window.Alpine.start();
      }
    }

    stratox.container().set('dispatch', this.#dispatcher);

    this.#router = routeCollection;
    this.#dispatcher.dispatcher(routeCollection, serverParams, this.mountIndex(name, stratox, fn));
    stratox.onload(this.#config.ready.apply(this, [stratox, this.#dispatcher, this.#router]));
    return this;
  }

  /**
   * Mount app to dispatcher
   * @param  {Router} routeCollection Instance of Router (@Stratox/Pilot Router)
   * @param  {Function} serverParams Dynamic function for collecting server requests
   *                                 (App.serverParams("hash") or App.request("path"))
   * @param  {Function} fn Set index view
   * @return {self}
   */
  singlton(fn) {
    const elem = this.getElement();
    const name = (typeof elem === 'string' ? elem : 'main');
    const stratox = new StratoxExtend(elem, this.#config);
    const singleton = this.mountIndex(name, stratox);

    singleton({
      controller: fn,
      method: 'GET',
    }, 200);

    return this;
  }

  /**
   * Will mount index view
   * @param  {string}   name    Index view name
   * @param  {Stratox}  stratox Instance of Stratox
   * @param  {Function} fn
   * @return {Function}
   */
  mountIndex(name, stratox, fn) {
    const inst = this;
    Stratox.setComponent(name, this.main);

    return (dispatchData, status) => {
      inst.mountCallback(dispatchData, () => {
        stratox.view(name, {
          meta: dispatchData,
          app: inst,
          callable: fn,
        });

        return stratox.execute();
      }, (status !== 200));
    };
  }

  /**
   * Take over the responder
   * @param  {callable} call
   * @return {void}
   */
  responder(call) {
    if (typeof call !== 'function') {
      throw new Error('The responder argument 1 has to be a callable!');
    }
    this.#config.responder = call;
  }

  getDispatchConfig(dispatchData) {
    if (typeof dispatchData.config === 'object') {
      return dispatchData.config;
    }
    return false;
  }

  /**
   * Mount callable
   * @param  {object}   dispatchData The dispatcher response
   * @param  {callable}   call
   * @param  {bool}      disableFetch Disable the fetch
   * @return {void}
   */
  mountCallback(mountDispData, call, disableFetch) {
    const dispatchData = mountDispData;
    const inst = this;
    const configs = this.getDispatchConfig(dispatchData);
    const responseConfig = inst.overwriteConfigFromRouter(configs, { ...inst.#config.request });

    if (typeof responseConfig.url === 'string' && (disableFetch === false)) {
      const responsePath = inst.getResponseType(responseConfig?.path, dispatchData.path);
      const path = UrlHelper.getPath(responsePath, responseConfig.startPath);
      const fetch = new StratoxFetch(responseConfig.url + path, responseConfig.config);
      fetch.setQueryStr(responseConfig.get(dispatchData.request.get));

      const ajaxConfig = responseConfig.config;
      dispatchData.url = fetch.getUrl();

      if (typeof inst.#config.responder === 'function') {
        inst.#config.responder(call, dispatchData, fetch.getUrl(), path);
      } else {
        fetch.setMethod(dispatchData.verb);
        if ((dispatchData.verb === 'POST' || dispatchData.verb === 'PUT') && (typeof dispatchData?.request?.post === 'object')) {
          fetch.setData(responseConfig.post(dispatchData.request.post));
        }

        fetch.prepare((response) => {
          const errorController = inst.#router.getStatusError(response.status);
          if (errorController) {
            dispatchData.controller = errorController;
            dispatchData.status = response.status;
            throw new Error(`HTTP Status error code ${response.status}`);
          }
        }).execute((response) => {
          dispatchData.response = response;
          call(dispatchData);
        }).error(() => {
          call(dispatchData);
        });
      }
    } else if (typeof inst.#config.responder === 'function') {
      inst.#config.responder(call, dispatchData, '', '');
    } else {
      call(dispatchData);
    }
  }

  /**
   * Get response either from router or dispatch
   * @param  {mixed} value
   * @param  {mixed} defaultValue
   * @return {mixed}
   */
  getResponseType(value, defaultValue) {
    let val = value;
    if (typeof value === 'function') {
      val = value(defaultValue);
    }
    if (val !== undefined && val !== false && val !== null) {
      return val;
    }
    return (defaultValue !== undefined) ? defaultValue : false;
  }

  /**
   * Overwrite app default configs from router
   * @param  {mixed} router
   * @param  {mixed} config
   * @return {mixed}
   */
  overwriteConfigFromRouter(router, config) {
    const fromRouter = router;
    let fromConfig = config;
    if (fromRouter !== undefined) {
      if (fromRouter === false) {
        fromConfig = false;
      } else {
        fromConfig = ObjectHelper.deepMerge(fromConfig, fromRouter);
      }
    }
    return fromConfig;
  }

  /**
   * Will return the expected prepare views that will be built by vite and
   * used as a dynamic view public!
   * @return {void}
   */
  getPreparedViews(call) {
    Object.keys(this.#config.prepAsyncViews).forEach((path) => {
      this.#config.prepAsyncViews[path]().then((mod) => {
        call(mod);
      });
    });
  }

  /**
   * Will help you set the the view directory
   * @param {string} dir
   */
  setViewDirectory(dir) {
    return (import.meta.env.DEV ? dir : './views/');
  }

  /**
   * Get expected class
   * @param  {object} data
   * @return {object}
   */
  static getClass(data) {
    let controllerClass;
    const [FirstController] = data.controller || [];
    if (typeof FirstController?.constructor === 'function') {
      if (typeof FirstController === 'function') {
        controllerClass = new FirstController();
      } else {
        controllerClass = FirstController;
      }
    }
    return controllerClass;
  }

  /**
   * Generate a random string
   * @param  {int} length Max string gen length
   * @return {string}
   */
  static genRandStr(length) {
    return (Math.random().toString(36).substring(2, 2 + length));
  }
}
