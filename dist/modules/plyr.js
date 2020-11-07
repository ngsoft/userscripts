(function(root, factory){
    /* globals define, require, module, self */
    const
            name = "plyr",
            dependencies = ['utils', 'config', 'Plyr'];
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
}(typeof self !== 'undefined' ? self : this, function(utils, config, plyr){

    const {sprintf, loadcss} = utils;
    const cfg = config.get('Plyr');
    loadcss(sprintf(cfg.path, cfg.version) + '.css');
    return plyr;
}));

