const xmlBuilder = require('xmlbuilder');

function createFailedCaseName(testCase, source) {
  const {
    rule,
    line,
    column,
  } = testCase;
  const shortName = source.replace(system.cwd(), '').substring(1);
  return `${rule} - ${shortName} (${line},${column})`;
}

function parseFailedCase(testCase, source) {
  const {
    rule,
    severity,
    text,
    line,
    column,
  } = testCase;

  return {
    '@name': createFailedCaseName(testCase, source),
    failure: {
      '@type': severity,
      '@message': text,
      '#text': `On line ${line}, column ${column} in ${source}`,
    },
  };
}

function parseSuite(testSuite) {
  const suiteName = testSuite.source;
  const failuresCount = testSuite.warnings.length;
  const testCases = testSuite.errored
    ? testSuite.warnings.map((testCase) => parseFailedCase(testCase, suiteName))
    : { '@name': 'stylelint.passed' };

  return {
    testsuite: {
      '@name': suiteName,
      '@failures': failuresCount,
      '@errors': failuresCount,
      '@tests': failuresCount || '1',
      testcase: testCases,
    },
  };
}

module.exports = (stylelintResults) => {
  const xmlRoot = xmlBuilder.create('testsuites', { encoding: 'utf-8' })
    .att('package', 'stylelint.rules');
  const testSuites = stylelintResults.map((testSuite) => parseSuite(testSuite));

  return testSuites.length > 0
    ? xmlRoot.element(testSuites).end({ pretty: true })
    : xmlRoot.end({ pretty: true });
};
