/**
 * Module gmData
 */
(function(root, factory){
    /* globals define, require, module, self */
    const dependencies = ["gmtools", "md5"];
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
        root["gmData"] = factory(...dependencies.map(dep => require(dep)));/*jshint ignore:line */
    }
}(typeof self !== 'undefined' ? self : this, function(gmtools, md5, undef){



    const {
        isPlainObject, isValidUrl, getURL, addstyle, addscript,
        f, s, u, n, minute, UUID
    } = gmtools;



    class Interface {

        get __ABSTRACT(){
            return [];
        }

        constructor(){

            let
                    name = this.constructor.name,
                    proto = Object.getPrototypeOf(this),
                    parents = [];

            while (proto instanceof Interface) {
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
                    throw new Error('Interface class ' + iface.constructor.name + ' does not declare methods that are not abstract (do you need to make it an interface?).');
                }

                parents.forEach(proto => {
                    Object.keys(Object.getOwnPropertyDescriptors(proto)).forEach(method => {
                        if (typeof proto[method] === f && methods.includes(method)) {

                            if (iface[method].length !== proto[method].length) {
                                throw new Error(`Interface ${iface.constructor.name}.${method}() expects ${iface[method].length} parameters, ${proto[method].length} given in ${proto.constructor.name}.${method}()`);
                            }
                            declared.push(method);
                        }
                    });
                });
                if (methods.length !== declared.length){
                    throw new Error('class ' + name + ' does not declare ' + methods.filter(m => declared.includes(m) === false).join('(), ') + '().');
                }
            } else throw new Error('Interface ' + name + ' cannot be instanciated.');
        }
    }




    /**
     * DataStore Interface
     * @type {Class}
     */
    class DataStore extends Interface {
        /**
         * Gets a value from the storage
         * @param {string|undefined} key if not using key all the storage will be returned
         * @returns {any}
         */
        get(key){}
        /**
         * Adds a value to the storage
         * @param {string|Object} key storage key or key/value pair
         * @param {any} [val]
         * @returns {DataStore}
         */
        set(key, val){}
        /**
         * Checks if storage has a value for the given key
         * @param {string} key
         * @returns {Boolean}
         */
        has(key){}
        /**
         * Remove a value from the storage
         * @param {string} key
         * @returns {DataStore}
         */
        remove(key){}
        /**
         * Empty the storage
         * @returns {DataStore}
         */
        clear(){}
    }


    /**
     * Store data into an Object
     * @type {Class}
     * @extends {Datastore}
     */
    class nullStore extends DataStore {

        constructor(storage){
            super();
            Object.defineProperty(this, 'storage', {
                value: {}, enumerable: false,
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
                for (let i = 0; i < this._storage.length; i++) {
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
            const errors = ["GM_getValue", "GM_setValue", "GM_deleteValue", "GM_listValues"].filter(x => typeof self[x] !== f);
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
            Object.keys(this.get()).forEach(key => this.remove(key));
            return this;
        }

    }


    /**
     * Injects defaults settings into gmStore
     */
    class UserSettings extends gmStore {
        /**
         * @param {Object} defaults a plain object containing defaults settings
         * @returns {UserSettings}
         */
        constructor(defaults){
            super();
            if (isPlainObject(defaults)) {
                Object.keys(defaults).forEach((x) => {
                    if (typeof this.get(x) !== typeof defaults[x]) {
                        this.set(x, defaults[x]);
                    }
                }, this);
            }

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
            if (expiration instanceof Date) this.expire = expiration;
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
                this.expiration = new Date(tt);
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
         * @returns {xStore}
         */
        get storage(){
            return this.__store__;
        }
        set storage(val){
            if (val instanceof DataStore) this.__store__ = val;
        }
        get ttl(){
            return this.__ttl__;
        }
        set ttl(ttl){
            if (typeof ttl === n) this.__ttl__ = ttl;
        }

        get deferred(){
            if (typeof this.__deferred__ === u) this.__deferred__ = [];
            return this.__deferred__;
        }

        get expire(){
            if (typeof this.__expire__ === u) {
                let key = this.prefix + "LSCache";
                this.__expire__ = this.storage.get(key) || {};
            }

            return this.__expire__;
        }

        set expire(obj){
            if (isPlainObject(obj)) {
                this.__expire__ = obj;
                let key = this.prefix + "LSCache";
                this.storage.set(key, obj);
            }
        }

        get prefix(){
            return this.__prefix__ + ":";
        }

        /**
         * Creates a new cache pool
         * @param {string} prefix
         * @param {number} [ttl]
         * @param {DataStore} storage
         */
        constructor(prefix = "", ttl = 60000, storage = null){
            if (storage instanceof DataStore === false) storage = new xStore(localStorage);
            this.storage = storage;
            this.__prefix__ = "";
            if (typeof prefix === s) this.__prefix__ = prefix;
            this.ttl = typeof ttl === n ? ttl : 60000;
            this.__removeExpired();

        }

        __removeExpired(){

            let expired = this.expire, now = +new Date(), keys = Object.keys(expired);
            for (let i = 0; i < keys.length; i++) {
                if (now > expired[keys[i]]) {
                    this.deleteItem(keys[i]);
                }
            }

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
            this.__removeExpired();
            return this.storage.has(this.prefix + key);
        }

        /**
         * Deletes all items in the pool.
         *
         * @return {boolean}  True if the pool was successfully cleared. False if there was an error.
         */
        clear(){

            const
                    $this = this,
                    storage = this.storage,
                    data = storage.get();

            Object.keys(data).forEach(key => {
                if (key.indexOf($this.prefix) === 0) storage.remove(key);
            });

            this.expire = {};
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
            let exp = this.expire;
            delete(exp[key]);
            this.expire = exp;
            this.storage.remove(this.prefix + key);
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

                let expire = item.expiration || new Date((+new Date()) + this.ttl),
                        data = this.expire;
                data[item.getKey()] = +expire;
                this.expire = data;
                let key = this.prefix + item.getKey();
                this.storage.set(key, item.value !== undef ? item.value : null);
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


    /**
     * Loads and caches resources (js and css)
     * @param {boolean} [usecache] Use Browser localStorage to store the scripts // if set to false, the cache will use a fake storage
     * @param {number} [ttl] Number of ms to keep items in cache eg: 2 * hour
     * @param {string} [prefix] prefix to use to store the files in cache
     * @returns {gmLoader}
     */
    class gmLoader {

        constructor(usecache = true, ttl = 5 * minute, prefix = UUID + ":gmLoader"){
            let storage;
            if (usecache === true) storage = new xStore(localStorage);
            else storage = new nullStore(); //cache is disabled that way, on next page load Object will be cleared
            Object.defineProperties(this, {
                cache: {configurable: true, enumerable: false, writable: false, value: new LSCache(prefix, ttl, storage)}
            });
        }

        /** Getters */

        /** @returns {number} */
        get ttl(){
            return this.cache.ttl;
        }

        /** Setters */
        set ttl(v){
            this.cache.ttl = v;
        }

        /** Methods */

        /**
         * Get item from the cache (shortcut)
         * @param {string} key
         * @returns {LSCacheItem}
         */
        getItem(key){
            return this.cache.getItem(key);
        }


        /**
         * Checks if cache has given key
         * @param {string} key
         * @returns {Boolean}
         */
        hasItem(key){
            return this.cache.hasItem(key);
        }

        /**
         * Clears the cache
         * @returns {Boolean}
         */
        clear(){
            return this.cache.clear();
        }


        /**
         *  Loads Single or multiple resources
         *  @param {string} from  URL multiples urls can be used to load multiples resources
         *  @param {string} [name] Alias to be used for the cache
         *  @param {string} [as]  "js" or "css" are valid values
         *  @param {number} [ttl] cache ttl for the given resource (overrides constructor value)
         *  @param {function} [then] callback to be exexuted just after a certain resource has been loaded
         *  @param {Object} [params] an object that can regroup all the previous keys eg: {name: "mylib", from: "https://...", as: "js", ttl: 3 * day, then(){}}
         *  @param {Array} [multi]  an Array containing multiples URL or multiples params ["http://..",{ttl: 2 * year, from: "...uery.min.js", then(){$(document)...}]
         *
         * @returns {Promise} Resolves if all resources have been loaded and reject if at least one has failed
         */
        require(){
            const
                    $this = this,
                    queue = [],
                    args = Array.from(arguments),
                    defaults = {
                        from: "", as: "", name: "", then: null, ttl: this.ttl
                    },
                    buildQueue = function(args){
                        let item = Object.assign({}, defaults);
                        args.forEach(arg => {
                            if (Array.isArray(arg)) return buildQueue(arg);
                            if (typeof arg === f) item.then = arg;
                            else if (typeof arg === n) item.ttl = arg;
                            else if (typeof arg === s) {
                                if (isValidUrl(arg)) {
                                    if (item.from.length > 0) return buildQueue([arg]);
                                    item.from = arg;
                                } else if (/^(js|css)$/.test(arg)) item.as = arg;
                                else item.name = arg;
                            } else if (isPlainObject(arg)) {
                                if (typeof arg.from === s ? isValidUrl(arg.from) : false) item.from = arg.from;
                                if (typeof arg.as === s ? /^(js|css)$/.test(arg.as) : false) item.as = arg.as;
                                if (typeof arg.name === s) item.name = arg.name;
                                if (typeof arg.then === f) item.then = arg.then;
                                if (typeof arg.ttl === n) item.ttl = arg.ttl;
                            }
                        });
                        if (item.from.length === 0) throw new Error('Cannot load Resource: URL not defined');
                        item.from = getURL(item.from);
                        if (item.name.length === 0) item.name = md5(item.from);
                        if (item.as.length === 0) {
                            let
                                    url = new URL(item.from),
                                    matches = /\.(js|css)$/.exec(url.pathname);
                            if (matches === null) throw new Error('Cannot load Resource: Load as js/css?');
                            else item.as = matches[1];
                        }
                        queue.push(item);
                    },
                    loadResource = function(text, res){
                        if (res.as === "js") addscript(text);
                        else addstyle(text);
                        if (typeof res.then === f) res.then();
                    };


            return new Promise(function(resolve, reject){
                buildQueue(args);
                let loaded = 0, length = queue.length, errors = [], success = [], fromcache = [];
                if (length === 0) reject(new Error('Cannot load resource: did you pass an argument?'));

                const handleErrors = function(){
                    if (loaded === length) {
                        let r = {success: success, errors: errors, fromcache: fromcache};
                        if (errors.length === 0) resolve(r);
                        else reject(r);
                    }
                };

                queue.forEach(res => {
                    let {from, name, ttl} = res;
                    let item = $this.getItem(name);
                    if (item.isHit()) {
                        loaded++;
                        loadResource(item.get(), res);
                        fromcache.push(from);
                        success.push(from);
                        return handleErrors();
                    }
                    fetch(from, {redirect: "follow", cache: "no-store"})
                            .then(response => {
                                if (response.status !== 200) throw new Error(response.url);
                                return response.text();
                            })
                            .then(text => {
                                item.set(text);
                                item.expiresAfter(ttl);
                                $this.cache.save(item);
                                loaded++;
                                loadResource(item.get(), res);
                                success.push(from);
                                handleErrors();

                            })
                            .catch(e => {
                                errors.push(from);
                                loaded++;
                                handleErrors();
                            });
                });
            });
        }



    }

    return {
        xStore, gmStore, nullStore,
        UserSettings, LSCache, gmLoader
    };
}));