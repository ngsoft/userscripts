(function(root, factory){
    /* globals define, require, module, self */
    const
            name = "config",
            dependencies = ['module', 'enums', 'sprintf', 'require'];
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
}(typeof self !== 'undefined' ? self : this, function(module, enums, sprint, req){

    const {gettype, o, u, s} = enums;
    const {sprintf} = sprint;
    const cfg = {
        plyronline: {
            version: '3.6.2',
            path: 'https://cdn.jsdelivr.net/npm/plyr@%s/dist/plyr'
        },
        subtitle: {
            version: '2.0.5', //last stable version before 3.0 (no easy converts)
            path: 'https://cdn.jsdelivr.net/npm/subtitle@%s/dist/subtitle.bundle.min'
        },
        dashjs: {
            path: 'https://cdn.dashjs.org/latest/dash.all.min'
        },
        hls: {
            version: '0.14.16',
            path: 'https://cdn.jsdelivr.net/npm/hls.js@%s/dist/hls.min',
            config: {
                enableWebVTT: false,
                enableCEA708Captions: false
            }
        }
    };


    let overrides = module.config();
    Object.keys(overrides).forEach(key => {
        let type = gettype(overrides[key]);
        if (gettype(cfg[key] === gettype(overrides[key]))) {
            if (type === o) Object.assign(cfg[key], overrides[key]);
            else cfg[key] = overrides[key];
        } else if (gettype(cfg[key] === u)) cfg[key] = overrides[key];
    });


    const obj = {};


    Object.keys(cfg).forEach(key => {

        if (gettype(cfg[key]) === o) {
            let item = cfg[key], path;
            if (gettype(item.path) === s) {
                if (gettype(item.version) === s) path = sprintf(item.path, item.version);
                else path = item.path;
                obj[key] = path;
            }
        }
    });
    if (Object.keys(obj).length > 0) {
        requirejs.config({
            paths: obj
        });
    }



    return cfg;

}));

