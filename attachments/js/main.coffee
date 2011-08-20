$('#main').text 'woohoo'

$ ->
	Backbone.couch_connector.config.db_name = "posters"
	Backbone.couch_connector.config.ddoc_name = ''
	Backbone.couch_connector.enable_changes = true