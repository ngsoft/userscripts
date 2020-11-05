(function(root, factory){
    /* globals define, require, module, self */
    const
            name = "storage",
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
}(typeof self !== 'undefined' ? self : this, function(utils){

    const {f, s, u, isPlainObject, GM_getValue, GM_setValue, GM_deleteValue, GM_listValues} = utils;



    /**
     * Defines an Interface
     */
    class Iface {

        get __ABSTRACT(){
            return [];
        }

        constructor(){

            let
                    name = this.constructor.name,
                    proto = Object.getPrototypeOf(this),
                    parents = [];

            while (proto instanceof Iface) {
                parents.push(proto);
                proto = Object.getPrototypeOf(proto);
            }
            if (parents.length > 1) {
                const
                        iface = parents.pop(),
                        abstract = Array.isArray(this.__ABSTRACT) ? this.__ABSTRACT : [],
                        declared = [];
                abstract.push('constructor');

                const methods = Object.keys(Object.getOwnPropertyDescriptors(iface)).filter(key => typeof iface[key] === f && !abstract.includes(key));

                if (methods.length === 0) {
                    throw new Error('Iface class ' + iface.constructor.name + ' does not declare methods that are not abstract (do you need to make it an interface?).');
                }

                parents.forEach(proto => {
                    Object.keys(Object.getOwnPropertyDescriptors(proto)).forEach(method => {
                        if (typeof proto[method] === f && methods.includes(method)) {

                            if (iface[method].length !== proto[method].length) {
                                throw new Error(`Iface ${iface.constructor.name}.${method}() expects ${iface[method].length} parameters, ${proto[method].length} given in ${proto.constructor.name}.${method}()`);
                            }
                            declared.push(method);
                        }
                    });
                });
                if (methods.length > declared.length) {
                    throw new Error('class ' + name + ' does not declare ' + methods.filter(m => declared.includes(m) === false).join('(), ') + '().');
                }
            } else throw new Error('Iface ' + name + ' cannot be instanciated.');
        }
    }


    /**
     * DataStore Interface
     * @type {Class}
     */
    class DataStore extends Iface {
        /**
         * Gets a value from the storage
         * @param {string|undefined} key if not using key all the storage will be returned
         * @returns {any}
         */
        get(key){ }
        /**
         * Adds a value to the storage
         * @param {string|Object} key storage key or key/value pair
         * @param {any} [val]
         * @returns {DataStore}
         */
        set(key, val){ }
        /**
         * Checks if storage has a value for the given key
         * @param {string} key
         * @returns {Boolean}
         */
        has(key){ }
        /**
         * Remove a value from the storage
         * @param {string} key
         * @returns {DataStore}
         */
        remove(key){ }
        /**
         * Empty the storage
         * @returns {DataStore}
         */
        clear(){ }
    }
    ;




    /**
     * Store data into an Object
     * @type {Class}
     * @extends {Datastore}
     */
    class nullStore extends DataStore {

        constructor(storage){
            super();
            storage = storage || {};
            Object.defineProperty(this, 'storage', {
                value: storage, enumerable: false,
                configurable: true, writable: true
            });
        }
        get(key){
            let retval;
            if (typeof key === s) retval = this.storage[key];
            else if (typeof key === u) retval = Object.assign({}, this.storage);
            return retval;
        }
        set(key, val){
            if (typeof key === s && typeof val !== u) this.storage[key] = val;
            else if (isPlainObject(key)) Object.assign(this.storage, key);
            return this;
        }
        has(key){
            return typeof this.storage.hasOwnProperty(key);
        }
        remove(key){
            delete this.storage[key];
            return this;
        }
        clear(){
            this.storage = {};
            return this;
        }

    }

    /**
     * Store data into localStorage or sessionStorage
     * @type {Class}
     * @extends {Datastore}
     * @param {Storage} storage
     */
    class xStore extends DataStore {

        constructor(storage){
            super();
            if (!(storage instanceof Storage)) {
                throw new Error('xStore : argument not instance of Storage');
            }
            Object.defineProperty(this, 'storage', {
                value: storage, configurable: true,
                enumerable: false, writable: false
            });
        }

        get(key){
            let retval, sval;
            if (typeof key === s) {
                if ((sval = this.storage.getItem(key)) !== null) {
                    try {
                        retval = JSON.parse(sval);
                    } catch (e) {
                        retval = sval;
                    }
                }
            } else if (typeof key === u) {
                //get all
                retval = {};
                for (let i = 0; i < this.storage.length; i++) {
                    key = this.storage.key(i);
                    retval[key] = this.get(key);
                }
            }
            return retval;

        }
        set(key, val){
            if (typeof key === s && typeof val !== u) {
                if (typeof val !== s) {
                    let sval = val;
                    try {
                        val = JSON.stringify(sval);
                    } catch (e) {
                        val = sval;
                    }
                }
                this.storage.setItem(key, val);

            } else if (isPlainObject(key)) Object.keys(key).forEach(k => this.set(k, key[k]));
            return this;
        }
        has(key){
            return this.storage.hasOwnProperty(key);
        }
        remove(key){
            if (typeof key === s) this.storage.removeItem(key);
            return this;
        }
        clear(){
            this.storage.clear();
            return this;
        }

    }

    /**
     * Store data into GreaseMonkey 3 or Tampermonkey
     * @type {Class}
     * @extends {DataStore}
     */
    class gmStore extends DataStore {
        /* globals GM_getValue, GM_setValue, GM_deleteValue, GM_listValues */
        constructor(){
            super();
            const errors = ["GM_getValue", "GM_setValue", "GM_deleteValue", "GM_listValues"].filter(x => typeof utils[x] !== f);
            if (errors.length > 0) throw new Error('gmStore:  %s are not available.'.replace('%s', errors.join(', ')));
        }
        get(key){
            let retval;
            if (typeof key === s) retval = GM_getValue(key);
            else if (typeof key === u) {
                retval = {};
                GM_listValues().forEach(key => retval[key] = this.get(key));
            }
            return retval;

        }
        set(key, val){
            if (typeof key === s && typeof val !== u) GM_setValue(key, val);
            else if (isPlainObject(key)) Object.keys(key).forEach(k => this.set(k, key[k]));
            return this;
        }
        has(key){
            return GM_listValues().includes(key);
        }
        remove(key){
            if (typeof key === s) GM_deleteValue(key);
            return this;
        }
        clear(){
            GM_listValues().forEach(key => this.remove(key));
            return this;
        }
    }


    /**
     * Manages a subkey in any DataStore
     * @type {Class}
     * @extends {DataStore}
     */
    class exStore extends nullStore {

        constructor(datastore, key){

            if (typeof key !== s) throw new Error('exStore Invalid argument key');
            if (!(datastore instanceof DataStore)) throw new Error('exStore Invalid argument datastore');

            let obj = datastore.get(key);
            if (!isPlainObject(obj)) obj = {};
            super(obj);
            Object.defineProperty(this, 'datastore', {
                value: datastore, enumerable: false,
                configurable: true, writable: true
            });

            Object.defineProperty(this, 'key', {
                value: key, enumerable: false,
                configurable: true, writable: true
            });

        }

        set(key, val){
            super.set(key, val);
            this.datastore.set(this.key, this.storage);//sync data
            return this;
        }
        remove(key){
            super.remove(key);
            this.datastore.set(this.key, this.storage);//sync data
            return this;
        }
        clear(){
            super.clear();
            this.datastore.set(this.key, this.storage);//sync data
            return this;
        }

    }

    return {Iface, nullStore, xStore, gmStore, exStore};

}));


