const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// assets.js
const Assets = require('./assets');

module.exports = {
    entry: {
        app: "./twitter_network/static/twitter_network/src/twitter_network_script.js",
    },
    output: {
        path: __dirname + "/twitter_network/static/twitter_network/src",
        filename: "[name].bundle.js"
    },
    plugins: [
      new CopyWebpackPlugin(
        Assets.js.map(asset => {
          return {
            from: path.resolve(__dirname, `./node_modules/${asset}`),
            to: path.resolve(__dirname, './twitter_network/static/twitter_network/js')
          };
        })
      ),
        new CopyWebpackPlugin(
        Assets.css.map(asset => {
          return {
            from: path.resolve(__dirname, `./node_modules/${asset}`),
            to: path.resolve(__dirname, './twitter_network/static/twitter_network/css')
          };
        })
      )
    ]
};