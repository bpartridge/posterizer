(function() {
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  $(function() {
    var HomeView, Task, TaskEvent, TaskTableEntryView, TaskTableView, TasksWithEventCounts, UpdatingCollectionView, app, tasksWithEventCounts;
    Backbone.couch_connector.config.db_name = 'posters';
    Backbone.couch_connector.config.ddoc_name = 'app';
    _.templateSettings = {interpolate : /\{\{(.+?)\}\}/g};
    app = {
      activePage: function() {
        return $(".ui-page-active").get(0);
      },
      reapplyStyles: function(el) {
        el.find('ul[data-role]').listview();
        el.find('div[data-role="fieldcontain"]').fieldcontain();
        el.find('button[data-role="button"]').button();
        el.find('input,textarea').textinput();
        return el.page();
      },
      redirectTo: function(page) {
        return $.mobile.changePage(page);
      },
      goBack: function() {
        return $.historyBack();
      }
    };
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
        console.log(this);
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
          return this.renderChildView(childView);
        }
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
        var view, _i, _len, _ref, _results;
        this._rendered = true;
        _ref = this._childViews;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          _results.push(this.renderChildView(view));
        }
        return _results;
      };
      UpdatingCollectionView.prototype.renderChildView = function(childView) {
        $(this.el).append(childView.el);
        return childView.render;
      };
      return UpdatingCollectionView;
    })();
    TaskTableEntryView = (function() {
      __extends(TaskTableEntryView, Backbone.View);
      function TaskTableEntryView() {
        this.render = __bind(this.render, this);
        TaskTableEntryView.__super__.constructor.apply(this, arguments);
      }
      TaskTableEntryView.prototype.tagName = $('#task-table-entry-template')[0].nodeName;
      TaskTableEntryView.prototype.template = _.template($('#task-table-entry-template').html());
      TaskTableEntryView.prototype.initialize = function(options) {
        TaskTableEntryView.__super__.initialize.call(this, options);
        return this.render();
      };
      TaskTableEntryView.prototype.render = function() {
        var content;
        console.log("Rendering", this, "to", this.el);
        content = this.model.toJSON();
        return $(this.el).html(this.template(content));
      };
      return TaskTableEntryView;
    })();
    TaskTableView = (function() {
      __extends(TaskTableView, UpdatingCollectionView);
      function TaskTableView() {
        TaskTableView.__super__.constructor.apply(this, arguments);
      }
      TaskTableView.prototype.childViewConstructor = TaskTableEntryView;
      TaskTableView.prototype.initialize = function(options) {
        TaskTableView.__super__.initialize.call(this, options);
        this.el = app.activePage();
        return this.render();
      };
      return TaskTableView;
    })();
    HomeView = (function() {
      __extends(HomeView, Backbone.View);
      function HomeView() {
        this.render = __bind(this.render, this);
        HomeView.__super__.constructor.apply(this, arguments);
      }
      HomeView.prototype.el = $('#home');
      HomeView.prototype.initialize = function(options) {
        HomeView.__super__.initialize.call(this, options);
        this.el = app.activePage();
        return this.render();
      };
      HomeView.prototype.render = function() {
        return this.$('[data-role=content]').text('Loaded');
      };
      return HomeView;
    })();
    return Backbone.history.start();
  });
}).call(this);
