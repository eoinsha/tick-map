Tick Map
====

`tick-map` is a simple data structure in JavaScript for storing values in _sorted_, time-based buckets.

[![Build Status](https://travis-ci.org/eoinsha/tick-map.svg?branch=master)](https://travis-ci.org/eoinsha/tick-map)

The intention of `tick-map` is to allow easy, fast storage and retrieval of values using time-based keys. The key is specified only by a decimal value so it does not strictly have to represent time. The original intended usage is to store values for time ticks which are fractions of a second and allow retrieval of them using either the exact key or by the nearest rounded time tick; e.g. a second.


# Usage

```
var TickMap = require('tick-map');

var tickMap = TickMap(); // Create a new TickMap

tickMap.add(3.000, "Event 1");
tickMap.add(3.142, "Event 2");
tickMap.add(4.900, "Event 3");
tickMap.add(1.421, "Event 4");

console.log(tickMap.get(3.000)); // => "Event 1"
console.log(tickMap.item(1)); // => "Event 1"
console.log(tickMap.item(0)); // => "Event 4" (Values are sorted on tick value)
console.log(tickMap.getBucketItems(3.000)); // => ["Event 1", "Event 2"]
```
