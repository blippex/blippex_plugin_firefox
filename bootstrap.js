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
  include("includes/buttons.js");
  include("includes/utils.js");
  icon = addon.getResourceURI("chrome/content/firefox/images/toolbar.png").spec;
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

function constructElement(doc, tagName, propList, where){
  var _element = doc.createElement(tagName);
  for (var key in (propList || {})){
    switch (key){
      case 'class':
        _element.className = propList[key];
        break;
      case 'id':
        _element.id = propList[key];
        break;
      default:
        _element.setAttribute(key, propList[key])
    }
  }
  if (where){
    where.appendChild(_element)
  }
  return _element;
}

function createButton(doc){
  let _toolbarButton = doc.createElement("toolbarbutton");
  _toolbarButton.setAttribute("id", "Blippex-toolbar-button");
  _toolbarButton.setAttribute("type", "button");
  _toolbarButton.setAttribute("label", "blippex");
  _toolbarButton.setAttribute("image", "chrome://Blippex/content/firefox/images/toolbar.png");
  _toolbarButton.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
  _toolbarButton.setAttribute("popup", "Blippex-popup-main");
  setDefaultPosition("Blippex-toolbar-button", "nav-bar");
  restorePosition(doc, _toolbarButton);
  //just destroy the button when unloading the plugin
  unload(function() {
    _toolbarButton.parentNode.removeChild(_toolbarButton);
  })
}

function createPopup(doc, win){
  var _panel = constructElement(doc, 'panel', {
    'id':             'Blippex-popup-main',
    'class':          'blippexPopup',
    'noautohide':     'false',
    'position':       'after_end',
    'style':          '-moz-appearance: none !important; -moz-border-radius: 8px;width:306px;color:#FFFFFF !important; background-color: #FFFFFF !important',
    'width':          '450px'
  });
  var _browser = constructElement(doc, 'browser', {
    'id':   'blippex-frame',
    'flex':  1,
    'type':   'chrome'
  }, _panel);
  _browser.setAttribute('src', 'chrome://Blippex/content/common/html/popup.html');
  _panel.addEventListener('popupshowing', function(){(new XPCNativeWrapper(_browser.contentWindow).wrappedJSObject).blippex.popup._init();});
  _panel.addEventListener('popupshown', function(){(new XPCNativeWrapper(_browser.contentWindow).wrappedJSObject).blippex.popup._shown();});
  unload(function(){
    _panel.removeEventListener('popupshowing', function(){(new XPCNativeWrapper(_browser.contentWindow).wrappedJSObject).blippex.popup._init();});
    _panel.removeEventListener('popupshown', function(){(new XPCNativeWrapper(_browser.contentWindow).wrappedJSObject).blippex.popup._shown();});
  });
  doc.getElementById('mainPopupSet').appendChild(_panel);
  unload(function() {
    _panel.parentNode.removeChild(_panel);
  })
}

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
  include("chrome/content/common/js/api/search.js", window);
  include("chrome/content/common/js/libs/timespent.js", window);
  include("chrome/content/common/js/libs/misc.js", window);
  include("chrome/content/common/js/libs/disabled.js", window);
  include("chrome/content/firefox/js/content_start.js", window);
  include("chrome/content/firefox/js/core.js", window);
  include("chrome/content/firefox/js/google.js", window);
  
  let doc = window.document,
      win = doc.querySelector("window");
  window.blippex.core.doc = doc;
  createPopup(doc, window);
  createButton(doc);
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