del = require 'del'
gulp = require 'gulp'
gutil = require 'gulp-util'
coffee = require 'gulp-coffee'
sourcemaps = require 'gulp-sourcemaps'
istanbul = require 'gulp-coffee-istanbul'
coffeelint = require 'gulp-coffeelint'
mocha = require 'gulp-mocha'

jsFiles     = ['lib/**/*.js']
specFiles   = ['spec/**/*.coffee']
coffeeFiles = ['src/**/*.coffee']
testFiles   = jsFiles
buildFiles  = ['lib', 'coverage']

gulp.task 'clean', (cb) ->
  del buildFiles, cb

gulp.task 'lint', ->
  gulp.src coffeeFiles
    .pipe coffeelint()
    .pipe coffeelint.reporter()
    # .pipe coffeelint.reporter('fail') # fail task

gulp.task 'coffee', ['lint'], ->
  gulp.src coffeeFiles
    .pipe sourcemaps.init()
    .pipe coffee({bare: true}).on('error', gutil.log)
    .pipe sourcemaps.write()
    .pipe gulp.dest './lib/'

gulp.task 'build', ['coffee']

gulp.task 'test', ['coffee'], ->
  gulp.src testFiles
    .pipe istanbul( includeUntested: true ) # Covering files
    .pipe istanbul.hookRequire()
    .on 'finish', ->
      gulp.src specFiles
        .pipe mocha reporter: 'nyan'
        .pipe istanbul.writeReports() # Creating the reports after tests run

gulp.task 'default', ['test']
