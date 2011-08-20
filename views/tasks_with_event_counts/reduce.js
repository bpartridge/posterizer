function(keys, values, rereduce) {
  var count = 0, task = null, i = 0, len = values.length, val;
  for (; i < len; i += 1) {
    val = values[i];
    if (!val) { count += 1; }
    else {
      // assume it's the task dictionary
      task = task || val;
      if (val.eventCount) count += parseInt(val.eventCount);
    }
  }
  if (task) { task.eventCount = count; }
  return task || count;
};

/*
Here's how reduces/rereduces will work:
task, count -> task
task, task -> task
count, count -> count
We're guaranteed to see a full task at the top of the list.
*/