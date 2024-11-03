import { Stratox } from 'stratox/src/Stratox';
import StratoxFetch from './StratoxFetch';

export default class StratoxExtend extends Stratox {
  /**
   * Create a self contained block within a view
   * @param  {callable} view
   * @param  {object|StratoxFetch} data
   * @param  {callable} call
   * @return {string}
   */
  block(view, data, config) {
    const isFetch = (data instanceof StratoxFetch);
    const elID = this.getID(this.genRandStr(6));
    const output = `<div id="${elID}"></div>`;
    const inst = this.attachViewToEl(`#${elID}`, view, (isFetch ? { isLoading: true } : data), (itemArg, el) => {
      const viewInst = this;
      const item = itemArg;
      if (isFetch) {
        data.complete((response) => {
          response.isLoading = false;
          item.data = response;
          if (typeof config?.response === 'function') {
            config.response(item.data, item, el);
          }
          viewInst.update();
        });
      } else if (typeof config?.response === 'function') {
        config.response(item.data, item, el);
      }
    }, config?.modify);

    return {
      output,
      view: inst,
      toString() {
        return output;
      },
    };
  }

  /**
   * Create a block within a view
   * @param  {callable} view
   * @param  {object|StratoxFetch} data
   * @return {string}
   */
  view(key, data, call) {
    const inst = this;
    if (data instanceof StratoxFetch) {
      const view = inst.viewEngine(key, {
        isLoading: true,
      });

      data.complete((response) => {
        response.isLoading = false;
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
