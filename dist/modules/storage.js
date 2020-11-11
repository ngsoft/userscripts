(function(root, factory){
    /* globals define, require, module, self */
    const
            name = "storage",
            dependencies = ['GM'];
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
}(typeof self !== 'undefined' ? self : this, function yzb1pb3wd1fubjf7jutqyb(GM, undef){

    const {GM_getValue, GM_setValue, GM_deleteValue, GM_listValues} = GM;

    const

            // Scallar types
            s = "string",
            f = "function",
            u = "undefined",
            n = "number";
            

    /**
     * Test if given argument is a plain object
     * @param {any} v
     * @returns {Boolean}
     */
    function isPlainObject(v){
        return v instanceof Object && Object.getPrototypeOf(v) === Object.prototype;
    }


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
        constructor(){
            super();
        }
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

        get(key){
            let obj = this.datastore.get(this.key);
            if (!isPlainObject(obj)) obj = {};
            this.storage = obj;//sync data
            return super.get(key);
        }

        has(key){
            return this.get(key) !== undef;
        }

        set(key, val){
            this.get();
            super.set(key, val);
            this.datastore.set(this.key, this.storage);//sync data
            return this;
        }
        remove(key){
            this.get();
            super.remove(key);
            this.datastore.set(this.key, this.storage);//sync data
            return this;
        }
        clear(){
            this.datastore.set(this.key, {});//sync data
            return this;
        }

    }



    /**
     * Cache Item
     * @link https://www.php-fig.org/psr/psr-6/
     */
    class LSCacheItem {

        constructor(key, hit, value){
            this.key = key;
            this.hit = hit === true;
            this.value = value;
        }
        /**
         * Returns the key for the current cache item.
         *
         * The key is loaded by the Implementing Library, but should be available to
         * the higher level callers when needed.
         *
         * @returns {string} The key string for this cache item.
         */
        getKey(){
            return this.key;
        }

        /**
         * Retrieves the value of the item from the cache associated with this object's key.
         *
         * The value returned must be identical to the value originally stored by set().
         *
         * If isHit() returns false, this method MUST return null. Note that null
         * is a legitimate cached value, so the isHit() method SHOULD be used to
         * differentiate between "null value was found" and "no value was found."
         *
         * @return {any} The value corresponding to this cache item's key, or undefined if not found.
         */
        get(){
            return this.value;
        }

        /**
         * Confirms if the cache item lookup resulted in a cache hit.
         *
         * Note: This method MUST NOT have a race condition between calling isHit()
         * and calling get().
         *
         * @return {boolean} True if the request resulted in a cache hit. False otherwise.
         */
        isHit(){
            return this.hit === true;
        }

        /**
         * Sets the value represented by this cache item.
         *
         * The $value argument may be any item that can be serialized by PHP,
         * although the method of serialization is left up to the Implementing
         * Library.
         *
         * @param {any} value
         *
         * @return {LSCacheItem}   The invoked object.
         */
        set(value){
            this.value = value;
            return this;
        }

        /**
         * Sets the expiration time for this cache item.
         *
         * @param {Date|number} expiration
         *
         * @return {LSCacheItem} The called object.
         */
        expiresAt(expiration){
            if (typeof expiration === n) expiration = new Date(expiration);
            if (expiration instanceof Date) this.expiration = +expiration;
            return this;
        }


        /**
         * Sets the expiration time for this cache item.
         *
         * @param {number} time
         *
         * @return {LSCacheItem} The called object.
         */
        expiresAfter(time){
            if (typeof time === n) {
                let tt = +new Date();
                tt += time;
                this.expiration = +new Date(tt);
            }
            return this;
        }


    }





    /**
     * Cache data into localStorage
     * Item Cache Pool
     * @link https://www.php-fig.org/psr/psr-6/
     */
    class LSCache {
        /**
         * @returns {DataStore}
         */
        get storage(){
            return this._storage;
        }

        get prefix(){
            let prefix = this._prefix;
            if (prefix.length > 0) prefix += ":";
            prefix += 'LSCache:';
            return prefix;
        }

        get ttl(){
            return this._ttl;
        }

        get deferred(){
            return this._deferred;
        }

        get entries(){
            return this._entries;
        }

        /**
         * Creates a new cache pool
         * @param {number} [ttl]
         * @param {string} prefix
         * @param {DataStore} storage
         */
        constructor(ttl, prefix, storage){

            Object.defineProperties(this, {
                _ttl: {
                    configurable: true, enumerable: false, writable: true,
                    value: typeof ttl === n ? ttl : 60000
                },
                _prefix: {
                    configurable: true, enumerable: false, writable: true,
                    value: typeof prefix === s ? prefix : ""
                },
                _storage: {
                    configurable: true, enumerable: false, writable: true,
                    value: storage instanceof DataStore ? storage : new xStore(localStorage)
                },
                _deferred: {
                    configurable: true, enumerable: false, writable: true,
                    value: []
                },
                _entries: {
                    configurable: true, enumerable: false, writable: true,
                    value: null
                }

            });

            this._entries = new exStore(this.storage, (typeof prefix === s ? prefix : "") + ":LSCacheEntries");
            this._removeExpired();
        }

        _removeExpired(){
            let list = this.entries.get(), now = +new Date();
            Object.keys(list).forEach(key => {
                if (now > list[key]) {
                    this.entries.remove(key);
                    this.storage.remove(key);
                }
            });
        }

        /**
         * Returns a Cache Item representing the specified key.
         *
         * This method must always return a CacheItemInterface object, even in case of
         * a cache miss. It MUST NOT return null.
         *
         * @param {string} key The key for which to return the corresponding Cache Item.
         *
         *
         * @return {LSCacheItem} The corresponding Cache Item.
         */
        getItem(key){
            if (typeof key !== s) throw new Error("Invalid Argument");
            let value, pkey = this.prefix + key;
            if (this.hasItem(key)) value = this.storage.get(pkey);
            return new LSCacheItem(key, value !== undef, value);
        }

        /**
         * Returns a traversable set of cache items.
         *
         * @param {Array} keys An indexed array of keys of items to retrieve.
         *
         *
         * @return {Array}.
         */
        getItems(keys = []){
            let ret = [];
            if (Array.isArray(keys)) {
                for (let i = 0; i < keys.length; i++) {
                    ret.push(this.getItem(keys[i]));
                }
            }
            return ret;
        }
        /**
         * Confirms if the cache contains specified cache item.
         *
         * Note: This method MAY avoid retrieving the cached value for performance reasons.
         * This could result in a race condition with CacheItemInterface::get(). To avoid
         * such situation use CacheItemInterface::isHit() instead.
         *
         * @param {string} key The key for which to check existence.
         *
         *
         * @return {boolean}   True if item exists in the cache, false otherwise.
         */
        hasItem(key){
            if (typeof key !== s) throw new Error("Invalid Argument");
            this._removeExpired();
            return this.storage.has(this.prefix + key);
        }

        /**
         * Deletes all items in the pool.
         *
         * @return {boolean}  True if the pool was successfully cleared. False if there was an error.
         */
        clear(){
            const list = this.entries.get();
            Object.keys(list).forEach(key => {
                this.storage.remove(key);
            });
            this.entries.clear();
            return true;
        }

        /**
         * Removes the item from the pool.
         *
         * @param {string} key The key to delete.
         *
         *
         * @return {boolean} True if the item was successfully removed. False if there was an error.
         */
        deleteItem(key){
            if (typeof key !== s) throw new Error("Invalid Argument");
            let list = this.entries.get(), pkey = this.prefix + key;
            this.entries.remove(pkey);
            this.storage.remove(pkey);
            return true;
        }

        /**
         * Removes multiple items from the pool.
         *
         * @param {Array} keys
         *   An array of keys that should be removed from the pool.

         *
         * @return {boolean}
         *   True if the items were successfully removed. False if there was an error.
         */
        deleteItems(keys){
            if (Array.isArray(keys)) {
                for (let i = 0; i < keys.length; i++) {
                    this.deleteItem(keys[i]);
                }
            }
            return true;
        }
        /**
         * Persists a cache item immediately.
         *
         * @param {LSCacheItem} item
         *   The cache item to save.
         *
         * @return {boolean} True if the item was successfully persisted. False if there was an error.
         */
        save(item){
            if (item instanceof LSCacheItem) {
                let now = +new Date(), tt = item.expiration || (now + this.ttl), pkey = this.prefix + item.getKey();
                if (typeof item.get() === u || item.get() === null) {
                    this.deleteItem(item.key);
                    return true;
                }
                this.storage.set(pkey, item.value);
                this.entries.set(pkey, tt);
                return true;

            }
            return false;

        }

        /**
         * Sets a cache item to be persisted later.
         *
         * @param {LSCacheItem} item
         *   The cache item to save.
         *
         * @return {boolean}  False if the item could not be queued or if a commit was attempted and failed. True otherwise.
         */
        saveDeferred(item){
            if (item instanceof LSCacheItem) {
                this.deferred.push(item);
                return true;
            }
        }

        /**
         * Persists any deferred cache items.
         *
         * @return {boolean}  True if all not-yet-saved items were successfully saved or there were none. False otherwise.
         */
        commit(){
            let item;
            while ((item = this.deferred.shift()) !== undef) {
                this.save(item);
            }
            return true;
        }
    }

    return {Iface, nullStore, xStore, gmStore, exStore, LSCache};

}));


