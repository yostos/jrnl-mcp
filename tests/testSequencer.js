const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Sort tests: unit tests first, then integration tests
    const copyTests = [...tests];
    return copyTests.sort((testA, testB) => {
      const isUnitA = testA.path.includes('unit.test');
      const isUnitB = testB.path.includes('unit.test');
      
      if (isUnitA && !isUnitB) return -1;
      if (!isUnitA && isUnitB) return 1;
      
      // If both are same type, sort alphabetically
      return testA.path > testB.path ? 1 : -1;
    });
  }
}

module.exports = CustomSequencer;