"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.retrieveIcons = retrieveIcons;
exports.parseIcons = parseIcons;

var _fs = _interopRequireDefault(require("fs"));

var _jimp = _interopRequireDefault(require("jimp"));

var _mime = _interopRequireDefault(require("mime"));

var _uri = require("../helpers/uri");

var _fingerprint = _interopRequireDefault(require("../helpers/fingerprint"));

var _IconError = _interopRequireDefault(require("../errors/IconError"));

var _Apple = require("../validators/Apple");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var supportedMimeTypes = [_jimp.default.MIME_PNG, _jimp.default.MIME_JPEG, _jimp.default.MIME_BMP];

function parseArray(i) {
  if (i == null) return [];
  return i && !Array.isArray(i) ? [i] : i;
}

function sanitizeIcon(iconSnippet) {
  if (!iconSnippet.src) {
    throw new _IconError.default('Unknown icon source.');
  }

  var sizes = parseArray(iconSnippet.size || iconSnippet.sizes);

  if (!sizes) {
    throw new _IconError.default('Unknown icon sizes.');
  }

  return {
    src: iconSnippet.src,
    sizes: sizes,
    media: iconSnippet.media,
    destination: iconSnippet.destination,
    ios: iconSnippet.ios || false,
    color: iconSnippet.color
  };
}

function processIcon(width, height, icon, buffer, mimeType, publicPath, shouldFingerprint) {
  var dimensions = "".concat(width, "x").concat(height);
  var fileName = shouldFingerprint ? "icon_".concat(dimensions, ".").concat((0, _fingerprint.default)(buffer), ".").concat(_mime.default.getExtension(mimeType)) : "icon_".concat(dimensions, ".").concat(_mime.default.getExtension(mimeType));
  var iconOutputDir = icon.destination ? (0, _uri.joinURI)(icon.destination, fileName) : fileName;
  var iconPublicUrl = (0, _uri.joinURI)(publicPath, iconOutputDir);
  console.log('output:::', icon);
  return {
    manifestIcon: {
      src: iconPublicUrl,
      sizes: dimensions,
      type: mimeType
    },
    webpackAsset: {
      output: iconOutputDir,
      url: iconPublicUrl,
      source: buffer,
      size: buffer.length,
      ios: icon.ios ? {
        valid: icon.ios,
        media: icon.media,
        size: dimensions,
        href: iconPublicUrl
      } : false,
      color: icon.color
    }
  };
}

function processImg(sizes, icon, cachedIconsCopy, icons, assets, fingerprint, publicPath, callback) {
  var processNext = function processNext() {
    if (sizes.length > 0) {
      return processImg(sizes, icon, cachedIconsCopy, icons, assets, fingerprint, publicPath, callback); // next size
    } else if (cachedIconsCopy.length > 0) {
      var next = cachedIconsCopy.pop();
      return processImg(next.sizes, next, cachedIconsCopy, icons, assets, fingerprint, publicPath, callback); // next icon
    } else {
      return callback(null, {
        icons: icons,
        assets: assets
      }); // there are no more icons left
    }
  };

  var size = sizes.pop();
  var width;
  var height;

  if (Array.isArray(size) && size.length) {
    // [0, 0] || [0]
    width = size[0];
    height = size.length > 1 ? size[1] : size[0];
  } else if (typeof size === 'number') {
    // 0
    width = size;
    height = size;
  } else if (typeof size === 'string') {
    // '0x0'
    var dimensions = size.split('x');
    width = dimensions[0];
    height = dimensions[1];
  }

  if (width > 0 && height > 0) {
    var mimeType = _mime.default.getType(icon.src);

    if (!supportedMimeTypes.includes(mimeType)) {
      var buffer;

      try {
        buffer = _fs.default.readFileSync(icon.src);
      } catch (err) {
        throw new _IconError.default("It was not possible to read '".concat(icon.src, "'."));
      }

      var processedIcon = processIcon(width, height, icon, buffer, mimeType, publicPath, fingerprint);
      icons.push(processedIcon.manifestIcon);
      assets.push(processedIcon.webpackAsset);
      return processNext();
    }

    _jimp.default.read(icon.src, function (err, img) {
      if (err) throw new _IconError.default("It was not possible to read '".concat(icon.src, "'."));
      img.cover(width, height).getBuffer(mimeType, function (err, buffer) {
        if (err) throw new _IconError.default("It was not possible to retrieve buffer of '".concat(icon.src, "'."));
        var processedIcon = processIcon(width, height, icon, buffer, mimeType, publicPath, fingerprint);
        icons.push(processedIcon.manifestIcon);
        assets.push(processedIcon.webpackAsset);
        return processNext();
      });
    });
  }
}

function retrieveIcons(options) {
  var startupImages = parseArray(options.startupImages);
  var icons = parseArray(options.icon || options.icons);

  if (startupImages.length) {
    var startupImage = startupImages[0];
    icons = icons.concat((0, _Apple.fromStartupImage)(startupImage));
  }

  console.log('To process: ', icons, options.icon || options.icons);
  var response = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = icons[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var icon = _step.value;
      response.push(sanitizeIcon(icon));
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  console.log('Sanitizes: ', icons);
  delete options.startupImages;
  delete options.icon;
  delete options.icons;
  return response;
}

function parseIcons(fingerprint, publicPath, icons, callback) {
  if (icons.length === 0) {
    callback(null, {});
  } else {
    var first = icons.pop();
    processImg(first.sizes, first, icons, [], [], fingerprint, publicPath, callback);
  }
}