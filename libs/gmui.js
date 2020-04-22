/**
 * gmui Module
 */

(function(root, factory){
    const deps = []; //your dependencies there
    if (typeof define === 'function' && define.amd) define(deps, factory);
    else if (typeof exports === 'object') module.exports = factory(...deps.map(dep => require(dep)));
    else root["gmui"] = factory(...deps.map(dep => root[dep]));
}(this, function(){

    const gmui = {}; //your exports here







    return gmui;
}));

