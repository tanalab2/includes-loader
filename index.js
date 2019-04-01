var fs = require('fs')
var path = require('path')
var getOptions = require('loader-utils').getOptions;

var defaultOptions = {
  pattern: {
    re: /#include\s+?"(.+?)";*?/,
    index: 1
  },
  extensions: []
}

module.exports = function (source) {
  var loader = this
  loader.callback = loader.async()

  loader.cacheable()

  parse(loader, source)

}

function parse(loader, source) {

  try {
    var filepath = loader.resourcePath
    var filepathParse = path.parse(filepath)
    var options = Object.assign({}, defaultOptions, getOptions(loader))

    if (typeof options.pattern === 'function') {
      options.pattern = options.pattern(filepath)
    }

    if (!options.pattern) {
      options.pattern = defaultOptions.pattern
    } else if (!(
      options.pattern.re instanceof RegExp &&
      Number.isInteger(options.pattern.index) &&
      options.pattern.index > -1
    )) {
      throw new Error('includes-loader: pattern is invalid')
    }

    options.pattern.re = new RegExp(options.pattern.re, 'g')

    if (typeof options.extensions === 'function') {
      options.extensions = options.extensions(filepath)
    }

    if (Array.isArray(options.extensions) && options.extensions.length === 0) {
      options.extensions = [filepathParse.ext]
    } else if (!(
      Array.isArray(options.extensions) &&
      options.extensions.length > 0
    )) {
      throw new Error('includes-loader: extensions is invalid')
    }

    options.source = source
    //loader.options = options
    //loader.includes = []
    options.includes = []
    if (options.pattern.re.test(source)) {
      parseIncludes(loader, options, filepath, source)
    } else {
      loader.callback(null, options.source)
    }

  } catch (err) {
    loader.callback(err)
  }

}

function parseIncludes(loader, options, filepath, data) {

  try {
    var fileparse = path.parse(filepath)

    data.replace(options.pattern.re, function () {

      var include = {
        iDir: fileparse.dir,
        iPath: arguments[options.pattern.index],
        iTarget: arguments[0],
        iExtensions: [].concat(options.extensions)
      }

      options.includes.push({include})

      parseFile(loader, options, include)

    })

  } catch (err) {
    loader.callback(err)
  }
}

function hasExt(path) {
  return !!path.extname(path)
}

function parseFile(loader, options, include) {
  try {
    var extension, filepath
    if (path.extname(include.iPath)) {
      include.iExtensions = []
      filepath = path.resolve(include.iDir, include.iPath)
    } else {
      extension = include.iExtensions.shift()
      filepath = path.resolve(include.iDir, include.iPath + extension)
    }
    fs.readFile(filepath, 'utf-8', function (err, data) {
      if (err) {
        if (include.iExtensions.length) {
          parseFile(loader, options, include)
        } else {
          loader.callback(new Error('includes-loader: can not find file ' + filepath))
        }
      } else {
        var index = options.includes.indexOf(include)
        options.source = options.source.replace(include.iTarget, data)
        options.includes.splice(index, 1)
        parseIncludes(loader, options, filepath, data)
        if (options.includes.length === 0) {
          loader.callback(null, options.source)
        }
      }
    })
  } catch (err) {
    loader.callback(err)
  }
}
