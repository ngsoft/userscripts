(function(root, factory){
    /* globals define, require, module, self, EventTarget */
    const
            name = "events",
            dependencies = ['utils'];
    if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    } else if (typeof exports === 'object' && module.exports) {
        module.exports = factory(...dependencies.map(dep => require(dep)));
    } else {
        root.require = root.require || function(dep){
            let result;
            Object.keys(Object.getOwnPropertyDescriptors(root)).some(key => {
                if (key.toLowerCase() === dep.toLowerCase()) result = root[key];
                return typeof result !== "undefined";
            });
            return result;
        };
        root[name] = factory(...dependencies.map(dep => require(dep)));/*jshint ignore:line */
    }
}(typeof self !== 'undefined' ? self : this, function events(utils, undef){


    const {s, f, b, doc, isPlainObject} = utils;

    /**
     * Small Event Wrapper
     * @param {EventTarget} target
     * @param {Object} binding
     * @returns {Events}
     */
    function Events(target, binding){

        if (typeof target === s) target = doc.querySelector(target);

        if (this instanceof Events) {
            const self = this;
            binding = binding instanceof Object ? binding : target;
            if (!(target instanceof EventTarget)) target = doc.createElement('div');
            if (!(binding instanceof EventTarget)) {
                ["on", "off", "one", "trigger"].forEach(method => {
                    binding[method] = function(...args){
                        self[method].apply(self, args);
                        return this;
                    };
                });
            }
            Object.assign(this, {
                target: target,
                binding: binding,
                events: []
            });
            return this;
        } else if ((target instanceof EventTarget)) return new Events(...arguments);

    }

    Events.prototype = {
        /**
         * Add an event listener
         * @param {string} type
         * @param {function} listener
         * @param {boolean|Object} options
         * @returns {Events}
         */
        on(type, listener, options){
            if (typeof type === s && typeof listener === f) {
                const self = this,
                        params = {
                            once: false,
                            capture: false
                        },
                        handler = listener.bind(self.binding);
                if (typeof options === b) params.capture = options;
                else if (isPlainObject(options)) Object.keys(params).forEach(key => {
                        params[key] = options[key] === true;
                    });
                type.split(/\s+/).forEach(type => {
                    self.events.push({
                        type: type,
                        listener: listener,
                        handler: handler,
                        options: params
                    });
                    self.target.addEventListener(type, handler, params);
                });
            }
            return this;
        },
        /**
         * Add an event listener that can be triggered once
         * @param {string} type
         * @param {function} listener
         * @param {boolean} capture
         * @returns {Events}
         */
        one(type, listener, capture){
            if (typeof type === s && typeof listener === f) this.on(type, listener, {
                    once: true,
                    capture: capture === true
                });
            return this;
        },
        /**
         * Removes an event listener
         * @param {string} type
         * @param {function} listener
         * @param {boolean} capture
         * @returns {Events}
         */
        off(type, listener, capture){
            if (typeof type === s) {
                const self = this,
                        params = {
                            capture: false
                        };
                let callback;
                for (let i = 1; i < arguments.length; i++) {
                    let arg = arguments[i];
                    switch (typeof arg) {
                        case b:
                            params.capture = arg;
                            break;
                        case f:
                            callback = arg;
                            break;
                        default:
                            break;
                    }
                }
                type.split(/\s+/).forEach(type => {
                    self.events = self.events.filter(evt => {
                        if (typeof callback === f) {
                            if (type === evt.type && params.capture === evt.params.capture && callback === evt.listener) {
                                self.target.removeEventListener(type, evt.handler, params.capture);
                                return false;
                            }
                        } else if (type === evt.type) {
                            self.target.removeEventListener(type, evt.handler, evt.params.capture);
                            return false;
                        }
                        return true;
                    });
                });
            }
            return this;
        },
        /**
         * Dispatches an event
         * @param {string} type
         * @param {any} data
         * @returns {Events}
         */
        trigger(type, data){
            if (typeof type === s) {
                const self = this;
                data = data !== undef ? data : {};
                type.split(/\s+/).forEach(type => {
                    let event;
                    if (self.target.parentElement === null) event = new Event(type);
                    else event = new Event(type, {
                            bubbles: true,
                            cancelable: true
                        });
                    Object.assign(event, data);
                    self.target.dispatchEvent(event);
                });
            }
            return this;
        }


    };


    /**
     * Dispatches an Event
     * @param {EventTarget} el
     * @param {string} type
     * @param {any} data
     * @returns {undefined}
     */
    function trigger(el, type, data){
        if (el instanceof EventTarget) {
            if (typeof type === s) {
                let event;
                type.split(/\s+/).forEach((t) => {
                    if (el.parentElement === null) event = new Event(type);
                    else event = new Event(t, {bubbles: true, cancelable: true});
                    Object.assign(event, data);
                    el.dispatchEvent(event);
                });
            }
        }
    }


    return {
        Events, trigger
    };



}));



