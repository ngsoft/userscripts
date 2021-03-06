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
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_deleteValue
// @grant       GM_listValues
// @grant       GM_xmlhttpRequest
// @grant       GM_registerMenuCommand
// @grant       GM_unregisterMenuCommand
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
            [
                //"https://cdn.jsdelivr.net/npm/izitoast@1.4.0/dist/js/iziToast.min.js",
                "https://cdn.jsdelivr.net/npm/izitoast@1.4.0/dist/css/iziToast.min.css"
            ].forEach(src => {
                if (/\.js$/.test(src)) loadjs(src);
                else if (/\.css$/.test(src)) loadcss(src);
            });
            addstyle(`
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

        static plugin(src, subtitles, licence, headers){

            let
                    u = new URL('plugin://plugin.video.rpcstream/'),
                    request = {
                        title: doc.title,
                        referer: location.origin + location.pathname,
                        useragent: navigator.userAgent,
                        url: src
                    };
            if (typeof subtitles === s) request.subtitles = subtitles;
            if (/^\{/.test(licence) && /\}$/.test(licence)) request.licence = licence;
            if (isPlainObject(headers)) request.headers = headers;
            u.searchParams.set('request', btoa(JSON.stringify(request)));
            return this.action(u.href);
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
        NodeFinder.find('video[data-src^="http"], video[src^="http"], video source[src^="http"]', element => {
            let
                    video = element.closest('video'),
                    tracks = video.querySelectorAll('track[srclang="en"],track[srclang="und"]'),
                    subtitles;
            if (typeof doc.body.KRPCM === u) new KodiRPC();

            tracks.forEach(track => {
                subtitles = track.dataset.src || track.src;
            });


            let src = element.data('src') || element.src,desc = "Send Source link";

            if (element.tagName === "SOURCE") {

                let size = element.getAttribute('size') || "";
                if (size.length > 0) {
                    desc += ' ';
                    desc += size;
                }
            } else desc = "Send Video Link";
            desc += " from " + host;

            commands.add('sendplugin' + id, desc + ' (plugin)', KodiRPC.plugin(src, subtitles));
            commands.add('send' + id, desc, KodiRPC.action(src));
            id++;
        });

        NodeFinder.find('source[src^="http"][data-licence^="{"][data-licence$="}"], source[data-src^="http"][data-licence^="{"][data-licence$="}"]', source => {

            let
                    src = source.dataset.src || source.src,
                    licence = source.getAttribute('data-licence'),
                    video = source.closest('video'),
                    tracks = video.querySelectorAll('track[srclang="en"],track[srclang="und"]'),
                    subtitles,
                    size = source.getAttribute('size') || "",
                    desc = "Send Source " + (size.length > 0 ? size : "") + " Link from " + host + " (DRM)";
            if (tracks.length === 0) tracks = [video.querySelector('track')];
            tracks.forEach(track => {
                if (track instanceof Element) subtitles = track.dataset.src || track.src;
            });

            commands.add(uniqid(), desc, KodiRPC.plugin(src, subtitles, licence));

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

                            commands.add('sendjwplugin' + i, 'Send JWPlayer video ' + i + ' from ' + host + ' (Plugin) ', KodiRPC.plugin(source.file, track));
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
                site = "youtube";
                plugin = 'plugin.video.youtube';
                purl = "plugin://plugin.video.youtube/?action=play_video&videoid=%s".replace(/\%s/, vid);

            } else if (/dailymotion/.test(src.host)) {
                src.href = src.href.replace('embed/', '');
                vid = src.href.substr(src.href.lastIndexOf('/') + 1);
                site = "dailymotion";
                plugin = 'plugin.video.dailymotion_com';
                purl = "plugin://plugin.video.dailymotion_com/?url=%s&mode=playVideo".replace(/\%s/, vid);
            }
            let success = false;
            servers.forEach(server => {
                server.client.getPluginVersion(plugin)
                        .then(response => {
                            if (!response.error) {
                                if (typeof doc.body.KRPCM === u) new KodiRPC();
                                commands.add(site + vid, 'Send ' + site + ' Video ' + vid, KodiRPC.action(purl));
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
                                commands.add(site + id, 'Send ' + site + ' Video', KodiRPC.action(purl));
                            }
                        })
                        .catch(e => e);
            });


        }



        if (/viki/.test(location.host) && /^\/videos\/\d+v/.test(location.pathname)) {
            if (typeof doc.body.KRPCM === u) new KodiRPC();
            let
                    plugin = 'plugin.video.vikir',
                    site = 'Viki',
                    purl = new URL('plugin://plugin.video.vikir/?mode=4');


            servers.forEach(server => {
                server.client.getPluginVersion(plugin)
                        .then(response => {
                            if (!response.error) {

                                commands.add(site + 'video', 'Send ' + site + ' Video', () => {


                                    let matches = /^\/videos\/(\d+v)/.exec(location.pathname);
                                     if (matches !== null) {
                                        let
                                                vid = matches[1],
                                                vurl = vid + '@video@100@100@';
                                        purl.searchParams.set('name', doc.title);
                                        purl.searchParams.set('url', vurl);

                                     KodiRPC.action(purl.href)();
                                    }
                                });
                            }
                        })
                        .catch(e => e);
            });

        }

        


    });
    


})(document);