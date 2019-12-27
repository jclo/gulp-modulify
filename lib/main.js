// ESLint declarations
/* eslint one-var: 0, semi-style: 0, no-underscore-dangle: 0 */

'use strict';


// -- Node modules
const { Transform } = require('stream')
    , Vinyl         = require('vinyl')
    ;


// -- Local modules
const Util = require('./util')
    , Lib  = require('./lib')
    ;


// -- Local constants


// -- Local variables


// -- Public -------------------------------------------------------------------

module.exports = (filename, options) => {
  // Create a Transform Stream Object:
  const transformStream = new Transform({ objectMode: true })
      , name = filename || 'core.js'
      , files = []
      , tree = {}
      ;

  let root;

  /**
   * Overloads the _transform stream method.
   *
   * @method (arg1, arg2, arg3)
   * @public
   * @param {Object}        Gulp Stream Object,
   * @param {String}        type of stream encoding (String or Buffer),
   * @param {function}      function to call at completion.
   * @returns {}            -,
   * @since 0.0.0,
   */
  transformStream._transform = function(file, encoding, callback) {
    // Do nothing if the file is null:
    if (file.isNull()) {
      callback(null, file);
      return;
    }

    // Do nothing if the file is a stream:
    if (file.isStream()) {
      callback(null, file);
      return;
    }

    // Process buffers:
    if (file.isBuffer()) {
      if (!root) root = file.cwd;
      Util.transform(file, tree, (f) => {
        files.push(f);
        callback();
      });
      return;
    }

    callback(null, file);
  };

  /**
   * Overloads the _flush stream method.
   *
   * @method (arg1)
   * @public
   * @param {function}      function to call at completion.
   * @returns {}            -,
   * @since 0.0.0,
   */
  transformStream._flush = async function(callback) {
    const file = new Vinyl(name);

    Lib.fixLinks(files, () => {
      Util.addTree(files, tree);
      Util.addHeaderAndFooter(files, options);

      // Concatenate all files in one:
      let contents = '';
      for (let i = 0; i < files.length; i++) {
        contents += files[i].contents;
      }

      file.contents = Buffer.from(contents, 'utf8');
      file.path = `${root}/${name}`;
      this.push(file);
      callback();
    });
  };

  // return the new transform stream object:
  return transformStream;
};
