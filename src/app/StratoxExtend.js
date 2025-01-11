import Stratox from 'stratox/src/Stratox';
import StratoxFetch from './StratoxFetch';

export default class StratoxExtend extends Stratox {
  #views = [];

  /**
   * Create a self contained block within a view
   * @param  {string|object|function} key
   * @param  {object} data
   * @param  {function} call
   * @return {object|string}
   */
  block(view, data, config) {
    const isFetch = (data instanceof StratoxFetch);
    const doneCall = (typeof config === 'function') ? config : config?.response;
    const elID = this.getID(this.genRandStr(6));
    const output = `<div id="${elID}"></div>`;
    let itemInherit = {};
    const inst = this.attachViewToEl(`#${elID}`, view, (isFetch ? {} : data), (instArg, itemArg, el) => {
      const viewInst = this;
      const item = itemArg;
      if (isFetch) {
        data.complete((response) => {
          itemArg.setLoading(false);
          item.data = response;
          if (typeof doneCall === 'function') {
            doneCall.apply(instArg, [item.data, instArg, item, el]);
          }
          instArg.update();
        });
      } else if (typeof doneCall === 'function') {
        itemArg.setLoading(false);
        doneCall.apply(instArg, [item.data, instArg, item, el]);
      }
    }, (instArg, itemArg, el) => {
      itemInherit = itemArg;
      itemArg.setLoading(true);
      if (typeof config?.modify === 'function') {
        config.modify.apply(instArg, [instArg, itemArg, el]);
      }
    });

    return {
      output,
      view: inst,
      item: itemInherit,
      toString() {
        return output;
      },
    };
  }

  /**
   * Create a latyout with new stratox view instances avoiding bubbling problems
   * This should be used instead of view inside of the framework
   * @param  {string|object|function} key
   * @param  {object} data
   * @param  {function} call
   * @return {object}
   */
  layout(key, data, call) {
    const view = this.clone();
    const item = view.view(key, data, call);
    this.#views.push(view);
    return { view, item };
  }

  /**
   * Will load as partial if not a utilizing fetch API
   * @param  {string|object|function} key
   * @param  {object} data
   * @param  {function} call
   * @return {object|string}
   */
  partial(key, data, call) {
    if (data instanceof StratoxFetch) {
      return this.block(key, data, call);
    }
    return this.partialEngine(key, data, call);
  }

  /**
   * Get prepared views ready to be executed
   * @return {array}
   */
  getViews() {
    return this.#views;
  }

  /**
   * Create a view instance
   * @param  {callable} view
   * @param  {object|StratoxFetch} data
   * @return {string}
   */
  view(key, data, call) {
    const inst = this;
    if (data instanceof StratoxFetch) {
      const view = inst.viewEngine(key, {});
      view.setLoading(true);
      data.complete((response) => {
        view.setLoading(false);
        view.data = response;
        view.update();
      });
      return view;
    }
    return inst.viewEngine(key, data);
  }

  /**
   * Open new Stratox instance
   * @param  {string} elem String element query selector
   * @return {Stratox}
   */
  clone(elem) {
    return new StratoxExtend(elem);
  }

  /**
   * DEPRECTAED: Use clone instead
   */
  open(elem) {
    return this.clone(elem);
  }

  /**
   * DEPRECTAED: Use block instead
   */
  attachPartial(...args) {
    return this.block(...args);
  }
}
