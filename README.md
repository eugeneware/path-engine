# path-engine

Query your levelup/leveldb engine using a javascript property path array syntax
**with INDEXES**.

This is a plugin for [level-queryengine](https://github.com/eugeneware/level-queryengine).

# Installation

Install through npm:

```
$ npm install path-engine
```

# Usage

``` js
var levelQuery = require('level-queryengine'),
    pathEngine = require('path-engine'),
    levelup = require('levelup'),
    db = levelQuery(levelup('my-db'));

db.query.use(pathEngine());

// index the properties you want:
db.ensureIndex('num');

db.batch(makeSomeData(), function (err) {
  // will find all objects with the num field set to 42
  db.query(['num', 42])
    .on('data', console.log)
    .on('stats', function (stats) {
      // stats contains the query statistics in the format
      //  { indexHits: 1, dataHits: 1, matchHits: 1 });
    });
});
```

## Example Queries

This module uses the popular javascript property array path syntax to query
your levelup database.

For example, for the following object:

``` js
{
  name: 'bob',
  car: {
    make: 'Toyota',
    model: 'Corolla'
  },
  tags: [ 'tag1', 'tag2', 'tag3' ]
}
```

You would get to each of the "leaves" by the following query "path" arrays:

``` js
['name', 'bob'];
['car', 'make', 'Toyota'];
['car', 'model', 'Corolla'];
['tags', 'tag1'];
['tags', 'tag2'];
['tags', 'tag3'];
```

This module adds awesome **INDEX** support to the syntax, so you're not just
filtering your entire database stream, but taking advantage of any indexes
that are set up using [level-queryengine](https://github.com/eugeneware/level-queryengine)

# Indexing Strategy Support

Currently two index strategies are supported:

* `'property'` (default) - index the property defined by the `indexName`.
  If you don't pass in any `emitFunction` (or `indexType`) then this indexing
  strategy will be used by default.
* `'pairs'` - used by the [pairs](https://github.com/eugeneware/pairs) module
   and [jsonquery-engine](https://github.com/eugeneware/jsonquery-engine) to
   index "pairs" of object properties to allow arbitrary object queries with
   a reasonable tradeoff between index size and query performance.

To use the alacarte `'property'` system:

``` js
db.query.use(pathEngine());

// index these properties
db.ensureIndex('num');
db.ensureIndex('tree.a');

db.query(...);
```

To use the `'pairs'` strategy, which effectively indexes almost EVERY field,
with a nice balance between selectiveness and index size:

``` js
var pairs = require('pairs');
db.query.use(pathEngine());

// index all pairs of properties
db.ensureIndex('*', 'pairs', pairs.index);

db.query(...);
```

This will enable you to do effective ad-hoc queries on practically any field.
But, be aware the pairs indexing can be VERY large.

# TODO

This project is under active development. Here's a list of things I'm planning to add:

* Add support for the `true` array placeholder in the path. (eg: ['tags', true, 'tag1'])
* support the `'full-path'` indexing strategy.
* joins?
