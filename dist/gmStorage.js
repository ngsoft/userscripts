/**
 * Utilities for tampermonkey userscripts
 * @link https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.2.6/dist/gmStorage.min.js
 * @link https://github.com/ngsoft/userscripts/blob/master/dist/gmStorage.js
 */


/**
 * require()
 */
(function(root, factory){
    /* globals define, module, self, unsafeWindow */
    const dependencies = [];
    if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    } else if (typeof exports === 'object' && module.exports) {
        module.exports = factory(...dependencies.map(dep => require(dep)));
    } else {
        var require = root.require || function(dep){
            let result;
            Object.keys(Object.getOwnPropertyDescriptors(root)).some(key => {
                if (key.toLowerCase() === dep.toLowerCase()) result = root[key];
                return typeof result !== "undefined";
            });
            return result;
        };
        root.require = factory(...dependencies.map(dep => require(dep))); /*jshint ignore:line */
    }
}(typeof self !== 'undefined' ? self : this, function(){
    
    const 
            s = "string",
            u = "undefined",
            doc = document,
            global = typeof unsafeWindow !== u ? unsafeWindow : window,
            modules_src = 'https://cdn.jsdelivr.net/gh/ngsoft/userscripts@master/dist/modules/';


    /**
     * Checks if url is valid
     * @param {string} url
     * @returns {boolean}
     */
    function isValidUrl(url){
        const weburl = new RegExp("^(?:(?:(?:https?|ftp):)?\\/\\/)(?:\\S+(?::\\S*)?@)?(?:(?!(?:10|127)(?:\\.\\d{1,3}){3})(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z0-9\\u00a1-\\uffff][a-z0-9\\u00a1-\\uffff_-]{0,62})?[a-z0-9\\u00a1-\\uffff]\\.)+(?:[a-z\\u00a1-\\uffff]{2,}\\.?))(?::\\d{2,5})?(?:[/?#]\\S*)?$", "i");
        if (typeof url === s && url.length > 0) {
            return weburl.test(url);
        }
        return false;
    }




    /**
     * Loads an external script
     * @param {string} src
     * @param {boolean} defer
     * @returns {Promise}
     */
    function  loadjs(src, defer){
        return new Promise((resolve, reject) => {
            if (!isValidUrl(src)) {
                reject(new Error("Invalid argument src."));
                return;
            }
            let script = doc.createElement('script');
            Object.assign(script, {
                type: 'text/javascript',
                onload: e => resolve(e.target),
                onerror: () => reject(new Error('Cannot load' + src)),
                src: src
            });
            if (defer === true) script.defer = true;
            document.head.appendChild(script);
        });
    }

    /**
     * Loads an external CSS
     * @param {string} src
     * @returns {Promise}
     */
    function  loadcss(src){

        return new Promise((resolve, reject) => {
            if (!isValidUrl(src)) {
                reject(new Error('Invalid argument src'));
                return;
            }
            let style = doc.createElement('link');
            Object.assign(style, {
                rel: "stylesheet",
                type: "text/css",
                href: src,
                onload: e => resolve(e.target),
                onerror: () => reject(new Error('Cannot load' + src))
            });
            document.head.appendChild(style);
        });
    }





    function load(scripts, stylesheets){
        
        return new Promise((resolve, reject) => {
            if (typeof scripts === s) scripts = [scripts];
            if (typeof stylesheets === s) stylesheets = [stylesheets];
            scripts = Array.isArray(scripts) ? scripts : [];
            stylesheets = Array.isArray(stylesheets) ? stylesheets : [];
            if (!scripts.every(x => isValidUrl(x))) {
                reject(new Error('Invalid Argument script'));
                return;
            }
            if (!stylesheets.every(x => isValidUrl(x))) {
                reject(new Error('Invalid Argument stylesheets'));
                return;
            }
            if (scripts.length === stylesheets.length && scripts.length === 0) {
                reject(new Error('No Arguments Supplied'));
                return;
            }

            let cnt = 0, max = scripts.length + stylesheets.length;

            scripts.forEach(src => {
                loadjs(src)
                        .then(el => {
                            cnt++;
                            if (cnt === max) resolve(el);
                        })
                        .catch(err => reject(err));
            });

            stylesheets.forEach(src => {
                loadcss(src)
                        .then(el => {
                            cnt++;
                            if (cnt === max) resolve(el);
                        })
                        .catch(err => reject(err));
            });
        });
    }


    function loadmodule(module){

        return new Promise((resolve, reject) => {

            let result;

            if (typeof module !== s) {
                reject(new Error('Invalid argument module'));
                return;
            }

            result = requirejs(module);
            if (typeof result !== u) {
                resolve(result);
                return;
            }

            loadjs(modules_src + module.toLowerCase() + ".min.js")
                    .then(() => resolve(requirejs(module)))
                    .catch(err => reject(err));
        });
    }


    function requirejs(dep){
        let result;

        Object.keys(Object.getOwnPropertyDescriptors(global)).some(key => {
            if (key.toLowerCase() === dep.toLowerCase()) result = global[key];
            return typeof result !== u;
        });
        if (typeof result === u) {
            Object.keys(Object.getOwnPropertyDescriptors(self)).some(key => {
                if (key.toLowerCase() === dep.toLowerCase()) result = self[key];
                return typeof result !== u;
            });
        }
        console.debug(dep, result);
        return result;
    }

    requirejs.load = load;
    requirejs.loadjs = loadjs;
    requirejs.loadcss = loadcss;
    requirejs.loadmodule = loadmodule;
    
    return requirejs;
}));

(function(root, factory){
    /* globals define, require, module, self */
    const
            name = 'gmStorage',
            dependencies = ['GM_setValue', 'GM_getValue', 'GM_deleteValue', 'GM_listValues'];

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
}(typeof self !== 'undefined' ? self : this, function(gmset, gmget, gmdelete, gmlist){


    const
            f = 'function';

    /**
     * Defines an Interface
     */
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
                if (methods.length !== declared.length) {
                    throw new Error('class ' + name + ' does not declare ' + methods.filter(m => declared.includes(m) === false).join('(), ') + '().');
                }
            } else throw new Error('Interface ' + name + ' cannot be instanciated.');
        }
    }









}));