/**
 * gmdata Module
 */
((i, f, w, u) => {
    'use strict';
    if (module !== u ? module.exports !== u : exports !== u) { // NodeJS and CommonJS
        module.id = i;
        module.exports ? module.exports = f() : exports = f();
    } else if (typeof define === 'function') define(name, factory); // AMD
    else if (w !== u) {// if nothing else
        w.require = w.require || (m => w[m]);
        w[i] = f();
    }
})('gmdata', () => {

    const gmdata = {
        //your exports here

    };

    //your module here
    function isArray(v){
        return Array.isArray(v);
    }




    return gmdata;
}, window);