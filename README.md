# gulp-exist-example
What can you achieve with gulp-exist? Have a try and find out.

A completely ant-less build of a existdb application.

## Installation

After you pulled this repo run `npm i`

## Things you can do

- increase the version in package.json
- then run `gulp install`

## What else?

`gulp --tasks` will give you an idea of gulp tasks you can try.

## How does it work?

The `gulpfile.js` gathers data from package.json and `.existdb.json` to populate the package descriptor dynamically.
Also the server connection is read from  `.existdb.json`.
The resulting XAR can now also be installed directly from gulp (actually directly using one of the latest features in [node-exist](https://github.com/eXist-db/node-exist)).

## What's next?

- SCSS is kind of dated, a postCSS example might be more interesting
- refactor the template replacement into either gulp-exist or even an npm package of its own
- investigate npm initializers (think create-react-app)
- If you have an idea what would be useful -> open an issue :)
