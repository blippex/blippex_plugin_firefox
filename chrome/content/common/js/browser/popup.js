/*
 **	@class blippexPopup
 ** @version 1.0
 */
var background = window.parent;
var _blippex = background.blippex;
var blippex = _blippex;

blippex.define('blippex.popup', {
	_init: function() {
		blippex.popup.initHandlers();
		blippex.popup.onFit();
	},
	_shown: function(){
		blippex.popup.popupRenderer();
		blippex.popup.onFit();
	},
	initHandlers: function(){
		blippex.popup.addEventListener('blippex-input-value', function(event){if (event.keyCode == 13) {blippex.popup.onSearch();} return false;}, 'keydown');
		blippex.popup.addEventListener('blippex-input-enable', function(){blippex.popup.onEnable()});
		blippex.popup.addEventListener('blippex-form', function(){return false;}, 'submit');
		blippex.popup.addEventListener('blippex-input-submit', function(){blippex.popup.onSearch();return false;});
		blippex.popup.addEventListener('blippex-checkbox-https', function(){blippex.popup.onHttps(this.checked)});
		blippex.popup.addEventListener('blippex-checkbox-google', function(){blippex.popup.onGoogle(this.checked)});
	},
	addEventListener: function(id, handler, event){
    event = event || 'click';
		document.getElementById(id).parentNode.replaceChild(document.getElementById(id).cloneNode(true), document.getElementById(id));
		document.getElementById(id).addEventListener(event, handler);
	},
	popupRenderer: function(){
		document.getElementById('blippex-input-value').focus();
		document.getElementById('blippex-checkbox-https').checked = _blippex.browser.settings.get('https', true);
		document.getElementById('blippex-checkbox-google').checked = _blippex.browser.settings.get('google', true);
		document.getElementById('blippex-input-enable').textContent = _blippex.libs.disabled.isEnabled() ? "Deactivate for 30min" : "Reactivate"
	},
	onEnable: function(){
		_blippex.libs.disabled.toggle();
		blippex.popup.onHide();
	},
	onHttps: function(value){
		_blippex.browser.settings.set('https', value);
	},
	onGoogle: function(value){
		_blippex.browser.settings.set('google', value);
	},
	onSearch: function(){
		var _query = document.getElementById('blippex-input-value');
		if (_query && _query.value.length){
			_blippex.browser.tabs.add('https://www.blippex.org/?q='+encodeURIComponent(_query.value));
			_query.value = '';
			blippex.popup.onHide();
		}
	},
	onHide: function(id){
		try {
			var popup = background.document.getElementById(id || "Blippex-popup-main");
			if (popup) {
				popup.hidePopup();
			}
		} catch (e) {}
	},
	onFit: function(){
    background.document.getElementById("Blippex-popup-main").style.height = document.body.scrollHeight + 7 + 'px';
  }
});

