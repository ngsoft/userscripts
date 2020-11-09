/**
 * Module menu
 */
(function(root, factory){
    /* globals define, require, module, self */
    const
            name = 'menu',
            dependencies = ['utils', 'GM'];
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
        root["menu"] = factory(...dependencies.map(dep => require(dep)));/*jshint ignore:line */
    }
}(typeof self !== 'undefined' ? self : this, function(utils, GM){

    const {n, f, u, s, doc, trigger, uniqid, gettype, assert} = utils;
    const {GM_registerMenuCommand, GM_unregisterMenuCommand} = GM;

    const
            commands = {},
            supported = gettype(GM_registerMenuCommand, f) && gettype(GM_unregisterMenuCommand, f);

    let listening = false;


    function addListener(){
        if (listening === true) return;
        listening = true;
        doc.addEventListener('GM_MenuCommand', e => {
            if (typeof e.command === s) {
                let name = e.command;
                commands[name].commands.forEach(c => c());
            }
        });

    }



    class Menu {

        static get enabled(){
            return supported;
        }

        static get entries(){
            return commands;
        }
        
        static addEntry(name, description, command){
            assert(gettype(name, s), 'Invalid argument name, not a string');
            assert(gettype(description, s), 'Invalid argument description, not a string');
            assert(gettype(command, f), 'Invalid argument command, not a function');
            assert(!commands[name], 'Command %s already defined', name);
            if (!supported) return;
            return new Menu(name, description, command);
        }
        
        static removeEntry(name){
            assert(gettype(name, s), 'Invalid Argument: name');
            if (!supported) return;
            if (commands[name]) GM_unregisterMenuCommand(commands[name].id);
            delete commands[name];
        }
        
        constructor(name, description, command){

            Object.defineProperties(this, {
                id: {
                    configurable: true, enumerable: false, writable: true,
                    value: null
                },
                name: {
                    configurable: true, enumerable: false, writable: true,
                    value: name
                },
                description: {
                    configurable: true, enumerable: false, writable: true,
                    value: description
                },
                commands: {
                    configurable: true, enumerable: false, writable: true,
                    value: [command]
                }
            });

            this.id = GM_registerMenuCommand(description, () => {
                trigger(doc, 'GM_MenuCommand', {command: name});
            });
            commands[name] = this;
            addListener();
        }

        addCommand(command){
            assert(gettype(command, f), 'Invalid Argument command, not a function');
            this.commands.push(command);
        }

    }



    return Menu;
}));

