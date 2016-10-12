'use strict';
const test = require('tap').test;
const TickMap = require('..');

// ES6-specific tests to be conditionally included

test('es6 iterator', t => {
  const tm = new TickMap();
  const ticks = [
    2.2,
    3.3,3.999,
    5.5,
    6.6,6,6.9999
  ];
  const sorted = [0,1,2,3,5,4,6];
  const values = [];
  ticks.forEach(function(tick) {
    const value = { prop: new Date() };
    values.push(value);
    tm.add(tick, value);
  });

  let idx = 0;
  for(let entry of tm) {
    t.equal(entry.tick, ticks[sorted[idx]]);
    t.equal(entry.value, values[sorted[idx]]);
    idx++;
  }

  t.equal(idx, ticks.length);

  t.end();
});
