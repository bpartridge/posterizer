function(doc) {
  if (doc.type == 'task_event') {
    emit(doc.task_id, null);
  }
  else if (doc.type == 'task') {
    emit(doc._id, doc);
  }
}