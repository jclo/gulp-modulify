// ESLint declarations
/* eslint one-var: 0, semi-style: 0, no-underscore-dangle: 0 */

'use strict';


// -- Node modules
const stream   = require('stream')
    , readline = require('readline')
    ;


// -- Local modules
const Util = require('./util');


// -- Local constants


// -- Local variables


// -- Private Functions --------------------------------------------------------

/**
 * Searches and Fixes the library link.
 *
 * @function (arg1, arg2)
 * @private
 * @param {Array}           the list of passed-in files,
 * @param {String}          the line to analyse,
 * @returns {Null/String}   returns the transformed string or null,
 * @since 0.0.0,
 */
function _searchAndFixLink(files, line) {
  const T  = Util.getTree()
      , re = new RegExp(`= ${T.replace('$', '\\$')}.`)
      ;

  if (line.match(re)) {
    const s = line.slice(line.indexOf(T), -1);

    for (let i = 0; i < files.length; i++) {
      if (files[i].lib && s === files[i].lib.link) {
        // Prefer destructuring:
        // return { libname } = $__TREE.a.b.c
        const la = line.trim().split(' ');
        let s1 = s.split('.');
        if (la[1] === files[i].lib.name) {
          s1.pop();
          s1 = s1.join('.');
          return line
            .replace(la[1], `{ ${la[1]} }`)
            .replace(s, s1)
          ;
        }

        // No destructuring:
        // return A = $__TREE.a.b.c.libname
        s1[s1.length - 1] = files[i].lib.name;
        s1 = s1.join('.');
        return line
          .replace(s, s1)
        ;
      }
    }
  }
  return null;
}

/**
 * Parses a file and updates th library link.
 *
 * Nota:
 * The library name and the library file name could differ. For instance,
 * a library file name could be abc.js and the library name could be ABC.
 * When the statement 'import' is replaced by a link, the library name isn't
 * known yet. Thus, the link is equal to the path of the embedded library
 * completed by the library file name.
 *
 * For instance, if a library named abc.js is is the path './src/libin/',
 * 'Util._buildTree' creates the link 'const L = $__TREE.src.libin.abc'.
 *
 * The purpose of This function is to replace '$__TREE.src.libin.abc' by
 * '$__TREE.src.libin.ABC'.
 *
 * When an embedded library is parsed (refer to Util._attachEmbeddedLib),
 * the property file.lib = { signature: 'sign.', name: 'name', link: 'link'}
 * is added. So, we just need to find a link that matches to replace '.abc'
 * by 'file.lib.name'.
 *
 * @function (arg1, arg2)
 * @private
 * @param {Array}           the list of passed-in files,
 * @param {Object}          the processed file,
 * @returns {}              -,
 * @since 0.0.0,
 */
/* eslint-disable no-param-reassign */
function _parse(files, file) {
  const bufferStream = new stream.PassThrough();
  bufferStream.end(Buffer.from(file.contents, 'utf8'));

  const rl = readline.createInterface({
    input: bufferStream,
    crlfDelay: Infinity,
  });

  let s = '';
  let l;
  rl.on('line', (line) => {
    l = _searchAndFixLink(files, line);
    if (l) {
      s += `${l}\n`;
    } else {
      s += `${line}\n`;
    }
  });

  return new Promise((resolve, reject) => {
    rl.on('close', () => {
      file.contents = s;
      resolve();
    });

    rl.on('error', (e) => {
      reject(e);
    });
  });
}
/* eslint-enable no-param-reassign */

/**
 * Fixes the library links.
 *
 * @function (arg1, arg2)
 * @private
 * @param {Array}           the list of passed-in files,
 * @param {Function}        the function to call at the completion,
 * @returns {}              -,
 * @since 0.0.0,
 */
/* eslint-disable no-await-in-loop */
async function _fixLinks(files, callback) {
  for (let i = 0; i < files.length; i++) {
    if (!files[i].lib) {
      await _parse(files, files[i]);
    }
  }
  callback();
}
/* eslint-enable no-await-in-loop */


// -- Public Static Methods ----------------------------------------------------

module.exports = {

  /**
   * Fixes the library links.
   *
   * @method (arg1, arg2)
   * @public
   * @param {Array}         the list of passed-in files,
   * @param {Function}      the function to call at the completion,
   * @returns {}            -,
   * @since 0.0.0,
   */
  fixLinks(files, callback) {
    _fixLinks(files, callback);
  },
};
