import validatePresets from './validators/presets';
import validateColors from './validators/colors';
import checkDeprecated from './validators/versioning';
const fs = require('fs');
const path = require('path');
import {
  buildResources,
  injectResources,
  generateHtmlTags,
  generateAppleTags,
  generateMaskIconLink,
  applyTag,
} from './injector';

const MAKE_CMD = 'WebpackPwaManifestMake';
const EMIT_CMD = 'WebpackPwaManifestEmit';
const TAP_CMD = 'webpack-pwa-manifest';
const TAP = 'WebpackPwaManifest';
class WebpackPwaManifest {
  constructor(options = {}) {
    validatePresets(options, 'dir', 'display', 'orientation', 'crossorigin');
    validateColors(options, 'background_color', 'theme_color');
    checkDeprecated(options, 'useWebpackPublicPath');
    this.assets = null;
    this.htmlPlugin = false;
    const shortName = options.short_name || options.name || 'App';
    // fingerprints is true by default, but we want it to be false even if users
    // set it to undefined or null.
    if (!options.hasOwnProperty('fingerprints')) {
      options.fingerprints = true;
    }
    this.options = {
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
      crossorigin: null,
      ...options,
    };
  }

  apply(compiler) {
    const self = this;
    const { hooks } = compiler;
    if (!this.options.name) {
      this.options.name = getEstimatedTitle(compiler.context);
    }

    // Hook into the html-webpack-plugin processing
    // and add the html
    const injectToHtml = function(htmlPluginData, compilation, callback) {
      if (!self.htmlPlugin) {
        self.htmlPlugin = true;
      }
      const publicPath =
        self.options.publicPath || compilation.options.output.publicPath;
      buildResources(self, publicPath, () => {
        if (!self.options.inject) {
          callback(null, htmlPluginData);
          return;
        }

        let tags = generateAppleTags(self.options, self.assets);
        const themeContent =
          self.options['theme-color'] || self.options.theme_color;
        if (themeContent) {
          const themeColorTag = {
            name: 'theme-color',
            content: themeContent,
          };
          applyTag(tags, 'meta', themeColorTag);
        }

        const manifestLink = {
          rel: 'manifest',
          href: self.manifest.url,
        };
        if (!!self.options.crossorigin) {
          manifestLink.crossorigin = self.options.crossorigin;
        }
        applyTag(tags, 'link', manifestLink);
        tags = generateMaskIconLink(tags, self.assets);

        const tagsHTML = generateHtmlTags(tags);
        htmlPluginData.html = htmlPluginData.html.replace(
          /(<\/head>)/i,
          `${tagsHTML}</head>`,
        );

        callback(null, htmlPluginData);
      });
    };

    // webpack 4
    if (compiler.hooks) {
      compiler.hooks.compilation.tap(TAP, function(cmpp) {
        // This is set in html-webpack-plugin pre-v4.
        let hook = cmpp.hooks.htmlWebpackPluginAfterHtmlProcessing;
        if (!hook) {
          const HtmlWebpackPlugin = require('html-webpack-plugin');
          hook = HtmlWebpackPlugin.getHooks(cmpp).beforeEmit;
        }

        hook.tapAsync(TAP_CMD, (htmlPluginData, cb) => {
          injectToHtml(htmlPluginData, cmpp, () => {
            injectResources(cmpp, self.assets, cb);
          });
        });
      });
    } else {
      compiler.plugin('compilation', function(compilation) {
        compilation.plugin(
          'html-webpack-plugin-before-html-processing',
          (htmlPluginData, callback) =>
            injectToHtml(htmlPluginData, compilation, callback),
        );
      });
    }
  }
}

function getEstimatedTitle(dir) {
  let packageJson = path.resolve(dir, 'package.json');
  if (!fs.existsSync(packageJson)) {
    packageJson = path.resolve(dir, '../package.json');
    if (!fs.existsSync(packageJson)) {
      return 'app';
    }
  }
  return JSON.parse(fs.readFileSync(packageJson)).name;
}
module.exports = WebpackPwaManifest;
