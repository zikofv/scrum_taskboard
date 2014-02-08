/*
 * A really simple taskboard built with Meteor.
 *
 * You can create and edit tasks.
 * Tasks contain a description, an estimated time and a state. The description field
 * supports markdown syntax.
 *
 * This whole app is based on the parties example: https://github.com/meteor/meteor/tree/devel/examples/parties
 * and this great post: https://www.discovermeteor.com/blog/a-look-at-a-meteor-template/
 * The color palette used comes from: http://www.colourlovers.com/palette/3232382/Villefill4
 *
 * TODO
 * Add checks to the task's fields.
 * Provide support to define a task's fields.
 * Implement swimlanes per user story.
 * Work in Progress a la Kanban.
 * Add a task dependency field.
 * Add user login support.
 */

/*
 * Task states.
 */
states = ["To Do", "In Progress", "To Verify", "Done"]

/*
 * A task has a description, an estimation and a state.
 */
Tasks = new Meteor.Collection("tasks");
/*
 * All tasks CRUD operations must be accessed through Meteor.call
 */
Tasks.allow({
  insert: function (userId, doc) {
    return false;
  },
  update: function (userId, doc, fields, modifier){
    return false;
  },
  remove: function (userId, doc) {
    return false;
  },
});

if (Meteor.isClient) {

  /*---------------------------------------------
   * Helper functions.
   * -------------------------------------------*/ 
  var openTaskDialog = function () {
    Session.set("showTaskDialog", true);
  };
  var closeTaskDialog = function () {
    Session.set("showTaskDialog", false);
  };
  var showTaskDialog = function () {
    return Session.get("showTaskDialog");
  };
  var createTask = function (description, estimation, state) {
    Meteor.call('createTask', description, estimation, state);
  };
  var updateTask = function (tId, description, estimation, state) {
    Meteor.call('updateTask', tId, description, estimation, state);
  };
  var removeTask = function (taskId) {
    if (confirm("Do you really want to delete this task?"))
      Meteor.call('removeTask', taskId);
  };
  var actionIsEdit = function () {
    return _.isEqual(Session.get('action'), 'edit');
  };
  var actionIsCreate = function () {
    return _.isEqual(Session.get('action'), 'create');
  };
  var setCreateAction = function () {
    Session.set('action', 'create');//The current action in this session, is creating a task
  };
  var setEditAction = function (tId) {
    Session.set('selectedTask', tId);
    Session.set('action', 'edit');//The current action in this session, is updating a task
  };
  var getSelectedTask = function () {
    return Session.get('selectedTask');
  };

  /*---------------------------------------------
   * mainContainer template
   * -------------------------------------------*/ 
  Template.mainContainer.showTaskDialog = showTaskDialog;

  /*---------------------------------------------
   * createTask template
   *
   * This template shows a create task button.
   * -------------------------------------------*/ 
  Template.createTask.events({
    'click .createTask' : function (e, t) {
      setCreateAction();
      openTaskDialog();
    },
  });

  /*--------------------------------------------
   * taskDialog template
   *
   * This template is shown as a modal dialog, when
   * creating or updating tasks.
   *
   * We must check the 'action' set in the Session,
   * to determine whether we are creating a new task
   * or updating an old one.
   * -------------------------------------------*/ 
  Template.taskDialog.states = states;

  Template.taskDialog.task = function () {
    if (actionIsEdit()) {
      return Tasks.findOne(getSelectedTask());
    }
    return {};
  };

  Template.taskDialog.title = function (){
    if (actionIsCreate())
      return 'Create Task';
    else
      return 'Edit Task';
  };

  //Check the discovermeteor post to see how this works
  Template.taskDialog.selected = function () {
    if (actionIsEdit()) {
      var task = Tasks.findOne(getSelectedTask());
      return _.isEqual(this, task.state) ? 'selected' : '';
    }
    else return '';
  };

  Template.taskDialog.events({
    'click .save' : function (evt, tmpl) {
      var description = tmpl.find(".description").value;
      var estimation = tmpl.find(".estimation").value;
      var state = tmpl.find(".state").value;
      if (actionIsCreate()){
        createTask(description, estimation, state);
      }
      else {
        if (actionIsEdit()){
          updateTask(getSelectedTask(), description, estimation, state)
        }
      }
      closeTaskDialog();
    },
    'click .cancel' : function (evt, tmpl) {
      closeTaskDialog();
    },
  });

  /*--------------------------------------------
   * taskBoard template
   *
   * This template shows a column with tasks for each possible task state.
   * -------------------------------------------*/ 
  // Bootstrap's grid uses 12 columns.
  Template.taskBoard.columnWidth = function () {
    return Math.floor(12 / states.length)
  };
  Template.taskBoard.columnTitles = states;
  Template.taskBoard.tasksByState = function (st) {
    return Tasks.find({ state:st });
  };

  /*--------------------------------------------
   * task template
   *
   * This template shows a single task.
   * -------------------------------------------*/ 
  Template.task.columnWidth = Template.taskBoard.columnWidth;

  /*
   * Tasks can be edited or removed.
   */
  Template.task.events({ 
    'click .removeTask' : function (evt, tmpl) {
      removeTask(this._id);
    },
    'click .editTask' : function (evt, tmpl) {
      setEditAction(this._id);
      openTaskDialog();
    }
  });
}

/*--------------------------------------------
 * Meteor methods
 * Here we group the task's CRUD methods
 * -------------------------------------------*/ 
Meteor.methods({
  createTask: function (description, estimation, state) {
    if (_.contains(states, state)) {
      Tasks.insert({
        description: description,
        estimation: estimation,
        state: state,
      });
    }
  },
  updateTask: function (tId, description, estimation, state) {
    if (_.contains(states, state)){
      Tasks.update(
        tId,
        {
        description: description,
        estimation: estimation,
        state: state,
      });
    }
  },
  removeTask: function (tId) {
    Tasks.remove(tId);
  }
});
