var test = require('tap').test;
var TickMap = require('..');

test('create with new', function(t) {
  var tm = new TickMap();
  t.ok(tm instanceof TickMap);
  t.end();
});

test('create with function', function(t) {
  var tm = TickMap();
  t.ok(tm instanceof TickMap);
  t.end();
});

test('add a value', function(t) {
  var tm = TickMap();
  tm.add(1.3, { name: 'myName' });
  t.end();
});

test('get no value by index in empty TickMap', function(t) {
  var tm = TickMap();
  var got = tm.item(0);
  t.equal(got, undefined);
  t.end();
});

test('get no value by tick in empty TickMap', function(t) {
  var tm = TickMap();
  var got = tm.get(2.2);
  t.equal(got, undefined);
  t.end();
});

test('get bucket items by tick in empty TickMap', function(t) {
  var tm = TickMap();
  var bucket = tm.getBucketItems(3.001);
  t.same(bucket, []);
  t.end();
});

test('add a value and get by index', function(t) {
  var tm = TickMap();
  var value = { prop: new Date() }; // Can be anything
  tm.add(3.142, value);
  t.equal(tm.item(0), value);
  t.equal(tm.length, 1);
  t.end();
});

test('add a value and get by exact tick', function(t) {
  var tm = TickMap();
  var value = { prop: new Date() }; // Can be anything
  tm.add(3.142, value);
  t.equal(tm.length, 1);
  t.equal(tm.get(3.142), value);
  t.end();
});

test('length and bucket count when same', function(t) {
  var tm = new TickMap();
  var ticks = [1.1,2.2,3.3,4.4,5.5,6.6];
  ticks.forEach(function(tick) {
    tm.add(tick, { prop: new Date() });
  });
  t.equal(tm.length, ticks.length);
  t.equal(tm.bucketCount, ticks.length);
  t.end();
});

test('length and bucket count when buckets have many', function(t) {
  var tm = new TickMap();
  var ticks = [1,1.1,1.7,2.2,3.3,3.999,4.4,4.5,5.5,6.6,6,6.9999];
  ticks.forEach(function(tick) {
    tm.add(tick, { prop: new Date() });
  });
  t.equal(tm.length, ticks.length);
  t.equal(tm.bucketCount, 6);
  t.end();
});

test('get buckets by zero-based index', function(t) {
  var tm = new TickMap();
  var ticks = [2.2,3.3,3.999,5.5,6.6,6,6.9999];
  ticks.forEach(function(tick) {
    tm.add(tick, { prop: new Date() });
  });
  t.equal(tm.bucketCount, 4);
  t.equal(tm.bucketAt(0), 2)
  t.equal(tm.bucketAt(1), 3)
  t.equal(tm.bucketAt(2), 5)
  t.equal(tm.bucketAt(3), 6)
  t.equal(tm.bucketAt(4), undefined)
  t.end();
});

test('get correct bucket index for some values', function(t) {
  var tm = new TickMap();
  var ticks = [
    2.2,
    3.3,3.999,
    5.5,
    6.6,6,6.9999
  ];
  ticks.forEach(function(tick) {
    tm.add(tick, { prop: new Date() });
  });
  t.equal(tm.bucketCount, 4);
  t.equal(tm.bucketIndexFor(0), 0);
  t.equal(tm.bucketIndexFor(0.5555), 0);
  t.equal(tm.bucketIndexFor(1), 0);
  t.equal(tm.bucketIndexFor(2), 0);
  t.equal(tm.bucketIndexFor(2.2), 0);
  t.equal(tm.bucketIndexFor(3.5), 1);
  t.equal(tm.bucketIndexFor(4.1), 2);
  t.equal(tm.bucketIndexFor(5), 2);
  t.equal(tm.bucketIndexFor(5.6), 2);
  t.equal(tm.bucketIndexFor(6.9), 3);
  t.equal(tm.bucketIndexFor(7), 4);
  t.equal(tm.bucketIndexFor(10), 4);
  t.end();
});

test('remove values', function(t) {
  var tm = new TickMap();
  var ticks = [
    2.2,
    3.3,3.999,
    5.5,
    6.6,6,6.9999
  ];
  var values = [];
  ticks.forEach(function(tick) {
    var value = { prop: new Date() };
    values.push(value);
    tm.add(tick, value);
  });

  t.notOk(tm.remove(1, { prop: new Date() }));
  t.equal(tm.length, 7);
  t.notOk(tm.remove(2.2, { prop: new Date() }));
  t.equal(tm.length, 7);
  t.ok(tm.remove(ticks[1], values[1]));
  t.equal(tm.length, 6);
  t.ok(tm.remove(ticks[2], values[2]));
  t.equal(tm.length, 5);
  t.end();
});


test('plain iterator', function(t) {
  var tm = new TickMap();
  var ticks = [
    2.2,
    3.3,3.999,
    5.5,
    6.6,6,6.9999
  ];
  var sorted = [0,1,2,3,5,4,6];
  var values = [];
  ticks.forEach(function(tick) {
    var value = { prop: new Date() };
    values.push(value);
    tm.add(tick, value);
  });

  var it = tm.iterator();
  var iteration;
  for(var idx = 0; idx < ticks.length; idx++) {
    iteration = it.next();
    t.notOk(iteration.done);
    t.equal(iteration.value.tick, ticks[sorted[idx]]);
    t.equal(iteration.value.value, values[sorted[idx]]);
  }

  t.ok(it.next().done);
  t.end();
});

test('array-like access', function(t) {
  var tm = new TickMap();
  var ticks = [
    2.2,
    3.3,3.999,
    5.5,
    6.6,6,6.9999
  ];
  var sorted = [0,1,2,3,5,4,6];
  var values = [];
  ticks.forEach(function(tick) {
    var value = { prop: new Date() };
    values.push(value);
    tm.add(tick, value);
  });

  debugger;
  for(var idx = 0; idx < ticks.length; idx++) {
    t.equal(tm[idx].tick, ticks[sorted[idx]]);
    t.equal(tm[idx].value, values[sorted[idx]]);
  }

  t.end();
});

if (typeof Symbol === 'function') {
  require('../es6-tests/tick-map');
}

test('get correct last bucket index for some values', function(t) {
  var tm = new TickMap();
  var ticks = [
    2.2,
    3.3,3.999,
    5.5,
    6.6,6,6.9999
  ];
  ticks.forEach(function(tick) {
    tm.add(tick, { prop: new Date() });
  });
  t.equal(tm.bucketCount, 4);
  t.equal(tm.lastBucketIndexFor(0), 0);
  t.equal(tm.lastBucketIndexFor(0.5555), 0);
  t.equal(tm.lastBucketIndexFor(1), 0);
  t.equal(tm.lastBucketIndexFor(2), 0);
  t.equal(tm.lastBucketIndexFor(2.2), 0);
  t.equal(tm.lastBucketIndexFor(2.3), 0);
  t.equal(tm.lastBucketIndexFor(3.5), 1);
  t.equal(tm.lastBucketIndexFor(4.1), 1);
  t.equal(tm.lastBucketIndexFor(5), 1);
  t.equal(tm.lastBucketIndexFor(5.6), 2);
  t.equal(tm.lastBucketIndexFor(6.9), 3);
  t.equal(tm.lastBucketIndexFor(7), 3);
  t.equal(tm.lastBucketIndexFor(10), 3);
  t.end();
});

test('add a value and fail to get by bucket neighbour', function(t) {
  var tm = TickMap();
  var value = { prop: new Date() }; // Can be anything
  tm.add(3.142, value);
  t.equal(tm.length, 1);
  t.equal(tm.get(3.124), undefined);
  t.end();
});

test('add values and ensure sorted', function(t) {
  var tm = TickMap();

  tm.add(3.2, 'b');
  tm.add(2.6, 'e');
  tm.add(2.2, 'z');
  tm.add(100.9, 'a');
  tm.add(100.0001, 'r');

  var str = '';
  for(var i = 0; i < 5; i++) {
    str += tm.item(i);
  }
  t.same(str, 'zebra');
  t.end();
});

test('add a value and get by bucket neighbours', function(t) {
  var tm = TickMap();
  var value = { prop: new Date() };
  tm.add(5.778, value);
  t.equal(tm.length, 1);
  var items = tm.getBucketItems(5.2);
  t.equal(items[0], value);
  t.equal(items.length, 1);
  t.same(tm.getBucketItems(6), []);
  t.same(tm.getBucketItems(4.9999), []);
  t.end();
});

test('add a load of values and retrieve by all means', function(t) {
  var numValues = 1000;
  var tm = TickMap();
  var values = [];
  var valuesByTick = {};
  var genTick = Math.random();
  for (var i = 0; i < numValues; i++) {
    var value = 'Value_' + i + '_' + genTick; // tick in the value for diagnosis
    values.push(value);
    valuesByTick[genTick] = value;
    tm.add(genTick, value);
    genTick += Math.random() * 3; // unique but sparse tick population
  }
  t.equal(tm.length, numValues);
  for (var i = 0; i < numValues; i++) {
    t.equal(tm.item(i), values[i]);
    t.equal(tm.lastItem(i), values[i]);
  }
  t.equals(tm.lastItem(numValues + 1), values[numValues - 1]);

  for (prop in valuesByTick) {
    if (valuesByTick.hasOwnProperty(prop)) {
      var tick = parseFloat(prop);
      t.equal(tm.get(tick), valuesByTick[prop]);

      var allBucketItems = tm.getBucketItems(tick);
      t.ok(allBucketItems.length > 0);
      t.ok(allBucketItems.indexOf(valuesByTick[prop]) > -1);
    }
  }
  t.end();
});


test('check bounds for lastItem access', function(t) {
  var tm = new TickMap();
  t.equal(tm.item(0), undefined);
  t.equal(tm.lastItem(0), undefined);
  t.equal(tm.item(2), undefined);
  t.equal(tm.lastItem(2), undefined);
  var values = [2,4,6,8];
  for(var i = 0; i < values.length; i++) {
    tm.add(i, values[i]);
  }
  for(var i = 0; i < values.length; i++) {
    t.equal(tm.lastItem(i), values[i]);
  }
  t.equal(tm.lastItem(5), values[values.length - 1]);
  t.equal(tm.lastItem(555), values[values.length - 1]);
  t.end();
});
