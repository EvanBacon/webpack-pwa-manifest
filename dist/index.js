"use strict";

var _presets = _interopRequireDefault(require("./validators/presets"));

var _colors = _interopRequireDefault(require("./validators/colors"));

var _versioning = _interopRequireDefault(require("./validators/versioning"));

var _injector = require("./injector");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _readOnlyError(name) { throw new Error("\"" + name + "\" is read-only"); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var fs = require('fs');

var path = require('path');

var MAKE_CMD = 'WebpackPwaManifestMake';
var EMIT_CMD = 'WebpackPwaManifestEmit';
var TAP_CMD = 'webpack-pwa-manifest';
var TAP = 'WebpackPwaManifest';
var MAX_SHORT_NAME_LENGTH = 12;
var DEFAULT_COLOR = '#4630EB';
var DEFAULT_BACKGROUND_COLOR = '#ffffff';
var DEFAULT_START_URL = '.';
var DEFAULT_DISPLAY = 'fullscreen';
var DEFAULT_STATUS_BAR = 'default';
var DEFAULT_LANG_DIR = 'auto';
var DEFAULT_ORIENTATION = 'any';

function isObject(item) {
  return _typeof(item) === 'object' && !Array.isArray(item) && item !== null;
}

function warn() {
  var _console;

  // TODO: Bacon: Add a way to disable logs
  (_console = console).warn.apply(_console, arguments);
} // https://developer.mozilla.org/en-US/docs/Web/Manifest#orientation


var VALID_ORIENTATIONS = ['any', 'natural', 'landscape', 'landscape-primary', 'landscape-secondary', 'portrait', 'portrait-primary', 'portrait-secondary', 'omit'];
var ICON_SIZES = [96, 128, 192, 256, 384, 512];
/**
 * Generate a `manifest.json` for your PWA based on the `app.json`.
 * This plugin must be **after HtmlWebpackPlugin**.
 *
 * To test PWAs in chrome visit `chrome://flags#enable-desktop-pwas`
 */

var absolutePath = function absolutePath() {
  for (var _len = arguments.length, pathComponents = new Array(_len), _key = 0; _key < _len; _key++) {
    pathComponents[_key] = arguments[_key];
  }

  return path.resolve.apply(path, [process.cwd()].concat(pathComponents));
};

var WebpackPwaManifest =
/*#__PURE__*/
function () {
  function WebpackPwaManifest(appJson, options) {
    _classCallCheck(this, WebpackPwaManifest);

    if (!isObject(appJson)) {
      throw new Error('app.json must be an object');
    }

    var nativeManifest = appJson.expo || appJson;
    var web = nativeManifest.web || {};
    var splash = nativeManifest.splash || {};
    var ios = nativeManifest.ios || {};
    var android = nativeManifest.android || {};
    var name = web.name || nativeManifest.name;
    var shortName = web.shortName || web.short_name || name;
    var description = web.description || nativeManifest.description;
    /**
     * **Splash screen background color**
     * `https://developers.google.com/web/fundamentals/web-app-manifest/#splash-screen`
     * The background_color should be the same color as the load page,
     * to provide a smooth transition from the splash screen to your app.
     */

    var backgroundColor = web.backgroundColor || web.background_color || splash.backgroundColor || DEFAULT_BACKGROUND_COLOR; // No default background color
    // The theme_color sets the color of the tool bar, and may be reflected in the app's preview in task switchers.
    // TODO: Bacon: Ensure this is covered by `WebpackPwaManifest`: the theme_color should match the meta theme color specified in your document head.

    var themeColor = web.themeColor || web.theme_color || nativeManifest.primaryColor || DEFAULT_COLOR; // TODO: Bacon: startUrl or startURL ?

    var startUrl = web.startUrl || web.start_url || DEFAULT_START_URL; // validation: https://github.com/arthurbergmz/webpack-pwa-manifest/blob/ce46542adef3b91fd65221c586c6e934a3b6a272/src/validators/presets.js#L10

    var display = web.display || DEFAULT_DISPLAY;
    var orientation = web.orientation || nativeManifest.orientation;

    if (orientation && typeof orientation === 'string') {
      orientation = orientation.toLowerCase(); // Convert expo value to PWA value

      if (orientation === 'default') {
        orientation = 'any';
      }
    } else {
      orientation = 'any';
    } // If you don't include a scope in your manifest, then the default implied scope is the directory that your web app manifest is served from.


    var scope = web.scope;
    var barStyle = web.barStyle || web['apple-mobile-web-app-status-bar-style'] || DEFAULT_STATUS_BAR;
    /**
     * https://developer.mozilla.org/en-US/docs/Web/Manifest#related_applications
     * An array of native applications that are installable by, or accessible to, the underlying platform
     * for example, a native Android application obtainable through the Google Play Store.
     * Such applications are intended to be alternatives to the
     * website that provides similar/equivalent functionality — like the native app version of the website.
     */

    var relatedApplications = web.relatedApplications || web.related_applications || [];
    /**
     * If the manifest needs credentials to fetch you have to add the crossorigin attribute even if the manifest file is in the same orgin of the current page.
     * null, `use-credentials` or `anonymous`
     * validation: https://github.com/arthurbergmz/webpack-pwa-manifest/blob/ce46542adef3b91fd65221c586c6e934a3b6a272/src/validators/presets.js#L13
     */

    var crossorigin = web.crossorigin || null;
    /**
     * https://developer.mozilla.org/en-US/docs/Web/Manifest#dir
     * `ltr`, `rtl`, `auto`
     * validation: https://github.com/arthurbergmz/webpack-pwa-manifest/blob/ce46542adef3b91fd65221c586c6e934a3b6a272/src/validators/presets.js#L4
     */

    var dir = web.dir || DEFAULT_LANG_DIR;
    /**
     * https://developer.mozilla.org/en-US/docs/Web/Manifest#prefer_related_applications
     * Specifies a boolean value that hints for the user agent to indicate
     * to the user that the specified native applications (see below) are recommended over the website.
     * This should only be used if the related native apps really do offer something that the website can't... like Expo ;)
     */

    var preferRelatedApplications = web.recommendNativeApp || web.preferRelatedApplications || web.prefer_related_applications;
    /**
     * Specifies the primary language for the values in the `name` and `short_name` members.
     * This value is a string containing a single language tag.
     * ex: `"en-US"`
     */
    // TODO: Bacon: sync with <html/> lang

    var lang = options.languageISOCode; // TODO: Bacon: validation doesn't handle platforms: https://github.com/arthurbergmz/webpack-pwa-manifest/blob/master/src/icons/index.js
    // TODO: Bacon: Maybe use android, and iOS icons.

    var icons = [];
    var icon;

    if (web.icon || nativeManifest.icon) {
      icon = absolutePath(web.icon || nativeManifest.icon);
    } else {
      // Use template icon
      icon = options.defaultIcon;
    }

    icons.push({
      src: icon,
      size: ICON_SIZES
    });
    var startupImages = [];
    var iOSIcon = nativeManifest.icon || ios.icon;

    if (iOSIcon) {
      var iOSIconPath = absolutePath(iOSIcon);
      icons.push({
        ios: true,
        size: 1024,
        src: iOSIconPath
      });
      var _ios$splash = ios.splash,
          iOSSplash = _ios$splash === void 0 ? {} : _ios$splash;
      var splashImageSource = iOSIconPath;

      if (iOSSplash.image || splash.image) {
        splashImageSource = absolutePath(iOSSplash.image || splash.image);
      } // <link rel="apple-touch-startup-image" href="images/splash/launch-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)">
      // <link rel="apple-touch-startup-image" href="images/splash/launch-750x1294.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)">
      // <link rel="apple-touch-startup-image" href="images/splash/launch-1242x2148.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)">
      // <link rel="apple-touch-startup-image" href="images/splash/launch-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)">
      // <link rel="apple-touch-startup-image" href="images/splash/launch-1536x2048.png" media="(min-device-width: 768px) and (max-device-width: 1024px) and (-webkit-min-device-pixel-ratio: 2) and (orientation: portrait)">
      // <link rel="apple-touch-startup-image" href="images/splash/launch-1668x2224.png" media="(min-device-width: 834px) and (max-device-width: 834px) and (-webkit-min-device-pixel-ratio: 2) and (orientation: portrait)">
      // <link rel="apple-touch-startup-image" href="images/splash/launch-2048x2732.png" media="(min-device-width: 1024px) and (max-device-width: 1024px) and (-webkit-min-device-pixel-ratio: 2) and (orientation: portrait)">


      startupImages.push({
        src: splashImageSource,
        supportsTablet: ios.supportsTablet,
        orientation: orientation,
        destination: "assets/splash"
      });
    }

    console.log('startupImages', startupImages); // Validate short name

    if (shortName && shortName.length > MAX_SHORT_NAME_LENGTH) {
      var message;

      if (web.shortName) {
        warn("web.shortName should be 12 characters or less, otherwise it'll be curtailed on the mobile device homepage.");
      } else {
        warn("name should be 12 characters or less, otherwise it'll be curtailed on the mobile device homepage. You should define web.shortName in your app.json as a string that is ".concat(MAX_SHORT_NAME_LENGTH, " or less characters."));
      }
    }

    var EXPO_ORIENTATIONS = ['landscape', 'portrait'];

    if (!web.orientation && !EXPO_ORIENTATIONS.includes(orientation)) {
      warn("orientation: ".concat(orientation, " is invalid. Expected one of: ").concat(EXPO_ORIENTATIONS.join(', '), ". For more control define your `web.orientation` as one of: ").concat(VALID_ORIENTATIONS.join(', ')));
    }

    if (options.strict && display && !['fullscreen', 'standalone', 'minimal-ui'].includes(display)) {
      warn("web.display: ".concat(display, " is not a valid PWA display and will prevent the app install banner from being shown."));
    } // if the user manually defines this as false, then don't infer native apps.


    if (preferRelatedApplications !== false) {
      var noRelatedApplicationsDefined = Array.isArray(relatedApplications) && !relatedApplications.length;

      if (noRelatedApplicationsDefined) {
        if (ios.bundleIdentifier) {
          var alreadyHasIOSApp = relatedApplications.some(function (app) {
            return app.platform === 'itunes';
          });

          if (!alreadyHasIOSApp) {
            var iosApp = {
              platform: 'itunes',
              url: ios.appStoreUrl,
              id: ios.bundleIdentifier
            };
            relatedApplications.push(iosApp);
          }
        }

        if (android.package) {
          var alreadyHasAndroidApp = relatedApplications.some(function (app) {
            return app.platform === 'play';
          });

          if (!alreadyHasAndroidApp) {
            var androidUrl = android.playStoreUrl;

            if (!androidUrl && android.package) {
              androidUrl = (_readOnlyError("androidUrl"), "http://play.google.com/store/apps/details?id=".concat(android.package));
            }

            var androidApp = {
              platform: 'play',
              url: androidUrl,
              id: android.package
            };
            relatedApplications.push(androidApp);
          }
        }
      }
    }

    this._parseOptions({
      background_color: backgroundColor,
      description: description,
      dir: dir,
      display: display,
      filename: options.filename,
      includeDirectory: false,
      icons: icons,
      startupImages: startupImages,
      lang: lang,
      name: name,
      orientation: orientation,
      prefer_related_applications: preferRelatedApplications,
      related_applications: relatedApplications,
      scope: scope,
      short_name: shortName,
      start_url: startUrl,
      theme_color: themeColor,
      ios: {
        'apple-mobile-web-app-status-bar-style': barStyle
      },
      crossorigin: crossorigin
    });
  }

  _createClass(WebpackPwaManifest, [{
    key: "_parseOptions",
    value: function _parseOptions(options) {
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
  }, {
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