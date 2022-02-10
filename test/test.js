'use strict';

const { expect } = require('chai');
const cp = require('child_process');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const util = require('util');

const timeout = 20000;

describe('track-reporter', function() {
  this.timeout(timeout);

  it('should not print stacktrace on test failure', async () => {
    const stdout = await runTests(FIXTURES.FAIL_TESTCASE);
    expect(stdout).all.not.match(/AssertionError:/);
  });
  
  it('should not inserts two spaces between testcase number and testcase name even with empty description', async () => {
    const stdout = await runTests(FIXTURES.EMPTY_DESCRIPTION);
    expect(stdout).to.include('ok 1 [basic] success');
  });

  it('should increment testcase numbers correctly', async () => {
    const stdout = await runTests(FIXTURES.NORMAL_TESTCASES);
    const expected = [
      'ok 1 [basic] testcase #1',  
      'ok 2 [basic] testcase #2',  
      'ok 3 [basic] testcase #3',  
      'ok 4 [advanced] testcase #4',  
      'ok 5 [advanced] testcase #5',  
      'ok 6 [advanced] testcase #6',  
    ];
    expected.forEach(line => expect(stdout).to.include(line));
  })
});
  
describe('default tap reporter', function() {
  this.timeout(timeout);

  // Following tests are just to confirm behavior of the current version of mocha and tap reporter.
  // Remove / modify them if needed.
  it('prints stacktrace on test failure', async () => {
    const stdout = await runTests(FIXTURES.FAIL_TESTCASE, { reporter: 'tap' });
    expect(stdout).any.match(/AssertionError:/);
  });

  it('inserts two spaces between testcase number and testcase name with empty description', async () => {
    const stdout = await runTests(FIXTURES.EMPTY_DESCRIPTION, { reporter: 'tap' });
    expect(stdout).to.include('ok 1  [basic] success');
  });
});

function exec(command, options) {
  return new Promise((res, _) => {
    cp.exec(command, options, (error, stdout, stderr) => {
      res({ 
        stdout: stdout,
        stderr: stderr,
        error
      });  
    })
  });
}

async function runTests(files, options) {
  let dir;
  try {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'track-reporter-'));
    const reporter = options?.reporter || 'track-reporter';
    async function createFile(filename, content) {
      const p = path.join(dir, filename);  
      await fs.mkdir(path.dirname(p), { recursive: true });  
      return fs.writeFile(p, content);
    }
    await Promise.all(
      Object.keys(files).map(filename => createFile(filename, files[filename]))
    );
    if (!files['package.json']) {
      await createFile('package.json', JSON.stringify({
        "scripts": {
          "test": `mocha -R ${reporter} --exit`
        },
        "devDependencies": {
          "chai": "4",
          "mocha": "9",
          "track-reporter": `file:${path.dirname(__dirname)}`
        }
      }));
    }
    await exec('npm install', { cwd: dir });
    const { stdout } = await exec('npm test', { cwd: dir });
    return stdout.split('\n');
  } finally {
    if (!!dir) {
      await fs.rmdir(dir, { recursive: true }).catch(e => Promise.resolve(true));
    }  
  }
}

const FIXTURES = {
  FAIL_TESTCASE: {
    "test.js": `
      const { expect } = require('chai');
      describe('[basic]', () => {
        it('error', () => {
            expect(1).to.eql(2)
        });
      });
    `  
  },
  EMPTY_DESCRIPTION: {
    "test.js": `
      describe('', () => {
        it('[basic] success', () => {});
      });
    `  
  },
  NORMAL_TESTCASES: {
    "test.js": `
      const { expect } = require('chai');
      describe('[basic]', () => {
        it('testcase #1', () => {});
        it('testcase #2', () => {});
        it('testcase #3', () => {});
      });
      describe('[advanced]', () => {
        it('testcase #4', () => {});
        it('testcase #5', () => {});
        it('testcase #6', () => {});
      });
    `  
  }
}