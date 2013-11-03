module.exports = function (grunt) {
  var path = require('path');
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
  grunt.initConfig({
    express: {
      all: {
        options: {
          port: 9000,
          hostname: 'localhost',
          livereload: true,// TODO: livereload not working, failed to get script
          bases: [path.resolve('.')]
        }
      }
    },
    open : {
      all: {
        path: 'http://localhost:<%= express.all.options.port %>' + '/examples/simple.html'
      }
    }
  });
  grunt.registerTask('server', [
    'express',
    'open',
    'express-keepalive'
  ]);
};