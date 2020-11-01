// ==UserScript==
// @version	2.0
// @name	KodiRPC 2.0
// @description	Send Stream URL to Kodi using jsonRPC
// @author	daedelus
// @namespace	https://github.com/ngsoft
// @icon	https://kodi.tv/favicon.ico
// @require	https://cdn.jsdelivr.net/npm/izitoast@1.4.0/dist/js/iziToast.min.js
// @require	https://cdn.jsdelivr.net/gh/ngsoft/userscripts@1.2.5/dist/gmutils.min.js
// @grant	GM_setValue
// @grant	GM_getValue
// @grant	GM_deleteValue
// @grant	GM_listValues
// @grant	GM_xmlhttpRequest
// @grant	GM_registerMenuCommand
// @grant	GM_unregisterMenuCommand
// @run-at	document-end
// @include	*
// @exclude	/https?:\/\/(\w+\.)?(youtube|google|dailymotion)\.\w+\//
// ==/UserScript==