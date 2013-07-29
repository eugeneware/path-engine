var expect = require('chai').expect,
    bytewise = require('byteup')(),
    levelup = require('levelup'),
    path = require('path'),
    pairs = require('pairs'),
    levelQuery = require('level-queryengine'),
    pathEngine = require('..'),
    rimraf = require('rimraf'),
    after = require('after');

function encode(key) {
  return bytewise.encode(key).toString('hex');
}

function decode(key) {
  return bytewise.decode(new Buffer(key, 'hex'));
}

function log() {
  console.error.apply(console, [].slice.apply(arguments));
}

describe('level-plan', function() {
  var db, dbPath = path.join(__dirname, '..', 'data', 'test-db');

  beforeEach(function(done) {
    rimraf.sync(dbPath);
    db = levelup(dbPath, { keyEncoding: 'bytewise', valueEncoding: 'json' }, done);
  });

  afterEach(function(done) {
    db.close(done);
  });

  it('should be able to build a simple path query engine', function(done) {
    db = levelQuery(db);

    db.query.use(pathEngine());
    db.ensureIndex('name');

    db.batch(testData(), doQuery);
    function doQuery(err) {
      if (err) return done(err);
      var hits = 0;
      db.query(['name', 'name 42'])
        .on('data', function (data) {
          hits++;
          expect(data.name).to.equal('name 42');
          expect(data.num).to.equal(420);
        })
        .on('stats', function (stats) {
          expect(stats).to.deep.equals(
            { indexHits: 1, dataHits: 1, matchHits: 1 });
        })
        .on('end', function () {
          expect(hits).to.equal(1);
          done();
        });
    }
  });

  it('should be able to be able to do a table scan when no index matches', function(done) {
    db = levelQuery(db);

    db.query.use(pathEngine());
    db.ensureIndex('name');

    db.batch(testData(), doQuery);
    function doQuery(err) {
      if (err) return done(err);
      var hits = 0;
      db.query(['num', 420])
        .on('data', function (data) {
          hits++;
        })
        .on('stats', function (stats) {
          expect(stats).to.deep.equals(
            { indexHits: 0, dataHits: 100, matchHits: 1 });
        })
        .on('end', function () {
          expect(hits).to.equal(1);
          done();
        });
    }
  });

  it('should be able to use the path engines with pairs', function(done) {
    db = levelQuery(db);

    db.query.use(pathEngine());
    db.ensureIndex('*', 'pairs', pairs.index);

    db.batch(testData(), doQuery);
    function doQuery(err) {
      if (err) return done(err);
      var hits = 0;
      db.query(['car', 'year', 2035])
        .on('data', function (data) {
          hits++;
          expect(data.name).to.equal('name 42');
          expect(data.num).to.equal(420);
        })
        .on('stats', function (stats) {
          expect(stats).to.deep.equals(
            { indexHits: 1, dataHits: 1, matchHits: 1 });
        })
        .on('end', function () {
          expect(hits).to.equal(1);
          done();
        });
    }
  });
});

function testData() {
  var batch = [];
  for (var i = 0; i < 100; i++) {
    var obj = {
      name: 'name ' + i,
      car: {
        make: 'Toyota',
        model: i % 2 ? 'Camry' : 'Corolla',
        year: 1993 + i
      },
      pets: [
        { species: 'Cat', breed: i == 50 ? 'Saimese' : 'Burmese' },
        { species: 'Cat', breed: 'DSH' },
        { species: 'Dog', breed: 'Dalmation' }
      ],
      tags: [
        'tag1', 'tag2', 'tag3'
      ],
      tagsNoIndex: [
        'tag1', 'tag2', 'tag3'
      ],
      tree: {
        a: i,
        b: i + 1,
      },
      treeNoIndex: {
        a: i,
        b: i + 1,
      },
      num: 10*i,
      numNoIndex: 10*i
    };
    if (i === 42) {
      obj.tags.push('tag4');
      obj.tagsNoIndex.push('tag4');
    }
    if (i === 84) {
      delete obj.name;
    }
    batch.push({ type: 'put', key: i, value: obj });
  }

  return batch;
}
