"use strict";

var _presets = _interopRequireDefault(require("./validators/presets"));

var _colors = _interopRequireDefault(require("./validators/colors"));

var _versioning = _interopRequireDefault(require("./validators/versioning"));

var _injector = require("./injector");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var fs = require('fs');

var path = require('path');

var MAKE_CMD = 'WebpackPwaManifestMake';
var EMIT_CMD = 'WebpackPwaManifestEmit';
var TAP_CMD = 'webpack-pwa-manifest';
var TAP = 'WebpackPwaManifest';

var WebpackPwaManifest =
/*#__PURE__*/
function () {
  function WebpackPwaManifest() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, WebpackPwaManifest);

    (0, _presets.default)(options, 'dir', 'display', 'orientation', 'crossorigin');
    (0, _colors.default)(options, 'background_color', 'theme_color');
    (0, _versioning.default)(options, 'useWebpackPublicPath');
    this.assets = null;
    this.htmlPlugin = false;
    var shortName = options.short_name || options.name || 'App'; // fingerprints is true by default, but we want it to be false even if users
    // set it to undefined or null.

    if (!options.hasOwnProperty('fingerprints')) {
      options.fingerprints = true;
    }

    this.options = _objectSpread({
      filename: options.fingerprints ? '[name].[hash].[ext]' : '[name].[ext]',
      name: 'App',
      short_name: shortName,
      orientation: 'portrait',
      display: 'standalone',
      start_url: '.',
      inject: true,
      fingerprints: true,
      ios: false,
      publicPath: null,
      includeDirectory: true,
      crossorigin: null
    }, options);
  }

  _createClass(WebpackPwaManifest, [{
    key: "apply",
    value: function apply(compiler) {
      var self = this;
      var hooks = compiler.hooks;

      if (!this.options.name) {
        this.options.name = getEstimatedTitle(compiler.context);
      } // Hook into the html-webpack-plugin processing
      // and add the html


      var injectToHtml = function injectToHtml(htmlPluginData, compilation, callback) {
        if (!self.htmlPlugin) {
          self.htmlPlugin = true;
        }

        var publicPath = self.options.publicPath || compilation.options.output.publicPath;
        (0, _injector.buildResources)(self, publicPath, function () {
          if (!self.options.inject) {
            callback(null, htmlPluginData);
            return;
          }

          var tags = (0, _injector.generateAppleTags)(self.options, self.assets);
          var themeContent = self.options['theme-color'] || self.options.theme_color;

          if (themeContent) {
            var themeColorTag = {
              name: 'theme-color',
              content: themeContent
            };
            (0, _injector.applyTag)(tags, 'meta', themeColorTag);
          }

          var manifestLink = {
            rel: 'manifest',
            href: self.manifest.url
          };

          if (!!self.options.crossorigin) {
            manifestLink.crossorigin = self.options.crossorigin;
          }

          (0, _injector.applyTag)(tags, 'link', manifestLink);
          tags = (0, _injector.generateMaskIconLink)(tags, self.assets);
          var tagsHTML = (0, _injector.generateHtmlTags)(tags);
          htmlPluginData.html = htmlPluginData.html.replace(/(<\/head>)/i, "".concat(tagsHTML, "</head>"));
          callback(null, htmlPluginData);
        });
      }; // webpack 4


      if (compiler.hooks) {
        compiler.hooks.compilation.tap(TAP, function (cmpp) {
          // This is set in html-webpack-plugin pre-v4.
          var hook = cmpp.hooks.htmlWebpackPluginAfterHtmlProcessing;

          if (!hook) {
            var HtmlWebpackPlugin = require('html-webpack-plugin');

            hook = HtmlWebpackPlugin.getHooks(cmpp).beforeEmit;
          }

          hook.tapAsync(TAP_CMD, function (htmlPluginData, cb) {
            injectToHtml(htmlPluginData, cmpp, function () {
              (0, _injector.injectResources)(cmpp, self.assets, cb);
            });
          });
        });
      } else {
        compiler.plugin('compilation', function (compilation) {
          compilation.plugin('html-webpack-plugin-before-html-processing', function (htmlPluginData, callback) {
            return injectToHtml(htmlPluginData, compilation, callback);
          });
        });
      }
    }
  }]);

  return WebpackPwaManifest;
}();

function getEstimatedTitle(dir) {
  var packageJson = path.resolve(dir, 'package.json');

  if (!fs.existsSync(packageJson)) {
    packageJson = path.resolve(dir, '../package.json');

    if (!fs.existsSync(packageJson)) {
      return 'app';
    }
  }

  return JSON.parse(fs.readFileSync(packageJson)).name;
}

module.exports = WebpackPwaManifest;