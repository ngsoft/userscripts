(function(root, factory){
    /* globals define, require, module, self */
    const
            name = "data",
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
}(typeof self !== 'undefined' ? self : this, function(utils, undef){

    const{s, u, isPlainObject} = utils;


    /**
     * Some browser injections
     */
    if (HTMLElement ? HTMLElement.prototype : false) {

        /**
         * Set or Get value from Element.dataset
         * @param {string|object} key
         * @param {any} value
         * @returns {any}
         */
        HTMLElement.prototype.data = HTMLElement.prototype.data || function(key, value){
            const self = this;
            if (typeof key === s) {
                if (typeof value !== u) {
                    if (value === null) delete(self.dataset[key]);
                    else self.dataset[key] = typeof value === s ? value : JSON.stringify(value);
                } else if ((value = self.dataset[key]) !== undef) {
                    let retval;
                    try {
                        retval = JSON.parse(value);
                    } catch (e) {
                        retval = value;
                    }
                    return retval;
                }
                return undef;
            } else if (isPlainObject(key)) {
                Object.keys(key).forEach((k) => {
                    self.data(k, key[k]);
                });
                return undef;
            } else if (typeof key === u) {
                //returns all data
                let retval = {};
                Object.keys(this.dataset).forEach((k) => {
                    retval[k] = self.data(k);
                });
                return retval;
            }
        };


        HTMLElement.prototype.siblings = HTMLElement.prototype.siblings || function(selector){
            const self = this, retval = [];
            selector = typeof selector === s ? selector : null;
            if (self.parentElement !== null) {
                let list = self.parentElement.children;
                for (let i = 0; i < list.length; i++) {
                    let el = list[i];
                    if (el === self) continue;
                    if (selector !== null ? el.matches(selector) === false : false) continue;
                    retval.push(el);
                }
            }
            return retval;
        };
    }


    if (NodeList ? NodeList.prototype : false) {
        /**
         * Set or Get value from Element.dataset
         * @param {string|object} key
         * @param {any} value
         * @returns {undefined}
         */
        NodeList.prototype.data = NodeList.prototype.data || function(key, value){
            const self = this;
            if (((typeof key === s) || typeof key === u) && (typeof value === u)) {
                //reads from first element
                if (self.length > 0) return self[0].data(key);
                return undef;
            } else self.forEach((el) => {
                    el.data(key, value);
                });
        };
    }



    return {};


}));



