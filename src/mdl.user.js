// ==UserScript==
// @version      2.0
// @name         MyDramaList
// @description  UI Remaster
// @author       daedelus
// @namespace    https://github.com/ngsoft/userscripts
// @grant        GM_addStyle
// @run-at       document-end
// @noframes
// @include      /^https?:\/\/(\w+\.)?mydramalist\.\w+\//
// @icon         https://mydramalist.com/favicon.ico
// @defaulticon  data:image/x-icon;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBAQFBAYFBQYJBgUGCQsIBgYICwwKCgsKCgwQDAwMDAwMEAwODxAPDgwTExQUExMcGxsbHCAgICAgICAgICD/2wBDAQcHBw0MDRgQEBgaFREVGiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICD/wgARCAAQABADAREAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAID/8QAFgEBAQEAAAAAAAAAAAAAAAAAAgEF/9oADAMBAAIQAxAAAAHLTyQoKLmz/8QAGBABAQEBAQAAAAAAAAAAAAAAAgMEBQH/2gAIAQEAAQUCPE2I2wVkJ9fQG+n65//EABoRAAIDAQEAAAAAAAAAAAAAAAABAgMRFCH/2gAIAQMBAT8B55Eq2hXsd2+Yf//EABkRAAMAAwAAAAAAAAAAAAAAAAABAwIRE//aAAgBAgEBPwHviKmxxQpH/8QAJBAAAgAEBQUBAAAAAAAAAAAAAQIAERIhEyIxQUIDUmKBkqL/2gAIAQEABj8CDCiTBSL923qcM5ZSq0yI5VT0+TFQAsFEtstN/wACMJuimHxXNbW+vlH/xAAdEAEAAgICAwAAAAAAAAAAAAABETEAIUFRYXGB/9oACAEBAAE/IVs+jsOFwTkgqilNIr7JjBycK528i3Jmlp3JVZd7z//aAAwDAQACAAMAAAAQL1//xAAfEQACAQMFAQAAAAAAAAAAAAABEQAhgdFBYXGhwfH/2gAIAQMBAT8QBg6adwITRUu/kHL48xEGBX3zP//EAB0RAAIBBQEBAAAAAAAAAAAAAAERACFBodHxYfD/2gAIAQIBAT8QIje+IIlV1x2FD73cSWy+an//xAAaEAEBAQEBAQEAAAAAAAAAAAABIREAQTFR/9oACAEBAAE/ELzWK2UiqXkGLw7jL4bdFj4LOIQwPYYA4g3PzjV0xoD5TehaT5O//9k=
// ==/UserScript==
(function(){
    /**
     * Works best wit uBlock Origin
     */

    const visuallyHiddenStyle = `{
        position: fixed !important; right: auto !important; bottom: auto !important; top:-100% !important; left: -100% !important;
        height: 1px !important; width: 1px !important; opacity: 0 !important;max-height: 1px !important; max-width: 1px !important;
        display: inline !important;z-index: -1 !important;
    }`, toHide = [];


    [
        '.hidden',
        '[class*="_right_"]',
        '.nav-link[href*="/vip"]',
        '.nav-link[href*="store."]',
        '.mdl-support-goal',

    ].forEach(sel => {
        toHide.push(sel);
        toHide.push(sel + ' *');
    });


    GM_addStyle(toHide.join(", ") + visuallyHiddenStyle);

})();

