# main.coffee
# Copyright (c) 2011 Brenton Partridge
# 
# This file is part of Posterizer.
# 
# Posterizer is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# Posterizer is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with Posterizer.  If not, see <http://www.gnu.org/licenses/>.

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
    user_id: null
    user_name: null
    task_id: null
    task_title: 'unknown'
  initialize: ->
    @bind 'all', -> console.log arguments # for debugging

state = new State

class User extends Backbone.Model
class UserCollection extends Backbone.Collection
  model: User
  url: '/users'

class Task extends Backbone.Model
  defaults:
    type: 'task'
    title: 'Untitled Task'
    eventCount: 0

class TasksWithEventCounts extends Backbone.Collection
  db:
    view: 'tasks_with_event_counts'
    group: true
  url: '/tasks_with_event_counts'
  model: Task
  comparator: (task) -> return task.get 'title'

class TaskEvent extends Backbone.Model
  defaults:
    type: 'task_event'
    task_id: null
    task_title: null
    user_name: null
    timestamp: null
    notCurrent: false
  initialize: ->
    if not @has 'timestamp'
      @set {timestamp: new Date().toString()}

class TaskEventCollection extends Backbone.Collection
  db: {changes: true}
  url: '/task_events'
  model: TaskEvent
  comparator: (event) -> 
    val = -(new Date(event.get 'timestamp').getTime())
    # console.log "TaskEventCollection comparator", val
    val
  getAllIds: =>
    @map (model) -> model.id

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
      task_title: @model.get 'title'
    true # follow link, which will bring up an editing page

class UpdatingCollectionView extends Backbone.View
  initialize: (options) ->
    @childViewConstructor ||= options.childViewConstructor
    @childViewName ||= options.childViewName
    # console.log this
    throw "no child view constructor" unless @childViewConstructor
    @_childViews = []
    @collection.each @add
    @collection.bind 'add', @reset # not @add to ensure sorted order
    @collection.bind 'remove', @remove
    # @collection.bind 'remove', @reset # not @remove because elements may be wrapped by jQuery Mobile
    @collection.bind 'reset', @reset
  reset: =>
    # console.log "UCV reset", @childViewName, @collection.size()
    if @_rendered
      $(view.el).remove() for view in @_childViews
      # $(@el).empty() # just to be sure
    @collection.each (model) => @add model, {no_reapply_styles: true}
    reapplyStyles @el
  add: (model, options) =>
    # console.log "UCV add", model
    childView = new @childViewConstructor({model:model})
    @_childViews.push childView
    if @_rendered
      @renderChildView childView
    if not options?.no_reapply_styles
      reapplyStyles @el
  remove: (model) =>
    viewToRemove = _(@_childViews).detect (cv) -> cv.model is model
    @_childViews = _(@_childViews).without viewToRemove
    if @_rendered
      $(viewToRemove.el).remove()
  render: =>
    # console.log "UCV render", @childViewName
    if not @_rendered
      @renderChildView view for view in @_childViews
      reapplyStyles @el
    @_rendered = true
  renderChildView: (childView) =>
    $(@el).append childView.el
    childView.render()

class TaskTableView extends UpdatingCollectionView
  childViewConstructor: TaskTableEntryView
  childViewName: 'TaskTableEntryView'
  initialize: ->
    super(arguments)
    # console.log "TaskTableView initialized", this

class TaskEventAddView extends Backbone.View
  initialize: ->
    super(arguments)
    state.bind 'change', @render
  render: =>
    if not state.get 'user_name'
      @$('.desc').text """
        You must log in below before adding activity to a task."""
      @$('> :not(a.login-button,.desc)').hide()
    else
      @$('> *').show()
      @$('.desc').text """
        Adding activity as #{state.get 'user_name'} to task: 
        #{state.get 'task_title'}"""
  events:
    "submit form" : "onSubmit"
  onSubmit: =>
    return false if @_submitting
    @_submitting = true
    @error 'no collection specified' if not @collection
    @error 'no task specified' if not state.get 'task_id'
    @error 'no user specified' if not state.get 'user_id'
    attributes =
      task_id: state.get 'task_id'
      task_title: state.get 'task_title'
      user_id: state.get 'user_id'
      user_name: state.get 'user_name'
    @collection.create attributes,
      success: @success
      error: @error
    false
  success: =>
    desc = $('#add-activity-result').find('.desc')
    desc.text("Successfully added activity")
    @_submitting = false
    $.mobile.changePage '#add-activity-result',
      transition: 'pop'
  error: (err) =>
    desc = $('#add-activity-result').find('.desc')
    err ||= "Unknown error"
    desc.text("Error adding activity: " + err)
    @_submitting = false
    $.mobile.changePage '#add-activity-result',
      transition: 'pop'

class ActivityEntryView extends Backbone.View
  tagName: $('#activity-entry-template')[0].nodeName
  template: _.template($('#activity-entry-template').html())
  initialize: ->
    super(arguments)
    @model.bind 'change', @render
    @render()
  render: =>
    content = @model.toJSON()
    $(@el).html @template(content)
    if content.notCurrent
      $(@el).attr 'data-theme', 'a' # gray if old
    else
      $(@el).attr 'data-theme', 'e' # blue if current

class HomeView extends Backbone.View
  initialize: ->
    super(arguments)
    state.bind 'change', @render
    @render()
  render: =>
    if state.get 'user_name'
      @$('h2').text "Welcome, #{state.get 'user_name'}!"
    else
      @$('h2').text "Welcome to the Posterizer!"

class UserSelectEntryView extends Backbone.View
  tagName: $('#user-select-entry-template')[0].nodeName
  template: _.template($('#user-select-entry-template').html())
  initialize: ->
    super(arguments)
    @render()
  render: =>
    # console.log "Rendering", this, "to", @el, "parent", $(@el).parent()
    content = @model.toJSON()
    $(@el).html @template(content)
  events:
    "click a": "onLink"
  onLink: =>
    console.log "Setting state for", @model
    state.set
      user_id: @model.id
      user_name: @model.get 'name'
    true # follow link, which will go back

class UserSelectView extends UpdatingCollectionView
  childViewConstructor: UserSelectEntryView
  childViewName: 'UserSelectEntryView'

class ActivityView extends UpdatingCollectionView
  childViewConstructor: ActivityEntryView
  childViewName: 'ActivityEntryView'

class ActivityUtilsView extends Backbone.View
  initialize: ->
    super(arguments)
    @render()
  render: =>
    if window.location.href.indexOf("%20cooler") == -1
      $('#activity-delete-all').hide()
      if window.location.href.indexOf("pianoman") == -1
        $('#activity-mark-old').hide()
  events:
    'click #activity-mark-old' : "markOld"
    'click #activity-delete-all' : "deleteAll"
  markOld: =>
    models = @collection.models
    marker = =>
      if model = _(models).first()
        models = _(models).rest()
        console.log "marker: marking", model
        model.save {notCurrent: true}, {success: marker}
      else
        location.reload() # avoid inconsistency problems
    marker()
    $('.ui-btn-active').removeClass('ui-btn-active')
    return false
  deleteAll: =>
    # recursion woohoo!
    destroyer = =>
      if model = @collection.first()
        console.log "destroyer: destroying", model
        model.destroy {success: destroyer}
      else
        location.reload() # avoid inconsistency problems
    destroyer()
    $('.ui-btn-active').removeClass('ui-btn-active')
    return false

$ ->
  views = []
  views.push new HomeView
    el: $('#home').find('.content')
  
  tasks = new TasksWithEventCounts  
  tasks.fetch()
  views.push new TaskTableView
    el: $('#task-table')
    collection: tasks
  
  users = new UserCollection
  users.fetch()
  views.push new UserSelectView
    el: $('#user-select')
    collection: users
  
  events = new TaskEventCollection
  events.fetch
    success: ->
      fetcher = -> tasks.fetch()
      events.bind 'all', _.debounce(fetcher, 200)
  views.push new ActivityView
    el: $('#activity-list')
    collection: events
  views.push new ActivityUtilsView
    el: $('#activity-utils')
    collection: events
  views.push new TaskEventAddView
    el: $('#add-activity').find('.content')
    collection: events
  
  $('body').live 'pagecreate', ->
    view.render?() for view in views
  
  # the following is a hack to make buttons not blue once a page load is complete
  $('body').live 'pageshow', ->
    $('.ui-btn-active').removeClass('ui-btn-active')
