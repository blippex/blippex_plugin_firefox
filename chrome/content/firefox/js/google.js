blippex.define('blippex.content.google', {
  engine:   'google',
  query:    '',
  tabs:     {},
  init: function(tab) {
    if (!/google/i.test(tab.doc.defaultView.location.host)){
      return;
    }
    if (!tab.doc.getElementById('blippex')){
      var style = tab.doc.createElement('style');
      style.setAttribute('type', 'text/css');
      style.appendChild(tab.doc.createTextNode(blippex.api.search.css));
      tab.doc.getElementsByTagName("head")[0].appendChild(style);
    }
    blippex.content.google.setListeners(tab);
    blippex.api.search.sendMessage(tab, {
      'action': 'search',
      'engine': this.engine,
      'query':  this.getQueryFromURL(tab.doc)
    });
    if (blippex.content.google.tabs[tab.id] && blippex.content.google.tabs[tab.id].ddg_timer) {
      clearTimeout(blippex.content.google.tabs[tab.id].ddg_timer);
    }
    blippex.content.google.tabs[tab.id] = {
      ddg_timer: null,
      href:      ''
    }
    tab.doc.defaultView.setInterval(function(){
       if (blippex.content.google.tabs[tab.id].href != tab.doc.defaultView.location.href){
          blippex.content.google.tabs[tab.id].href = tab.doc.defaultView.location.href
          blippex.api.search.sendMessage(tab, {
            'action': 'search',
            'engine': blippex.content.google.engine,
            'query':  blippex.content.google.getQueryFromURL(tab.doc)
          });
       }
    }, 500);
    tab.doc.querySelector("[name=q]").addEventListener('keyup', function(e){
        var query = blippex.content.google.getQuery(null, tab.doc);
    
        var fn = function(){ blippex.content.google.qsearch(null, tab); };
    
        if(e.keyCode == 40 || e.keyCode == 38)
            fn = function(){ blippex.content.google.qsearch(true, tab); };
    
        clearTimeout(blippex.content.google.tabs[tab.id].ddg_timer);
        blippex.content.google.tabs[tab.id].ddg_timer = setTimeout(function(){
            fn();
        }, 700);
        tab.doc.getElementsByClassName("gssb_c")[0].onclick = function(){
            blippex.content.google.qsearch(true, tab);
        };
    }, true);
    tab.doc.querySelector("[name=btnG]").addEventListener('click', function(){
      blippex.content.google.qsearch(null, tab);
    }, true);
  },
  setListeners: function(tab) {
  },
  sendMessage: function(tab, request){
    switch (request.type) {
      case 'search':
        if (tab.doc.getElementById(request.where.id)) {
          var pLayer = tab.doc.getElementById('blippex');
          var newDiv = tab.doc.createElement('div');
          newDiv.innerHTML = request.tpl;
          if (pLayer) {
            pLayer.parentNode.replaceChild(newDiv, pLayer);
          } else if (request.where.position == 'end') {
            tab.doc.getElementById(request.where.id).appendChild(newDiv);
          } else {
            tab.doc.getElementById(request.where.id).insertBefore(newDiv, tab.doc.getElementById(request.where.id).firstChild);
          }
          //blippex.content.google.addEventListener(tab.doc, 'blippex-button-close', function(){
          //  tab.doc.getElementById('blippex-layout-confirmation').style.display = '';
          //  tab.doc.getElementById('blippex-layout-results').style.display = 'none';
          //});
          //blippex.content.google.addEventListener(tab.doc, 'blippex-button-confrim-yes', function(){
          //  newDiv.style.display = 'none';
          //  blippex.api.search.sendMessage(tab, {
          //    'action':   'disable_overlay',
          //    'engine':   blippex.content.google.engine
          //  });
          //});
          //blippex.content.google.addEventListener(tab.doc, 'blippex-button-confrim-no', function(){
          //  tab.doc.getElementById('blippex-layout-confirmation').style.display = 'none';
          //  tab.doc.getElementById('blippex-layout-results').style.display = '';
          //});
        }
        break;
      default:
    }
  },
	addEventListener: function(doc, id, handler, event){
    event = event || 'click';
		doc.getElementById(id).parentNode.replaceChild(doc.getElementById(id).cloneNode(true), doc.getElementById(id));
		doc.getElementById(id).addEventListener(event, handler);
	},
  getQueryFromURL: function(doc) {
    var regex = new RegExp('[\?\&\#]q=([^\&#]+)');
    if (regex.test(doc.defaultView.location.href)) {
      var q = doc.defaultView.location.href.split(regex);
      q = q[q.length - 2].replace(/\+/g, " ");
      return decodeURIComponent(q);
    }
  },
  getQuery: function(direct, doc) {
      var instant = doc.getElementsByClassName("gssb_a");
      if (instant.length !== 0 && !direct){
          var selected_instant = instant[0];
          
          var query = selected_instant.childNodes[0].childNodes[0].childNodes[0].
                      childNodes[0].childNodes[0].childNodes[0].innerHTML;
          query = query.replace(/<\/?(?!\!)[^>]*>/gi, '');
  
          return query;
      } else {
          return doc.getElementsByName('q')[0].value;
      }
  },
  qsearch: function(direct, tab){
    var query = blippex.content.google.getQuery(direct, tab.doc);
    blippex.content.google.query = query;
    blippex.content.google
    blippex.api.search.sendMessage(tab, {
      'action': 'search',
      'engine': blippex.content.google.engine,
      'query':  query
    });
  }
});