module.exports = pathEngine;
function pathEngine() {
  return {
    query: query,
    match: match,
    plans: {
      'property': propertyPlan,
      'pairs': pairsPlan
    }
  };
}

function parseQuery(q) {
  return {
    prop: q.slice(0, q.length - 1).join('.'),
    path: q.slice(0, q.length - 1),
    value: q[q.length - 1]
  };
}

function propertyPlan(idx, queryParts) {
  var db = this;
  return db.indexes[idx].createIndexStream({
    start: [queryParts.value, null],
    end: [queryParts.value, undefined]
  });
}

function pairsPlan(idx, queryParts) {
  var db = this;
  var stem = queryParts.path.concat(queryParts.value);
  if (stem.length > 2) {
    stem = stem.slice(stem.length - 2);
  }
  return db.indexes[idx].createIndexStream({
    start: stem.concat(null),
    end: stem.concat(undefined)
  });
}

function query(q) {
  var db = this;
  var queryParts = parseQuery(q);
  var idx = db.indexes[queryParts.prop];
  if (idx && idx.type in db.query.engine.plans) {
    return db.query.engine.plans[idx.type].call(db, queryParts.prop, queryParts);
  } else if ((idx == db.indexes['*']) && idx.type in db.query.engine.plans) {
    return db.query.engine.plans[idx.type].call(db, '*', queryParts);
  } else {
    return null;
  }
}

function match(obj, q) {
  var queryParts = parseQuery(q);
  return fetchProp(obj, queryParts.path) === queryParts.value;
}

function fetchProp(obj, path) {
  while (path.length > 0) {
    var prop = path.shift();
    if (obj[prop] !== undefined) {
      obj = obj[prop];
    } else {
      return;
    }
  }
  return obj;
}
