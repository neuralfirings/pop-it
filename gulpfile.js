var gulp = require('gulp');

var coffee = require('gulp-coffee');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

gulp.task('default', ['coffee', 'sass', 'compress_js', 'compress_css', 'watch']);

gulp.task('compress_js', function() {
  gulp.src('./lib/js/*.js')
    .pipe(uglify())
    .pipe(concat('libraries.min.js'))
    .pipe(gulp.dest('./public/js'));
});

gulp.task('compress_css', function() {
  gulp.src('./lib/css/*.css')
    // .pipe(uglify())
    .pipe(concat('libraries.css'))
    .pipe(gulp.dest('./public/css'));
});

gulp.task('coffee', function() {
  gulp.src('./coffee/*.coffee')
      .pipe(coffee({ bare: true }))
      .on('error', function (err) {
          console.error(err);
        })
      // .pipe(gulp.dest('./public/js'))
      .pipe(concat('application.js'))
      .pipe(gulp.dest('./public/js'))
      .pipe(rename('application.min.js'))
      .pipe(uglify())
      .pipe(gulp.dest('./public/js'));
});

gulp.task('sass', function () {
    gulp.src('./scss/*.scss')
      .pipe(sass())
      .on('error', function (err) {
        console.error(err);
      })
      .pipe(concat('application.css'))
      .pipe(gulp.dest('./public/css'));
});

gulp.task('watch', function() {
    gulp.watch('coffee/*.coffee', ['coffee']);
    gulp.watch('scss/*.scss', ['sass']);
    gulp.watch('./lib/js/*.js', ['compress_js']);
    gulp.watch('./lib/css/*.css', ['compress_css']);
});