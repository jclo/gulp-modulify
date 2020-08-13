# gulp-modulify

[![NPM version][npm-image]][npm-url]
[![Travis CI][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![Dependencies status][dependencies-image]][dependencies-url]
[![Dev Dependencies status][devdependencies-image]][devdependencies-url]
[![License][license-image]](LICENSE.md)
<!--- [![node version][node-image]][node-url] -->

| `gulp-modulify` has been deprecated. Please, use [kadoo](https://www.npmjs.com/package/kadoo) or [pakket](https://www.npmjs.com/package/pakket) now. |
| --- |

`gulp-modulify` encapsulates each javascript source file inside an IIFE module and the whole inside an UMD module. The generated output is an UMD library that could run on both Node.js and the browsers.


## Quick Startup

Write your source files with the `import` and `export` statements like this:

```javascript
// IIFE_START
import A from '../a';

... your code

export default B;
// IIFE_END
```

`gulp-modulify` encapsulates your source file into an IIFE module if it finds the tags `// IIFE_START` and `// IIFE_END`. If you want to keep some portions of your code out of an IIFE module (not recommended), write it outside that tags.

It replaces `import` and `export` by links.

The resulting output looks like:

```javascript
(function() {
  const A = $__TREE.src.x.y.a;

  ... your unaltered code

  $__TREE.extend($TREE.src.x.z, B);
}());
```

Then, it bundles all the files, of your project, in a unique output file. As each file is embedded in an IIFE module, it prevents any conflict between the different portions of your Javascript code.

The IIFE modules are connected together by the links that replace the `import` and `export` statements.

When you look at the resulting output, you can see that your code is almost not altered. `gulp-modulify` adds just two lines at the top of your library in addition to the links that replace `import` and `export`.

[ES6libplus](https://www.npmjs.com/package/@mobilabs/es6libplus) is a boilerplate that allows you writing libraries that rely on `gulp-modulify`.


## How to use it

You can create a `Gulp` task like this:

```javascript
function dolib() {
  return src(<source_files>)
    .pipe(modulify(output.js, {
      header,
      footer,
    }))
    .pipe(dest(destination));
}
```

This task takes an array of source files and pass them to `modulify`. This last one transforms the source files to a set of IIFE modules, bundles them, adds an header and a footer and creates an UMD library.

Again, [ES6libplus](https://www.npmjs.com/package/@mobilabs/es6libplus) is an example of library built with `gulp-modulify`. Feel free to use it.


## License

[MIT](LICENSE.md).

<!--- URls -->

[npm-image]: https://img.shields.io/npm/v/gulp-modulify.svg?style=flat-square
[npm-install-image]: https://nodei.co/npm/gulp-modulify.png?compact=true
[node-image]: https://img.shields.io/badge/node.js-%3E=_0.10-green.svg?style=flat-square
[download-image]: https://img.shields.io/npm/dm/gulp-modulify.svg?style=flat-square
[travis-image]: https://img.shields.io/travis/jclo/gulp-modulify.svg?style=flat-square
[coveralls-image]: https://img.shields.io/coveralls/jclo/gulp-modulify/master.svg?style=flat-square
[dependencies-image]: https://david-dm.org/jclo/gulp-modulify/status.svg?theme=shields.io
[devdependencies-image]: https://david-dm.org/jclo/gulp-modulify/dev-status.svg?theme=shields.io
[license-image]: https://img.shields.io/npm/l/gulp-modulify.svg?style=flat-square

[npm-url]: https://www.npmjs.com/package/gulp-modulify
[npm-install-url]: https://nodei.co/npm/gulp-modulify
[node-url]: http://nodejs.org/download
[download-url]: https://www.npmjs.com/package/gulp-modulify
[travis-url]: https://travis-ci.org/jclo/gulp-modulify
[coveralls-url]: https://coveralls.io/github/jclo/gulp-modulify?branch=master
[dependencies-url]: https://david-dm.org/jclo/gulp-modulify
[devdependencies-url]: https://david-dm.org/jclo/gulp-modulify?type=dev
[license-url]: http://opensource.org/licenses/MIT
