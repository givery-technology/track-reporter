'use strict';

const Mocha = require('mocha');
const {
  EVENT_RUN_END,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_TEST_END,
} = Mocha.Runner.constants;

class TrackReporter {
  constructor(runner) {
    const stats = runner.stats;
    let n = 1;

    runner
      .on(EVENT_TEST_END, () => {
        ++n;
      })
      .on(EVENT_TEST_PASS, (test) => {
        // Test#fullTitle() returns the suite name(s)
        // prepended to the test title
        console.log(`ok ${n} ${test.fullTitle().trim()}`);
      })
      .on(EVENT_TEST_FAIL, (test, err) => {
        console.log(`not ok ${n} ${test.fullTitle().trim()}`);
        err.message.split("\n").forEach(line => console.log("  " + line));
      })
      .once(EVENT_RUN_END, () => {
        console.log(`# tests ${stats.passes + stats.failures}`)
        console.log(`# pass ${stats.passes}`)
        console.log(`# fail ${stats.failures}`)
      });
  }
}

module.exports = TrackReporter;
