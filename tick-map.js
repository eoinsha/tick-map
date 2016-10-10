module.exports = TickMap;

var Map = require('pseudomap');

var Find = require('lodash.find');
var SortedIndexBy = require('lodash.sortedindexby');

function TickMap() {
  if (!(this instanceof TickMap)) {
    return new TickMap();
  }

  this.internals = {
    tickSeq: [],  // Ordered array of populated ticks in the map. Duplicates are allowed
    bucketMap: new Map()
  };
}

Object.defineProperties(TickMap.prototype, {
  length: { enumerable: true, get: function() {
    return this.internals.tickSeq.length;
  }},
  _getBucket: { enumerable: false, get: function() {
    return getBucket;
  }}
});


TickMap.prototype.add = function(tick, value) {
  var targetIndex = SortedIndexBy(this.internals.tickSeq, tick);
  this.internals.tickSeq.splice(targetIndex, 0, tick);

  var bucketKey = makeBucketKey(tick);
  var entry = new Entry(tick, value);
  var bucket = this.internals.bucketMap.get(bucketKey);
  if (!bucket) {
    bucket = [ entry ];
    this.internals.bucketMap.set(bucketKey, bucket);
    return;
  }
  var bucketIndex = SortedIndexBy(bucket, entry, entryTickMap);
  bucket.splice(bucketIndex, 0, entry);
}

/**
 * Retrieve an item by zero-based index
 */
TickMap.prototype.item = function(index) {
  var tick = this.internals.tickSeq[index];
  return this.get(tick);
}

/**
 * Retrieve an item by exact tick.
 *
 * @return The item or `undefined`
 */
TickMap.prototype.get = function(tick) {
  var bucket = this._getBucket(tick);
  if (bucket) {
    var entry = getInBucket(bucket, tick);
    if (entry) {
      return entry.value;
    }
  }
}

/**
 * Retrieves all items in the same bucket as the specified tick
 *
 * @return An array of items. If no items exist or no bucket exists, an empty array is returned.
 */
TickMap.prototype.getBucketItems = function(tick) {
  var entries = this._getBucket(tick);
  if (entries) {
    return entries.map(function(entry) {
      return entry.value;
    });
  }
  return [];
}


function getBucket(tick) {
  var bucketKey = makeBucketKey(tick);
  return this.internals.bucketMap.get(bucketKey);
}

function getInBucket(bucket, tick) {
  return Find(bucket, {tick: tick});
}

function entryTickMap(entry) {
  return entry.tick;
}

function makeBucketKey(tick) {
  return Math.floor(tick);
}

function Entry(tick, value) {
  this.tick = tick;
  this.value = value;
}
