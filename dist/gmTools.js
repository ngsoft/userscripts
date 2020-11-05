/**
 * Utilities for tampermonkey userscripts
 * @link https://cdn.jsdelivr.net/gh/ngsoft/userscripts@master/dist/gmTools.min.js
 * https://cdn.jsdelivr.net/gh/requirejs/requirejs@latest/require.js
 * https://github.com/requirejs/requirejs/blob/latest/require.js
 * @link https://github.com/ngsoft/userscripts/blob/master/dist/gmTools.js
 */


(function(global){


    if (!GM_info) throw new Error('Not loaded in userscript.');

    let version = 'master', files = [], matches;


    GM_info.script.header.split(/\n+/).forEach(line => {
        if ((matches = /@require[\s\t]+(\w+:\/\/.+)/.exec(line))) files.push(matches[1].trim());
    });

    const exports = {};
    [
        'GM_deleteValue',
        'GM_listValues',
        'GM_setValue',
        'GM_getValue',
        'GM_getResourceText',
        'GM_getResourceURL',
        'GM_registerMenuCommand',
        'GM_unregisterMenuCommand',
        'GM_xmlhttpRequest'
    ].forEach(v => exports[v] = self[v]);


    const
            GMinfo = (typeof GM_info !== 'undefined' ? GM_info : (typeof GM === 'object' && GM !== null && typeof GM.info === 'object' ? GM.info : null)),
            scriptname = GMinfo ? `${GMinfo.script.name} @${GMinfo.script.version}` : "",
            UUID = GMinfo ? GMinfo.script.uuid : "";
    
    
    
    Object.assign(exports, {GMinfo, scriptname, UUID});
    requirejs.config({
        baseUrl: "http://localhost:8092/libs/",

    });
    

            
            
            
    
    requirejs.config({

        paths: {
            Plyr: 'https://cdn.jsdelivr.net/npm/plyr@3.6.2/dist/plyr',
            enums: '/dist/modules/enums'
        },
        config: {
            enums: exports
        }
    });





    // console.debug(GM_info, self);

    //global.GM_info = GM_info;

    require(["gmui", 'Plyr', 'enums'], (ui, plyr, enums) => {
        console.debug(ui, plyr);
        console.debug(enums);
    });






})((typeof unsafeWindow !== 'undefined' ? unsafeWindow : window));









