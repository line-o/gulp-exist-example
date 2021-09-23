# gulp-exist-example

What can you achieve with gulp-exist? Have a try and find out.

A completely ant-less build of a existdb application.

## Installation

```bash
npx degit line-o/gulp-exist-example#main my-new-app
```

## Things you can do

Assuming you have an existdb 5 running at localhost:8080
with the default admin account. Otherwise you need to change
the settings in `.existdb.json`.

### Testing it for the first time

- run `gulp install`
- have a look at the packagemanager of your existdb instance
- increase the version in package.json
- then run `gulp install` again

### Further down the rabbit hole

- run `gulp watch` and change anything in the src folder
- observe how SCSS is compiled, JavaScript minified and static files copied
- after that it will immediately be synced to your database, too

## What else?

`gulp --tasks` will give you an idea of gulp tasks you can try.

```sh
├── clean
├── templates
├── watch:tmpl
├── styles
├── watch:styles
├── minify
├── watch:es
├── copy
├── watch:static
├── build
├── watch
├── deploy
├── xar
├── install
└── default
```

## How does it work?

The `gulpfile.js` gathers metadata from package.json to populate the package descriptor dynamically. Additional 
Also the server connection is read from environment variables. 

| variable      | default value          | description
| ----          | ----                   | ----
|`EXIST_SERVER` | https://localhost:8443 | the URL to connect to the existdb server
|`EXIST_USER`   | admin                  | the user to connect to the existdb server
|`EXIST_PASS`   | _empty_                | the password for the user (must be set in order for EXIST_USER to take effect)

For how to conveniently read and manage environment variables have a look at [dotenv-cli](https://www.npmjs.com/package/dotenv-cli).

The resulting XAR can now also be installed directly from gulp (actually directly using one of the latest features in [node-exist](https://github.com/eXist-db/node-exist)).

## What's next?

- SCSS is kind of dated, a postCSS example might be more interesting
- [x] refactor the template replacement into either gulp-exist or even an npm package of its own
- [ ] investigate npm initializers (think create-react-app)
- If you have an idea what would be useful -> open an issue :)
