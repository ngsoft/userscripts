/**
 * Module player
 */
(function(root, factory){
    /* globals define, require, module, self */
    const
            name = 'player'
    dependencies = ['utils', 'plyr', 'dash', 'Hls'];
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
        root["player"] = factory(...dependencies.map(dep => require(dep)));/*jshint ignore:line */
    }
}(typeof self !== 'undefined' ? self : this, function player(utils, Plyr, dashjs, Hls){


    const {loadcss, rootmodules} = utils;


    class Player {


    }


    loadcss(rootmodules + 'css/player.css');




    return {Player};
}));








