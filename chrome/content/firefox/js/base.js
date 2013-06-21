/*
 **	Class with browser related definitions used by core framework
 **	@author blippex
 **	@version 1.0
 */
blippex.define('blippex.base', {
  'browser':  {
    'name':   'firefox',
    'online': function(){
      return navigator.onLine
    }
  },
  'console': {
    'log': function(arg){
      Application.console.log(arg);
    }
  },
  'xhr':  function(){
    return new XMLHttpRequest();
  },
  'gps': function(){
    /* for browsers where its unsupported just return {getCurrentPosition: function(){}, watchPosition: function(){}} */
    return Cc["@mozilla.org/geolocation;1"].getService(Ci.nsIDOMGeoGeolocation);
  },
  'settings': {
    /* helper method for firefox browsers */
    '_getMethod': function(key, setter){
      var _method = null;
      switch(Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch).getPrefType('extensions.Blippex.' + key)){
         case Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch).PREF_STRING:
            _method = 'CharPref';
            break;
         case Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch).PREF_INT:
            _method = 'IntPref';
            break;
         case Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch).PREF_BOOL:
            _method = 'BoolPref';
            break;
         default:
      }
      return _method ? ((setter ? 'set' : 'get') + _method) : null;
    },
    /* for firefox it should do nothing since all settings are initialized via prefs.js */
    'init': function(key, value){  },
    /* for firefox browser def is ignored since prefs.js sets default value */
    'get': function(key, def){
      return blippex.base.settings._getMethod(key) ? Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch)[blippex.base.settings._getMethod(key)]('extensions.Blippex.' + key) : def;
    },
    'set': function(key, value){
      Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch)[blippex.base.settings._getMethod(key, true)]('extensions.Blippex.' + key, value);
    }
  },
  'tabs': {
    'add': function(oArgs){
      var browser = document.getElementById("content");
      browser.selectedTab = browser.addTab(oArgs.url || '');
    }
  }
});