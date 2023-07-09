var gulp = require("gulp");
var webpack = require("webpack-stream");
var server = require('gulp-webserver');

const destinationDirectory = "dist";

// Copy HTML
gulp.task("copy-html", function () {
    return gulp.src("src/**/*.html").pipe(gulp.dest(destinationDirectory));
});

// Webpack non-HTML content
gulp.task("webpack", function () {
    return gulp.src("src/**/*.ts").pipe(webpack(require('./webpack.config.js'))).pipe(gulp.dest(destinationDirectory));
});


// All build tasks combined
gulp.task(
    "default",
    gulp.parallel("copy-html", "webpack"));


// Dev-time: local server
gulp.task('serve', function () {
    gulp.src(destinationDirectory)
        .pipe(server({
            livereload: true,
            open: true,
            port: 5055
        }));
});