module.exports = TickMap;

var Map = require('es6-map');

var Find = require('lodash.find');
var FindIndex = require('lodash.findindex');
var SortedIndexBy = require('lodash.sortedindexby');

var EMPTY = []; // Avoid creating man empty arrays for very sparse tick maps

function TickMap() {
  if (!(this instanceof TickMap)) {
    return new TickMap();
  }

  this.internals = {
    tickSeq: [],  // Ordered array of populated ticks in the map. Duplicates are allowed
    bucketKeys: [],  // Ordered array of bucket keys
    bucketMap: new Map()
  };
}

Object.defineProperties(TickMap.prototype, {
  length: { enumerable: true, get: function() {
    return this.internals.tickSeq.length;
  }},
  bucketCount: { enumerable: true, get: function() {
    return this.internals.bucketKeys.length;
  }},
  _getBucket: { enumerable: false, get: function() {
    return getBucket;
  }}
});

var hasSymbol = typeof Symbol === 'function';
/* istanbul ignore next */ // Depends on ES6 support level
if (hasSymbol) {
  Object.defineProperty(TickMap.prototype, Symbol.iterator, {
    get: function() {
      return this.iterator;
    }
  });
}

TickMap.prototype.iterator = function() {
  var tm = this;
  return {
    next: function() {
      var result = {
        done: this.$bucket === tm.internals.bucketKeys.length
      };

      if (!result.done) {
        var bucket = tm.internals.bucketMap.get(tm.internals.bucketKeys[this.$bucket]);
        result.value = bucket[this.$bucketIdx];
        ++this.$bucketIdx;
        if (this.$bucketIdx === bucket.length) {
          this.$bucketIdx = 0;
          ++this.$bucket;
        }
      }
      return result;
    },
    $bucket: 0,
    $bucketIdx: 0
  }
}

TickMap.prototype.add = function(tick, value) {
  var append = false;
  var tickSeq = this.internals.tickSeq;

  // Optimising for append by order is worthwhile
  var append = tickSeq.length === 0 || tickSeq[tickSeq.length - 1] < tick;

  if (append) {
    tickSeq.push(tick);
  }
  else {
    var targetIndex = SortedIndexBy(tickSeq, tick);
    tickSeq.splice(targetIndex, 0, tick);
  }

  var bucketKey = makeBucketKey(tick);
  var entry = new Entry(tick, value);
  var bucket = this.internals.bucketMap.get(bucketKey);
  if (!bucket) {
    // Add the key to the bucketKeys array, used for lookup of buckets by zero-based index
    if (append) {
      this.internals.bucketKeys.push(bucketKey);
    }
    else {
      var bucketKeyIndex = SortedIndexBy(this.internals.bucketKeys, bucketKey);
      this.internals.bucketKeys.splice(bucketKeyIndex, 0, bucketKey);
    }
    bucket = [ entry ];
    this.internals.bucketMap.set(bucketKey, bucket);
  }
  else {
    if (append) {
      bucket.push(entry);
    }
    else {
      var bucketIndex = SortedIndexBy(bucket, entry, entryTickMap);
      bucket.splice(bucketIndex, 0, entry);
    }
  }

  // Allow array-like [] access to _entries_ by index
  var lastIdx = this.internals.tickSeq.length - 1;
  var tm = this;
  Object.defineProperty(this, lastIdx, {
    enumerable: false,
    get: function() {
      return tm.getEntry(tm.internals.tickSeq[lastIdx]);
    }
  });
}

/**
 * Delete the entry specified by exact tick and value
 * @return `true` if found and deleted, `false` otherwise
 */
TickMap.prototype.remove = function(tick, value) {
  var bucketKey = makeBucketKey(tick);
  var bucket = this.internals.bucketMap.get(bucketKey);
  if (bucket) {
    const bucketIndex = FindIndex(bucket, bucketFindPredicate(tick, value));
    if (bucketIndex > -1) {
      if (bucket.length === 1) { // Would be empty so delete the bucket
        this.internals.bucketMap.delete(bucketKey);
        var bucketKeyIndex = SortedIndexBy(this.internals.bucketKeys, bucketKey);
        this.internals.bucketKeys.splice(bucketKeyIndex, 1);
      }
      else {
        bucket.splice(bucketIndex, 1);
      }
      this.internals.tickSeq.splice(this.internals.tickSeq.indexOf(tick), 1);
      var lastIdx = this.internals.tickSeq.length - 1;
      delete this[lastIdx]; // Remove property accessor by idx
      return true;
    }
  }
  return false;
}

/**
 * Predicate for finding in buckets using tick and value identity
 */
function bucketFindPredicate(tick, value) {
  return function(item) {
    return item.tick === tick && item.value === value;
  }
}

/**
 * Get the zero-based index of the populated bucket based on the
 * correct position for the specified tick/key whether it is present or not
 *
 * @return integer index into the populated bucket
 */
TickMap.prototype.bucketIndexFor = function(tick) {
  return SortedIndexBy(this.internals.bucketKeys, makeBucketKey(tick));
}

/**
 * Get the zero-based index of the populated bucket that represents
 * the nearest tick equal to or less than the specified tick.
 *
 * @return integer index into the populated bucket or 0 if no buckets exist
 */
TickMap.prototype.lastBucketIndexFor = function(tick) {
  var bucketKey = makeBucketKey(tick);
  var lastIndex = SortedIndexBy(this.internals.bucketKeys, bucketKey);
  var lastIndexKey = this.internals.bucketKeys[lastIndex];
  var bucket = lastIndexKey && this.internals.bucketMap.get(lastIndexKey);
  if (lastIndex !== 0 && (!bucket || bucket[0].tick > tick)) {
    --lastIndex; // Point to the previous populated bucket
  }
  return lastIndex;
}

/**
 * Retrieve an item by zero-based index
 */
TickMap.prototype.item = function(index) {
  var tick = this.internals.tickSeq[index];
  return this.get(tick);
}

/**
 * Retrieve an item by the nearest, last matching index
 */
TickMap.prototype.lastItem = function(index) {
  if (this.internals.tickSeq.length) {
    var lastIndex = Math.min(index, this.internals.tickSeq.length - 1);
    var tick = this.internals.tickSeq[lastIndex];
    return this.get(tick);
  }
}

TickMap.prototype.lastItemByTime = function(tick) {
  var targetIndex = SortedIndexBy(this.internals.tickSeq, tick);
  if (targetIndex !== 0 && (targetIndex === this.internals.tickSeq.length || this.internals.tickSeq[targetIndex] > tick)) {
    --targetIndex;
  }
  return this.get(this.internals.tickSeq[targetIndex]);
}

TickMap.prototype.bucketAt = function(bucketIndex) {
  return this.internals.bucketKeys[bucketIndex];
}

/**
 * Retrieve an entry {tick, value} by exact tick.
 *
 * @return The entry or `undefined`
 */
TickMap.prototype.getEntry = function(tick) {
  var bucket = this._getBucket(tick);
  return bucket && getInBucket(bucket, tick);
}

/**
 * Retrieve a value by exact tick.
 *
 * @return The item or `undefined`
 */
TickMap.prototype.get = function(tick) {
  var entry = this.getEntry(tick);
  return entry && entry.value;
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
  return EMPTY;
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
