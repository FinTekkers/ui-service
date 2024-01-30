import { c as create_ssr_component, v as validate_component, b as each, a as add_attribute, e as escape } from './index3-d286ad7b.js';
import { I as Icon } from './store-5db37d9d.js';
import { f as footerURLText, i as installCodeLang } from './uidata-ac10d113.js';
import './index2-57f07b7d.js';

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/seedrandom/lib/alea.js
var require_alea = __commonJS({
  "node_modules/seedrandom/lib/alea.js"(exports, module) {
    (function(global2, module2, define2) {
      function Alea(seed) {
        var me = this, mash = Mash();
        me.next = function() {
          var t = 2091639 * me.s0 + me.c * 23283064365386963e-26;
          me.s0 = me.s1;
          me.s1 = me.s2;
          return me.s2 = t - (me.c = t | 0);
        };
        me.c = 1;
        me.s0 = mash(" ");
        me.s1 = mash(" ");
        me.s2 = mash(" ");
        me.s0 -= mash(seed);
        if (me.s0 < 0) {
          me.s0 += 1;
        }
        me.s1 -= mash(seed);
        if (me.s1 < 0) {
          me.s1 += 1;
        }
        me.s2 -= mash(seed);
        if (me.s2 < 0) {
          me.s2 += 1;
        }
        mash = null;
      }
      function copy(f, t) {
        t.c = f.c;
        t.s0 = f.s0;
        t.s1 = f.s1;
        t.s2 = f.s2;
        return t;
      }
      function impl(seed, opts) {
        var xg = new Alea(seed), state = opts && opts.state, prng = xg.next;
        prng.int32 = function() {
          return xg.next() * 4294967296 | 0;
        };
        prng.double = function() {
          return prng() + (prng() * 2097152 | 0) * 11102230246251565e-32;
        };
        prng.quick = prng;
        if (state) {
          if (typeof state == "object")
            copy(state, xg);
          prng.state = function() {
            return copy(xg, {});
          };
        }
        return prng;
      }
      function Mash() {
        var n = 4022871197;
        var mash = function(data) {
          data = String(data);
          for (var i = 0; i < data.length; i++) {
            n += data.charCodeAt(i);
            var h = 0.02519603282416938 * n;
            n = h >>> 0;
            h -= n;
            h *= n;
            n = h >>> 0;
            h -= n;
            n += h * 4294967296;
          }
          return (n >>> 0) * 23283064365386963e-26;
        };
        return mash;
      }
      if (module2 && module2.exports) {
        module2.exports = impl;
      } else if (define2 && define2.amd) {
        define2(function() {
          return impl;
        });
      } else {
        this.alea = impl;
      }
    })(
      exports,
      typeof module == "object" && module,
      typeof define == "function" && define
    );
  }
});

// node_modules/seedrandom/lib/xor128.js
var require_xor128 = __commonJS({
  "node_modules/seedrandom/lib/xor128.js"(exports, module) {
    (function(global2, module2, define2) {
      function XorGen(seed) {
        var me = this, strseed = "";
        me.x = 0;
        me.y = 0;
        me.z = 0;
        me.w = 0;
        me.next = function() {
          var t = me.x ^ me.x << 11;
          me.x = me.y;
          me.y = me.z;
          me.z = me.w;
          return me.w ^= me.w >>> 19 ^ t ^ t >>> 8;
        };
        if (seed === (seed | 0)) {
          me.x = seed;
        } else {
          strseed += seed;
        }
        for (var k = 0; k < strseed.length + 64; k++) {
          me.x ^= strseed.charCodeAt(k) | 0;
          me.next();
        }
      }
      function copy(f, t) {
        t.x = f.x;
        t.y = f.y;
        t.z = f.z;
        t.w = f.w;
        return t;
      }
      function impl(seed, opts) {
        var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
          return (xg.next() >>> 0) / 4294967296;
        };
        prng.double = function() {
          do {
            var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
          } while (result === 0);
          return result;
        };
        prng.int32 = xg.next;
        prng.quick = prng;
        if (state) {
          if (typeof state == "object")
            copy(state, xg);
          prng.state = function() {
            return copy(xg, {});
          };
        }
        return prng;
      }
      if (module2 && module2.exports) {
        module2.exports = impl;
      } else if (define2 && define2.amd) {
        define2(function() {
          return impl;
        });
      } else {
        this.xor128 = impl;
      }
    })(
      exports,
      typeof module == "object" && module,
      typeof define == "function" && define
    );
  }
});

// node_modules/seedrandom/lib/xorwow.js
var require_xorwow = __commonJS({
  "node_modules/seedrandom/lib/xorwow.js"(exports, module) {
    (function(global2, module2, define2) {
      function XorGen(seed) {
        var me = this, strseed = "";
        me.next = function() {
          var t = me.x ^ me.x >>> 2;
          me.x = me.y;
          me.y = me.z;
          me.z = me.w;
          me.w = me.v;
          return (me.d = me.d + 362437 | 0) + (me.v = me.v ^ me.v << 4 ^ (t ^ t << 1)) | 0;
        };
        me.x = 0;
        me.y = 0;
        me.z = 0;
        me.w = 0;
        me.v = 0;
        if (seed === (seed | 0)) {
          me.x = seed;
        } else {
          strseed += seed;
        }
        for (var k = 0; k < strseed.length + 64; k++) {
          me.x ^= strseed.charCodeAt(k) | 0;
          if (k == strseed.length) {
            me.d = me.x << 10 ^ me.x >>> 4;
          }
          me.next();
        }
      }
      function copy(f, t) {
        t.x = f.x;
        t.y = f.y;
        t.z = f.z;
        t.w = f.w;
        t.v = f.v;
        t.d = f.d;
        return t;
      }
      function impl(seed, opts) {
        var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
          return (xg.next() >>> 0) / 4294967296;
        };
        prng.double = function() {
          do {
            var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
          } while (result === 0);
          return result;
        };
        prng.int32 = xg.next;
        prng.quick = prng;
        if (state) {
          if (typeof state == "object")
            copy(state, xg);
          prng.state = function() {
            return copy(xg, {});
          };
        }
        return prng;
      }
      if (module2 && module2.exports) {
        module2.exports = impl;
      } else if (define2 && define2.amd) {
        define2(function() {
          return impl;
        });
      } else {
        this.xorwow = impl;
      }
    })(
      exports,
      typeof module == "object" && module,
      typeof define == "function" && define
    );
  }
});

// node_modules/seedrandom/lib/xorshift7.js
var require_xorshift7 = __commonJS({
  "node_modules/seedrandom/lib/xorshift7.js"(exports, module) {
    (function(global2, module2, define2) {
      function XorGen(seed) {
        var me = this;
        me.next = function() {
          var X = me.x, i = me.i, t, v;
          t = X[i];
          t ^= t >>> 7;
          v = t ^ t << 24;
          t = X[i + 1 & 7];
          v ^= t ^ t >>> 10;
          t = X[i + 3 & 7];
          v ^= t ^ t >>> 3;
          t = X[i + 4 & 7];
          v ^= t ^ t << 7;
          t = X[i + 7 & 7];
          t = t ^ t << 13;
          v ^= t ^ t << 9;
          X[i] = v;
          me.i = i + 1 & 7;
          return v;
        };
        function init(me2, seed2) {
          var j, X = [];
          if (seed2 === (seed2 | 0)) {
            X[0] = seed2;
          } else {
            seed2 = "" + seed2;
            for (j = 0; j < seed2.length; ++j) {
              X[j & 7] = X[j & 7] << 15 ^ seed2.charCodeAt(j) + X[j + 1 & 7] << 13;
            }
          }
          while (X.length < 8)
            X.push(0);
          for (j = 0; j < 8 && X[j] === 0; ++j)
            ;
          if (j == 8)
            X[7] = -1;
          else
            X[j];
          me2.x = X;
          me2.i = 0;
          for (j = 256; j > 0; --j) {
            me2.next();
          }
        }
        init(me, seed);
      }
      function copy(f, t) {
        t.x = f.x.slice();
        t.i = f.i;
        return t;
      }
      function impl(seed, opts) {
        if (seed == null)
          seed = +new Date();
        var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
          return (xg.next() >>> 0) / 4294967296;
        };
        prng.double = function() {
          do {
            var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
          } while (result === 0);
          return result;
        };
        prng.int32 = xg.next;
        prng.quick = prng;
        if (state) {
          if (state.x)
            copy(state, xg);
          prng.state = function() {
            return copy(xg, {});
          };
        }
        return prng;
      }
      if (module2 && module2.exports) {
        module2.exports = impl;
      } else if (define2 && define2.amd) {
        define2(function() {
          return impl;
        });
      } else {
        this.xorshift7 = impl;
      }
    })(
      exports,
      typeof module == "object" && module,
      typeof define == "function" && define
    );
  }
});

// node_modules/seedrandom/lib/xor4096.js
var require_xor4096 = __commonJS({
  "node_modules/seedrandom/lib/xor4096.js"(exports, module) {
    (function(global2, module2, define2) {
      function XorGen(seed) {
        var me = this;
        me.next = function() {
          var w = me.w, X = me.X, i = me.i, t, v;
          me.w = w = w + 1640531527 | 0;
          v = X[i + 34 & 127];
          t = X[i = i + 1 & 127];
          v ^= v << 13;
          t ^= t << 17;
          v ^= v >>> 15;
          t ^= t >>> 12;
          v = X[i] = v ^ t;
          me.i = i;
          return v + (w ^ w >>> 16) | 0;
        };
        function init(me2, seed2) {
          var t, v, i, j, w, X = [], limit = 128;
          if (seed2 === (seed2 | 0)) {
            v = seed2;
            seed2 = null;
          } else {
            seed2 = seed2 + "\0";
            v = 0;
            limit = Math.max(limit, seed2.length);
          }
          for (i = 0, j = -32; j < limit; ++j) {
            if (seed2)
              v ^= seed2.charCodeAt((j + 32) % seed2.length);
            if (j === 0)
              w = v;
            v ^= v << 10;
            v ^= v >>> 15;
            v ^= v << 4;
            v ^= v >>> 13;
            if (j >= 0) {
              w = w + 1640531527 | 0;
              t = X[j & 127] ^= v + w;
              i = 0 == t ? i + 1 : 0;
            }
          }
          if (i >= 128) {
            X[(seed2 && seed2.length || 0) & 127] = -1;
          }
          i = 127;
          for (j = 4 * 128; j > 0; --j) {
            v = X[i + 34 & 127];
            t = X[i = i + 1 & 127];
            v ^= v << 13;
            t ^= t << 17;
            v ^= v >>> 15;
            t ^= t >>> 12;
            X[i] = v ^ t;
          }
          me2.w = w;
          me2.X = X;
          me2.i = i;
        }
        init(me, seed);
      }
      function copy(f, t) {
        t.i = f.i;
        t.w = f.w;
        t.X = f.X.slice();
        return t;
      }
      function impl(seed, opts) {
        if (seed == null)
          seed = +new Date();
        var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
          return (xg.next() >>> 0) / 4294967296;
        };
        prng.double = function() {
          do {
            var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
          } while (result === 0);
          return result;
        };
        prng.int32 = xg.next;
        prng.quick = prng;
        if (state) {
          if (state.X)
            copy(state, xg);
          prng.state = function() {
            return copy(xg, {});
          };
        }
        return prng;
      }
      if (module2 && module2.exports) {
        module2.exports = impl;
      } else if (define2 && define2.amd) {
        define2(function() {
          return impl;
        });
      } else {
        this.xor4096 = impl;
      }
    })(
      exports,
      typeof module == "object" && module,
      typeof define == "function" && define
    );
  }
});

// node_modules/seedrandom/lib/tychei.js
var require_tychei = __commonJS({
  "node_modules/seedrandom/lib/tychei.js"(exports, module) {
    (function(global2, module2, define2) {
      function XorGen(seed) {
        var me = this, strseed = "";
        me.next = function() {
          var b = me.b, c = me.c, d = me.d, a = me.a;
          b = b << 25 ^ b >>> 7 ^ c;
          c = c - d | 0;
          d = d << 24 ^ d >>> 8 ^ a;
          a = a - b | 0;
          me.b = b = b << 20 ^ b >>> 12 ^ c;
          me.c = c = c - d | 0;
          me.d = d << 16 ^ c >>> 16 ^ a;
          return me.a = a - b | 0;
        };
        me.a = 0;
        me.b = 0;
        me.c = 2654435769 | 0;
        me.d = 1367130551;
        if (seed === Math.floor(seed)) {
          me.a = seed / 4294967296 | 0;
          me.b = seed | 0;
        } else {
          strseed += seed;
        }
        for (var k = 0; k < strseed.length + 20; k++) {
          me.b ^= strseed.charCodeAt(k) | 0;
          me.next();
        }
      }
      function copy(f, t) {
        t.a = f.a;
        t.b = f.b;
        t.c = f.c;
        t.d = f.d;
        return t;
      }
      function impl(seed, opts) {
        var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
          return (xg.next() >>> 0) / 4294967296;
        };
        prng.double = function() {
          do {
            var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
          } while (result === 0);
          return result;
        };
        prng.int32 = xg.next;
        prng.quick = prng;
        if (state) {
          if (typeof state == "object")
            copy(state, xg);
          prng.state = function() {
            return copy(xg, {});
          };
        }
        return prng;
      }
      if (module2 && module2.exports) {
        module2.exports = impl;
      } else if (define2 && define2.amd) {
        define2(function() {
          return impl;
        });
      } else {
        this.tychei = impl;
      }
    })(
      exports,
      typeof module == "object" && module,
      typeof define == "function" && define
    );
  }
});

// (disabled):crypto
var require_crypto = __commonJS({
  "(disabled):crypto"() {
  }
});

// node_modules/seedrandom/seedrandom.js
var require_seedrandom = __commonJS({
  "node_modules/seedrandom/seedrandom.js"(exports, module) {
    (function(global2, pool, math) {
      var width = 256, chunks = 6, digits = 52, rngname = "random", startdenom = math.pow(width, chunks), significance = math.pow(2, digits), overflow = significance * 2, mask = width - 1, nodecrypto;
      function seedrandom2(seed, options, callback) {
        var key = [];
        options = options == true ? { entropy: true } : options || {};
        var shortseed = mixkey(flatten(
          options.entropy ? [seed, tostring(pool)] : seed == null ? autoseed() : seed,
          3
        ), key);
        var arc4 = new ARC4(key);
        var prng = function() {
          var n = arc4.g(chunks), d = startdenom, x = 0;
          while (n < significance) {
            n = (n + x) * width;
            d *= width;
            x = arc4.g(1);
          }
          while (n >= overflow) {
            n /= 2;
            d /= 2;
            x >>>= 1;
          }
          return (n + x) / d;
        };
        prng.int32 = function() {
          return arc4.g(4) | 0;
        };
        prng.quick = function() {
          return arc4.g(4) / 4294967296;
        };
        prng.double = prng;
        mixkey(tostring(arc4.S), pool);
        return (options.pass || callback || function(prng2, seed2, is_math_call, state) {
          if (state) {
            if (state.S) {
              copy(state, arc4);
            }
            prng2.state = function() {
              return copy(arc4, {});
            };
          }
          if (is_math_call) {
            math[rngname] = prng2;
            return seed2;
          } else
            return prng2;
        })(
          prng,
          shortseed,
          "global" in options ? options.global : this == math,
          options.state
        );
      }
      function ARC4(key) {
        var t, keylen = key.length, me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];
        if (!keylen) {
          key = [keylen++];
        }
        while (i < width) {
          s[i] = i++;
        }
        for (i = 0; i < width; i++) {
          s[i] = s[j = mask & j + key[i % keylen] + (t = s[i])];
          s[j] = t;
        }
        (me.g = function(count) {
          var t2, r = 0, i2 = me.i, j2 = me.j, s2 = me.S;
          while (count--) {
            t2 = s2[i2 = mask & i2 + 1];
            r = r * width + s2[mask & (s2[i2] = s2[j2 = mask & j2 + t2]) + (s2[j2] = t2)];
          }
          me.i = i2;
          me.j = j2;
          return r;
        })(width);
      }
      function copy(f, t) {
        t.i = f.i;
        t.j = f.j;
        t.S = f.S.slice();
        return t;
      }
      function flatten(obj, depth) {
        var result = [], typ = typeof obj, prop;
        if (depth && typ == "object") {
          for (prop in obj) {
            try {
              result.push(flatten(obj[prop], depth - 1));
            } catch (e) {
            }
          }
        }
        return result.length ? result : typ == "string" ? obj : obj + "\0";
      }
      function mixkey(seed, key) {
        var stringseed = seed + "", smear, j = 0;
        while (j < stringseed.length) {
          key[mask & j] = mask & (smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++);
        }
        return tostring(key);
      }
      function autoseed() {
        try {
          var out;
          if (nodecrypto && (out = nodecrypto.randomBytes)) {
            out = out(width);
          } else {
            out = new Uint8Array(width);
            (global2.crypto || global2.msCrypto).getRandomValues(out);
          }
          return tostring(out);
        } catch (e) {
          var browser = global2.navigator, plugins = browser && browser.plugins;
          return [+new Date(), global2, plugins, global2.screen, tostring(pool)];
        }
      }
      function tostring(a) {
        return String.fromCharCode.apply(0, a);
      }
      mixkey(math.random(), pool);
      if (typeof module == "object" && module.exports) {
        module.exports = seedrandom2;
        try {
          nodecrypto = require_crypto();
        } catch (ex) {
        }
      } else if (typeof define == "function" && define.amd) {
        define(function() {
          return seedrandom2;
        });
      } else {
        math["seed" + rngname] = seedrandom2;
      }
    })(
      typeof self !== "undefined" ? self : exports,
      [],
      Math
    );
  }
});

// node_modules/seedrandom/index.js
var require_seedrandom2 = __commonJS({
  "node_modules/seedrandom/index.js"(exports, module) {
    var alea = require_alea();
    var xor128 = require_xor128();
    var xorwow = require_xorwow();
    var xorshift7 = require_xorshift7();
    var xor4096 = require_xor4096();
    var tychei = require_tychei();
    var sr = require_seedrandom();
    sr.alea = alea;
    sr.xor128 = xor128;
    sr.xorwow = xorwow;
    sr.xorshift7 = xorshift7;
    sr.xor4096 = xor4096;
    sr.tychei = tychei;
    module.exports = sr;
  }
});

// src/internal/styling/classesGeneration.ts
__toESM(require_seedrandom2(), 1);
Promise.resolve();

const css$6 = {
  code: '.svelte-c501ul.svelte-c501ul::before,.svelte-c501ul.svelte-c501ul::after,.svelte-c501ul.svelte-c501ul{padding:0;margin:0;box-sizing:border-box}.navigation_bar .navigation_links .svelte-c501ul:is(ul) li.svelte-c501ul{padding:0.6em 1em;position:relative;cursor:pointer;display:flex;flex-direction:row;justify-content:center;align-items:center;gap:1em}.navigation_bar .navigation_links .svelte-c501ul:is(ul) li.svelte-c501ul:not(:first-child)::before{content:"";width:0;height:2px;background-color:#1b6f85;position:absolute;bottom:-1%;border-radius:6px;left:0%;transform:translateX(-50%);transition:width 0.5s ease-in-out, left 0.5s ease-in-out}.navigation_bar .navigation_links .svelte-c501ul:is(ul) li.svelte-c501ul:hover::before{width:95%;left:50%}.navigation_bar .navigation_links .svelte-c501ul:is(ul) li a.svelte-c501ul{display:flex;flex-direction:row;justify-content:center;align-items:center;gap:0.5em}.navigation_bar .navigation_links .svelte-c501ul:is(ul) li.svelte-c501ul:first-child{border-radius:50px;background-color:#7cd2ba;transition:all 0.5s ease-in-out;color:#0c3a46;font-weight:bold}.navigation_bar .navigation_links .svelte-c501ul:is(ul) li.svelte-c501ul:first-child:hover{background-color:#1b6f85;color:whitesmoke}.navigation_bar .navigation_links .svelte-c501ul:is(ul) li.svelte-c501ul:last-child{display:flex;flex-direction:center;justify-content:center;align-items:row;gap:0.4em;margin-left:1em}.Footer.svelte-c501ul.svelte-c501ul{width:100%;height:60vh;padding:1em;background-color:#0c3a46;display:grid;justify-content:center;align-items:center;justify-items:center;align-content:center}.Footer.svelte-c501ul .footer_container.svelte-c501ul{display:grid;grid-template-columns:repeat(6, 1fr);grid-template-rows:repeat(5, 10vh);height:50vh;padding:1em;justify-content:center;align-items:center;justify-items:center;align-content:center}.Footer.svelte-c501ul .footer_container .footer_logo.svelte-c501ul{grid-area:3/1/3/2}.Footer.svelte-c501ul .footer_container .footer_logo h2.svelte-c501ul{display:flex;flex-direction:row;justify-content:flex-start;align-items:flex-start;gap:0.2em;font-size:1.5rem}.Footer.svelte-c501ul .footer_container .footer_social_links.svelte-c501ul{display:flex;flex-direction:column;justify-content:space-between;align-items:flex-start;gap:1em;grid-area:3/6/4/-1}.Footer.svelte-c501ul .footer_container .footer_social_links .icon.svelte-c501ul{cursor:pointer;position:relative}.Footer.svelte-c501ul .footer_container .footer_social_links .icon.svelte-c501ul::before{position:absolute;left:2vw;opacity:0;content:attr(data-custom);transition:all 0.5s ease}.Footer.svelte-c501ul .footer_container .footer_social_links .icon.svelte-c501ul:hover::before{left:2.5vw;opacity:1}.Footer.svelte-c501ul .footer_links.svelte-c501ul{width:100%;grid-area:1/2/6/6;display:grid;grid-template-columns:1fr 1fr}.Footer.svelte-c501ul .footer_links div.svelte-c501ul:nth-child(1){grid-column:1/1}.Footer.svelte-c501ul .footer_links div.svelte-c501ul:nth-child(2){grid-column:2/-1}.Footer.svelte-c501ul .footer_links div.svelte-c501ul:nth-child(n){width:100%;height:100%;text-align:center}.Footer.svelte-c501ul .footer_links div:nth-child(n) h1.svelte-c501ul{margin-bottom:1em}.Footer.svelte-c501ul .footer_links div:nth-child(n) .svelte-c501ul:is(ul){line-height:2em}@media screen and (max-width: 1200px){.Footer.svelte-c501ul.svelte-c501ul{grid-template-columns:1fr}.Footer.svelte-c501ul .footer_container.svelte-c501ul{grid-template-columns:1fr;grid-template-rows:repeat(4, 1fr);gap:1em}.Footer.svelte-c501ul .footer_container .footer_logo.svelte-c501ul{grid-area:1/1/1/2}.Footer.svelte-c501ul .footer_container .footer_social_links.svelte-c501ul{grid-area:4/1/4/-1;width:50vw;margin:0 auto;display:flex;flex-direction:row;justify-content:space-between;align-items:flex-start;gap:1em}.Footer.svelte-c501ul .footer_container .footer_social_links .icon.svelte-c501ul::before{display:none}.Footer.svelte-c501ul .footer_container .footer_links.svelte-c501ul{grid-area:2/1/2/-1}}@media screen and (max-width: 600px){.Footer.svelte-c501ul.svelte-c501ul{position:relative;padding:2em;height:60vh}.Footer.svelte-c501ul .footer_container.svelte-c501ul{width:100%}.Footer.svelte-c501ul .footer_container .footer_logo.svelte-c501ul{position:absolute;top:0;left:50%;transform:translateX(-50%);width:100%;margin-top:2em;display:flex;flex-direction:row;justify-content:space-between;align-items:flex-start;gap:2em}.Footer.svelte-c501ul .footer_container .footer_logo h2.svelte-c501ul{margin:0 auto;font-size:1.5rem}.Footer.svelte-c501ul .footer_container .footer_social_links.svelte-c501ul{display:flex;flex-direction:row;justify-content:center;align-items:center;gap:2em;left:0%;bottom:10%;width:100%}.Footer.svelte-c501ul .footer_container .footer_social_links .icon.svelte-c501ul::before{display:none}.Footer.svelte-c501ul .footer_links div.svelte-c501ul:nth-child(n){width:100%;height:100%;text-align:center}.Footer.svelte-c501ul .footer_links div:nth-child(n) h1.svelte-c501ul{margin-bottom:1em}.Footer.svelte-c501ul .footer_links div:nth-child(n) .svelte-c501ul:is(ul){line-height:2em}}',
  map: null
};
const FooterSection = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$6);
  return `<div class="Footer svelte-c501ul"><div class="footer_container svelte-c501ul"><div class="footer_logo svelte-c501ul"><h2 class="svelte-c501ul">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "material-symbols:finance-mode",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )} Fintekkers
      </h2></div>


    <div class="footer_links svelte-c501ul">${each(footerURLText, (footerURL) => {
    return `<div class="svelte-c501ul"><h1 class="svelte-c501ul">${escape(footerURL.title)}</h1>
           <ul class="svelte-c501ul">${each(footerURL.links, (link) => {
      return `<li class="svelte-c501ul"><a${add_attribute("href", link.url, 0)} class="svelte-c501ul">${escape(link.text)}</a></li>`;
    })}</ul>
         </div>`;
  })}</div>

    
    <div class="footer_social_links svelte-c501ul"><div class="icon svelte-c501ul" data-custom="facebook">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "basil:facebook-outline",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}</div>

      <div class="icon svelte-c501ul" data-custom="stackoverflow">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "jam:stackoverflow",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}</div>

      <div class="icon svelte-c501ul" data-custom="github">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "ri:github-fill",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}</div>
      <div class="icon svelte-c501ul" data-custom="twitter">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "pajamas:twitter",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}</div></div></div>
</div>`;
});
const css$5 = {
  code: ".svelte-1qwf6tb.svelte-1qwf6tb::before,.svelte-1qwf6tb.svelte-1qwf6tb::after,.svelte-1qwf6tb.svelte-1qwf6tb{padding:0;margin:0;box-sizing:border-box}.code-block-installation-container.svelte-1qwf6tb.svelte-1qwf6tb{display:grid;grid-template-columns:1fr;width:48vw}.custom_header.svelte-1qwf6tb.svelte-1qwf6tb{display:flex;flex-direction:row;justify-content:center;align-items:center;gap:1em;border-radius:6px;position:relative;z-index:3}.custom_header.svelte-1qwf6tb .custom_header_title.svelte-1qwf6tb{width:100px;padding:0.2em;text-align:center;border-radius:6px;background:whitesmoke;color:black;cursor:pointer;transition:all 0.5s ease-in-out}.custom_header.svelte-1qwf6tb .custom_header_title.svelte-1qwf6tb:hover{background:#1b6f85;color:whitesmoke}.custom_codeblock.svelte-1qwf6tb.svelte-1qwf6tb{width:100%;height:-moz-max-content;height:max-content;background:rgb(24, 24, 24);padding:1em;border-radius:6px;position:relative;margin:1em 0}.custom_codeblock.svelte-1qwf6tb .code_language.svelte-1qwf6tb{position:absolute;font-size:0.8rem;text-transform:uppercase;color:#86929c;top:0.5em}.custom_codeblock.svelte-1qwf6tb .copy_btn.svelte-1qwf6tb{background:rgba(66, 66, 66, 0.527);width:-moz-max-content;width:max-content;padding:0.2em 0.6em;border-radius:15px;position:absolute;font-size:0.9rem;width:5em;right:5px;top:5px;cursor:pointer;transition:all 0.5s ease-in-out;text-align:center}.custom_codeblock.svelte-1qwf6tb .copy_btn.svelte-1qwf6tb:hover{color:#1b6f85;background-color:whitesmoke}.custom_codeblock.svelte-1qwf6tb .code_content.svelte-1qwf6tb{margin-top:2em;height:-moz-max-content;height:max-content;overflow:hidden;white-space:pre-wrap}@media screen and (max-width: 1200px){.code-block-installation-container.svelte-1qwf6tb.svelte-1qwf6tb{width:100%}.custom_codeblock.svelte-1qwf6tb.svelte-1qwf6tb{width:80%;margin:1em auto}.custom_codeblock.svelte-1qwf6tb .code_content.svelte-1qwf6tb{max-width:100%}}@media screen and (max-width: 600px){.custom_codeblock.svelte-1qwf6tb.svelte-1qwf6tb{width:90vw}.custom_codeblock.svelte-1qwf6tb .code_content.svelte-1qwf6tb{max-width:100%}}",
  map: null
};
const CustomCodeBlock = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const { Typescript } = installCodeLang;
  let codeLanguage = Typescript.language;
  let codeCommand = Typescript.installCMD;
  let codeContent = Typescript.importCode;
  const codeBlockData = installCodeLang;
  $$result.css.add(css$5);
  return `<div class="code-block-installation-container svelte-1qwf6tb"><div class="custom_header svelte-1qwf6tb">${each(Object.entries(codeBlockData), ([key, _value]) => {
    return `<div class="custom_header_title svelte-1qwf6tb">${escape(key)}</div>`;
  })}</div>
    <div class="custom_codeblock svelte-1qwf6tb"><div class="copy_btn svelte-1qwf6tb">${escape("Copy")}</div>
    <div class="code_language svelte-1qwf6tb">${escape(codeLanguage)}</div>
    <div class="code_content svelte-1qwf6tb" id="mycode_command">${escape(codeCommand)}</div></div>
    <div class="custom_codeblock svelte-1qwf6tb"><div class="copy_btn svelte-1qwf6tb">${escape("Copy")}</div>
    <div class="code_language svelte-1qwf6tb">${escape(codeLanguage)}</div>
    <div class="code_content svelte-1qwf6tb" id="mycode_content">${escape(codeContent)}</div></div>

</div>`;
});
const css$4 = {
  code: '.svelte-1r0mecf.svelte-1r0mecf::before,.svelte-1r0mecf.svelte-1r0mecf::after,.svelte-1r0mecf.svelte-1r0mecf{padding:0;margin:0;box-sizing:border-box}.get-started-container.svelte-1r0mecf .get-started-text .get-started-text-intro button.svelte-1r0mecf{padding:0.5rem 1rem;border-radius:5px;background-color:#258ea8}.get-started-container.svelte-1r0mecf.svelte-1r0mecf{width:100%;background-color:#0c3a46;border-radius:6px;display:grid;grid-template-columns:repeat(auto-fit, minmax(50vw, 1fr))}.get-started-container.svelte-1r0mecf .get-started-image.svelte-1r0mecf{grid-column:1/-1;width:95%;height:25vh;border-radius:6px;background:url("https://www.hp.com/us-en/shop/app/assets/images/uploads/prod/what%20is%20an%20api167511875313774.jpg") center center/cover no-repeat}.get-started-container.svelte-1r0mecf .get-started-text.svelte-1r0mecf{gap:1em;padding:1em;display:grid;grid-template-columns:repeat(4, 1fr);justify-items:center;border-right:solid 1px #164e63}.get-started-container.svelte-1r0mecf .get-started-text .get-started-text-intro.svelte-1r0mecf{display:grid;grid-template-columns:repeat(auto-fill, minmax(100px, 1fr));justify-items:center;grid-column:1/-1;padding:1em;gap:1em}.get-started-container.svelte-1r0mecf .get-started-text .get-started-text-intro .get-started-text-title.svelte-1r0mecf{display:flex;flex-direction:row;justify-content:flex-start;align-items:center;gap:0.5em;font-size:1.5rem;grid-area:1/1/1/-1}.get-started-container.svelte-1r0mecf .get-started-text .get-started-text-intro .get-started-text-paragraph.svelte-1r0mecf{line-height:2em;grid-area:2/2/2/5;text-align:center}.get-started-container.svelte-1r0mecf .get-started-text .get-started-text-intro button.svelte-1r0mecf{transition:all 0.5s ease;font-weight:bold;font-size:1rem;height:8vh;background-color:#7cd2ba;color:#05192a;grid-area:3/3/3/3;border-radius:30px;width:20vh}.get-started-container.svelte-1r0mecf .get-started-text .get-started-text-intro button.svelte-1r0mecf:hover{background-color:#1b6f85;color:whitesmoke}.get-started-container.svelte-1r0mecf .get-started-text .key-advantage-features.svelte-1r0mecf{display:grid;grid-template-columns:repeat(auto-fit, minmax(5vw, 1fr));justify-content:center;gap:1em;grid-auto-flow:dense;grid-column:1/-1;padding:1em;width:100%}.get-started-container.svelte-1r0mecf .get-started-text .key-advantage-features .key-advantage-feature.svelte-1r0mecf{border-radius:6px;padding:1em;aspect-ratio:1/1;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:1em;border:solid 1px #1b6f85;text-align:center}.get-started-container.svelte-1r0mecf .get-started-code.svelte-1r0mecf{gap:2em}.get-started-container.svelte-1r0mecf .get-started-code .codeblock.svelte-1r0mecf{padding:2em 1em 1em 1em;display:grid;grid-template-columns:repeat(5, 1fr);justify-content:center;align-items:center}.get-started-container.svelte-1r0mecf .get-started-code .codeblock .svelte-1r0mecf:is(p){grid-column:1/-1;display:flex;flex-direction:row;justify-content:center;align-items:center;gap:1em;margin-bottom:1em}.get-started-container.svelte-1r0mecf .get-started-code .get-started-code-text .svelte-1r0mecf:is(p){text-align:left}.get-started-container.svelte-1r0mecf .code-block-installation.svelte-1r0mecf{padding:2em}@media screen and (max-width: 1200px){.get-started-container.svelte-1r0mecf.svelte-1r0mecf{grid-template-columns:1fr}.get-started-container.svelte-1r0mecf .get-started-text .get-started-text-intro.svelte-1r0mecf{display:grid;justify-items:center}.get-started-container.svelte-1r0mecf .get-started-text .get-started-text-intro .get-started-text-paragraph.svelte-1r0mecf{grid-area:2/1/2/-1;width:50vw;text-align:center}.get-started-container.svelte-1r0mecf .get-started-text .get-started-text-intro button.svelte-1r0mecf{grid-area:3/1/3/-1}.get-started-container.svelte-1r0mecf .get-started-text .key-advantage-features.svelte-1r0mecf{grid-template-columns:repeat(auto-fit, 15vw)}.get-started-container.svelte-1r0mecf .get-started-image.svelte-1r0mecf{display:none}.get-started-container.svelte-1r0mecf .get-started-code .codeblock .code-block-installation.svelte-1r0mecf{grid-column:1/-1;border:solid 1px #86929c;backdrop-filter:blur(13px) saturate(180%);-webkit-backdrop-filter:blur(13px) saturate(180%);background-color:rgba(11, 46, 54, 0.4941176471);border-radius:12px;padding:1em 0;margin:1em 0 0 0}}@media screen and (max-width: 600px){.get-started-container.svelte-1r0mecf.svelte-1r0mecf{padding-bottom:2em}.get-started-container.svelte-1r0mecf .get-started-text .get-started-text-intro .get-started-text-title.svelte-1r0mecf,.get-started-container.svelte-1r0mecf .get-started-text .get-started-text-intro .get-started-text-paragraph.svelte-1r0mecf{width:90vw;display:flex;flex-direction:row;justify-content:center;align-items:center;gap:1em}.get-started-container.svelte-1r0mecf .get-started-text .key-advantage-features.svelte-1r0mecf{grid-template-columns:repeat(3, 1fr);border-bottom:solid 1px rgba(255, 255, 255, 0.229);padding-bottom:3em}.get-started-container.svelte-1r0mecf .get-started-text .svelte-1r0mecf:is(p){width:70%}.get-started-container.svelte-1r0mecf .get-started-code .codeblock .svelte-1r0mecf:is(p){width:90vw}}',
  map: null
};
const GetStartedSection = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$4);
  return `<div class="get-started-container svelte-1r0mecf"><div class="get-started-text svelte-1r0mecf"><div class="get-started-text-intro svelte-1r0mecf"><p class="get-started-text-title svelte-1r0mecf">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "healthicons:entry-outline",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}  <strong class="svelte-1r0mecf">Get started instantly! </strong></p> <br class="svelte-1r0mecf"> 
           <p class="get-started-text-paragraph svelte-1r0mecf">Fintekkers platform provides
            you all the APIs you need to build your own fintech product, or
            solve your business opportunities at miminum cost.

           </p> 

          <button class="get-started-cta-button svelte-1r0mecf">Get Started</button></div>

        <div class="get-started-image svelte-1r0mecf"></div>
  

       <div class="key-advantage-features svelte-1r0mecf"><div class="key-advantage-feature svelte-1r0mecf">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "formkit:group",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )} 
            Consolidate all your trading tools 
        </div>
        <div class="key-advantage-feature svelte-1r0mecf">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "carbon:time",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )} 
            Access robust real-time data
        </div>
        <div class="key-advantage-feature svelte-1r0mecf">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "icons8:support",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )} 
            Lean on free dedicated US-based support
        </div></div></div>
    <div class="get-started-code svelte-1r0mecf"><div class="codeblock  svelte-1r0mecf"><p class="svelte-1r0mecf">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "line-md:cog-loop",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )} 
                            Install Fintekkers client libraries

                            <span class="svelte-1r0mecf">/
                            </span>

                            ${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "material-symbols:electric-bolt-outline",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}  Make your first API call
                        </p>

        
                        <div class="code-block-installation svelte-1r0mecf">${validate_component(CustomCodeBlock, "CustomCodeBlock").$$render($$result, {}, {}, {})}</div></div></div> 
</div>`;
});
const computerImage = "/_app/immutable/assets/stock.b1e3dfd3.png";
const css$3 = {
  code: '.svelte-132ns87.svelte-132ns87::before,.svelte-132ns87.svelte-132ns87::after,.svelte-132ns87.svelte-132ns87{padding:0;margin:0;box-sizing:border-box}.landing-page-container.svelte-132ns87 .landing-content.svelte-132ns87{border:solid 1px #86929c;backdrop-filter:blur(13px) saturate(180%);-webkit-backdrop-filter:blur(13px) saturate(180%);background-color:rgba(11, 46, 54, 0.4941176471);border-radius:12px;border:1px solid rgba(90, 150, 163, 0.4941176471)}.button.svelte-132ns87.svelte-132ns87{padding:0.5rem 1rem;border-radius:5px;background-color:#258ea8}.landing-page-container.svelte-132ns87.svelte-132ns87{width:100%;height:100vh;background:url("https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D") center center/cover no-repeat;position:relative;display:grid;grid-template-columns:repeat(2, 1fr);grid-template-rows:repeat(6, 20%);border-radius:6px}.landing-page-container.svelte-132ns87 .landing-content.svelte-132ns87{width:100vw;height:100vh;display:grid;grid-template-columns:repeat(auto-fill, minmax(50px, 1fr));grid-template-rows:repeat(8, 100px);gap:1em;padding:1em}.landing-page-container.svelte-132ns87 .landing-content .landing-headline.svelte-132ns87{font-size:3rem;text-align:left;line-height:1.2em;grid-area:3/2/4/12}.landing-page-container.svelte-132ns87 .landing-content .landing-description.svelte-132ns87{font-size:1em;grid-area:4/2/5/8;margin-top:1em}.landing-page-container.svelte-132ns87 .landing-content .landing-cta-buttons.svelte-132ns87{grid-area:5/2/5/7}.landing-page-container.svelte-132ns87 .landing-content .landing-cta-buttons button.svelte-132ns87{min-width:100px;min-height:50px;font-weight:bold;border-radius:30px}.landing-page-container.svelte-132ns87 .landing-content .landing-cta-buttons button.svelte-132ns87:nth-child(1){background-color:#7cd2ba;color:#05192a;margin-right:1em}.landing-page-container.svelte-132ns87 .landing-content .landing-cta-buttons button.svelte-132ns87:nth-child(2){background-color:#1b6f85;order:2}.landing-page-container.svelte-132ns87 .landing-content .landing-cta-buttons .explore-product-button.svelte-132ns87{transition:all 0.5s ease-in-out}.landing-page-container.svelte-132ns87 .landing-content .landing-cta-buttons .explore-product-button.svelte-132ns87:hover{background-color:#7cd2ba;color:#05192a}.landing-page-container.svelte-132ns87 .landing-content .landing-cta-buttons .try-now-button.svelte-132ns87{transition:all 0.5s ease-in-out}.landing-page-container.svelte-132ns87 .landing-content .landing-cta-buttons .try-now-button.svelte-132ns87:hover{background-color:#1b6f85;color:whitesmoke}.landing-page-container.svelte-132ns87 .landing-content .landing-image.svelte-132ns87{width:100%;height:100%;transform:rotateY(180deg);grid-area:1/10/-1/-1;display:grid;grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));grid-template-rows:repeat(6, 100px)}.landing-page-container.svelte-132ns87 .landing-content .landing-image img.svelte-132ns87{display:block;grid-area:1/1/4/6}.landing-page-container.svelte-132ns87 .landing-content .landing-image .first-icon.svelte-132ns87{grid-area:5/4/5/4}.landing-page-container.svelte-132ns87 .landing-content .landing-image .second-icon.svelte-132ns87{grid-area:2/1/2/1}.landing-page-container.svelte-132ns87 .landing-content .landing-image .third-icon.svelte-132ns87{grid-area:7/2/7/2}@media screen and (max-width: 1200px){.svelte-132ns87.svelte-132ns87::before,.svelte-132ns87.svelte-132ns87::after,.svelte-132ns87.svelte-132ns87{padding:0;margin:0;box-sizing:border-box}.landing-page-container.svelte-132ns87 .landing-content.svelte-132ns87{border:solid 1px #86929c;backdrop-filter:blur(13px) saturate(180%);-webkit-backdrop-filter:blur(13px) saturate(180%);background-color:rgba(11, 46, 54, 0.4941176471);border-radius:12px;border:1px solid rgba(90, 150, 163, 0.4941176471)}.button.svelte-132ns87.svelte-132ns87{padding:0.5rem 1rem;border-radius:5px;background-color:#258ea8}.landing-page-container.svelte-132ns87 .landing-content .landing-headline.svelte-132ns87{font-size:2.5rem;line-height:1em;text-align:center;grid-area:3/1/3/-1}.landing-page-container.svelte-132ns87 .landing-content .landing-description.svelte-132ns87{grid-area:4/1/4/-1;text-align:center;margin:0 auto}.landing-page-container.svelte-132ns87 .landing-content .landing-cta-buttons.svelte-132ns87{grid-area:5/1/5/-1;text-align:center}.landing-page-container.svelte-132ns87 .landing-content .landing-image.svelte-132ns87{display:none}.landing-page-container.svelte-132ns87 .landing-content .landing-image .landing-image-icon.svelte-132ns87{display:none}}@media screen and (max-width: 600px){.svelte-132ns87.svelte-132ns87::before,.svelte-132ns87.svelte-132ns87::after,.svelte-132ns87.svelte-132ns87{padding:0;margin:0;box-sizing:border-box}.landing-page-container.svelte-132ns87 .landing-content.svelte-132ns87{border:solid 1px #86929c;backdrop-filter:blur(13px) saturate(180%);-webkit-backdrop-filter:blur(13px) saturate(180%);background-color:rgba(11, 46, 54, 0.4941176471);border-radius:12px;border:1px solid rgba(90, 150, 163, 0.4941176471)}.button.svelte-132ns87.svelte-132ns87{padding:0.5rem 1rem;border-radius:5px;background-color:#258ea8}.landing-page-container.svelte-132ns87 .landing-content.svelte-132ns87{padding:0;grid-template-columns:1fr;display:grid}.landing-page-container.svelte-132ns87 .landing-content .landing-headline.svelte-132ns87{font-size:2.5rem;width:100%;line-height:1.2em;text-align:center;grid-area:3/1/3/-1}.landing-page-container.svelte-132ns87 .landing-content .landing-description.svelte-132ns87{text-align:center;width:90%;grid-area:4/1/5/-1;margin-top:3em}.landing-page-container.svelte-132ns87 .landing-content .landing-cta-buttons.svelte-132ns87{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:0em;grid-area:6/1/6/-1}.landing-page-container.svelte-132ns87 .landing-content .landing-cta-buttons button.svelte-132ns87{width:50%}.landing-page-container.svelte-132ns87 .landing-content .landing-cta-buttons button.svelte-132ns87:nth-child(1){order:2;margin-bottom:1em;margin-right:0}}',
  map: null
};
const LandingSection = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$3);
  return `<div class="landing-page-container svelte-132ns87"><div class="landing-content svelte-132ns87"><h1 class="landing-headline svelte-132ns87">Fintekkers is a Premier Fintech Infrastructure
        </h1>
        <p class="landing-description svelte-132ns87">We worry about scale, security and
            plumbing while you focus on your competitive advantage, your ideas.
        </p>
        <div class="landing-cta-buttons svelte-132ns87"><button class="button try-now-button svelte-132ns87">Try Now</button>
            <button class="button explore-product-button svelte-132ns87" disabled>Explore Product</button></div>
        <div class="landing-image svelte-132ns87"><img${add_attribute("src", computerImage, 0)} alt="computer-vector" class="svelte-132ns87">

        <div class="landing-image-icon first-icon svelte-132ns87">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "solar:graph-up-outline",
      style: "width: 150px; height: 150px;color:#258ea8;opacity:50%",
      class: "icon"
    },
    {},
    {}
  )}</div>
        <div class="landing-image-icon second-icon svelte-132ns87">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "cil:graph",
      style: "width: 150px; height: 150px; color:#258ea8; opacity:50%",
      class: "icon"
    },
    {},
    {}
  )}</div>
        <div class="landing-image-icon third-icon svelte-132ns87">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "pepicons-print:coins",
      style: "width: 120px; height: 120px; color:#258ea8; opacity:50%",
      class: "icon"
    },
    {},
    {}
  )}</div></div></div>

</div>`;
});
const css$2 = {
  code: ".svelte-1b3w482.svelte-1b3w482::before,.svelte-1b3w482.svelte-1b3w482::after,.svelte-1b3w482.svelte-1b3w482{padding:0;margin:0;box-sizing:border-box}.navigation_bar .navigation_links .svelte-1b3w482:is(ul) li a.svelte-1b3w482{display:flex;flex-direction:row;justify-content:center;align-items:center;gap:0.5em}.Our-features-container.svelte-1b3w482.svelte-1b3w482{padding:2em 1em;background-color:#1b6f85;display:grid;grid-template-columns:repeat(3, 1fr);grid-template-rows:1fr;justify-items:center;align-items:center}.Our-features-container.svelte-1b3w482 .our-feature.svelte-1b3w482{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:1.5em;height:30vh;line-height:1.5em;border:solid 1px rgba(255, 255, 255, 0.322) !important;position:relative}.Our-features-container.svelte-1b3w482 .our-feature .feature-headline.svelte-1b3w482{display:flex;flex-direction:row;justify-content:center;align-items:center;gap:0.5em;position:absolute;top:7%}.Our-features-container.svelte-1b3w482 .our-feature.svelte-1b3w482:nth-child(n){width:25vw;border:solid 1px rgba(255, 255, 255, 0.102);border-radius:6px;padding:1em}.Our-features-container.svelte-1b3w482 .our-feature:nth-child(n) p.svelte-1b3w482{text-align:center;padding-top:2em}@media screen and (max-width: 1200px){.Our-features-container.svelte-1b3w482.svelte-1b3w482{grid-template-columns:1fr;gap:1em}.Our-features-container.svelte-1b3w482 .our-feature.svelte-1b3w482{display:grid;justify-items:center;align-items:center}.Our-features-container.svelte-1b3w482 .our-feature.svelte-1b3w482:nth-child(n){grid-column:1/-1;width:60%}}@media screen and (max-width: 600px){.Our-features-container.svelte-1b3w482.svelte-1b3w482{height:-moz-max-content;height:max-content;display:grid;grid-template-columns:1fr;grid-template-rows:1fr 1fr 1fr}.Our-features-container.svelte-1b3w482 .our-feature.svelte-1b3w482{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:1.5em}.Our-features-container.svelte-1b3w482 .our-feature.svelte-1b3w482:nth-child(n){min-width:25vw;max-width:100%;width:100%}.Our-features-container.svelte-1b3w482 .our-feature:nth-child(n) p.svelte-1b3w482{font-size:1rem}}",
  map: null
};
const OurFeatureSection = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$2);
  return `<div class="Our-features-container svelte-1b3w482"><div class="our-feature our-feature_1 svelte-1b3w482"><div class="feature-headline svelte-1b3w482">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "icon-park-outline:speed",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}
            <h2 class="svelte-1b3w482">Fast</h2></div>
        <p class="svelte-1b3w482">Use binary data streams to turbo charge your products. &#39;Documents&#39;
            like XML &amp; JSON are decades old, and don&#39;t scale to your needs.
            Scale fast, scale globally.
        </p></div>
    <div class="our-feature our-feature_2 svelte-1b3w482"><div class="feature-headline svelte-1b3w482">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "game-icons:flexible-lamp",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}
            <h2 class="svelte-1b3w482">Convenient</h2></div>
        <p class="svelte-1b3w482">Our platform is built on top of open-source models (<a href="https://github.com/FinTekkers/ledger-models" class="svelte-1b3w482">see the code</a>). Out of the box models, and implementations in multiple languages
            (Javascript, Python, Java, Rust) let you start building your
            application, not read through reams of API docs
        </p></div>
    <div class="our-feature our-feature_3 svelte-1b3w482"><div class="feature-headline svelte-1b3w482">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "octicon:goal-24",
      style: "width: 25px; height: 25px;"
    },
    {},
    {}
  )}
            <h2 class="svelte-1b3w482">Flexible</h2></div>

        <p class="svelte-1b3w482">Leverage the services you want, no more no less. Get started today
            without even needing an API key, and use our publicly available
            data. Later, you can register for an API key once you want access to
            more features (security, scale, etc)
        </p></div>
</div>`;
});
const css$1 = {
  code: ".svelte-10knjt4.svelte-10knjt4::before,.svelte-10knjt4.svelte-10knjt4::after,.svelte-10knjt4.svelte-10knjt4{padding:0;margin:0;box-sizing:border-box}.video_section.svelte-10knjt4.svelte-10knjt4{height:100vh;background:whitesmoke;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:2em;text-align:center}.video_section.svelte-10knjt4 .video_description.svelte-10knjt4{display:flex;flex-direction:column;justify-content:center;align-items:center;gap:1em}.video_section.svelte-10knjt4 .video_description p.svelte-10knjt4{width:40vw;color:#0c3a46;font-size:2rem;margin-bottom:1em;font-weight:bold;line-height:1.2em}.video_section.svelte-10knjt4 .video_container.svelte-10knjt4{position:relative;left:0.8%}@media screen and (max-width: 1200px){.video_section.svelte-10knjt4 .video_container.svelte-10knjt4{position:relative;width:70%;padding-bottom:40%;overflow:hidden}.video_section.svelte-10knjt4 .video_container iframe.svelte-10knjt4{position:absolute;top:0;left:0;width:100%;height:100%}}@media screen and (max-width: 600px){.video_section.svelte-10knjt4 .video_container.svelte-10knjt4{position:relative;width:100%;padding-bottom:56.25%;overflow:hidden;left:-1%}.video_section.svelte-10knjt4 .video_container iframe.svelte-10knjt4{position:absolute;top:0;left:0;width:100%;height:100%}}",
  map: null
};
const VideoSection = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css$1);
  return `<div class="video_section svelte-10knjt4"><div class="video_description svelte-10knjt4">${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      icon: "ph:video-duotone",
      style: "width: 120px; height: 120px; color:#258ea8; opacity:50%",
      class: "icon"
    },
    {},
    {}
  )}
        <p class="svelte-10knjt4">Learn more about our Platform</p></div>

    <div class="video_container svelte-10knjt4"><iframe id="videoFrame"${add_attribute("width", 670, 0)}${add_attribute("height", 380, 0)} src="https://www.youtube.com/embed/gjBxFPf0DTs?si=4HlILChW7lLOrpZp" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" class="svelte-10knjt4"></iframe></div>
</div>`;
});
const css = {
  code: ".svelte-18gf40f::before,.svelte-18gf40f::after,.svelte-18gf40f{padding:0;margin:0;box-sizing:border-box}.landing_page_overlay.svelte-18gf40f{height:100vh;width:100vw;background-color:#0c3a46}",
  map: null
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  $$result.css.add(css);
  return `<div class="landing_page_overlay svelte-18gf40f">${validate_component(LandingSection, "LandingOverview").$$render($$result, {}, {}, {})}
 ${validate_component(GetStartedSection, "LandingSection").$$render($$result, {}, {}, {})}
 ${validate_component(OurFeatureSection, "AboutSection").$$render($$result, {}, {}, {})}
 ${validate_component(VideoSection, "VideoSection").$$render($$result, {}, {}, {})}
 ${validate_component(FooterSection, "Footer").$$render($$result, {}, {}, {})}
</div>`;
});

export { Page as default };
//# sourceMappingURL=_page.svelte-d05735c8.js.map
