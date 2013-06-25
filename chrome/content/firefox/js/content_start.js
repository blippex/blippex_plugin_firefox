blippex.define('blippex.content.content_start', {
   init: function(_doc) {
      var doc = _doc || document;
      doc && blippex.content.content_start._embedPluginPresenceVariable(doc);
   },
   _embedPluginPresenceVariable: function(doc) {
      if (doc.location.href.indexOf("blippex.org") > -1) {
         var scr = doc.createElement("script");
         scr.type = "text/javascript";
         scr.textContent = 'window.blippexExtension = 1;';
         (doc.head || doc.body || doc.documentElement).appendChild(scr);
      }
   }
});