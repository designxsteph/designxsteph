'use strict';

const gulp = require('gulp'),
    concat = require('gulp-concat'),
    cleancss = require('gulp-clean-css'),
    uglify = require('gulp-uglify-es').default,
    sass = require('gulp-sass'),
    clean = require('gulp-clean'),
    purgecss = require('gulp-purgecss'),
    rename = require('gulp-rename'),
    merge = require('merge-stream'),
    bundleconfig = require('./bundleconfig.json');

const { series, parallel, src, dest, watch } = require('gulp');
sass.compiler = require('node-sass');

const regex = {
    css: /\.css$/,
    js: /\.js$/
};

const getBundles = (regexPattern) => {
    return bundleconfig.filter(bundle => {
        return regexPattern.test(bundle.outputFileName);
    });
};

function del() {
    return src(['wwwroot/js/*.*.js', 'wwwroot/css', 'wwwroot/fonts'], { allowEmpty: true })
        .pipe(clean({ force: true }));
}

function copyFonts() {
    return src('node_modules/@fortawesome/fontawesome-free/webfonts/*.*')
        .pipe(dest('wwwroot/fonts/fontawesome-free'));
}

function compileSass() {
    return src('wwwroot/scss/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(dest('wwwroot/css'));
}

function compileJs() {
    var tasks = getBundles(regex.js).map(function (bundle) {

        return gulp.src(bundle.inputFiles, { base: '.' })
            .pipe(concat(bundle.outputFileName))
            .pipe(dest('.'));
    });

    return merge(tasks);
}

function compileCss() {
    var tasks = getBundles(regex.css).map(function (bundle) {

        return gulp.src(bundle.inputFiles, { base: '.' })
            .pipe(concat(bundle.outputFileName))
            .pipe(purgecss({
                content: ['Pages/**/*.cshtml', 'wwwroot/js/*.bundle.js']
            }))
            .pipe(gulp.dest('.'));
    });

    return merge(tasks);
}

function minCss() {
    var tasks = getBundles(regex.css).map(function (bundle) {

        return gulp.src(bundle.outputFileName, { base: '.' })
            .pipe(cleancss({
                level: 2,
                compatibility: 'ie8'
            }))
            .pipe(rename({ suffix: '.min' }))
            .pipe(gulp.dest('.'));
    });

    return merge(tasks);
}

function minJs() {
    var tasks = getBundles(regex.js).map(function (bundle) {

        return gulp.src(bundle.outputFileName, { base: '.' })
            .pipe(uglify())
            .pipe(rename({ suffix: '.min' }))
            .pipe(dest('.'));
    });

    return merge(tasks);
}

// Independednt tasks
exports.del = del;
exports.copyFonts = copyFonts;
exports.compileSass = compileSass;
exports.compileJs = compileJs;
exports.minCss = minCss;
exports.minJs = minJs;

// Gulp series
exports.compileSassJs = parallel(compileSass, compileJs);
exports.minCssJs = parallel(minCss, minJs);

// Gulp default
exports.default = series(del, copyFonts, exports.compileSassJs, compileCss, exports.minCssJs);

// Watch files
exports.watchFiles = function () {
    watch(['wwwroot/scss/*.scss', 'wwwroot/js/site.js', 'wwwroot/lib/'], exports.default);
};