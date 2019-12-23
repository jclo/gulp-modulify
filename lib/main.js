// ESLint declarations
/* eslint one-var: 0, semi-style: 0, no-underscore-dangle: 0 */

'use strict';


// -- Node modules
const stream        = require('stream')
    , { Transform } = require('stream')
    , readline      = require('readline')
    , path          = require('path')
    , Vinyl         = require('vinyl')
    ;


// -- Local modules


// -- Local constants
const TREE    = '$__TREE'
    , treetag = '{{$__tree:json}}'
    ;

const TREEFILE = ['  /* ***************************************************************************',
  '   *',
  '   * Tree is an object that links all the internal IIFE modules.',
  '   *',
  '   * ************************************************************************ */',
  '  /* eslint-disable-next-line */',
  `  const ${TREE} = ${treetag};`,
  '  /* eslint-disable-next-line */',
  '  $__TREE.extend=function(o,m){var k=Object.keys(m);for(var i=0;i<k.length;i++){o[k[i]]=m[k[i]]}};',
  '',
  ''].join('\n');


// -- Local variables


// -- Private Functions --------------------------------------------------------

/**
 * Inserts the passed-in header and footer.
 *
 * This function prepends an optional header and appends optional footer to
 * the concatened output file. Usually the header is the top section of an
 * UMD module while the footer is the bottom section.
 *
 * @function (arg1, arg2)
 * @private
 * @param {Array}           the list of passed-in files,
 * @param {Object}          the optional parameters,
 * @returns {}              -,
 * @since 0.0.0,
 */
/* eslint-disable no-param-reassign */
function _addHeaderAndFooter(files, options) {
  if (options && typeof options.header === 'string') {
    files[0].contents = `${options.header}\n${files[0].contents}`;
  }

  if (options && typeof options.footer === 'string') {
    files[files.length - 1].contents += options.footer;
  }
}
/* eslint-enable no-param-reassign */

/**
 * Normalizes the path names.
 *
 * Nota:
 * This function removes hyphen from the path names.
 *
 * @function (arg1)
 * @private
 * @param {Array}           the file path,
 * @returns {Array}         the normalized file path,
 * @since 0.0.0,
 */
function _formatPath(p) {
  const newp = [];
  for (let i = 0; i < p.length; i++) {
    if (p[i].match('-')) {
      newp.push(p[i].replace('-', ''));
    } else {
      newp.push(p[i]);
    }
  }
  return newp;
}

/**
 * Adds the object tree to tree.js.
 *
 * @function (arg1, arg2)
 * @private
 * @param {Object}          the current file,
 * @param {Object}          the tree object,
 * @returns {}              -,
 * @since 0.0.0,
 */
/* eslint-disable no-param-reassign */
function _addTree(files, tree) {
  const file = {
    root: files[0].root,
    dir: '',
    base: 'tree.js',
    ext: '.js',
    name: 'tree',
    contents: '',
  };

  const t = JSON.stringify(tree);
  file.contents = TREEFILE.replace(treetag, t);
  files.unshift(file);
}
/* eslint-enable no-param-reassign */

/**
 * Builds the object tree.
 *
 * Nota:
 * The tree object references the files in the folder structure. If the
 * folder structure looks like:
 *   . src
 *      |_ util1 - util2
 *                   |_ util3
 *
 * The tree structure will be:
 *  . T = { src: { util1: {}, util2: { util3: {} } } }
 *
 * @function (arg1, arg2)
 * @private
 * @param {Object}          the current file,
 * @param {Object}          the tree object,
 * @returns {}              -,
 * @since 0.0.0,
 */
function _buildTree(file, tree) {
  const p = _formatPath((`${file.dir}/${file.name}`).split(path.sep));

  let i = 0;
  let t = tree;
  let keys;
  let key;
  do {
    keys = Object.keys(t);
    key = keys.indexOf(p[i]);
    if (key === -1) {
      t[p[i]] = {};
      t = t[p[i]];
    } else {
      t = t[p[i]];
    }
    i += 1;
  } while (i < p.length);
}

/**
 * Replaces the static import statement.
 *
 * Nota:
 * If 'import' looks like:
 *  . import A from './src/util/a.js'
 * It will be replaced by:
 *  . const A = $T.src.util.a
 *
 * The path must be relative from the current directory.
 *
 * @function (arg1, arg2)
 * @private
 * @param {Object}          the current file,
 * @param {String}          the current line,
 * @returns {String}        returns the path string or null,
 * @since 0.0.0,
 */
function _replaceImport(file, line) {
  if (line.search(/import/) > -1 && line.search(/from/) > -1) {
    const l = line.trim().split(' ');
    if (l[0] === 'import' && l[2] === 'from') {
      const s = l[3].replace(';', '').replace(/'/g, '');
      const p = _formatPath(
        path.relative(file.root, path.resolve(file.dir, s)).split(path.sep),
      );

      let T = `${TREE}`;
      for (let i = 0; i < p.length; i++) {
        T += `.${p[i]}`;
      }

      return line
        .replace('import', 'const')
        .replace('from', '=')
        .replace(l[3], `${T};`)
      ;
    }
  }
  return null;
}

/**
 * Replaces the export default statement.
 *
 * Nota:
 * If the export looks like 'export default A' and the file is in the
 * path './src/util1/util2/a.js', the export statement is replaced by:
 *  . 'export default A' becomes -> $__TREE.extend($__TREE.src.util1.util2.a, A);
 *
 * @function (arg1, arg2)
 * @private
 * @param {Object}          the current file,
 * @param {String}          the current line,
 * @returns {String}        returns the path string or null,
 * @since 0.0.0,
 */
function _replaceExport(file, line) {
  let s = '';
  if (line.search(/export/) > -1 && line.search(/default/) > -1) {
    const l = line.trim().split(' ');
    if (l[0] === 'export' && l[1] === 'default') {
      let t = `${TREE}`;
      const p = _formatPath((`${file.dir}/${file.name}`).split(path.sep));
      for (let i = 0; i < p.length; i++) {
        t += `.${p[i]}`;
      }

      // s += line.replace('export default', `${t} =`);
      const n = l[2].replace(';', '');
      s += line
        .replace('export', `${TREE}.extend(`)
        .replace('default', `${t},`)
        .replace(`${n}`, `${n})`)
        .replace('extend( ', 'extend(')
      ;
      return s;
    }
  }
  return null;
}

/**
 * Replaces the import and export statements in the passed-in file.
 *
 * @function (arg1)
 * @private
 * @param {Object}          the passed-in vinyl file,
 * @returns {Object}        returns a promise that returns nothing,
 * @since 0.0.0,
 */
/* eslint-disable no-param-reassign */
function _replaceImportExport(file) {
  const bufferStream = new stream.PassThrough();
  bufferStream.end(Buffer.from(file.contents, 'utf8'));

  const rl = readline.createInterface({
    input: bufferStream,
    crlfDelay: Infinity,
  });

  let s = '';
  let im;
  let ex;
  rl.on('line', (line) => {
    im = _replaceImport(file, line);
    ex = _replaceExport(file, line);
    if (im) {
      s += `${im}\n`;
    } else if (ex) {
      s += `${ex}\n`;
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
 * Encapsulates the passed-in file in an IIFE module.
 *
 * Nota:
 * The code must be between the two tags 'IIFE_START' and 'IIFE_END'. Thus,
 * the code:
 *  // IIFE_START
 *  ... code
 *  // IIFE_END
 *
 * is replaced by:
 * (function() {
 *   ... code
 * }());
 *
 * The output looks like:
 * {
 *   root: '',              // the root path of the project,
 *   dir: 'src/util2',      // the relative path where is the file,
 *   base: 'd.js',          // the complete file name,
 *   ext: '.js',            // the file extension,
 *   name: 'd',             // the file name without extension,
 *   contents:              // the contents of the file (utf-8 string),
 * }
 *
 * @function (arg1)
 * @private
 * @param {Object}          the passed-in vinyl file,
 * @returns {Object}        returns a promise that contains the transformed file,
 * @since 0.0.0,
 */
function _insertIIFE(file) {
  const bufferStream = new stream.PassThrough();
  bufferStream.end(Buffer.from(file.contents));

  const rl = readline.createInterface({
    input: bufferStream,
    crlfDelay: Infinity,
  });

  // Read the file line by line.
  // Replace the tags 'IIFE_START' and 'IIFE_END' by the IIFE header and footer
  // and indent the code properly.
  let s = '';
  let inside = false;
  rl.on('line', (line) => {
    if (line.match('IIFE_START')) {
      s += '  (function() {\n    // IIFE START\n';
      inside = true;
    } else if (line.match('IIFE_END')) {
      s += '    // IIFE END\n  }());\n';
      inside = false;
    } else if (inside) {
      s += line === '' || /^\s+$/.test(line) ? '\n' : `    ${line}\n`;
    } else {
      s += line === '' || /^\s+$/.test(line) ? '\n' : `  ${line}\n`;
    }
  });

  return new Promise((resolve, reject) => {
    rl.on('close', () => {
      s += '\n';
      resolve(s);
    });

    rl.on('error', (e) => {
      reject(e);
    });
  });
}

/**
 * Transforms the passed-in file in an IIFE module.
 *
 * @function (arg1, arg2, arg3)
 * @private
 * @param {Object}          the vinyl passed-in file,
 * @param {Array}           the tree object that references the IIFE modules,
 * @param {Function}        the file to call at the completion,
 * @returns {}              -,
 * @since 0.0.0,
 */
async function _transform(file, tree, callback) {
  const f = path.parse(path.relative(file.cwd, file.path));
  f.contents = await _insertIIFE(file);
  await _replaceImportExport(f);
  _buildTree(f, tree);
  callback(f);
}


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
      _transform(file, tree, (f) => {
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
  transformStream._flush = function(callback) {
    const file = new Vinyl(name);

    _addTree(files, tree);
    _addHeaderAndFooter(files, options);

    // Concatenate all files in one:
    let contents = '';
    for (let i = 0; i < files.length; i++) {
      contents += files[i].contents;
    }

    file.contents = Buffer.from(contents, 'utf8');
    file.path = `${root}/${name}`;
    this.push(file);
    callback();
  };

  // return the new transform stream object:
  return transformStream;
};
