const modules = new Map();
const define = (name, moduleFactory) => {
  modules.set(name, moduleFactory);
};

const moduleCache = new Map();
const requireModule = (name) => {
  if (moduleCache.has(name)) {
    return moduleCache.get(name).exports;
  }

  if (!modules.has(name)) {
    throw new Error(`Module '${name}' does not exist.`);
  }

  const moduleFactory = modules.get(name);
  const module = {
    exports: {},
  };
  moduleCache.set(name, module);
  moduleFactory(module, module.exports, requireModule);
  return module.exports;
};

define(5, function(module, exports, require) {
"use strict";

module.exports = "tomato";});
define(4, function(module, exports, require) {
"use strict";

module.exports = 'melon';});
define(3, function(module, exports, require) {
"use strict";

module.exports = 'kiwi ' + require(4) + ' ' + require(5);});
define(2, function(module, exports, require) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = exports.default = "banana " + require(3);});
define(1, function(module, exports, require) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _banana = _interopRequireDefault(require(2));
var _kiwi = _interopRequireDefault(require(3));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
var _default = exports.default = "apple " + _banana.default + " " + _kiwi.default;});
define(0, function(module, exports, require) {
"use strict";

var _apple = _interopRequireDefault(require(1));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
console.log(_apple.default);});
requireModule(0);