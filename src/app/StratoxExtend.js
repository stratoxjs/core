import { Stratox } from 'stratox/src/Stratox';
import StratoxFetch from './StratoxFetch';

export default class StratoxExtend extends Stratox {

	/**
     * Attach view is the same as attachViewToEl
     * EXCEPT for that it will also prepare the element container!
     */
    attachPartial(view, data, call) {
        const elID = this.getID(this.genRandStr(6));
        const clone = this.attachViewToEl(`#${elID}`, view, data, function(item, el) {
        	// Ajax
        	if(typeof call === "function") {
        		call(...arguments);
        	}
        });
        return `<div id="${elID}"></div>`;
    }

    view(key, data) {
        const inst = this;
        if(data instanceof StratoxFetch) {
            const view = inst._view(key, {
                isLoading: true
            });
            data.complete((response) => {
                response.isLoading = false;
                view.data = response;
                view.update();
            });
            return view;
        } else {
            return inst._view(key, data);
        }
    }

    /**
     * Open new Stratox instance
     * @param  {string} elem String element query selector
     * @return {Stratox}
     */
    clone(elem) {
        return new StratoxExtend(elem);
    }

    open(elem) {
	    return this.clone(elem);
	}
}