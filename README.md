# stylelint-junit-formatter

[![Build Status](https://travis-ci.com/eddies/stylelint-junit-formatter.svg?branch=master)](https://travis-ci.com/eddies/stylelint-junit-formatter)

Output JUnit XML reports of stylelint results (that can be parsed by CircleCI or Bamboo).

## Usage

### With CircleCI

Before:

![image](https://user-images.githubusercontent.com/149985/63839495-ff3b9500-c9b1-11e9-873c-5f7610653985.png)

After:

![image](https://user-images.githubusercontent.com/149985/63839459-ecc15b80-c9b1-11e9-9a3d-2a60276257dd.png)

Install stylelint-junit-formatter (and stylelint and optionally, a [config](https://github.com/stylelint/stylelint-config-standard)):
```console
$ npm install stylelint-junit-formatter stylelint stylelint-config-standard --save-dev
```

Add a `.stylelintrc`, e.g.:

```javascript
{
  "extends": "stylelint-config-standard",
  "ignoreFiles": "node_modules/**/*",
}
```

Add a script to `package.json` that runs stylelint, e.g.:

```json
{
  "name": "stylelint-ci",
  "version": "1.0.0",
  "scripts": {
    "lint": "stylelint '**/*.css'"
  },
  "devDependencies": {
    "stylelint": "^10.1.0",
    "stylelint-config-standard": "^18.3.0",
    "stylelint-junit-formatter": "^0.2.2"
  }
}
```

At this point, you should be able to execute `npm run lint` on the command line.

Add a `.circleci/config.yml` that runs stylelint and saves the results, e.g.:

```yaml
version: 2
jobs:
  build:
    docker:
      - image: circleci/node:10

    steps:
      - checkout
      # Download and cache dependencies
      - restore_cache:
          keys:
            - v1-dependencies-{{ checksum "package-lock.json" }}
            - v1-dependencies-

      - run:
          name: Build
          command: if [ ! -d "node_modules" ]; then npm ci; fi

      - save_cache:
          paths:
            - node_modules
          key: v1-dependencies-{{ checksum "package-lock.json" }}

      - run:
          name: Lint
          command: |
            mkdir -p reports/stylelint
            npm run lint -s -- --custom-formatter 'node_modules/stylelint-junit-formatter' > reports/stylelint/test-results.xml

      - store_test_results:
          path: reports
```

### With Bamboo
*TODO* (PRs welcome!)

### With the Stylelint Node API:

```javascript
const fs = require('fs');
const stylelint = require('stylelint');
const junitFormatter = require('stylelint-junit-formatter');

const stylelintOptions = {
  files: '**/*.css',
  formatter: junitFormatter,
};

stylelint.lint(stylelintOptions)
  .then((resultObject) => {
    // Do something with the result, e.g. write a report.xml to disk:
    // fs.writeFile('report.xml', resultObject.output, (error) => {…});
  });

```

…or read the [stylelint](https://github.com/stylelint/stylelint/blob/master/docs/developer-guide/formatters.md) documentation about using formatters and follow those instructions.

The formatter will generate a `.xml`-report with the following look:
```xml
<?xml version="1.0" encoding="utf-8"?>
<testsuites package="stylelint.rules">
  <testsuite name="path/to/css/file1.css" failures="0" errors="0" tests="1">
    <testcase name="stylelint.passed"/>
  </testsuite>
  <testsuite name="path/to/css/file2.css" failures="0" errors="0" tests="1">
    <testcase name="stylelint.passed"/>
  </testsuite>
  <testsuite name="path/to/css/file3.css" failures="0" errors="0" tests="1">
    <testcase name="stylelint.passed"/>
  </testsuite>
  <testsuite name="path/to/css/file4.css" failures="0" errors="0" tests="1">
    <testcase name="stylelint.passed"/>
  </testsuite>
</testsuites>
```

In the event of errors, those are presented in a way that CircleCI/Bamboo can interpret:
```xml
<?xml version="1.0" encoding="utf-8"?>
<testsuites package="stylelint.rules">
  <testsuite name="path/to/css/file.css" failures="0" errors="0" tests="1">
    <testcase name="stylelint.passed"/>
  </testsuite>
  <testsuite name="/path/to/css/file.css" failures="2" errors="2" tests="2">
    <testcase name="declaration-block-properties-order">
      <failure type="error"
               message="Expected &quot;color&quot; to come before &quot;font-weight&quot; (declaration-block-properties-order)">
       On line 7, column 3 in /path/to/css/file.css
      </failure>
    </testcase>
    <testcase name="shorthand-property-no-redundant-values">
      <failure type="error"
               message="Unexpected longhand value &#39;0 2rem 1.5rem 2rem&#39; instead of &#39;0 2rem 1.5rem&#39; (shorthand-property-no-redundant-values)">
       On line 8, column 3 in /path/to/css/file.css
      </failure>
    </testcase>
  </testsuite>
  <testsuite name="path/to/css/file.css" failures="0" errors="0" tests="1">
    <testcase name="stylelint.passed"/>
  </testsuite>
</testsuites>
```
