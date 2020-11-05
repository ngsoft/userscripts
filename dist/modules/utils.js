(function(root, factory){
    /* globals define, require, module, self */
    const
            name = "utils",
            dependencies = ['module', 'sprintf'];
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
}(typeof self !== 'undefined' ? self : this, function(module, sprintf, undef){


    const {s, f} = module.config();
    const doc = document;

    /**
     * Creates an HTMLElement from html code
     * @param {string} html
     * @returns {HTMLElement}
     */
    function html2element(html){
        if (typeof html === "string") {
            let template = doc.createElement('template');
            html = html.trim();
            template.innerHTML = html;
            return template.content.firstChild;
        }
    }


    /**
     * Creates a Document from html code
     * @param {string} html
     * @returns {documentElement}
     */
    function html2doc(html){
        let node = doc.implementation.createHTMLDocument().documentElement;
        if (typeof html === 'string' && html.length > 0) {
            node.innerHTML = html;
        }
        return node;
    }

    /**
     * Adds CSS to the bottom of the head
     * @param {string} css
     * @returns {undefined}
     */
    function addstyle(css){
        if (typeof css === "string" && css.length > 0) {
            let s = doc.createElement('style');
            s.setAttribute('type', "text/css");
            s.appendChild(doc.createTextNode('<!-- ' + css + ' -->'));
            doc.head.appendChild(s);
        }
    }


    /**
     * Adds script to the bottom of the head
     * @param {string} src
     * @returns {undefined}
     */
    function addscript(src){
        if (typeof src === s && src.length > 0) {
            let s = doc.createElement("script");
            s.setAttribute("type", "text/javascript");
            s.appendChild(doc.createTextNode(src));
            doc.head.appendChild(s);
        }
    }



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
     * Convert uri into full url
     * @param {string} uri
     * @returns {string|undefined}
     */
    function getURL(uri){
        let retval;
        if (typeof uri === s && uri.length > 0) {
            try {
                let a = doc.createElement("a"),
                        url;
                a.href = uri;
                //throws error if url not valid
                url = new URL(a.href);
                retval = url.href;
            } catch (error) {
                retval = undef;
            }

        }
        return retval;

    }


    /**
     * Sanitize a given filename
     * @param {string} input
     * @param {string} replacement
     * @returns {string}
     */
    function sanitizeFileName(input, replacement){
        replacement = typeof replacement === s ? replacement : "";
        if (typeof input === s) return input
                    .replace(/[\/\?<>\\:\*\|":\'\`\’]/g, replacement)
                    .replace(/[\x00-\x1f\x80-\x9f]/g, replacement)
                    .replace(/^\.+$/, replacement)
                    .replace(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i, replacement)
                    .replace(/[\. ]+$/, replacement)
                    .substring(0, 255);
    }



    /**
     * Generate a unique ID
     * @returns {String}
     */
    function uniqid(){
        return  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    /**
     * Loads an external script
     * @param {string} src
     * @param {boolean} defer
     * @returns {Promise}
     */
    function loadjs(src, defer){
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

    /**
     * Copy given text to clipboard
     * @param {string} text
     * @returns {boolean}
     */
    function copyToClipboard(text){
        let r = false;
        if (typeof text === "string" && text.length > 0) {
            let el = doc.createElement('textarea');
            el.innerHTML = text;
            el.style.opacity = 0;
            doc.body.appendChild(el);
            el.select();
            r = doc.execCommand("copy") === true;
            doc.body.removeChild(el);
        }
        return r;
    }


    /**
     * Download given text as a file
     * @param {string} text
     * @param {string} filename
     * @returns {undefined}
     * @link https://stackoverflow.com/questions/32225904/programmatical-click-on-a-tag-not-working-in-firefox
     */
    function Text2File(text, filename){
        if (typeof text === s && typeof filename === s) {
            let link = doc.createElement("a"), blob = new Blob([text], {type: "application/octet-stream"});
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.dispatchEvent(new MouseEvent(`click`));
        }
    }


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



    return Object.assign( {
        uniqid, html2element, html2doc, copyToClipboard, Text2File, doc,
        addstyle, loadjs, addscript, loadcss, isValidUrl, getURL, sanitizeFileName, Interface
    }, module.config(), sprintf);

}));

