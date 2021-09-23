/**
 * An example gulpfile to make ant-less existdb package builds a reality
 */
const { src, dest, watch, series, parallel, lastRun } = require('gulp')
const del = require('delete')
const zip = require('gulp-zip')
const rename = require('gulp-rename')
const sass = require('gulp-sass')
const uglify = require('gulp-uglify-es').default
const { createClient, readOptionsFromEnv } = require('@existdb/gulp-exist')
const replace = require('@existdb/gulp-replace-tmpl')

// read only version and license metadata from package.json
const { version, license, author } = require("./package.json")
// read additional metadata from .existdb.json
const { package } = require('./.existdb.json')
// .tmpl replacements to include 
// an array of objects the first definition of a key wins
const replacements = [package, { version, license, author }]

/**
 * Gather connection options suitable for automated and manual testing
 * of an off-the-shelf exist-db instance (e.g. in a CI environment)
 * Allows overriding specific settings via environment variables.
 *
 * EXISTDB_SERVER - URL to the exist-db you want to connect to
 * EXISTDB_USER - username of the user the queries should be executed with
 *     defaults to "admin"
 * EXISTDB_PASS - password to authenticate EXISTDB_USER
 *     must be set for EXISTDB_USER to take effect
 */
const connectionOptions = readOptionsFromEnv()
if (!connectionOptions.basic_auth) {
  connectionOptions.basic_auth = { user: 'admin', pass: '' }
}
const existClient = createClient(connectionOptions)

// read metadata from .existdb.json
const target = package.target

/**
 * Use the `delete` module directly, instead of using gulp-rimraf
 */
function clean (cb) {
  del(['build', 'dist'], cb)
}
exports.clean = clean

/**
 * replace placeholders in *.tmpl and 
 * output replaced file contents to build/*
 */
 function templates() {
  return src('src/*.tmpl') // search for .tmpl files in project root
      .pipe(replace(replacements, {debug:true})) // replace placeholders
      .pipe(rename(path => { path.extname = "" })) // remove .tmpl extension
      .pipe(dest('build'))
}
exports.templates = templates

function watchTemplates () {
  watch('src/*.tmpl', series(templates))
}
exports['watch:tmpl'] = watchTemplates

/**
 * compile SCSS styles and put them into 'build/app/css'
 */
function styles () {
  return src('src/scss/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(dest('build/css'))
}
exports.styles = styles

function watchStyles () {
  watch('src/scss/**/*.scss', series(styles))
}
exports['watch:styles'] = watchStyles

/**
 * minify EcmaSript files and put them into 'build/app/js'
 */
function minifyEs () {
  return src('src/js/**/*.js')
    .pipe(uglify())
    .pipe(dest('build/js'))
}
exports.minify = minifyEs

function watchEs () {
  watch('src/js/**/*.js', series(minifyEs))
}
exports['watch:es'] = watchEs

const staticGlob = 'src/**/*.{xml,html,xq,xquery,xql,xqm,xsl,xconf}'

/**
 * copy html templates, XSL stylesheet, XMLs and XQueries to 'build'
 */
function copyStatic () {
  return src(staticGlob).pipe(dest('build'))
}
exports.copy = copyStatic

function watchStatic () {
  watch(staticGlob, series(copyStatic))
}
exports['watch:static'] = watchStatic

/**
 * Upload all files in the build folder to existdb.
 * This function will only upload what was changed
 * since the last run (see gulp documentation for lastRun).
 */
function deploy () {
  return src('build/**/*', {
    base: 'build',
    since: lastRun(deploy)
  })
    .pipe(existClient.dest({ target }))
}

function watchBuild () {
  watch('build/**/*', series(deploy))
}

// construct the current xar name from available data
const packageName = () => `${target}-${version}.xar`

/**
 * create XAR package in repo root
 */
function xar () {
  return src('build/**/*', { base: 'build' })
    .pipe(zip(packageName()))
    .pipe(dest('dist'))
}

/**
 * upload and install the latest built XAR
 */
function installXar () {
  return src(packageName(), { cwd: 'dist' })
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
