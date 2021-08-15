// ==UserScript==
// @version     2.0
// @name        KodiRPC 2.0
// @description Send Stream URL to Kodi using jsonRPC
// @author      daedelus
// @namespace   https://github.com/ngsoft
// @icon        https://kodi.tv/favicon-32x32.png
//
// @require     https://cdn.jsdelivr.net/npm/izitoast@1.4.0/dist/js/iziToast.min.js
// @require     https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.2.5/dist/gmutils.min.js
// @resource    iziToastCSS https://cdn.jsdelivr.net/npm/izitoast@1.4.0/dist/css/iziToast.min.css
//
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @grant       GM_xmlhttpRequest
// @grant       GM_registerMenuCommand
// @grant       GM_unregisterMenuCommand
// @grant       GM_getResourceText
// @run-at      document-end
//
// @include     *
// @exclude     /https?:\/\/(\w+\.)?(youtube|google|dailymotion)\.\w+\//
// ==/UserScript==


(function(doc, undef){

    /* jshint expr: true */
    /* jshint -W018 */
    /* jshint -W083 */


    function loadResources(){

        if (loadResources.loading !== true) {
            loadResources.loading = true;
            addstyle(
                    GM_getResourceText('iziToastCSS') + `
                        .iziToast-wrapper {z-index: 2147483647 !important;}
                        .iziToast-wrapper-bottomRight{top: 40% !important;bottom: auto !important;}
                    `);
        }

        return new Promise(resolve => {
            new Timer(timer => {
                
                if(typeof iziToast !==u){
                    timer.stop();
                    resolve({iziToast: iziToast});
                }

            });

        });
    }



    JSON.RPCRequest = function(method, params, id){
        params = params || {};
        if (typeof method === s && isPlainObject(params)) {
            return this.stringify({
                jsonrpc: '2.0',
                method: method,
                params: params,
                id: typeof id === n ? id : Math.floor(Math.random() * (99 - 1) + 1)
            });
        }
    };





    class Server {

        constructor(data){

            this._params = {
                name: 'localhost',
                host: "127.0.0.1",
                port: 8080,
                pathname: '/jsonrpc',
                user: null,
                auth: null,
                id: uniqid(),
                enabled: true
            };
            if (isPlainObject(data)) Object.assign(this._params, data);
        }

        dirty(){
            return this._dirty === true;
        }

        set enabled(flag){
            if (typeof flag === b) {
                this._params.enabled = flag;
                this.dirty = true;
            }

        }

        set name(name){
            if (typeof name === s && name.length > 0) {
                this._params.name = name;
                this._dirty = true;
            }
        }

        set host(host){
            if (typeof host === s && host.length > 0) {
                this._params.host = host;
                this._dirty = true;
            }
        }


        set pathname(pathname){
            if (typeof pathname !== s) return;

            if (/^\//.test(pathname)) {
                this._params.pathname = pathname;
                this._dirty = true;
            }
        }

        set user(user){
            if (user === null) {
                this._params.user = this._params.auth = null;
                this._dirty = true;
                return;
            }
            if (typeof user !== s) return;
            this._params.user = user.length > 0 ? user : null;

        }
        set port(port){
            if (typeof port !== n) return;
            if ((port > 0) && (port < 65536)) {
                this._params.port = port;
                this._dirty = true;
            }
        }
        set auth(pass){
            if ((typeof pass === s ? pass.length > 0 : false) && (this.user !== null)) {
                this._params.auth = btoa(this.user + ':' + pass);
                this._dirty = true;
            } else if (pass === null) this.user = null;
        }

        get enabled(){
            return this._params.enabled !== false;
        }

        get name(){
            return this._params.name;
        }
        get host(){
            return this._params.host;
        }

        get pathname(){
            return this._params.pathname;
        }

        get user(){
            return this._params.user;
        }
        get port(){
            return this._params.port;
        }
        get auth(){
            return this._params.auth;
        }
        get id(){
            return this._params.id;
        }
        get address(){
            return  new URL('http://' + this.host + ':' + this.port + this.pathname);
        }
        get headers(){
            const headers = {
                "Content-Type": "application/json"
            };
            if (typeof this._params.auth === s) headers["Authorization"] = 'Basic ' + this._params.auth;
            return headers;
        }

        get client(){
            if (!(this._client instanceof Client)) this._client = new Client(this);
            return this._client;
        }


        send(method, params){
            const that = this;
            return new Promise((resolve, reject) => {
                let data = JSON.RPCRequest(method, params);
                if (data === undef) reject();
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: that.address,
                    data: data,
                    headers: that.headers,
                    onload(xhr){
                        if (xhr.status === 200) resolve(JSON.parse(xhr.response));
                        else reject();
                    },
                    onerror(){
                        reject();
                    }
                });
            });

        }



    }

    // From Kassi Share Firefox Extension
    // @link https://raw.githubusercontent.com/goldenratio/youtube-to-XBMC/master/src/js/background_scripts/player.js
    class Client
    {
        /**
         * @param kodiConf {KodiConfig}
         */
        constructor(server){
            if (server instanceof Server) this.server = server;
            else throw new Error('Invalid Server');
        }

        clearPlaylist(){
            const params = {
                playlistid: 1
            };

            return this.server.send("Playlist.Clear", params);
        }

        addToPlaylist(file){
            const params = {
                playlistid: 1,
                item: {
                    file: file
                }
            };
            return this.server.send("Playlist.Add", params);
        }

        playFromPlaylist(position = 0){
            const params = {
                item: {
                    playlistid: 1,
                    position: position
                }
            };

            return this.server.send("Player.Open", params);
        }

        getActivePlayers(){
            const params = {};
            return this.server.send("Player.GetActivePlayers", params);
        }

        getPluginVersion(pluginId){

            const params = {
                addonid: pluginId,
                "properties": ["version"]
            };

            return this.server.send("Addons.GetAddonDetails", params);
        }

        queue(file){
            return new Promise((resolve, reject) => {

                if (!file)
                {
                    reject();
                    return;
                }

                this.addToPlaylist(file)
                        .then(response => {

                            const result = response.result;
                            if (result == 'OK') {
                                return this.getActivePlayers();
                            }
                            return reject();
                        })
                        .then(response => {

                            const result = response.result;
                            // check if no video is playing and start the first video in queue
                            if (result && result.length <= 0) {
                                return this.playFromPlaylist();
                            }
                        })
                        .then(response => {
                            resolve(response);
                        })
                        .catch(() => {
                            reject();
                        });

            });

        }
        

        ping(){
            return this.server.send("JSONRPC.Ping");
        }

        


        playVideo(file){
            return new Promise((resolve, reject) => {


                // 1. Clear play list
                // 2. Add to playlist
                // 3. Play first index

                this.clearPlaylist()
                        .then(response => {
                            return this.addToPlaylist(file);
                        })
                        .then(response => {
                            return this.playFromPlaylist();
                        })
                        .then(response => {
                            resolve(response);
                        }).catch(() => {
                    reject();
                });

            });
        }


        queueVideo(file){
            return new Promise((resolve, reject) => {


                // Player.GetActivePlayers (if empty), Playlist.Clear, Playlist.Add(file), Player.GetActivePlayers (if empty), Player.Open(playlist)
                // Player.GetActivePlayers (if playing), Playlist.Add(file), Player.GetActivePlayers (if playing), do nothing

                this.getActivePlayers()
                        .then(response => {

                            const result = response.result;
                            if (result && result.length <= 0)
                            {
                                return this.clearPlaylist();
                            }
                        })
                        .then(response => {
                            return this.queue(file);
                        })
                        .then(response => {

                            resolve(response);
                        })
                        .catch(() => {

                            reject();
                        });

            });

        }
        
        directPlay(file){

            return this.server.send("Player.Open", {
                item: {
                    file: file
                }
            });
        }

        directPlayOrQueueVideo(file){

            return new Promise((resolve, reject) => {

                if (!file) {
                    reject();
                    return;
                }

                // Player.GetActivePlayers (if empty), Playlist.Clear, Playlist.Add(file), Player.GetActivePlayers (if empty), Player.Open(playlist)
                // Player.GetActivePlayers (if playing), Playlist.Add(file), Player.GetActivePlayers (if playing), do nothing

                this.getActivePlayers()
                        .then(response => {
                            const result = response.result;
                            if (result && result.length <= 0) {
                                this
                                        .directPlay(file)
                                        .then(response => {
                                            if (response.result == 'OK') {
                                                resolve(response);
                                            }
                                            reject();
                                        })
                                        .catch(() => {
                                            reject();
                                        });
                            }else {
                                this.queue(file)
                                        .then(response => {
                                            resolve(response);
                                        })
                                        .catch(() => {
                                            reject();
                                        });
                            }
                        })
                        .catch(() => {
                            reject();
                        });

            });



        }

        send(link, success, error){
            if (typeof link === s) {
                this
                        .directPlayOrQueueVideo(link)
                        .then(response => {
                            if (typeof success === f) success.call(this, link, this);
                        })
                        .catch(() => {
                            if (typeof error === f) error.call(this, link, this);

                        });
            }

        }
    }

    class Settings extends gmDialog {
        constructor(root){
            root = root instanceof Element ? root : doc.body;

            super(root, {
                title: GMinfo.script.name + " Settings",
                buttons: {
                    yes: "Save",
                    no: "Cancel"
                },
                events: {
                    confirm(e){
                        console.debug(e);
                        let saveto = that.servers.map(x => x._params);
                        gmSettings.set('servers', saveto);

                    },
                    cancel(e){
                        console.debug(e);
                    }
                }
            });
            const that = this;
            this.body = `<form class="KodiRPC-Settings">
                            <fieldset>
                                <legend>Select Server</legend>
                                <select name="server-selector"></select>
                                <span class="switch" style="float: right;">
                                    <input title="Enabled" type="checkbox" name="server-enabled" style="position: absolute;top: 0;right: 0;left: 0;bottom: 0;display: block;padding: 0;margin: 0;"/>
                                    <span class="slider"></span>
                                </span>
                            </fieldset>
                            <fieldset>
                                <legend>Configure Server</legend>
                                <label>Name:</label>
                                <input type="text" placeholder="Name" value="" name="server-name" required/>
                                <label>Host:</label>
                                <input type="text" placeholder="Host" value="" name="server-host" required/>
                                <label>Port:</label>
                                <input type="number" name="server-port" value="" placeholder="Port" min="1" max="65535" required>
                                <label>User:</label>
                                <input type="text" placeholder="Username" value="" name="server-user"/>
                                <label>Name:</label>
                                <input type="password" placeholder="Password" value="" name="server-auth"/>
                                
                                <input type="hidden" value="" name="server-id"/>
            
                            </fieldset>
                        </form>`;

            this.form = this.elements.body.querySelector('form.KodiRPC-Settings');

            Events(this.form).on('change submit', e => {
                if (e.type === "submit") e.preventDefault();
                else {
                    let target = e.target.closest('input, select'), name, value;
                    if (target !== null) {
                        name = target.name.replace(/^server\-/, '');
                        try {
                            if (target.type === "checkbox") value = target.checked;
                            else value = JSON.parse(target.value);
                        } catch (err) {
                            value = target.value;
                        }

                        if (name === "selector") {
                            this.server = null;
                            let server;
                            this.servers.forEach(s => {
                                if (s.id === value) server = s;
                            });
                            if (server instanceof Server) {
                                this.server = server;
                                ['id', 'name', 'host', 'port', 'user', 'enabled'].forEach(n => {
                                    let el = this.form.elements["server-" + n];
                                    if (el instanceof Element) {
                                        if (el.type === "checkbox") el.checked = server[n];
                                        else el.value = server[n];
                                    }
                                });


                            }


                        } else {
                            this.elements.buttons.yes.disabled = null;
                            this.server[name] = value;


                        }
                    }

                }

            });
            this.on('open', () => {
                this.elements.buttons.yes.disabled = true;
                this.servers = gmSettings.get('servers').map(s => new Server(s));
                this.server = null;
                this.form.elements["server-selector"].querySelectorAll('option').forEach(x => x.remove());
                this.servers.forEach(server => {
                    let opt = doc.createElement('option');
                    opt.value = server.id;
                    opt.innerHTML = server.name;
                    this.form.elements["server-selector"].appendChild(opt);
                });
                this.form.elements["server-selector"].selectedIndex = 0;
                Events(this.form.elements["server-selector"]).trigger('change');
            });


            //here

        }
    }

    // @link https://github.com/scriptish/scriptish/wiki/GM_unregisterMenuCommand

    class Commands {

        add(name, description, callback, accessKey){
            if (typeof description === s && typeof name === s && typeof callback === f) {
                if (this.has(name)) return;
                let
                        args = [description, callback],
                        command = {
                            name: name,
                            description: description,
                            callback: callback
                        };
                if (typeof accessKey === s) args.push(accessKey);
                command.id = GM_registerMenuCommand(...args);
                this._commands[name] = command;

            }

        }
        remove(name){

            let command = this._commands[name];
            if (isPlainObject(command)) {
                GM_unregisterMenuCommand(command.id);
                delete this._commands[name];
            }
        }
        has(name){
            return typeof this._commands[name] !== u;
        }

        constructor(){
            this._commands = {};
        }

    }


    class KodiRPC {
        constructor(root){
            root = root instanceof EventTarget ? root : doc.body;
            Object.defineProperty(root, 'KRPCM', {
                value: this, configurable: true
            });
            let host = location.hostname;
            commands.add('blacklist', 'Blacklist ' + host, () => {
                ask('Do you wish to add ' + host + ' to blacklist', () => {
                    if (!blacklist.includes(host)) blacklist.push(host);
                    gmSettings.set('blacklist', blacklist);
                    location.replace(location.href);

                });
            });
            
            Events(root)
                    .on('kodirpc.send', e => {
                        e.preventDefault();
                        e.stopPropagation();
                        let link, success, error;
                        if (typeof e.data === o) {
                            if (typeof e.data.success === f) success = e.data.success;
                            if (typeof e.data.error === f) error = e.data.error;
                            if (typeof e.data.link === s) link = e.data.link;
                            servers = gmSettings.get('servers').map(data => new Server(data));
                            let sendto = servers.filter(s => s.enabled);
                            console.debug(link);
                            try {
                                sendto.forEach(server => server.client.send(link, success, error));
                            } catch (e) {
                            }


                        }


                    })
                    .trigger('kodirpc.ready');

            console.debug("KodiRPC Module version", GMinfo.script.version, "started");
        }

        static action(src){
            return function(){
                Events(doc.body).trigger('kodirpc.send', {
                    link: src,
                    success(link, client){
                        loadResources().then(exports => {
                            const {iziToast} = exports;
                            iziToast.success({
                                title: '',
                                message: 'Link sent to ' + client.server.name
                            });
                        });
                    },
                    error(link, client){
                        loadResources().then(exports => {
                            const {iziToast} = exports;
                            iziToast.error({
                                title: '',
                                message: 'Error ' + client.server.name
                            });
                        });
                    }
                });

            };
        }

        static plugin(src, subtitles, mode){

            let
                    u = new URL('plugin://plugin.video.rpcstream/'),
                    title = doc.title !== null ? doc.title : '';
            if (
                    title.length < 1 &&
                    window.frameElement &&
                    window.frameElement.ownerDocument
                    ) {
                title = window.frameElement.ownerDocument.title;
            }


            let
                    request = {
                        title: title,
                        referer: location.origin + location.pathname,
                        useragent: navigator.userAgent,
                        url: src
                    };
            if (typeof subtitles === s) request.subtitles = subtitles;


            u.searchParams.set('request', btoa(JSON.stringify(request)));
            if (typeof mode === 'number') u.searchParams.set('mode', mode);
            return this.action(u.href);
        }


        static advancedPlugin(src, subtitles, params){
            let
                    u = new URL('plugin://plugin.video.rpcstream/'),
                    title = doc.title !== null ? doc.title : '';
            if (
                    title.length < 1 &&
                    window.frameElement &&
                    window.frameElement.ownerDocument
                    ) {
                title = window.frameElement.ownerDocument.title;
            }

            let
                    request = {
                        title: title,
                        referer: location.origin + location.pathname,
                        useragent: navigator.userAgent,
                        url: src
                    };
            if (isPlainObject(params)) request = Object.assign(request, params);
            if (typeof subtitles === s) request.subtitles = subtitles;
            u.searchParams.set('request', btoa(JSON.stringify(request)));
            if (typeof request.mode === n) u.searchParams.set('mode', request.mode);
            return this.action(u.href);

        }

    }



    class DailymotionAPI {

        getToken(){

            return new Promise((resolve, reject) => {

                if (this.token !== null) {
                    resolve(this.token);
                    return;
                }

                let  data = {
                    'client_id': 'f1a362d288c1b98099c7',
                    'client_secret': 'eea605b96e01c796ff369935357eca920c5da4c5',
                    'grant_type': 'client_credentials'
                }, encoded = new URLSearchParams();
                Object.keys(data).forEach(function(k){
                    encoded.set(k, data[k]);
                });

                GM_xmlhttpRequest({
                    method: 'POST',
                    url: 'https://graphql.api.dailymotion.com/oauth/token',
                    data: encoded.toString(),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    onload(xhr){
                        if (xhr.status === 200) {
                            let json = JSON.parse(xhr.response);
                            resolve(this.token = json.access_token);

                        }
                        else reject(new Error('Cannot get Dailymotion access Token.'));
                    },
                    onerror(){
                        reject(new Error('Cannot get Dailymotion access Token.'));
                    }
                });
            });

        }


        getMetadata(vid){
            
            return new Promise((resolve, reject) => {
                
                this.getToken().then(token=>{

                    let headers = Object.assign({
                        'Authorization': 'Bearer ' + token
                    }, this.headers),
                            url = 'https://www.dailymotion.com/player/metadata/video/' + vid + '?fields=qualities';

                    
                    GM_xmlhttpRequest({
                        method: 'POST',
                        url: url,
                        headers: headers,
                        data: JSON.stringify({app: 'com.dailymotion.neon'}),
                        onload(xhr){
                            if (xhr.status === 200) {
                                let json = JSON.parse(xhr.response);
                                resolve(json);

                            } else reject(new Error('Cannot get Dailymotion Metadata for ' + vid + '.'));
                        },
                        onerror(xhr){
                            reject(new Error('Cannot get Dailymotion Metadata for ' + vid + '.'));
                        }
                    });
                    
                    
                    
                });


            });
        }
        
        
        getMediaList(metadata){
            const that = this;
            return new Promise((resolve, reject)=>{
                if (isPlainObject(metadata)) {

                    if (typeof metadata.qualities !== u) {

                        let result = {};

                        Object.keys(metadata.qualities).forEach(key => {
                            let arr = metadata.qualities[key];
                            if (Array.isArray(arr)) {
                                arr.forEach(obj => {
                                    if (
                                            (typeof obj.type !== u) &&
                                            (typeof obj.url !== u)
                                            ) {
                                        if (obj.type === 'application/x-mpegURL') {
                                            //parse m3u8
                                            that.parseM3U8(obj.url).then(data => {
                                                data.forEach(obj => {

                                                    let key = obj.name + 'p';
                                                    key = key.replace('"', '');
                                                    result[key] = {
                                                        url: obj.url.replace(/\#.*$/, ''),
                                                        resolution: key,
                                                        hls: true
                                                    };

                                                });
                                                if (Object.keys(result).length > 0) {
                                                    resolve(result);
                                                }
                                            });

                                        }
                                    }
                                });
                            }

                        });


                    }

                }

                else reject(new Error('Invalid Metadata.'));
            });

        }
        getSubtitles(metadata){
            let url = null;
            if (isPlainObject(metadata)) {
                //console.debug(metadata);
                if (
                        (typeof metadata.subtitles !== u) &&
                        (typeof metadata.subtitles.data !== u) &&
                        (typeof metadata.subtitles.data.en !== u) &&
                        (typeof metadata.subtitles.data.en.urls !== u)

                        ) {
                    metadata.subtitles.data.en.urls.forEach(u => url = u);
                }
            }
            return url;
        }

        parseM3U8(url){

            let regex = /(#EXT-X-STREAM-INF.*)\n([^#].*)/;

            return new Promise((resolve, reject) => {


                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    onload(xhr){
                        if (xhr.status === 200) {
                            let text = xhr.response, result = [], matches;

                            while ((matches = regex.exec(text)) !== null) {
                                text = text.replace(matches[0], '');
                                let
                                        line = matches[1].replace('#EXT-X-STREAM-INF:', ''),
                                data = {};

                                line.split(',').forEach(t => {
                                    let kv = t.split('=');
                                    if (kv.length == 2) {
                                        let key = kv[0].trim(), value = kv[1].replace(/"/, '').trim();
                                        data[key.toLowerCase()] = value;
                                    }
                                });
                                if (Object.keys(data).length > 0) {
                                    data.url = matches[2].trim();
                                    result.push(data);
                                }
                            }
                            if (result.length > 0) {
                                resolve(result);
                                return;
                            }


                        }
                        reject(new Error('Cannot get Dailymotion HLS Info'));
                    },
                    onerror(){
                        reject(new Error('Cannot get Dailymotion HLS Info'));
                    }
                });



            });

        }

        static action(vid){
            return function(){
                let d = new DailymotionAPI();
                d.getMetadata(vid)
                        .then(meta => {
                            let subs = d.getSubtitles(meta), link;

                            d
                                    .getMediaList(meta)
                                    .then(list => {
                                        ['480p', '720p', '1080p'].forEach(res => {
                                            if (typeof list[res] !== u) link = list[res].url;
                                        });

                                        if (typeof link !== u) KodiRPC.advancedPlugin(link, subs, {
                                                referer: 'https://www.dailymotion.com/video/' + vid,
                                                useragent: 'Mozilla/5.0 (Linux; Android 7.1.1; Pixel Build/NMF26O) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.91 Mobile Safari/537.36',
                                                mode: 0
                                            })();
                                    })
                                    .catch(new Error('cannot send dailymotion video ' + vid));


                        })
                        .catch(console.error);
            };
        }



        constructor(){

            this.token = null;

            this.headers = {
                'Content-Type': 'application/json',
                'Origin': 'https://www.dailymotion.com'
            };

        }
    }



    let
            gmSettings = new UserSettings({
                servers: [],
                blacklist: []
            }),
            servers = gmSettings.get('servers').map(data => new Server(data)),
            blacklist = gmSettings.get('blacklist'),
            commands = new Commands(),
            host = location.hostname,
            settings;




    if (blacklist.includes(host)) return;


    if (servers.length === 0) servers.push(new Server());

    if (window === window.parent) {
        Events(doc.body).on('kodirpc.settings', () => {
            settings = settings || new Settings();
            if (settings.isClosed) settings.open();
        });

        commands.add('configure', 'Configure' + GMinfo.script.name, () => {
            Events(doc.body).trigger('kodirpc.settings');

        });
    }


    on.loaded().then(() => {
        if (typeof doc.body.KodiRPCModule !== u) {
            new KodiRPC();
        }

        let id = 0;
        //video, source tag
        NodeFinder.find('video[data-src^="http"], video[src^="http"], video source[src^="http"]', element => {
            let
                    video = element.closest('video'),
                    tracks = video.querySelectorAll('track[srclang="en"],track[srclang="und"]'),
                    subtitles;
            if (typeof doc.body.KRPCM === u) new KodiRPC();

            tracks.forEach(track => {
                subtitles = track.dataset.src || track.src;
            });


            let src = element.dataset.src || element.src, desc = "Send Source link";

            if (element.tagName === "SOURCE") {

                let size = element.getAttribute('size') || "";
                if (size.length > 0) {
                    desc += ' ';
                    desc += size;
                }
            } else desc = "Send Video Link";
            desc += " from " + host;

            commands.add('sendplugin' + id, '[RPCSTREAM] ' + desc, KodiRPC.plugin(src, subtitles));
            commands.add('sendpluginhls' + id, '[RPCSTREAM][HLS] ' + desc, KodiRPC.plugin(src, subtitles, 2));
            commands.add('send' + id, desc, KodiRPC.action(src));
            id++;
        });

        NodeFinder.find('video.jw-video', video => {
            if (typeof doc.body.KRPCM === u) new KodiRPC();
            if (typeof jwplayer === f) {
                let id = video.closest('div[id]');
                if (id !== null) id = id.id;
                let jw = jwplayer(id);
                if (typeof jw.getPlaylist === f) {
                    let playlist = jw.getPlaylist()[0], track;
                    
                    if (playlist.tracks) {
                        playlist.tracks.forEach(t => {

                            if (typeof track !== 'string') {
                                track = t.file;
                            } else if (t.label && /^en/i.test(t.label)) {
                                track = t.file;
                            }

                        });
                    }
                    playlist.sources.forEach((source, i) => {
                        if (/^http/.test(source.file)) {
                            commands.add('sendjwplugin' + i, '[RPCSTREAM] Send JWPlayer video ' + i + ' from ' + host, KodiRPC.plugin(source.file, track));
                            commands.add('sendjwpluginhls' + i, '[RPCSTREAM][HLS] Send JWPlayer video ' + i + ' from ' + host, KodiRPC.plugin(source.file, track));
                            commands.add('sendjw' + i, 'Send JWPlayer video ' + i + ' from ' + host, KodiRPC.action(source.file));
                        }
                    });

                }
            }
        });



        NodeFinder.find('iframe[src*="dailymotion.com/embed/"], iframe[src*="youtube.com/embed/"]', iframe => {
            let link = new URL(getURL(iframe.src)), src = new URL(link), plugin, purl, site, vid;
            src.search = "";
            if (/youtube/.test(src.host)) {
                src.href = src.href.replace('embed/', 'watch?v=');
                vid = src.searchParams.get('v');
                site = "YOUTUBE";
                plugin = 'plugin.video.youtube';
                purl = "plugin://plugin.video.youtube/?action=play_video&videoid=%s".replace(/\%s/, vid);

            } else if (/dailymotion/.test(src.host)) {
                src.href = src.href.replace('embed/', '');
                vid = src.href.substr(src.href.lastIndexOf('/') + 1);
                site = "DAILYMOTION";
                plugin = 'plugin.video.dailymotion_com';
                purl = "plugin://plugin.video.dailymotion_com/?url=%s&mode=playVideo".replace(/\%s/, vid);
            }
            let success = false;
            if (site == 'DAILYMOTION') {
                commands.add(site + vid + 'RPCSTREAM', '[RPCSTREAM] Send dailymotion video+subs ' + vid, DailymotionAPI.action(vid));
            }

            servers.forEach(server => {
                server.client.getPluginVersion(plugin)
                        .then(response => {
                            if (!response.error) {
                                if (typeof doc.body.KRPCM === u) new KodiRPC();
                                commands.add(site + vid, '[' + site + '] Send  Video ' + vid, KodiRPC.action(purl));
                            }
                        })
                        .catch(e => e);
            });





        });

        if (/crunchyroll/.test(location.host) && /\d+$/.test(location.pathname)) {
            if (typeof doc.body.KRPCM === u) new KodiRPC();

            let
                    plugin = "plugin.video.crunchyroll",
                    id = location.pathname.split("-").pop(),
                    purl = "plugin://plugin.video.crunchyroll/?mode=videoplay&episode_id=%s".replace(/\%s/, id);
                    site = "Crunchyroll";


            servers.forEach(server => {
                server.client.getPluginVersion(plugin)
                        .then(response => {
                            if (!response.error) {
                                if (typeof doc.body.KRPCM === u) new KodiRPC();
                                commands.add(site + id, '[CRUNCHYROLL] Send ' + site + ' Video', KodiRPC.action(purl));
                            }
                        })
                        .catch(e => e);
            });


        }




    });



})(document);