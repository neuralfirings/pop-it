var gulp = require('gulp');

var coffee = require('gulp-coffee');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

gulp.task('default', ['coffee', 'sass', 'watch']);

gulp.task('coffee', function() {
  gulp.src('./coffee/*.coffee')
      .pipe(coffee({ bare: true }))
      .pipe(concat('application.js'))
      .pipe(gulp.dest('./public/js'))
      .pipe(rename('application.min.js'))
      .pipe(uglify())
      .pipe(gulp.dest('./public/js'));
});

gulp.task('sass', function () {
    gulp.src('./scss/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('./public/css'));
});

gulp.task('watch', function() {
    gulp.watch('coffee/*.coffee', ['coffee']);
    gulp.watch('scss/*.scss', ['sass']);
});