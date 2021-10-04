/**
 * an example gulpfile to make ant-less existdb package builds a reality
 */
const { src, dest, watch, series, parallel } = require('gulp')
const { createClient, readOptionsFromEnv } = require('@existdb/gulp-exist')
const zip = require("gulp-zip")
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
// construct the current xar name from available data
const packageName = `${target}-${version}.xar`

/**
 * create XAR package in dist folder
 */
function xar () {
  return src(allFilesInBuild, {base: 'build'})
    .pipe(zip(packageName))
    .pipe(dest('dist'))
}

function watchBuild () {
  watch(allFilesInBuild, series(xar, installXar))
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
  templates,
  copyStatic,
  xar
)
const watchAll = parallel(
  watchStatic,
  watchTemplates,
  watchBuild
)

exports.build = build
exports.watch = watchAll

exports.xar = build
exports.install = exports.deploy = series(build, installXar)

// main task for day to day development
exports.default = series(build, installXar, watchAll)
