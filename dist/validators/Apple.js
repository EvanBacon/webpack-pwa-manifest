"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fromStartupImage = fromStartupImage;

var _Orientation = require("./Orientation");

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var Devices = [{
  names: ['iPhone SE'],
  width: 640,
  height: 1136,
  scale: 2
}, {
  names: ['iPhone Xs Max'],
  width: 1242,
  height: 2688,
  scale: 3
}, {
  names: ['iPhone Xr'],
  width: 828,
  height: 1792,
  scale: 2
}, {
  names: ['iPhone X', 'iPhone Xs'],
  width: 1125,
  height: 2436,
  scale: 3
}, {
  names: ['iPhone 8 Plus', 'iPhone 7 Plus', 'iPhone 6s Plus', 'iPhone 6 Plus'],
  width: 1242,
  height: 2208,
  scale: 3
}, {
  names: ['iPhone 8', 'iPhone 7', 'iPhone 6s', 'iPhone 6'],
  width: 750,
  height: 1334,
  scale: 2
}, {
  names: ['iPad Pro 12.9"'],
  width: 2048,
  height: 2732,
  scale: 2,
  isTablet: true
}, {
  names: ['iPad Pro 11"'],
  width: 1668,
  height: 2388,
  scale: 2,
  isTablet: true
}, {
  names: ['iPad Pro 10.5"'],
  width: 1668,
  height: 2224,
  scale: 2,
  isTablet: true
}, {
  names: ['iPad Mini', 'iPad Air'],
  width: 1536,
  height: 2048,
  scale: 2,
  isTablet: true
}];
var Tablets = Devices.filter(function (_ref) {
  var isTablet = _ref.isTablet;
  return isTablet;
});

function assembleOrientationMedia(width, height, scale, orientation) {
  // const orientation = width > height ? 'landscape' : 'portrait';
  return "(device-width: ".concat(Math.floor(width / scale), "px) and (device-height: ").concat(Math.floor(height / scale), "px) and (-webkit-device-pixel-ratio: ").concat(scale, ") and (orientation: ").concat(orientation, ")");
} // src: splashImageSource,
// supportsTablet: ios.supportsTablet,
// orientation,
// function startupSizeFromKey(inputString) {
//   const [aa, bb] = inputString.split('x');
//   const isLandscape = aa > bb;
//   const portraitKey = isLandscape ? `${bb}x${aa}` : `${aa}x${bb}`;
//   const scale = STARTUP_SIZES[portraitKey];
//   if (!scale) {
//     throw new Error(
//       inputString +
//         ' is not a valid startup screen size! Expected one of: ' +
//         Object.keys(STARTUP_SIZES).join(', ')
//     );
//   }
//   return assembleOrientationMedia(width, height, scale);
// }


function assembleOrientationMedia(width, height, scale, orientation) {
  // const orientation = width > height ? 'landscape' : 'portrait';
  var params = {
    'device-width': Math.floor(width / scale) + 'px',
    // 'max-device-width': width + 'px',
    'device-height': Math.floor(height / scale) + 'px',
    // 'max-device-height': height + 'px',
    '-webkit-device-pixel-ratio': scale,
    orientation: orientation
  };
  var query = ['screen'].concat(_toConsumableArray(Object.keys(params).map(function (key) {
    return "(".concat(key, ": ").concat(params[key], ")");
  })));
  return query.join(' and ');
}

function getDevices(_ref2) {
  var _ref2$orientation = _ref2.orientation,
      orientation = _ref2$orientation === void 0 ? 'natural' : _ref2$orientation,
      _ref2$supportsTablet = _ref2.supportsTablet,
      supportsTablet = _ref2$supportsTablet === void 0 ? true : _ref2$supportsTablet;

  if (!(0, _Orientation.isValid)(orientation)) {
    throw new Error("".concat(orientation, " is not a valid orientation"));
  }

  var orientations = [];

  if ((0, _Orientation.isLandscape)(orientation)) {
    orientations.push('landscape');
  }

  if ((0, _Orientation.isPortrait)(orientation)) {
    orientations.push('portrait');
  }

  var devices = [];

  if (supportsTablet) {
    devices = Devices;
  } else {
    devices = Devices.filter(function (_ref3) {
      var isTablet = _ref3.isTablet;
      return !isTablet;
    });
  }

  return devices.map(function (device) {
    return _objectSpread({}, device, {
      orientations: orientations
    });
  });
}

function fromStartupImage(_ref4) {
  var orientation = _ref4.orientation,
      supportsTablet = _ref4.supportsTablet,
      src = _ref4.src,
      destination = _ref4.destination,
      color = _ref4.color;
  var devices = getDevices({
    orientation: orientation,
    supportsTablet: supportsTablet
  });
  var startupImages = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = devices[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var device = _step.value;
      var width = device.width,
          height = device.height;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = device.orientations[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var _orientation = _step2.value;
          var size = _orientation === 'portrait' ? [width, height] : [height, width];
          startupImages.push({
            ios: 'startup',
            src: src,
            sizes: [size],
            scale: device.scale,
            media: assembleOrientationMedia(device.width, device.height, device.scale, _orientation),
            destination: destination,
            color: color
          });
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
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

  return startupImages; // return devices.map(device => {
  //   return {
  //     ios: 'startup',
  //     src,
  //     sizes: [[device.width, device.height]],
  //     scale: device.scale,
  //     media: assembleOrientationMedia(device.width, device.height, device.scale),
  //     destination,
  //     color,
  //   };
  // });
}