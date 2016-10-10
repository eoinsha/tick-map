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
