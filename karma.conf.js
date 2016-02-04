const istanbul = require('istanbul')

module.exports = function (config) {
  var headless = process.env.CI === 'true'
  var preprocessors = {}
  preprocessors['./*.js'] = ['coverage']
  preprocessors['./tests/**/*-spec.js'] = ['browserify']

  var browsers = process.env.CI ? ['Firefox'] : ['Chrome']

  config.set({
    basePath: '.',
    reporters: ['progress', 'coverage'],
    frameworks: ['mocha', 'sinon-chai', 'browserify'],
    browsers: browsers,
    preprocessors: preprocessors,
    files: [
      'node_modules/babel-polyfill/dist/polyfill.min.js',
      'tests/**/*-spec.js',
      {
        // http://localhost:9876/base/tests/videos/apple-watch.mp4
        pattern: './tests/videos/*.mp4',
        included: false
      },
      {
        // http://localhost:9876/base/tests/fixtures/simple.xml
        pattern: './tests/fixtures/*.xml',
        included: false
      }
    ],
    browserify: {
      debug: true,
      transform: [
        [
          'babelify',
          {
            'presets': ['es2015']
          }
        ],
        'brfs',
        [
          'browserify-istanbul',
          {
            ignore: [
              '**/*.html',
              '**/*.xml',
              '**/*.css',
              '**/*.swf',
              '**/*.js'
            ],
            instrumenter: istanbul,
            instrumenterConfig: {
              embedSource: true
            }
          }
        ]
      ],
      configure: function (bundle) {
        bundle.on('prebundle', function () {})
      }
    },
    client: {
      mocha: {
        reporter: 'html',
        ui: 'bdd'
      }
    },
    junitReporter: {
      outputFile: '_karma.xml',
      suite: ''
    },
    coverageReporter: {
      dir: 'coverage',
      reporters: [
        { type: 'lcov',
          subdir: 'report-lcov'
        },
        {
          type: 'cobertura',
          subdir: '.',
          file: 'cobertura.xml'
        }, {
          absolutePath: true,
          type: 'html',
          subdir: '.'
        }
      ]
    },
    singleRun: headless
  // logLevel: 'DEBUG'
  })
}
