var fs = require('fs')
var path = require('path')
const { runLoaders } = require("loader-runner");
var assert = require('chai').assert
var loaderPath = path.resolve(__dirname, "../index.js")

var defaultConfig = {
    output: {
        path: path.resolve(__dirname, './output'),
        filename: 'bundle.js'
    }
}

describe('by runner', () => {
    it('default', function() {
        runLoaders({
            resource: path.resolve(__dirname, './files/file.conf'),
            loaders: [
                {
                    loader: loaderPath,
                }
            ],
            readResource: fs.readFile.bind(fs)
        }, (err, result) => {
            assert.equal('foo\nbar\nfoo\nbar\nconf', result['result'][0]);
        });
    });

    it('md', function() {
        runLoaders({
            resource: path.resolve(__dirname, './files/file.md'),
            loaders: [
                "markdown-loader",
                {
                    loader: loaderPath,
                }
            ],
            readResource: fs.readFile.bind(fs)
        }, (err, result) => {
            assert.equal('<p>foo\nbar\nfoo\nbar\nconf</p>\n', result['result'][0]);
        });
    });
});
