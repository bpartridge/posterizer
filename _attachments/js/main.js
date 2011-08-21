(function() {
  var HomeView, State, Task, TaskEvent, TaskEventAddView, TaskTableEntryView, TaskTableView, TasksWithEventCounts, UpdatingCollectionView, reapplyStyles, state, tasksWithEventCounts;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Backbone.couch_connector.config.db_name = 'posters';
  Backbone.couch_connector.config.ddoc_name = 'app';
  _.templateSettings = {interpolate : /\{\{(.+?)\}\}/g};
  reapplyStyles = function(child) {
    var el;
    el = $(child).closest('[data-role="page"]');
    try {
      el.find('ul[data-role]').listview('refresh');
      el.find('div[data-role="fieldcontain"]').fieldcontain('refresh');
      el.find('button[data-role="button"]').button('refresh');
      el.find('input,textarea').textinput('refresh');
      return el.page();
    } catch (error) {

    }
  };
  State = (function() {
    __extends(State, Backbone.Model);
    function State() {
      State.__super__.constructor.apply(this, arguments);
    }
    State.prototype.defaults = {
      username: null,
      task_id: null,
      task_title: 'unknown'
    };
    State.prototype.initialize = function() {
      return this.bind('all', function() {
        return console.log(arguments);
      });
    };
    return State;
  })();
  state = new State;
  Task = (function() {
    __extends(Task, Backbone.Model);
    function Task() {
      Task.__super__.constructor.apply(this, arguments);
    }
    Task.prototype.defaults = {
      type: 'task',
      title: 'Untitled Task'
    };
    return Task;
  })();
  TasksWithEventCounts = (function() {
    __extends(TasksWithEventCounts, Backbone.Collection);
    function TasksWithEventCounts() {
      TasksWithEventCounts.__super__.constructor.apply(this, arguments);
    }
    TasksWithEventCounts.prototype.db = {
      view: 'tasks_with_event_counts',
      group: true
    };
    TasksWithEventCounts.prototype.url = '/tasks_with_event_counts';
    TasksWithEventCounts.prototype.model = Task;
    TasksWithEventCounts.prototype.comparator = function(task) {
      return task.get('title');
    };
    return TasksWithEventCounts;
  })();
  tasksWithEventCounts = new TasksWithEventCounts;
  TaskEvent = (function() {
    __extends(TaskEvent, Backbone.Model);
    function TaskEvent() {
      TaskEvent.__super__.constructor.apply(this, arguments);
    }
    TaskEvent.prototype.defaults = {
      type: 'task_event',
      task_id: null,
      task_title: null
    };
    return TaskEvent;
  })();
  TaskTableEntryView = (function() {
    __extends(TaskTableEntryView, Backbone.View);
    function TaskTableEntryView() {
      this.onLink = __bind(this.onLink, this);
      this.render = __bind(this.render, this);
      TaskTableEntryView.__super__.constructor.apply(this, arguments);
    }
    TaskTableEntryView.prototype.tagName = $('#task-table-entry-template')[0].nodeName;
    TaskTableEntryView.prototype.template = _.template($('#task-table-entry-template').html());
    TaskTableEntryView.prototype.initialize = function() {
      TaskTableEntryView.__super__.initialize.call(this, arguments);
      return this.render();
    };
    TaskTableEntryView.prototype.render = function() {
      var content;
      content = this.model.toJSON();
      return $(this.el).html(this.template(content));
    };
    TaskTableEntryView.prototype.events = {
      "click a": "onLink"
    };
    TaskTableEntryView.prototype.onLink = function() {
      state.set({
        task_id: this.model.id,
        task_title: this.model.get('task_title')
      });
      return true;
    };
    return TaskTableEntryView;
  })();
  UpdatingCollectionView = (function() {
    __extends(UpdatingCollectionView, Backbone.View);
    function UpdatingCollectionView() {
      this.renderChildView = __bind(this.renderChildView, this);
      this.render = __bind(this.render, this);
      this.remove = __bind(this.remove, this);
      this.add = __bind(this.add, this);
      this.reset = __bind(this.reset, this);
      UpdatingCollectionView.__super__.constructor.apply(this, arguments);
    }
    UpdatingCollectionView.prototype.initialize = function(options) {
      this.childViewConstructor || (this.childViewConstructor = options.childViewConstructor);
      if (!this.childViewConstructor) {
        throw "no child view constructor";
      }
      this._childViews = [];
      this.collection.each(this.add);
      this.collection.bind('add', this.add);
      this.collection.bind('remove', this.remove);
      return this.collection.bind('reset', this.reset);
    };
    UpdatingCollectionView.prototype.reset = function() {
      var view, _i, _len, _ref;
      if (this._rendered) {
        _ref = this._childViews;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          $(view.el).remove();
        }
      }
      this.collection.each(__bind(function(model) {
        return this.add(model);
      }, this));
      return null;
    };
    UpdatingCollectionView.prototype.add = function(model) {
      var childView;
      childView = new this.childViewConstructor({
        model: model
      });
      this._childViews.push(childView);
      if (this._rendered) {
        this.renderChildView(childView);
      }
      return reapplyStyles(this.el);
    };
    UpdatingCollectionView.prototype.remove = function(model) {
      var viewToRemove;
      viewToRemove = _(this._childViews).detect(function(cv) {
        return cv.model === model;
      });
      this._childViews = _(this._childViews).without(viewToRemove);
      if (this._rendered) {
        return $(viewToRemove.el).remove();
      }
    };
    UpdatingCollectionView.prototype.render = function() {
      var view, _i, _len, _ref;
      this._rendered = true;
      _ref = this._childViews;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        view = _ref[_i];
        this.renderChildView(view);
      }
      return reapplyStyles(this.el);
    };
    UpdatingCollectionView.prototype.renderChildView = function(childView) {
      $(this.el).append(childView.el);
      return childView.render;
    };
    return UpdatingCollectionView;
  })();
  TaskTableView = (function() {
    __extends(TaskTableView, UpdatingCollectionView);
    function TaskTableView() {
      TaskTableView.__super__.constructor.apply(this, arguments);
    }
    TaskTableView.prototype.childViewConstructor = TaskTableEntryView;
    TaskTableView.prototype.initialize = function() {
      return TaskTableView.__super__.initialize.call(this, arguments);
    };
    return TaskTableView;
  })();
  TaskEventAddView = (function() {
    __extends(TaskEventAddView, Backbone.View);
    function TaskEventAddView() {
      this.render = __bind(this.render, this);
      TaskEventAddView.__super__.constructor.apply(this, arguments);
    }
    TaskEventAddView.prototype.initialize = function() {
      TaskEventAddView.__super__.initialize.call(this, arguments);
      return state.bind('change', this.render);
    };
    TaskEventAddView.prototype.render = function() {
      if (!state.get('username')) {
        return $(this.el).text("You must log in below before adding activity to a task.");
      } else {
        return $(this.el).text("Adding activity as " + (state.get('username')) + " to task: \n" + (state.get('task_title')));
      }
    };
    return TaskEventAddView;
  })();
  HomeView = (function() {
    __extends(HomeView, Backbone.View);
    function HomeView() {
      this.render = __bind(this.render, this);
      HomeView.__super__.constructor.apply(this, arguments);
    }
    HomeView.prototype.initialize = function() {
      HomeView.__super__.initialize.call(this, arguments);
      state.bind('change', this.render);
      return this.render();
    };
    HomeView.prototype.render = function() {
      if (state.get('username')) {
        return this.$('h2').text("Welcome, " + (state.get('username')) + "!");
      } else {
        return this.$('h2').text("Welcome to the Posterizer!");
      }
    };
    return HomeView;
  })();
  $(function() {
    var views;
    views = [];
    views.push(new HomeView({
      el: $('#home').find('.content')
    }));
    views.push(new TaskTableView({
      el: $('#task-table'),
      collection: tasksWithEventCounts
    }));
    tasksWithEventCounts.fetch();
    views.push(new TaskEventAddView({
      el: $('#add-activity').find('.content')
    }));
    return $('body').live('pagecreate', function() {
      var view, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = views.length; _i < _len; _i++) {
        view = views[_i];
        _results.push(view.render());
      }
      return _results;
    });
  });
}).call(this);
