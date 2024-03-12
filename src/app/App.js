import { Stratox } from 'stratox/src/Stratox';
import { Dispatcher } from '@stratox/pilot';
import { ObjectHelper, UrlHelper } from '@stratox/core';

export default class App {

	#stratox;
	#dispatcher;
	#router;
	#config = {};
	#elem;

	constructor(config) {
		
		const inst = this;
		
		if(!config?.prepAsyncViews) {
			config.prepAsyncViews = import.meta.glob('@/templates/views/**/*.js');
		}

		inst.#config = ObjectHelper.deepMerge({
			prepAsyncViews: {},
			directory: '/src/templates/views/',
			components: {},
			helper: {},
			responder: null,
			dispatcher: {
				catchForms: true
			},
			ajax: {
				startPath: "",
				url: "",
				dataType: "json",
				config: {
					method: "GET",
					headers: {
						// Indicates that the client expects JSON data
						'Accept': 'application/json',
				    }
				}
			}
		}, config);

		Stratox.setConfigs({
			cache: false,
			popegation: false,
			directory: inst.setViewDirectory(inst.#config.directory),
			handlers: {
		        fields: inst.#config.components,
		        helper: inst.#config.helper
		    }
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
		let response, method, inst = this.open();
		
		// Controller
		if(typeof data.meta.controller === "function") {
			method = data.meta.controller;
		} else {
			const controllerClass = App.getClass(data.meta);
			if(controllerClass) method = controllerClass[data.meta.controller[1]];
		}
		
		if(typeof method !== "function") {
			throw new Error("The router controller argument expects either a callable or an array with class and method");
		}

		// Response
		let createResponse = method.apply(inst, [data.meta, container, helper, builder, data.app]);
		if(createResponse instanceof Stratox) {
			inst = Array(createResponse);

		} else if(typeof createResponse === "string" || typeof createResponse === "object") {
			
			if(typeof createResponse[0] === "object") {
				inst = createResponse;

			} else {
				if(!createResponse?.append) {
					inst = this.open();
				}
				response = (createResponse?.output ?? (typeof createResponse === "string" ? createResponse : ""));
				Stratox.setComponent("StratoxPlaceholderView", function(data) {
					return data.response;
				});
				inst.view("StratoxPlaceholderView", {
					response: response
				});
				
				inst = Array(inst);
			}			
		}

		// Pass response to builder
		if(createResponse?.type !== "takeover") {
			const obj = App.createResponse(inst);
			if(response === undefined) {
	            response = "";
	        }
	        if(typeof response !== "string") {
	            throw new Error("The controller response needs to be string or an instance of Stratox");
	        }

			if(typeof data.callable === "function") {
				let call = data.callable.apply(obj.inst, [obj.response, data.meta]);
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
		let i, output = "";
		for(i = 0; i < response.length; i++) {
			let inst = response[i], carrot = false, uniqueIDA, uniqueIDB = "stratox-el-"+App.genRandStr(10), out = "";
			out = inst.execute(function() {
       			if(carrot) {
       				inst.eventOnload(function() {
	       				const el = document.getElementById(uniqueIDA);
	       				el.outerHTML = inst.getResponse();
       				});
       			}
       			inst.eventOnload(function() {
       				inst.setElement("#"+uniqueIDB);
       			});
       		});

			if(inst.hasView() === false) {
				// Create a valid DOM shadow tag as a reference to view.
       			carrot = true;
       			uniqueIDA = "stratox-node-"+App.genRandStr(10);
       			out = '<template id="'+uniqueIDA+'"></template>';
       		}
       		out = '<div id="'+uniqueIDB+'">'+out+'</div>';
       		output += out;
		}

		return {
        	response: output,
        	inst: response[0]
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
	 * @param  {Router}   	routeCollection Instance of Router (@Stratox/Pilot Router)
	 * @param  {Function}   serverParams    Dynamic function for collecting server requests (App.serverParams("hash") or App.request("path"))
	 * @param  {Function} 	fn              Set index view
	 * @return {self}
	 */
	mount(routeCollection, serverParams, fn) {
		const elem = this.getElement();
		const name = (typeof elem === "string" ? elem : "main");
		const stratox = new Stratox(elem, this.#config);

		this.#router = routeCollection;
		this.#dispatcher.dispatcher(routeCollection, serverParams, this.mountIndex(name, stratox, fn));
		return this;
	}

	/**
	 * Mount app to dispatcher
	 * @param  {Router}   	routeCollection Instance of Router (@Stratox/Pilot Router)
	 * @param  {Function}   serverParams    Dynamic function for collecting server requests (App.serverParams("hash") or App.request("path"))
	 * @param  {Function} 	fn              Set index view
	 * @return {self}
	 */
	singlton(fn) {
		const elem = this.getElement();
		const name = (typeof elem === "string" ? elem : "main");
		const stratox = new Stratox(elem, this.#config);
		const singleton = this.mountIndex(name, stratox);

		singleton({
			controller: fn,
			method: "GET"
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

		return function(dispatchData, status) {
			inst.mountCallback(dispatchData, function() {
				  stratox.view(name, {
					meta: dispatchData,
					app: inst,
					callable: fn
				});

				return stratox.execute();

			}, (status !== 200));
		}
	}

	/**
	 * Take over the responder
	 * @param  {callable} call
	 * @return {void}
	 */
	responder(call) {
		if(typeof call !== "function") {
			throw new Error("The responder argument 1 has to be a callable!")
		}
		this.#config.responder = call;
	}

	/**
	 * Mount callable
	 * @param  {object} 	dispatchData The dispatcher response
	 * @param  {callable} 	call
	 * @param  {bool} 		disableFetch Disable the fetch
	 * @return {void}
	 */
	mountCallback(dispatchData, call, disableFetch) {
		const inst = this;
		if(typeof inst.#config.ajax.url === "string" && (disableFetch === false)) {
			const url = UrlHelper.trimTrailingSlashes(inst.#config.ajax.url);
			const path = UrlHelper.getPath(dispatchData.path, this.#config.ajax.startPath);
			const queryStr = UrlHelper.getQueryStr(dispatchData.request.get);
			const uri = url+path+queryStr;
			const ajaxConfig = inst.#config.ajax.config;

			dispatchData.url = url;

			if(typeof inst.#config.responder === "function") {
				inst.#config.responder(call, dispatchData, url, path);
			} else {

				ajaxConfig.method = dispatchData.verb;
				if(dispatchData.verb == "POST" && dispatchData.request.post instanceof FormData) {
					ajaxConfig.body = dispatchData.request.post;
				}

				const fetchResponse = fetch(uri, ajaxConfig);
				fetchResponse.then(function(response) {

					const errorController = inst.#router.getStatusError(response.status);
		        	if(errorController) {
		        		dispatchData.controller = errorController;
		        		dispatchData.status = response.status;
		        		throw new Error(`HTTP Status error code ${response.status}`);
		        	}

		        	if(typeof response[inst.#config.ajax.dataType] !== "function") {
		        		throw new Error(`The data type ${inst.#config.ajax.dataType} is not supported in fetch`);		        		
		        	}

		        	return response[inst.#config.ajax.dataType](); 
					
				}).then(function(dataResponse) {

					if(inst.#config.ajax.dataType === "xml") {
						const parser = new DOMParser();
    					dispatchData.response = parser.parseFromString(dataResponse, "application/xml");

					} else {
						dispatchData.response = dataResponse;
					}
					call(dispatchData);

				}).catch(function(error) {
				    console.error('There was a problem with your fetch operation:', error);
				    call(dispatchData);
				});
			}

		} else {
			if(typeof inst.#config.responder === "function") {
				inst.#config.responder(call, dispatchData, url, path)
			} else {
				call(dispatchData);
			}
		}
	}

	/**
	 * Will return the expected prepare views that will be built by vite and used as a dynamic view public!
	 * @return {void}
	 */
	getPreparedViews(call) {
        for (const path in this.#config.prepAsyncViews) {
            this.#config.prepAsyncViews[path]().then((mod) => {
            	call(mod);
            });
        }  
    }
    
    /**
	 * Will help you set the the view directory
	 * @param {string} dir
	 */
	setViewDirectory(dir) {
		return (import.meta.env.DEV ? dir : "./views/");
	}

	/**
	 * Get expected class
	 * @param  {object} data
	 * @return {object}
	 */
	static getClass(data) {
		let controllerClass;
		if(typeof data.controller?.[0]?.constructor === "function") {
			if(typeof data.controller[0] === "function") {
				controllerClass = new data.controller[0]();
			} else {
				controllerClass = data.controller[0];
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