const { classes: Cc, Constructor: CC, interfaces: Ci, utils: Cu,
        results: Cr, manager: Cm } = Components;
const ioService = Cc['@mozilla.org/network/io-service;1'].
                  getService(Ci.nsIIOService);
const resourceHandler = ioService.getProtocolHandler('resource')
                        .QueryInterface(Ci.nsIResProtocolHandler);
const XMLHttpRequest = CC('@mozilla.org/xmlextras/xmlhttprequest;1',
                          'nsIXMLHttpRequest');
const prefs = Cc["@mozilla.org/preferences-service;1"].
              getService(Ci.nsIPrefService).
              QueryInterface(Ci.nsIPrefBranch);
const mozIJSSubScriptLoader = Cc["@mozilla.org/moz/jssubscript-loader;1"].
                            getService(Ci.mozIJSSubScriptLoader);

const REASON = [ 'unknown', 'startup', 'shutdown', 'enable', 'disable',
                 'install', 'uninstall', 'upgrade', 'downgrade' ];

const URI = __SCRIPT_URI_SPEC__.replace(/bootstrap\.js$/, "");

const { AddonManager } = Cu.import("resource://gre/modules/AddonManager.jsm");
const { Services } = Cu.import("resource://gre/modules/Services.jsm");

var self = this, icon;

var addon = {
  getResourceURI: function(filePath) ({
    spec: URI + "" + filePath
  })
};

// Initializes default preferences
function setDefaultPrefs() {
  let branch = prefs.getDefaultBranch("");
  let prefLoaderScope = {
    pref: function(key, val) {
      switch (typeof val) {
        case "boolean":
          branch.setBoolPref(key, val);
          break;
        case "number":
          if (val % 1 == 0) // number must be a integer, otherwise ignore it
            branch.setIntPref(key, val);
          break;
        case "string":
          branch.setCharPref(key, val);
          break;
      }
    }
  };

  let uri = ioService.newURI(
      "defaults/preferences/prefs.js",
      null,
      ioService.newURI(URI, null, null));

  // if there is a prefs.js file, then import the default prefs
  try {
    // setup default prefs
    mozIJSSubScriptLoader.loadSubScript(uri.spec, prefLoaderScope);
  }
  // errors here should not kill addon
  catch (e) {
    Cu.reportError(e);
  }
}

function include(path, scope) {
  let uri = ioService.newURI(path, null,ioService.newURI(URI, null, null));
  mozIJSSubScriptLoader.loadSubScript(uri.spec, scope || self);
}

function startup(data, reason) {
  include("includes/utils.js");
  setDefaultPrefs();
  let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
  let windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    WindowListener.setupBrowserUI(domWindow);
  }
  wm.addListener(WindowListener);
  unload(function(){
    wm.removeListener(WindowListener);
  })
};

function intializeBlippex(window) {
  if (!window || typeof (window.blippex) != 'undefined') {
    return;
  }

  include("chrome/content/common/js/define.js", window);
  include("chrome/content/common/js/config.js", window);
  include("chrome/content/firefox/js/base.js", window);
  include("chrome/content/common/js/browser/settings.js", window);
  include("chrome/content/common/js/browser/tabs.js", window);
  include("chrome/content/common/js/browser/xhr.js", window);
  include("chrome/content/common/js/browser/debug.js", window);
  include("chrome/content/common/js/api/upload.js", window);
  include("chrome/content/common/js/libs/timespent.js", window);
  include("chrome/content/common/js/libs/misc.js", window);
  include("chrome/content/firefox/js/core.js", window);
  let doc = window.document,
      win = doc.querySelector("window");
  window.blippex.core.doc = doc;
  unload(function(){
    try{
      window.blippex.core.uninitializationHandler();
    } catch(e){}
    delete window.blippex;
  })
  window.blippex.core.initializationHandler(this);
}

function shutdown(data, reason) {
  if (reason == APP_SHUTDOWN) return;
  unload();
}
function install(data, reason) {}
function uninstall(data, reason) {
  dump('uninstalling')
  if (reason == ADDON_UNINSTALL){
    Services.prefs.deleteBranch("extensions.Blippex.");
  }
}

var WindowListener = {
  setupBrowserUI: function(window) {
    let document = window.document;
    intializeBlippex(window)
  },

  tearDownBrowserUI: function(window) {
    let document = window.document;
  },

  // nsIWindowMediatorListener functions
  onOpenWindow: function(xulWindow) {
    // A new window has opened
    let domWindow = xulWindow.QueryInterface(Ci.nsIInterfaceRequestor)
                             .getInterface(Ci.nsIDOMWindow);

    // Wait for it to finish loading
    domWindow.addEventListener("load", function listener() {
      domWindow.removeEventListener("load", listener, false);

      // If this is a browser window then setup its UI
      if (domWindow.document.documentElement.getAttribute("windowtype") == "navigator:browser")
        WindowListener.setupBrowserUI(domWindow);
    }, false);
  },

  onCloseWindow: function(xulWindow) {
  },

  onWindowTitleChange: function(xulWindow, newTitle) {
  }
};