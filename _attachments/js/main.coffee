$ ->
  Backbone.couch_connector.config.db_name = 'posters'
  Backbone.couch_connector.config.ddoc_name = 'app'
  
  # Enables Mustache.js-like templating.
  _.templateSettings = `{interpolate : /\{\{(.+?)\}\}/g}`
  
  app =
    activePage: ->
      $(".ui-page-active").get(0)

    reapplyStyles: (el) ->
      el.find('ul[data-role]').listview();
      el.find('div[data-role="fieldcontain"]').fieldcontain();
      el.find('button[data-role="button"]').button();
      el.find('input,textarea').textinput();
      el.page()

    redirectTo: (page) ->
      $.mobile.changePage page

    goBack: ->
      $.historyBack()
  
  class Task extends Backbone.Model
    defaults:
      type: 'task'
      title: 'Untitled Task'
  
  class TasksWithEventCounts extends Backbone.Collection
    db:
      view: 'tasks_with_event_counts'
      group: true
    url: '/tasks_with_event_counts'
    model: Task
    comparator: (task) -> return task.get 'title'
  
  tasksWithEventCounts = new TasksWithEventCounts
  
  class TaskEvent extends Backbone.Model
    defaults:
      type: 'task_event'
      task_id: null
      task_title: null
  
  class UpdatingCollectionView extends Backbone.View
    initialize: (options) ->
      @childViewConstructor ||= options.childViewConstructor
      console.log this
      throw "no child view constructor" unless @childViewConstructor
      @_childViews = []
      @collection.each @add
      @collection.bind 'add', @add
      @collection.bind 'remove', @remove
      @collection.bind 'reset', @reset
    reset: =>
      if @_rendered
        $(view.el).remove() for view in @_childViews
      @collection.each (model) => @add model
      null
    add: (model) =>
      childView = new @childViewConstructor({model:model})
      @_childViews.push childView
      if @_rendered
        @renderChildView childView
    remove: (model) =>
      viewToRemove = _(@_childViews).detect (cv) -> cv.model is model
      @_childViews = _(@_childViews).without viewToRemove
      if @_rendered
        $(viewToRemove.el).remove()
    render: =>
      @_rendered = true
      @renderChildView view for view in @_childViews
    renderChildView: (childView) =>
      $(@el).append childView.el
      childView.render
  
  class TaskTableEntryView extends Backbone.View
    tagName: $('#task-table-entry-template')[0].nodeName
    template: _.template($('#task-table-entry-template').html())
    initialize: (options) ->
      super(options)
      # console.log this, this.model, options
      @render()
    render: =>
      console.log "Rendering", this, "to", @el
      content = @model.toJSON()
      $(@el).html @template(content)
  
  class TaskTableView extends UpdatingCollectionView
    childViewConstructor: TaskTableEntryView
    initialize: (options) ->
      super(options)
      @el = app.activePage()
      @render()
  
  class HomeView extends Backbone.View
    el: $('#home')
    initialize: (options) ->
      super(options)
      @el = app.activePage()
      @render()
    render: =>
      @$('[data-role=content]').text('Loaded')
  
  Backbone.history.start()