var fs = require('fs')
var path = require('path')
//var jsdom = require('jsdom')
var jsdom = require("jsdom/lib/old-api.js");
var webpack = require('webpack')
var assert = require('chai').assert
var loaderPath = path.resolve(__dirname, "../index.js")
var eol = require('os').EOL

function equal(actual, expected) {
  assert.equal(actual, expected.replace(/\n/g, eol))
}

var defaultConfig = {
  output: {
    path: path.resolve(__dirname, './output'),
    filename: 'bundle.js'
  }
}

describe('includes-loader', function() {

  it('default', function(done) {
    var config = Object.assign({}, defaultConfig, {
      entry: path.resolve(__dirname, './files/default.js'),
      module: {
        rules:[
          {
            test: /\.conf$/,
            use: [
              {
                loader: loaderPath,
                // options: {
                //   pattern: {
                //     re: /#include\s+?"(.+?)";*?/,
                //     index: 1
                //   },
                //   extensions: [] // the extension will be same to the including file
                // }
              }
            ]
          }
        ]
      }
    })
    webpack(config, function(err, stats) {
      stats.compilation.errors.forEach(function (err) {
        console.error(err.message)
      })
      assert.lengthOf(stats.compilation.errors, 0)
      fs.readFile(path.resolve(__dirname, './output/bundle.js'), 'utf-8', function (err, data) {
        jsdom.env({
          html: '<!DOCTYPE html><html><head></head><body></body></html>',
          src: [data],
          done: function (err, window) {
            equal(window.confStr, 'foo\nbar\nfoo\nbar\nconf')
            done()
          }
        })
      })
    })
  })

  it('md', function(done) {
    var config = Object.assign({}, defaultConfig, {
      entry: path.resolve(__dirname, './files/md.js'),
      module: {
        rules:[
          {
            test: /\.md$/,
            use: [
              {
                loader: loaderPath,
                // options: {
                //   pattern: {
                //     re: /#include\s+?"(.+?)";*?/,
                //     index: 1
                //   },
                //   extensions: [] // the extension will be same to the including file
                // }
              }
            ]
          }
        ]
      }
    })
    webpack(config, function(err, stats) {
      stats.compilation.errors.forEach(function (err) {
        console.error(err.message)
      })
      assert.lengthOf(stats.compilation.errors, 0)
      fs.readFile(path.resolve(__dirname, './output/bundle.js'), 'utf-8', function (err, data) {
        jsdom.env({
          html: '<!DOCTYPE html><html><head></head><body></body></html>',
          src: [data],
          done: function (err, window) {
            equal(window.mdStr, 'foo\nbar\nfoo\nbar\nconf\n')
            done()
          }
        })
      })
    })
  })

  var includes_options = {
    pattern: function (filepath) {
      var pattern
      if (/\.html$/.test(filepath)) {
        pattern = {
          re: /<!--#\s*?include\s+?virtual=("|')(.+?)\1\s*?-->/,
          index: 2
        }
      }
      return pattern
    },
    extensions: function (filepath) {
      var extensions
      if (/\.html$/.test(filepath)) {
        extensions = ['', '.html', '.shtml', '.htm']
      } else if (/\.glsl$/.test(filepath)) {
        extensions = ['', '.glsl', '.vert', '.frag']
      }
      return extensions
    }
  }

  it('options', function(done) {
    var config = Object.assign({}, defaultConfig, {
      entry: path.resolve(__dirname, './files/options.js'),
      module: {
        rules: [
          {
            test: /\.html$/,
            use: [
              {
                loader: loaderPath,
                options: includes_options
              }
            ]
          },
          {
            test: /\.glsl$/,
            use: [
              {
                loader: loaderPath,
                options: includes_options
              }
            ]
          }
        ]
      },
    })
    webpack(config, function(err, stats) {
      stats.compilation.errors.forEach(function (err) {
        console.error(err.message)
      })
      assert.lengthOf(stats.compilation.errors, 0)
      fs.readFile(path.resolve(__dirname, './output/bundle.js'), 'utf-8', function (err, data) {
        jsdom.env({
          html: '<!DOCTYPE html><html><head></head><body></body></html>',
          src: [data],
          done: function (err, window) {
            equal(window.htmlStr, '<p>foo</p>\n<p>bar</p>\n<p>foo</p>\n<p>bar</p>\n<p>html</p>')
            equal(window.glslStr, '// foo\n// bar\n// foo\n// bar\n// glsl')
            done()
          }
        })
      })
    })
  })
})
