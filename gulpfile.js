/**
 * an example gulpfile to make ant-less existdb package builds a reality
 */
const { src, dest, watch, series, parallel, lastRun } = require('gulp')
const { createClient, readOptionsFromEnv } = require('@existdb/gulp-exist')
const zip = require("gulp-zip")
const sass = require('gulp-sass')
const uglify = require('gulp-uglify-es').default
const replace = require('@existdb/gulp-replace-tmpl')
const rename = require('gulp-rename')
const del = require('delete')

const { app, version, license, author } = require('./package.json')

const replacements = [app, { version, license, author }]

const target = app.target

const defaultOptions = { basic_auth: { user: "admin", pass: "" } }
const connectionOptions = Object.assign(defaultOptions, readOptionsFromEnv())
const existClient = createClient(connectionOptions);

/**
 * Use the `delete` module directly, instead of using gulp-rimraf
 */
function clean (cb) {
  del(['build', 'dist'], cb);
}
exports.clean = clean

const tmplFiles = 'src/*.tmpl'
/**
 * replace placeholders 
 * in src/repo.xml.tmpl and 
 * output to build/repo.xml
 */
function templates () {
  return src(tmplFiles)
    .pipe(replace(replacements, { debug: true }))
    .pipe(rename(path => { path.extname = "" }))
    .pipe(dest('build'))
}
exports.templates = templates

function watchTemplates () {
  watch(tmplFiles, templates)
}
exports["watch:tmpl"] = watchTemplates

const scssFiles = 'src/scss/**/*.scss'
/**
 * compile SCSS styles and put them into 'build/app/css'
 */
function styles () {
  return src(scssFiles)
    .pipe(sass().on('error', sass.logError))
    .pipe(dest('build/css'));
}
exports.styles = styles

function watchStyles () {
  watch(scssFiles, styles)
}
exports["watch:styles"] = watchStyles

const jsFiles = 'src/js/**/*.js'
/**
 * minify EcmaSript files and put them into 'build/app/js'
 */
function minifyEs () {
  return src(jsFiles)
    .pipe(uglify())
    .pipe(dest('build/js'))
}
exports.minify = minifyEs

function watchEs () {
  watch(jsFiles, minifyEs)
}
exports["watch:es"] = watchEs

const static = 'src/**/*.{xml,html,xq,xquery,xql,xqm,xsl,xconf,svg,png}'
/**
 * copy html templates, XSL stylesheet, XMLs and XQueries to 'build'
 */
function copyStatic () {
  return src(static).pipe(dest('build'))
}
exports.copy = copyStatic

function watchStatic () {
  watch(static, copyStatic);
}
exports["watch:static"] = watchStatic

const allFilesInBuild = 'build/**/*'
/**
 * Upload all files in the build folder to existdb.
 * This function will only upload what was changed 
 * since the last run (see gulp documentation for lastRun).
 */
function deploy () {
  return src(allFilesInBuild, {
        base: 'build',
        since: lastRun(deploy)
    })
    .pipe(existClient.dest({target}))
}

function watchBuild () {
  watch(allFilesInBuild, deploy)
}

// construct the current xar name from available data
const packageName = `${target}-${version}.xar`

/**
 * create XAR package in repo root
 */
function xar () {
  return src(allFilesInBuild, {base: 'build'})
    .pipe(zip(packageName))
    .pipe(dest('dist'))
}

/**
 * upload and install the latest built XAR
 */
function installXar () {
  return src(packageName, {cwd: 'dist'})
    .pipe(existClient.install())
}

// composed tasks
const build = series(
  clean,
  styles,
  minifyEs,
  templates,
  copyStatic
)
const watchAll = parallel(
  watchStyles,
  watchEs,
  watchStatic,
  watchTemplates,
  watchBuild
)

exports.build = build
exports.watch = watchAll

exports.deploy = series(build, deploy)
exports.xar = series(build, xar)
exports.install = series(build, xar, installXar)

// main task for day to day development
exports.default = series(build, deploy, watchAll)
