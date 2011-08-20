(function() {
  $('#main').text('woohoo');
  $(function() {
    Backbone.couch_connector.config.db_name = "posters";
    Backbone.couch_connector.config.ddoc_name = '';
    return Backbone.couch_connector.enable_changes = true;
  });
}).call(this);
