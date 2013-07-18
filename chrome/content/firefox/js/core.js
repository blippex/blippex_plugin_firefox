blippex.define('blippex.core', {
	tabs: {},
	windowId: null,
	pDoc: null,
	_unloaders: [],


	icons: {
		'active': {
			'icon': 'chrome://Blippex/content/firefox/images/toolbar.png'
		},
		'inactive': {
			'icon': 'chrome://Blippex/content/firefox/images/toolbar_disabled.png'
		}
	},


	init: function() {
		blippex.core.windowId = new Date().getTime();
		blippex.libs.timespent.init();
		blippex.libs.disabled.init();
		blippex.browser.settings._init();
		blippex.api.search.init();
		blippex.core.changeIcon();
	},

	changeIcon: function() {
		var pToolbarIcon = document.getElementById('Blippex-toolbar-button');
		if (pToolbarIcon) {
			pToolbarIcon.setAttribute("image", blippex.core.icons[blippex.libs.disabled.isEnabled() ? 'active' : 'inactive'].icon);
		}
	},

	onLoad: function(oArgs) {
		blippex.libs.timespent.upload({
			'tabId': oArgs.tab.id
		});
		blippex.core.tabs[oArgs.tab.id] = {
			'status': blippex.browser.tabs.check({
				'url': oArgs.tab.url
			}),
			'timespent': 0,
			'timestamp': blippex.libs.misc.formatDate(),
			'url': oArgs.tab.url
		}
	},

	onUnload: function(oArgs) {
		blippex.libs.timespent.upload({
			'tabId': oArgs.tab.id
		});
		blippex.core.tabs[oArgs.tab.id] = blippex.config.status.uploaded;
	},

	initializationHandler: function() {
		blippex.core.init();
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
		var browserEnumerator = wm.getEnumerator("navigator:browser");
		while (browserEnumerator.hasMoreElements()) {
			var browserWin = browserEnumerator.getNext();
			var tabbrowser = browserWin.gBrowser;
			var numTabs = tabbrowser.browsers.length;
			for (var index = 0; index < numTabs; index++) {
				blippex.core.tabProcessor(tabbrowser.tabContainer.childNodes[index]);
			}
		}
		gBrowser.tabContainer.addEventListener("TabOpen", blippex.core._tabMiscEvent, false);
		gBrowser.tabContainer.addEventListener("TabSelect", blippex.core._tabSelectEvent, false);
		gBrowser.tabContainer.addEventListener("TabPinned", blippex.core._tabMiscEvent, false);
		gBrowser.tabContainer.addEventListener("TabUnpinned", blippex.core._tabMiscEvent, false);
		window.addEventListener("unload", blippex.core._coreUnloadEvent, false);
		blippex.core._unloaders.push(function() {
			window.removeEventListener("unload", blippex.core._coreUnloadEvent, false);
			gBrowser.tabContainer.removeEventListener("TabOpen", blippex.core._tabMiscEvent, false);
			gBrowser.tabContainer.removeEventListener("TabSelect", blippex.core._tabSelectEvent, false);
			gBrowser.tabContainer.removeEventListener("TabPinned", blippex.core._tabMiscEvent, false);
			gBrowser.tabContainer.removeEventListener("TabUnpinned", blippex.core._tabMiscEvent, false);
		})
	},


	loadHandler: function(oArgs) {
		var pDoc = oArgs.pDoc;
		var tabId = oArgs.tabId;
		var now = oArgs.now || false;
		if (!blippex.core.isInPrivateMode()) {
			blippex.core.onLoad({
				'tab': {
					'id': tabId,
					'url': pDoc.location.href
				}
			})
		}
	},

	tabProcessor: function(ptTarget) {
		if ((ptTarget.getAttribute('tabId') || '').length > 0) {
			return;
		}
		var tabId = blippex.core.windowId + 'A' + new Date().getTime();
		ptTarget.setAttribute('tabId', tabId);
		gBrowser.getBrowserForTab(ptTarget).addEventListener("load", function(aEvent) {
			if ((aEvent.originalTarget.nodeName == '#document') && (aEvent.originalTarget.defaultView == aEvent.originalTarget.defaultView.parent) && blippex.core) {
				blippex.core.loadHandler({
					'pDoc': aEvent.originalTarget,
					'tabId': tabId
				});
			}
		}, true);
		gBrowser.getBrowserForTab(ptTarget).addEventListener("unload", function(aEvent) {
			if ((aEvent.originalTarget instanceof HTMLDocument) && (aEvent.originalTarget.defaultView == aEvent.originalTarget.defaultView.parent) && blippex.core) {
				blippex.browser.debug.log('unloading tab with id ' + tabId);
				if (blippex.core.tabs[tabId]) {
					blippex.core.onUnload({
						'tab': {
							'id': tabId
						}
					})
				}
			}
		}, true);
		gBrowser.getBrowserForTab(ptTarget).addEventListener("DOMContentLoaded", function(aEvent) {
			var pDoc = aEvent.originalTarget;
			if (pDoc instanceof HTMLDocument && blippex.core) {
				if (pDoc.defaultView.frameElement) {
					while (pDoc.defaultView.frameElement) {
						pDoc = pDoc.defaultView.frameElement.ownerDocument;
					}
				}
			}
			blippex.content.content_start.init(pDoc);
			blippex.content.google.init({
				'id': 	tabId,
				'doc':	pDoc
			});
		}, true);
	},

	_coreUnloadEvent: function() {
		blippex.core.shuttingDown = true;
	},
	_tabMiscEvent: function(e) {
		blippex.core.tabProcessor(e.target);
	},
	_tabSelectEvent: function(e) {
		blippex.core.tabProcessor(e.target);
	},
	uninitializationHandler: function() {
		blippex.libs.timespent._unload();
		blippex.core._unload();
	},
	_unload: function() {
		blippex.core._unloaders.forEach(function(unload) {
			unload();
		})
	},
	isInPrivateMode: function() {
		var isPrivate = true;
		try {
			// Firefox 20+
			Components.utils.import("resource://gre/modules/PrivateBrowsingUtils.jsm");
			if (!PrivateBrowsingUtils.isWindowPrivate(window)) {
				isPrivate = false;
			}
		} catch (e) {
			// pre Firefox 20 (if you do not have access to a doc. 
			// might use doc.hasAttribute("privatebrowsingmode") then instead)
			try {
				var inPrivateBrowsing = Components.classes["@mozilla.org/privatebrowsing;1"].
				getService(Components.interfaces.nsIPrivateBrowsingService).
				privateBrowsingEnabled;
				if (!inPrivateBrowsing) {
					isPrivate = false;
				}
			} catch (e) {
				Components.utils.reportError(e);
				return isPrivate;
			}
		}
		return isPrivate;
	}

});