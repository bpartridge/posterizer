(function() {
  var ActivityEntryView, ActivityUtilsView, ActivityView, HomeView, State, Task, TaskEvent, TaskEventAddView, TaskEventCollection, TaskTableEntryView, TaskTableView, TasksWithEventCounts, UpdatingCollectionView, User, UserCollection, UserSelectEntryView, UserSelectView, reapplyStyles, state;
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
      user_id: null,
      user_name: null,
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
  User = (function() {
    __extends(User, Backbone.Model);
    function User() {
      User.__super__.constructor.apply(this, arguments);
    }
    return User;
  })();
  UserCollection = (function() {
    __extends(UserCollection, Backbone.Collection);
    function UserCollection() {
      UserCollection.__super__.constructor.apply(this, arguments);
    }
    UserCollection.prototype.model = User;
    UserCollection.prototype.url = '/users';
    return UserCollection;
  })();
  Task = (function() {
    __extends(Task, Backbone.Model);
    function Task() {
      Task.__super__.constructor.apply(this, arguments);
    }
    Task.prototype.defaults = {
      type: 'task',
      title: 'Untitled Task',
      eventCount: 0
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
  TaskEvent = (function() {
    __extends(TaskEvent, Backbone.Model);
    function TaskEvent() {
      TaskEvent.__super__.constructor.apply(this, arguments);
    }
    TaskEvent.prototype.defaults = {
      type: 'task_event',
      task_id: null,
      task_title: null,
      user_name: null,
      timestamp: null,
      notCurrent: false
    };
    TaskEvent.prototype.initialize = function() {
      if (!this.has('timestamp')) {
        return this.set({
          timestamp: new Date().toString()
        });
      }
    };
    return TaskEvent;
  })();
  TaskEventCollection = (function() {
    __extends(TaskEventCollection, Backbone.Collection);
    function TaskEventCollection() {
      this.getAllIds = __bind(this.getAllIds, this);
      TaskEventCollection.__super__.constructor.apply(this, arguments);
    }
    TaskEventCollection.prototype.db = {
      changes: true
    };
    TaskEventCollection.prototype.url = '/task_events';
    TaskEventCollection.prototype.model = TaskEvent;
    TaskEventCollection.prototype.comparator = function(event) {
      var val;
      val = -(new Date(event.get('timestamp')).getTime());
      return val;
    };
    TaskEventCollection.prototype.getAllIds = function() {
      return this.map(function(model) {
        return model.id;
      });
    };
    return TaskEventCollection;
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
        task_title: this.model.get('title')
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
      this.childViewName || (this.childViewName = options.childViewName);
      if (!this.childViewConstructor) {
        throw "no child view constructor";
      }
      this._childViews = [];
      this.collection.each(this.add);
      this.collection.bind('add', this.reset);
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
        return this.add(model, {
          no_reapply_styles: true
        });
      }, this));
      return reapplyStyles(this.el);
    };
    UpdatingCollectionView.prototype.add = function(model, options) {
      var childView;
      childView = new this.childViewConstructor({
        model: model
      });
      this._childViews.push(childView);
      if (this._rendered) {
        this.renderChildView(childView);
      }
      if (!(options != null ? options.no_reapply_styles : void 0)) {
        return reapplyStyles(this.el);
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
      var view, _i, _len, _ref;
      if (!this._rendered) {
        _ref = this._childViews;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          this.renderChildView(view);
        }
        reapplyStyles(this.el);
      }
      return this._rendered = true;
    };
    UpdatingCollectionView.prototype.renderChildView = function(childView) {
      $(this.el).append(childView.el);
      return childView.render();
    };
    return UpdatingCollectionView;
  })();
  TaskTableView = (function() {
    __extends(TaskTableView, UpdatingCollectionView);
    function TaskTableView() {
      TaskTableView.__super__.constructor.apply(this, arguments);
    }
    TaskTableView.prototype.childViewConstructor = TaskTableEntryView;
    TaskTableView.prototype.childViewName = 'TaskTableEntryView';
    TaskTableView.prototype.initialize = function() {
      return TaskTableView.__super__.initialize.call(this, arguments);
    };
    return TaskTableView;
  })();
  TaskEventAddView = (function() {
    __extends(TaskEventAddView, Backbone.View);
    function TaskEventAddView() {
      this.error = __bind(this.error, this);
      this.success = __bind(this.success, this);
      this.onSubmit = __bind(this.onSubmit, this);
      this.render = __bind(this.render, this);
      TaskEventAddView.__super__.constructor.apply(this, arguments);
    }
    TaskEventAddView.prototype.initialize = function() {
      TaskEventAddView.__super__.initialize.call(this, arguments);
      return state.bind('change', this.render);
    };
    TaskEventAddView.prototype.render = function() {
      if (!state.get('user_name')) {
        this.$('.desc').text("You must log in below before adding activity to a task.");
        return this.$('> :not(a.login-button,.desc)').hide();
      } else {
        this.$('> *').show();
        return this.$('.desc').text("Adding activity as " + (state.get('user_name')) + " to task: \n" + (state.get('task_title')));
      }
    };
    TaskEventAddView.prototype.events = {
      "submit form": "onSubmit"
    };
    TaskEventAddView.prototype.onSubmit = function() {
      var attributes;
      if (this._submitting) {
        return false;
      }
      this._submitting = true;
      if (!this.collection) {
        this.error('no collection specified');
      }
      if (!state.get('task_id')) {
        this.error('no task specified');
      }
      if (!state.get('user_id')) {
        this.error('no user specified');
      }
      attributes = {
        task_id: state.get('task_id'),
        task_title: state.get('task_title'),
        user_id: state.get('user_id'),
        user_name: state.get('user_name')
      };
      this.collection.create(attributes, {
        success: this.success,
        error: this.error
      });
      return false;
    };
    TaskEventAddView.prototype.success = function() {
      var desc;
      desc = $('#add-activity-result').find('.desc');
      desc.text("Successfully added activity");
      this._submitting = false;
      return $.mobile.changePage('#add-activity-result', {
        transition: 'pop'
      });
    };
    TaskEventAddView.prototype.error = function(err) {
      var desc;
      desc = $('#add-activity-result').find('.desc');
      err || (err = "Unknown error");
      desc.text("Error adding activity: " + err);
      this._submitting = false;
      return $.mobile.changePage('#add-activity-result', {
        transition: 'pop'
      });
    };
    return TaskEventAddView;
  })();
  ActivityEntryView = (function() {
    __extends(ActivityEntryView, Backbone.View);
    function ActivityEntryView() {
      this.render = __bind(this.render, this);
      ActivityEntryView.__super__.constructor.apply(this, arguments);
    }
    ActivityEntryView.prototype.tagName = $('#activity-entry-template')[0].nodeName;
    ActivityEntryView.prototype.template = _.template($('#activity-entry-template').html());
    ActivityEntryView.prototype.initialize = function() {
      ActivityEntryView.__super__.initialize.call(this, arguments);
      this.model.bind('change', this.render);
      return this.render();
    };
    ActivityEntryView.prototype.render = function() {
      var content;
      content = this.model.toJSON();
      $(this.el).html(this.template(content));
      if (content.notCurrent) {
        return $(this.el).attr('data-theme', 'a');
      } else {
        return $(this.el).attr('data-theme', 'e');
      }
    };
    return ActivityEntryView;
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
      if (state.get('user_name')) {
        return this.$('h2').text("Welcome, " + (state.get('user_name')) + "!");
      } else {
        return this.$('h2').text("Welcome to the Posterizer!");
      }
    };
    return HomeView;
  })();
  UserSelectEntryView = (function() {
    __extends(UserSelectEntryView, Backbone.View);
    function UserSelectEntryView() {
      this.onLink = __bind(this.onLink, this);
      this.render = __bind(this.render, this);
      UserSelectEntryView.__super__.constructor.apply(this, arguments);
    }
    UserSelectEntryView.prototype.tagName = $('#user-select-entry-template')[0].nodeName;
    UserSelectEntryView.prototype.template = _.template($('#user-select-entry-template').html());
    UserSelectEntryView.prototype.initialize = function() {
      UserSelectEntryView.__super__.initialize.call(this, arguments);
      return this.render();
    };
    UserSelectEntryView.prototype.render = function() {
      var content;
      content = this.model.toJSON();
      return $(this.el).html(this.template(content));
    };
    UserSelectEntryView.prototype.events = {
      "click a": "onLink"
    };
    UserSelectEntryView.prototype.onLink = function() {
      console.log("Setting state for", this.model);
      state.set({
        user_id: this.model.id,
        user_name: this.model.get('name')
      });
      return true;
    };
    return UserSelectEntryView;
  })();
  UserSelectView = (function() {
    __extends(UserSelectView, UpdatingCollectionView);
    function UserSelectView() {
      UserSelectView.__super__.constructor.apply(this, arguments);
    }
    UserSelectView.prototype.childViewConstructor = UserSelectEntryView;
    UserSelectView.prototype.childViewName = 'UserSelectEntryView';
    return UserSelectView;
  })();
  ActivityView = (function() {
    __extends(ActivityView, UpdatingCollectionView);
    function ActivityView() {
      ActivityView.__super__.constructor.apply(this, arguments);
    }
    ActivityView.prototype.childViewConstructor = ActivityEntryView;
    ActivityView.prototype.childViewName = 'ActivityEntryView';
    return ActivityView;
  })();
  ActivityUtilsView = (function() {
    __extends(ActivityUtilsView, Backbone.View);
    function ActivityUtilsView() {
      this.deleteAll = __bind(this.deleteAll, this);
      this.markOld = __bind(this.markOld, this);
      ActivityUtilsView.__super__.constructor.apply(this, arguments);
    }
    ActivityUtilsView.prototype.events = {
      'click #activity-mark-old': "markOld",
      'click #activity-delete-all': "deleteAll"
    };
    ActivityUtilsView.prototype.markOld = function() {
      var marker, models;
      models = this.collection.models;
      marker = __bind(function() {
        var model;
        if (model = _(models).first()) {
          models = _(models).rest();
          console.log("marker: marking", model);
          return model.save({
            notCurrent: true
          }, {
            success: marker
          });
        } else {
          return location.reload();
        }
      }, this);
      marker();
      $('.ui-btn-active').removeClass('ui-btn-active');
      return false;
    };
    ActivityUtilsView.prototype.deleteAll = function() {
      var destroyer;
      destroyer = __bind(function() {
        var model;
        if (model = this.collection.first()) {
          console.log("destroyer: destroying", model);
          return model.destroy({
            success: destroyer
          });
        } else {
          return location.reload();
        }
      }, this);
      destroyer();
      $('.ui-btn-active').removeClass('ui-btn-active');
      return false;
    };
    return ActivityUtilsView;
  })();
  $(function() {
    var events, tasks, users, views;
    views = [];
    views.push(new HomeView({
      el: $('#home').find('.content')
    }));
    tasks = new TasksWithEventCounts;
    tasks.fetch();
    views.push(new TaskTableView({
      el: $('#task-table'),
      collection: tasks
    }));
    users = new UserCollection;
    users.fetch();
    views.push(new UserSelectView({
      el: $('#user-select'),
      collection: users
    }));
    events = new TaskEventCollection;
    events.fetch({
      success: function() {
        var fetcher;
        fetcher = function() {
          return tasks.fetch();
        };
        return events.bind('all', _.debounce(fetcher, 200));
      }
    });
    views.push(new ActivityView({
      el: $('#activity-list'),
      collection: events
    }));
    views.push(new ActivityUtilsView({
      el: $('#activity-utils'),
      collection: events
    }));
    views.push(new TaskEventAddView({
      el: $('#add-activity').find('.content'),
      collection: events
    }));
    $('body').live('pagecreate', function() {
      var view, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = views.length; _i < _len; _i++) {
        view = views[_i];
        _results.push(view.render());
      }
      return _results;
    });
    return $('body').live('pageshow', function() {
      return $('.ui-btn-active').removeClass('ui-btn-active');
    });
  });
}).call(this);
