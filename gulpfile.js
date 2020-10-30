const fs = require("fs")
const { src, dest, watch, series, parallel, lastRun } = require('gulp')
const { createClient } = require('@existdb/gulp-exist')
const { connect } = require('@existdb/node-exist')
const zip = require("gulp-zip")
const sass = require('gulp-sass')
const uglify = require('gulp-uglify-es').default
const replace = require('gulp-replace')
const rename = require('gulp-rename')
const del = require('delete')

const pkg = require('./package.json')

// read metadata from .existdb.json
const existJSON = require('./.existdb.json')
const serverInfo = existJSON.servers.localhost

const target = serverInfo.root
const connectionOptions = {
    basic_auth: {
        user: serverInfo.user, 
        pass: serverInfo.password
    },
    secure: false,
    port: 8080
}
const existClient = createClient(connectionOptions);
const db = connect(connectionOptions)

const packageName = () => `${existJSON.package.target}-${pkg.version}.xar`

async function installXar () {
    const file = packageName()
    const remotePath = `/db/system/repo/${file}`
    const buff = fs.readFileSync(file)
    console.log("uploading...", file)
    const uploadResult = await db.app.upload(buff, remotePath)
    if (uploadResult !== true) {
        return console.error(uploadResult)
    }
    console.log("installing...", file)
    const installationResult = await db.app.install(remotePath)
    console.log(installationResult)
}

function clean (cb) {
    // Use the `delete` module directly, instead of using gulp-rimraf
    del(['build'], cb);
}
exports.clean = clean

/**
 * @param {String} match
 * @param {String} p1 
 * @param {String} p2
 * @param {Number} offset 
 * @param {String} string 
 * @returns {String} replacement or empty string
 */
function handleReplacementIssue (match, offset, string, path, message) {
    const line = string.substring(0, offset).match(/\n/g).length + 1
    const startIndex = Math.max(0, offset - 30)
    const startEllipsis = Boolean(startIndex)
    const start = string.substring(startIndex, offset)
    const endIndex = (offset + match.length + Math.min(string.length, 30)) 
    const endEllipsis = endIndex === string.length
    const end = string.substr(offset + match.length, Math.min(string.length, 30))
    console.warn(`\n\x1b[31m${match}\x1b[39m ${message}`)
    console.warn(`Found at line ${line} in ${path}`)
    console.warn(`${ellipsis(startEllipsis)}${start}\x1b[31m${match}\x1b[39m${end}${ellipsis(endEllipsis)}`)
    return "" // replace with an empty string
}

/**
 * 
 * @param {String} match 
 * @param {String} p1 
 * @param {String} p2
 * @param {Number} offset 
 * @param {String} string 
 * @returns {String} replacement or empty string
 */
function tmplReplacement (match, p1, p2, offset, string) {
    const path = this.file.relative
    if (!p1) {
        return handleReplacementIssue(match, offset, string, path, "replacement must start with 'package.'")
    }
    // search for replacement in .existdb.json "package"
    if (existJSON.package && p2 in existJSON.package) {
        return existJSON.package[p2]
    }
    // search for replacement in package.json
    if (p2 in pkg) {
        return pkg[p2]
    }
    // missing substitution handling
    return handleReplacementIssue(match, offset, string, path, "is not set in package.json!")
}

/**
 * 
 * @param {Boolean} display 
 */
function ellipsis (display) {
    if (display) { return '...' }
    return ''
}

// replace placeholders 
// in src/repo.xml.tmpl and 
// output to build/repo.xml
function templates () {
  return src('src/*.tmpl')
    .pipe(replace(/@(package\.)?([^@]+)@/g, tmplReplacement))
    .pipe(rename(path => { path.extname = "" }))
    .pipe(dest('build/'))
}

exports.templates = templates

function watchTemplates () {
    watch('src/*.tmpl', series(templates))
}
exports["watch:tmpl"] = watchTemplates

// compile SCSS styles and put them into 'build/app/css'
function styles () {
    return src('src/scss/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(dest('build/css'));
}
exports.styles = styles

function watchStyles () {
    watch('src/scss/**/*.scss', series(styles))
}
exports["watch:styles"] = watchStyles

// compile SCSS styles and put them into 'build/app/css'
function minifyEs () {
    return src('src/js/**/*.js')
        .pipe(uglify())
        .pipe(dest('build/js'))
}
exports.minify = minifyEs

function watchEs () {
    watch('src/js/**/*.js', series(minifyEs))
}
exports["watch:es"] = watchEs

const static = 'src/**/*.{xml,html,xq,xquery,xql,xqm,xsl}'

// copy html templates, XMLs and XQuerys to 'build'
function copyStatic () {
    return src(static).pipe(dest('build'))
}
exports.copy = copyStatic

function watchStatic () {
    watch(static, series(copyStatic));
}
exports["watch:static"] = watchStatic

function deploy () {
    return src('build/**/*', {
            base: 'build',
            since: lastRun(deploy) 
        })
        .pipe(existClient.dest({target}))
}

function xar () {
    return src('build/**/*', {base: 'build'})
            .pipe(zip(packageName()))
            .pipe(dest('.'))
}

const build = series(clean, styles, minifyEs, templates, copyStatic)

exports.build = build
exports.deploy = series(build, deploy)
exports.xar = series(build, xar)
exports.install = series(build, xar, installXar)

function watchBuild () {
    watch('build/**/*', series(deploy))
}

const watchAll = parallel(
    watchStyles,
    watchEs,
    watchStatic,
    watchTemplates,
    watchBuild
)

exports.watch = watchAll
exports.default = series(build, deploy, watchAll)
