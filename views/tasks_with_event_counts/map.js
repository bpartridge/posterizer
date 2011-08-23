function(doc) {
  if (doc.type == 'task_event' && !(doc.notCurrent)) {
    var count = doc.count;
    if (count === null || count === undefined) count = 1;
    else count = parseInt(count);
    emit(doc.task_id, count);
  }
  else if (doc.type == 'task') {
    emit(doc._id, doc);
  }
}