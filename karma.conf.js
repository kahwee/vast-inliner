const webpack = require('./webpack.config.js')
const browsers = process.env.CI ? ['ChromeHeadless'] : ['Chrome']
module.exports = function (config) {
  config.set({
    basePath: '.',
    frameworks: ['mocha', 'chai'],
    files: [
      {
        // http://localhost:9876/base/tests/videos/apple-watch.mp4
        pattern: './tests/videos/*.mp4',
        included: false
      },
      {
        // http://localhost:9876/base/tests/fixtures/simple.xml
        pattern: './tests/fixtures/*.xml',
        included: false

      },
      'tests/*-spec.js',
      'tests/**/*-spec.js'
    ],
    browsers,
    webpack,
    preprocessors: {
      'tests/*-spec.js': ['webpack'],
      'tests/**/*-spec.js': ['webpack']
    },
    webpackMiddleware: {
      noInfo: true,
      stats: {
        chunks: false
      }
    },
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      dir: 'coverage',
      reporters: [
        {
          type: 'lcov',
          subdir: 'report-lcov'
        }
      ]
    },
    client: {
      mocha: {
        ui: 'bdd',
        reporter: 'html'
      }
    },
    singleRun: !!process.env.CI
  })
}
