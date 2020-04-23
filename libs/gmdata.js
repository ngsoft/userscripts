/**
 * gmdata Module
 */

(function(root, factory){
    const deps = ["gmtools", "md5"]; //your dependencies there
    if (typeof define === 'function' && define.amd) define(deps, factory);
    else if (typeof exports === 'object') module.exports = factory(...deps.map(dep => require(dep)));
    else root.gmdata = factory(...deps.map(dep => root[dep]));
}(this, function(gmtools, md5, undef){


    const {isPlainObject, isValidUrl, getURL, addstyle, addscript} = gmtools;


    /**
     * DataStore Interface
     * @type {Class}
     */
    class DataStore {
        constructor(){
            if (!(["get", "set", "has", "remove", "clear"].every(x => typeof this[x] === f))) {
                throw new Error("DataStore Interface Error : Missing Methods.");
            }
            Object.defineProperty(this, '_isDataStore', {
                value: true,
                configurable: true
            });
        }
    }


    /**
     * Store data into an Object
     * @type {Class}
     * @extends {Datastore}
     */
    class nullStore extends DataStore {

        constructor(storage){
            super();
            Object.defineProperty(this, '_storage', {
                value: {}, enumerable: false,
                configurable: true, writable: true
            });
        }

        get(key){
            let retval, sval;
            if (typeof key === s) retval = this._storage[key];
            else if (typeof key === u) retval = Object.assign({}, this._storage);//clone
            return retval;

        }
        set(key, val){
            if (typeof key === s && typeof val !== u) this._storage[key] = val;
            else if (isPlainObject(key)) Object.assign(this._storage, key);
            return this;

        }
        has(key){
            return typeof this._storage[key] !== u;

        }
        remove(key){
            delete this._storage[key];
            return this;
        }
        clear(){
            this._storage = {};
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
            Object.defineProperty(this, '_storage', {
                value: storage,
                configurable: true
            });
        }

        get(key){
            let retval, sval;
            //get one
            if (typeof key === s) {
                if ((sval = this._storage.getItem(key)) !== null) {
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
                    key = this._storage.key(i);
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
                this._storage.setItem(key, val);

            } else if (isPlainObject(key)) {
                Object.keys(key).forEach((k) => {
                    this.set(k, key[k]);
                });
            }
            return this;

        }
        has(key){
            return typeof this.get(key) !== u;

        }
        remove(key){
            if (typeof key === s) {
                key = key.split(' ');
            }
            if (Array.isArray(key)) {
                key.forEach((k) => {
                    this._storage.removeItem(k);
                });
            }
            return this;
        }
        clear(){
            this._storage.clear();
            return this;
        }

    }


    /* jshint -W117 */
    /**
     * Store data into GreaseMonkey 3 or Tampermonkey
     * @type {Class}
     * @extends {DataStore}
     */
    class gmStore extends DataStore {
        static get available(){
            return ["GM_getValue", "GM_setValue", "GM_deleteValue", "GM_listValues"].every((fn) => {
                /*jshint evil:true */
                try {
                    if (typeof (eval(fn)) === f) return true;
                } catch (e) {
                    return false;
                }
                /*jshint evil:false */
            });
        }

        constructor(){
            super();

            let disabled = [];
            ["GM_getValue", "GM_setValue", "GM_deleteValue", "GM_listValues"].forEach((fn) => {
                /*jshint evil:true */
                try {
                    if (typeof (eval(fn)) !== f) disabled.push(fn);
                } catch (e) {
                    disabled.push(fn);
                }
                /*jshint evil:false */
            });
            if (disabled.length > 0) {
                if (disabled.length === 4) {
                    console.warn("gmStore disabled.");
                    return;
                }
                disabled.forEach((fn) => {
                    console.warn('gmStore cannot use', fn);
                });
            }
        }



        get(key){
            let retval = undef;
            //get one
            if (typeof key === s) {
                if (typeof GM_getValue === f) {
                    retval = GM_getValue(key); // eslint-disable-line
                }
            } else if (typeof key === u) {
                //get all
                retval = {};
                if (typeof GM_listValues === f) {
                    GM_listValues().forEach((key) => { // eslint-disable-line
                        retval[key] = this.get(key);
                    });
                }
            }
            return retval;

        }
        set(key, val){

            if (typeof key === s && typeof val !== u) {
                if (typeof GM_setValue === f) {
                    GM_setValue(key, val); // eslint-disable-line
                }
            } else if (isPlainObject(key)) {
                Object.keys(key).forEach((k) => {
                    this.set(k, key[k]);
                });
            }
            return this;
        }
        has(key){
            return typeof this.get(key) !== u;
        }
        remove(key){
            if (typeof key === s) {
                key = key.split(' ');
            }
            if (Array.isArray(key)) {
                if (typeof GM_deleteValue === f) {
                    key.forEach((k) => {
                        GM_deleteValue(k); // eslint-disable-line
                    });
                }
            }
            return this;
        }

        clear(){
            Object.keys(this.get()).forEach((key) => {
                this.remove(key);
            });
            return this;
        }

    }

    /* jshint +W117 */

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

    class gmLoader {

        constructor(usecache = true, ttl = (5 * minute), prefix = UUID){
            let storage;
            if (usecache === true) storage = new xStore(localStorage);
            else storage = new nullStore(); //cache is disabled that way, on next page load Object will be cleared
            Object.defineProperties(this, {
                cache: {configurable: true, enumerable: false, writable: false, value: new LSCache(prefix, ttl, storage)}
            });
        }

        get ttl(){
            return this.cache.ttl;
        }

        set ttl(v){
            this.cache.ttl = v;
        }

    }

    /**
     * Loads and caches resources (js and css)
     * @param {boolean} [usecache]
     * @param {number} [ttl]
     * @param {string} [prefix]
     * @returns {gmLoader}
     */
    function gmLoaderLauncher(usecache = true, ttl = (5 * minute), prefix = UUID){
        if (this instanceof gmLoaderLauncher === false) return new gmLoader(...arguments);
        return new gmLoader(...arguments);
    }






    /**
     * Resource Loader
     * @param {string} prefix
     * @param {number} ttl
     * @returns {rloader}
     */
    function rloader(prefix, ttl){
        if (!(this instanceof rloader)) return new rloader(prefix, ttl);
        prefix = typeof prefix === s ? prefix : "";
        ttl = typeof ttl === n ? ttl : (5 * minute);
        this.__cache__ = new LSCache(prefix, ttl);
    }

    rloader.prototype = {
        /**
         * Checks if key exists
         * @param {string} key
         * @returns {boolean}
         */
        has(key){
            return this.__cache__.hasItem(key);
        },
        /**
         * Get a resource by key
         * @param {string} key
         * @returns {string|undefined}
         */
        get(key){
            let item = this.__cache__.getItem(key);
            return item.get();
        },
        /**
         * Loads a Ressource
         * @param {string} [url] Must be set first if key is defined
         * @param {function} [callback] a callback to load after
         * @param {string} [key]
         * @param {number} [expire]
         * @param {Object} [options] overrides {url: 'https://...', onload(){}, key: "mykey", expire: 5000}
         * @returns {rloader.prototype}
         */
        require(){
            const params = {
                expire: this.__cache__.ttl,
                onload: null,
                url: null,
                key: null
            }, self = this;
            //parse arguments
            for (let i = 0; i < arguments.length; i++) {
                let arg = arguments[i];
                switch (typeof arg) {
                    case n:
                        params.expire = arg;
                        break;
                    case s:
                        if (typeof params.url === s) params.key = arg;
                        else params.url = arg;
                        break;
                    case f:
                        params.onload = arg;
                        break;
                    case o:
                        if (isPlainObject(arg)) Object.assign(params, arg);
                        break;
                    default :
                        break;
                }
            }

            if (!isValidUrl(params.url)) throw new Error("Invalid Url.");
            let url = new URL(getURL(params.url)), ext;
            if (params.key === null) params.key = url.pathname.split("/").pop();
            if (/\.js$/i.test(params.key)) ext = "js";
            else if (/\.css$/i.test(params.key)) ext = "css";


            let item = this.__cache__.getItem(params.key), load = () => {
                switch (ext) {
                    case "css":
                        addstyle(item.get());
                        break;
                    case "js":
                        addscript(item.get());
                        break;
                    default :
                        break;
                }
                if (typeof params.onload === f) params.onload(item.get());
            };
            if (!item.isHit()) {
                fetch(url.href, {
                    method: "GET",
                    redirect: "follow",
                    cache: "no-store"
                }).then(r => {
                    if (r.status === 200) return r.text();
                    else {
                        console.warn(r);
                        throw new Error("Cannot get the resource " + url.href);
                    }
                }).then((text) => {
                    if (text.length > 0) {
                        item.set(text);
                        item.expiresAfter(params.ttl);
                        self.__cache__.save(item);
                        load();
                    }
                }).catch(console.warn);
            } else load();
            return this;
        },
        /**
         * Clears the cache
         * @returns {boolean}
         */
        clear(){
            return this.__cache__.clear();
        }

    };



    return {
        xStore: xStore,
        gmStore: gmStore,
        nullStore: nullStore,
        UserSettings: UserSettings,
        LSCache: LSCache,
        rloader: rloader,
        gmLoader: gmLoaderLauncher
    };
}));