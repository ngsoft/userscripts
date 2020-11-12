/**
 * Module dialog
 */
(function(root, factory){
    /* globals define, require, module, self */
    const
            name = 'dialog',
            dependencies = ['require', 'config', 'dialogpolyfill', 'utils'];
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
        root["dialog"] = factory(...dependencies.map(dep => require(dep)));/*jshint ignore:line */
    }
}(typeof self !== 'undefined' ? self : this, function k4y2mjucdmt478ju6k5k(require){

    const
            config = require('config'),
            polyfill = require('dialogpolyfill'),
            utils = require('utils');

    const {html2element, doc} = utils;



    const
            template = `<dialog class="">
                            <header class="">
                                <h1 class=""></h1>
                                <span class="gm-btn gm-btn-close" data-name="close">&times;</span>
                            </header>
                            <form method="dialog" class=""></form>
                            <footer class="">
                                <span class="gm-btn gm-btn-yes" data-name="confirm">Yes</span>
                                <span class="gm-btn gm-btn-no" data-name="dismiss">No</span>
                            </footer>
                        </dialog>`;



    class Dialog {

        get dialog(){
            return this.elements.dialog;
        }

        get root(){
            return this.elements.root;
        }

        open(){
            if (this.dialog.parentElement === null) doc.body.appendChild(this.dialog);
            this.dialog.showModal();
            return this;
        }

        constructor(options){



            Object.defineProperties(this, {
                elements: {
                    enumerable: false, configurable: true, writable: true,
                    value: {
                        root: html2element('<div class="pure"/>'),
                        dialog: html2element(template),
                        buttons: {}
                    }
                },
                options: {
                    enumerable: false, configurable: true, writable: true,
                    value: null
                },

                isReady: {
                    enumerable: true, configurable: true, writable: true,
                    value: false
                }
            });


            const dialog = this.dialog;
            ['header', 'body', 'footer'].forEach(cls => {
                let
                        className = 'gm-dialog-' + cls,
                        elem = dialog.querySelector('.' + className);
                this.elements[cls] = elem;
            });

            dialog.querySelectorAll('[data-name].gm-btn').forEach(elem => {
                let name = elem.getAttribute('data-name');
                if (name.length > 0) this.elements.buttons[name] === elem;
            });

            polyfill.registerDialog(dialog);

            dialog.dispatchEvent = function(...args){
                console.debug(...args);

                return EventTarget.prototype.dispatchEvent.call(dialog, ...args);
            };





        }

    }
















    utils.loadcss(config.get('paths.styles') + 'reset.css');
    utils.loadcss(config.get('paths.styles') + 'dialog.css');

    return Dialog;
}));

