"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isValid = isValid;
exports.isLandscape = isLandscape;
exports.isPortrait = isPortrait;
// https://developer.mozilla.org/en-US/docs/Web/Manifest#orientation
var VALID_ORIENTATIONS = ['any', 'natural', 'landscape', 'landscape-primary', 'landscape-secondary', 'portrait', 'portrait-primary', 'portrait-secondary', 'omit'];
var PORTRAIT_ORIENTATIONS = ['any', 'natural', 'portrait', 'portrait-primary', 'portrait-secondary', 'omit'];
var LANDSCAPE_ORIENTATIONS = ['any', 'natural', 'landscape', 'landscape-primary', 'landscape-secondary', 'omit'];

function isValid(orientation) {
  return VALID_ORIENTATIONS.includes(orientation);
}

function isLandscape(orientation) {
  return LANDSCAPE_ORIENTATIONS.includes(orientation);
}

function isPortrait(orientation) {
  return PORTRAIT_ORIENTATIONS.includes(orientation);
}