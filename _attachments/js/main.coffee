Backbone.couch_connector.config.db_name = 'posters'
Backbone.couch_connector.config.ddoc_name = 'app'

# Enables Mustache.js-like templating.
_.templateSettings = `{interpolate : /\{\{(.+?)\}\}/g}`

reapplyStyles = (child) ->
  el = $(child).closest('[data-role="page"]')
  # console.log "reapplyStyles", child, el
  try
    el.find('ul[data-role]').listview('refresh')
    el.find('div[data-role="fieldcontain"]').fieldcontain('refresh')
    el.find('button[data-role="button"]').button('refresh')
    el.find('input,textarea').textinput('refresh')
    el.page()
  catch error
    # console.log "Error in reapplyStyles", error

class State extends Backbone.Model
  defaults:
    username: null
    task_id: null
    task_title: 'unknown'
  initialize: ->
    @bind 'all', -> console.log arguments # for debugging

state = new State

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

class TaskTableEntryView extends Backbone.View
  tagName: $('#task-table-entry-template')[0].nodeName
  template: _.template($('#task-table-entry-template').html())
  initialize: ->
    super(arguments)
    # console.log this, this.model, options
    @render()
  render: =>
    # console.log "Rendering", this, "to", @el, "parent", $(@el).parent()
    content = @model.toJSON()
    $(@el).html @template(content)
  events:
    "click a": "onLink"
  onLink: =>
    # console.log "Setting state for", @model
    state.set
      task_id: @model.id
      task_title: @model.get 'task_title'
    true # follow link, which will bring up an editing page

class UpdatingCollectionView extends Backbone.View
  initialize: (options) ->
    @childViewConstructor ||= options.childViewConstructor
    # console.log this
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
    reapplyStyles @el
  remove: (model) =>
    viewToRemove = _(@_childViews).detect (cv) -> cv.model is model
    @_childViews = _(@_childViews).without viewToRemove
    if @_rendered
      $(viewToRemove.el).remove()
  render: =>
    @_rendered = true
    @renderChildView view for view in @_childViews
    reapplyStyles @el
  renderChildView: (childView) =>
    $(@el).append childView.el
    childView.render

class TaskTableView extends UpdatingCollectionView
  childViewConstructor: TaskTableEntryView
  initialize: ->
    super(arguments)
    # console.log "TaskTableView initialized", this

class TaskEventAddView extends Backbone.View
  initialize: ->
    super(arguments)
    state.bind 'change', @render
  render: =>
    if not state.get 'username'
      $(@el).text """
        You must log in below before adding activity to a task."""
    else
      $(@el).text """
        Adding activity as #{state.get 'username'} to task: 
        #{state.get 'task_title'}"""

class HomeView extends Backbone.View
  initialize: ->
    super(arguments)
    state.bind 'change', @render
    @render()
  render: =>
    if state.get 'username'
      @$('h2').text "Welcome, #{state.get 'username'}!"
    else
      @$('h2').text "Welcome to the Posterizer!"

$ ->
  views = []
  views.push new HomeView
    el: $('#home').find('.content')
  views.push new TaskTableView
    el: $('#task-table')
    collection: tasksWithEventCounts
  tasksWithEventCounts.fetch()
  
  views.push new TaskEventAddView
    el: $('#add-activity').find('.content')
  $('body').live 'pagecreate', ->
    view.render() for view in views
