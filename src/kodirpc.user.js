// ==UserScript==
// @version     2.0
// @name        KodiRPC 2.0
// @description Send Stream URL to Kodi using jsonRPC
// @author      daedelus
// @namespace   https://github.com/ngsoft
// @icon        https://kodi.tv/favicon.ico
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
            if ((p > 0) && (p < 65536)) {
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

    class Settings {
        constructor(root){

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
                            try {
                                sendto.forEach(server => server.client.send(link, success, error));
                            } catch (e) {
                            }


                        }


                    })
                    .on('kodirpc.settings', e => {
                        console.debug(e);

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


    }



    let
            gmSettings = new UserSettings({
                servers: [],
                blacklist: []
            }),
            servers = gmSettings.get('servers').map(data => new Server(data)),
            blacklist = gmSettings.get('blacklist'),
            commands = new Commands(),
            host = location.hostname;

    if (blacklist.includes(host)) {
        commands.add('blacklist', 'Whitelist ' + host, () => {
            let host = location.hostname;

            ask('Do you wish to remove ' + host + ' from blacklist', () => {
                if (blacklist.includes(host)) {
                    blacklist.splice(blacklist.indexOf(host), 1);
                    gmSettings.set('blacklist', blacklist);
                    location.replace(location.href);
                }
            });
        });
        return;
    }else {
        commands.add('blacklist', 'Blacklist ' + host, () => {
            let host = location.hostname;

            ask('Do you wish to add ' + host + ' to blacklist', () => {
                if (!blacklist.includes(host)) blacklist.push(host);
                gmSettings.set('blacklist', blacklist);
                location.replace(location.href);

            });
        });
    }

    if (servers.length === 0) servers.push(new Server());


    on.loaded().then(() => {
        if (typeof doc.body.KodiRPCModule !== u) {
            new KodiRPC();
        }

        let id = 0;
        NodeFinder.find('video[data-src^="http"], video[src^="http"], video source[src^="http"]', element => {
            if (typeof doc.body.KRPCM === u) new KodiRPC();

            let src = element.data('src') || element.src,desc = "Send Source link";

            if (element.tagName === "SOURCE") {

                let size = element.getAttribute('size') || "";
                if (size.length > 0) {
                    desc += ' ';
                    desc += size;
                }
            } else desc = "Send Video Link";

            desc += " from " + host;

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
                    let playlist = jw.getPlaylist()[0];
                    playlist.sources.forEach((source, i) => {
                        if (/^http/.test(source.file))
                            commands.add('sendjw' + i, 'Send JWPlayer video ' + i + ' from ' + host, KodiRPC.action(source.file));
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

    });

})(document);