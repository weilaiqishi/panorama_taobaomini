import { $ as $document, V as Vector3, M as MOUSE, T as TOUCH, Q as Quaternion, S as Spherical, a as Vector2, b as $window, E as EventDispatcher, s as sRGBEncoding, c as Scene, d as SphereGeometry, e as SpriteMaterial, f as MeshBasicMaterial, D as DoubleSide, g as Mesh, R as Raycaster, h as Sprite, P as PLATFORM, W as WebGL1Renderer, i as PerspectiveCamera, C as Clock, j as TextureLoader } from '../../chunks/three-platformize.js';

class Blob {
  constructor(parts, options) {
    this.parts = parts;
    this.options = options;

    // 目前仅适配如下
    // var blob = new Blob([bufferView], { type: source.mimeType });
    // sourceURI = URL.createObjectURL(blob);

    // var base64 = ArrayBufferToBase64(bufferView);
    // var url = `data:${options.type};base64,${base64}`;
  }
}

/*
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */

var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Use a lookup table to find the index.
var lookup = new Uint8Array(256);
for (var i = 0; i < chars.length; i++) {
  lookup[chars.charCodeAt(i)] = i;
}

// 有点慢
// export function encode(arraybuffer) {
//   var bytes = new Uint8Array(arraybuffer),
//     i,
//     len = bytes.length,
//     base64 = '';

//   for (i = 0; i < len; i += 3) {
//     base64 += chars[bytes[i] >> 2];
//     base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
//     base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
//     base64 += chars[bytes[i + 2] & 63];
//   }

//   if (len % 3 === 2) {
//     base64 = base64.substring(0, base64.length - 1) + '=';
//   } else if (len % 3 === 1) {
//     base64 = base64.substring(0, base64.length - 2) + '==';
//   }

//   return base64;
// }

// 快一点
function encode(arrayBuffer) {
  var base64 = '';

  var bytes = new Uint8Array(arrayBuffer);
  var byteLength = bytes.byteLength;
  var byteRemainder = byteLength % 3;
  var mainLength = byteLength - byteRemainder;

  var a, b, c, d;
  var chunk;

  // Main loop deals with bytes in chunks of 3
  for (var i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
    d = chunk & 63; // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += chars[a] + chars[b] + chars[c] + chars[d];
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength];

    a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3) << 4; // 3   = 2^2 - 1

    base64 += chars[a] + chars[b] + '==';
  } else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

    a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15) << 2; // 15    = 2^4 - 1

    base64 += chars[a] + chars[b] + chars[c] + '=';
  }

  return base64;
}

function decode(base64) {
  var bufferLength = base64.length * 0.75,
    len = base64.length,
    i,
    p = 0,
    encoded1,
    encoded2,
    encoded3,
    encoded4;

  if (base64[base64.length - 1] === '=') {
    bufferLength--;
    if (base64[base64.length - 2] === '=') {
      bufferLength--;
    }
  }

  var arraybuffer = new ArrayBuffer(bufferLength),
    bytes = new Uint8Array(arraybuffer);

  for (i = 0; i < len; i += 4) {
    encoded1 = lookup[base64.charCodeAt(i)];
    encoded2 = lookup[base64.charCodeAt(i + 1)];
    encoded3 = lookup[base64.charCodeAt(i + 2)];
    encoded4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return arraybuffer;
}

class $URL {
  createObjectURL(obj) {
    if (obj instanceof Blob) {
      // TODO: use wasm to improve decode performance
      // 经测试主要耗时在于字符串拼接，使用assemblyscript的字符串拼接比js拼接慢非常多

      // const t = Date.now();
      const base64 = encode(obj.parts[0]);
      const url = `data:${obj.options.type};base64,${base64}`;
      // console.log('createObjectURL', Date.now() - t);
      return url;
    }

    return '';
  }

  revokeObjectURL() {}
}

/**
 * Implementation of atob() according to the HTML and Infra specs, except that
 * instead of throwing INVALID_CHARACTER_ERR we return null.
 */
function atob(data) {
  // Web IDL requires DOMStrings to just be converted using ECMAScript
  // ToString, which in our case amounts to using a template literal.
  data = `${data}`;
  // "Remove all ASCII whitespace from data."
  data = data.replace(/[ \t\n\f\r]/g, '');
  // "If data's length divides by 4 leaving no remainder, then: if data ends
  // with one or two U+003D (=) code points, then remove them from data."
  if (data.length % 4 === 0) {
    data = data.replace(/==?$/, '');
  }
  // "If data's length divides by 4 leaving a remainder of 1, then return
  // failure."
  //
  // "If data contains a code point that is not one of
  //
  // U+002B (+)
  // U+002F (/)
  // ASCII alphanumeric
  //
  // then return failure."
  if (data.length % 4 === 1 || /[^+/0-9A-Za-z]/.test(data)) {
    return null;
  }
  // "Let output be an empty byte sequence."
  let output = '';
  // "Let buffer be an empty buffer that can have bits appended to it."
  //
  // We append bits via left-shift and or.  accumulatedBits is used to track
  // when we've gotten to 24 bits.
  let buffer = 0;
  let accumulatedBits = 0;
  // "Let position be a position variable for data, initially pointing at the
  // start of data."
  //
  // "While position does not point past the end of data:"
  for (let i = 0; i < data.length; i++) {
    // "Find the code point pointed to by position in the second column of
    // Table 1: The Base 64 Alphabet of RFC 4648. Let n be the number given in
    // the first cell of the same row.
    //
    // "Append to buffer the six bits corresponding to n, most significant bit
    // first."
    //
    // atobLookup() implements the table from RFC 4648.
    buffer <<= 6;
    buffer |= atobLookup(data[i]);
    accumulatedBits += 6;
    // "If buffer has accumulated 24 bits, interpret them as three 8-bit
    // big-endian numbers. Append three bytes with values equal to those
    // numbers to output, in the same order, and then empty buffer."
    if (accumulatedBits === 24) {
      output += String.fromCharCode((buffer & 0xff0000) >> 16);
      output += String.fromCharCode((buffer & 0xff00) >> 8);
      output += String.fromCharCode(buffer & 0xff);
      buffer = accumulatedBits = 0;
    }
    // "Advance position by 1."
  }
  // "If buffer is not empty, it contains either 12 or 18 bits. If it contains
  // 12 bits, then discard the last four and interpret the remaining eight as
  // an 8-bit big-endian number. If it contains 18 bits, then discard the last
  // two and interpret the remaining 16 as two 8-bit big-endian numbers. Append
  // the one or two bytes with values equal to those one or two numbers to
  // output, in the same order."
  if (accumulatedBits === 12) {
    buffer >>= 4;
    output += String.fromCharCode(buffer);
  } else if (accumulatedBits === 18) {
    buffer >>= 2;
    output += String.fromCharCode((buffer & 0xff00) >> 8);
    output += String.fromCharCode(buffer & 0xff);
  }
  // "Return output."
  return output;
}
/**
 * A lookup table for atob(), which converts an ASCII character to the
 * corresponding six-bit number.
 */

const keystr =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function atobLookup(chr) {
  const index = keystr.indexOf(chr);
  // Throw exception if character is not in the lookup string; should not be hit in tests
  return index < 0 ? undefined : index;
}

const _events = new WeakMap();

class Touch {
  constructor(touch) {
    // CanvasTouch{identifier, x, y}
    // Touch{identifier, pageX, pageY, clientX, clientY, force}
    this.identifier = touch.identifier;

    this.force = touch.force === undefined ? 1 : touch.force;
    this.pageX = touch.pageX === undefined ? touch.x : touch.pageX;
    this.pageY = touch.pageY === undefined ? touch.y : touch.pageY;
    this.clientX = touch.clientX === undefined ? touch.x : touch.clientX;
    this.clientY = touch.clientY === undefined ? touch.y : touch.clientY;

    this.screenX = this.pageX;
    this.screenY = this.pageY;
  }
}

class EventTarget {
  constructor() {
    _events.set(this, {});
  }

  addEventListener(type, listener, options = {}) {
    let events = _events.get(this);

    if (!events) {
      events = {};
      _events.set(this, events);
    }
    if (!events[type]) {
      events[type] = [];
    }
    events[type].push(listener);

    if (options.capture) ;
    if (options.once) ;
    if (options.passive) ;
  }

  removeEventListener(type, listener) {
    const events = _events.get(this);

    if (events) {
      const listeners = events[type];

      if (listeners && listeners.length > 0) {
        for (let i = listeners.length; i--; i > 0) {
          if (listeners[i] === listener) {
            listeners.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  dispatchEvent(event = {}) {
    if (typeof event.preventDefault !== 'function') {
      event.preventDefault = () => {};
    }
    if (typeof event.stopPropagation !== 'function') {
      event.stopPropagation = () => {};
    }

    const events = _events.get(this);

    if (events) {
      const listeners = events[event.type];

      if (listeners) {
        for (let i = 0; i < listeners.length; i++) {
          listeners[i](event);
        }
      }
    }
  }
}

const _requestHeader = new WeakMap();
const _responseHeader = new WeakMap();
const _requestTask = new WeakMap();

function _triggerEvent(type, event = {}) {
  event.target = event.target || this;

  if (typeof this[`on${type}`] === 'function') {
    this[`on${type}`].call(this, event);
  }
}

function _changeReadyState(readyState, event = {}) {
  this.readyState = readyState;

  event.readyState = readyState;

  _triggerEvent.call(this, 'readystatechange', event);
}

function _isRelativePath(url) {
  return !/^(http|https|ftp|myfile):\/\/.*/i.test(url);
}

class $XMLHttpRequest extends EventTarget {
  constructor() {
    super();

    /*
     * TODO 这一批事件应该是在 XMLHttpRequestEventTarget.prototype 上面的
     */
    this.onabort = null;
    this.onerror = null;
    this.onload = null;
    this.onloadstart = null;
    this.onprogress = null;
    this.ontimeout = null;
    this.onloadend = null;

    this.onreadystatechange = null;
    this.readyState = 0;
    this.response = null;
    this.responseText = null;
    this.responseType = 'text';
    this.dataType = 'arraybuffer';
    this.responseXML = null;
    this.status = 0;
    this.statusText = '';
    this.upload = {};
    this.withCredentials = false;

    _requestHeader.set(this, {
      'content-type': 'application/x-www-form-urlencoded',
    });
    _responseHeader.set(this, {});
  }

  abort() {
    const myRequestTask = _requestTask.get(this);

    if (myRequestTask) {
      myRequestTask.abort();
    }
  }

  getAllResponseHeaders() {
    const responseHeader = _responseHeader.get(this);

    return Object.keys(responseHeader)
      .map(header => {
        return `${header}: ${responseHeader[header]}`;
      })
      .join('\n');
  }

  getResponseHeader(header) {
    return _responseHeader.get(this)[header];
  }

  open(method, url) {
    this._method = method;
    this._url = url;
    _changeReadyState.call(this, $XMLHttpRequest.OPENED);
  }

  overrideMimeType() {}

  send(data = '') {
    if (this.readyState !== $XMLHttpRequest.OPENED) {
      throw new Error(
        "Failed to execute 'send' on 'XMLHttpRequest': The object's state must be OPENED.",
      );
    } else {
      const url = this._url;
      _requestHeader.get(this);
      const responseType = this.responseType;
      this.dataType;

      const relative = _isRelativePath(url);

      delete this.response;
      this.response = null;

      const onSuccess = ({ data, statusCode, header }) => {
        if (responseType === 'arraybuffer') {
          data = decode(data);
        }

        statusCode = statusCode === undefined ? 200 : statusCode;
        if (typeof data !== 'string' && !(data instanceof ArrayBuffer)) {
          try {
            data = JSON.stringify(data);
          } catch (e) {}
        }

        this.status = statusCode;
        if (header) {
          _responseHeader.set(this, header);
        }
        _triggerEvent.call(this, 'loadstart');
        _changeReadyState.call(this, $XMLHttpRequest.HEADERS_RECEIVED);
        _changeReadyState.call(this, $XMLHttpRequest.LOADING);

        this.response = data;

        if (data instanceof ArrayBuffer) {
          Object.defineProperty(this, 'responseText', {
            enumerable: true,
            configurable: true,
            get: function () {
              throw 'InvalidStateError : responseType is ' + this.responseType;
            },
          });
        } else {
          this.responseText = data;
        }
        _changeReadyState.call(this, $XMLHttpRequest.DONE);
        _triggerEvent.call(this, 'load');
        _triggerEvent.call(this, 'loadend');
      };

      const onFail = ({ errorMessage }) => {
        // TODO 规范错误

        if (errorMessage.indexOf('abort') !== -1) {
          _triggerEvent.call(this, 'abort');
        } else {
          _triggerEvent.call(this, 'error', {
            message: errorMessage,
          });
        }
        _triggerEvent.call(this, 'loadend');

        if (relative) {
          // 用户即使没监听error事件, 也给出相应的警告
          console.warn(errorMessage);
        }
      };

      if (relative) {
        const fs = my.getFileSystemManager();

        var options = {
          filePath: url,
          success: onSuccess,
          fail: onFail,
        };
        // if (encoding) {
        // options["encoding"] = encoding;
        // }
        fs.access({
          path: url,
          success: res => {
            console.log('文件存在', res);
          },
          fail: err => {
            console.log('err:', err);
          },
        });
        fs.readFile(options);
        return;
      }

      my.downloadFile({
        url,
        data,
        success: ({ apFilePath }) => {
          const fs = my.getFileSystemManager();
          fs.readFile({
            filePath: apFilePath,
            encoding: responseType === 'arraybuffer' ? 'base64' : 'utf8',
            // encoding: 'arraybuffer', // 不写encoding默认ArrayBuffer
            success: onSuccess,
          });
        },
        fail: onFail,
      });

      // my.request({
      //   data,
      //   url: url,
      //   method: this._method,
      //   header: header,
      //   dataType: dataType,
      //   responseType: responseType,
      //   success: onSuccess,
      //   fail: onFail,
      // });
    }
  }

  setRequestHeader(header, value) {
    const myHeader = _requestHeader.get(this);

    myHeader[header] = value;
    _requestHeader.set(this, myHeader);
  }

  addEventListener(type, listener) {
    if (typeof listener !== 'function') {
      return;
    }

    this['on' + type] = (event = {}) => {
      event.target = event.target || this;
      listener.call(this, event);
    };
  }

  removeEventListener(type, listener) {
    if (this['on' + type] === listener) {
      this['on' + type] = null;
    }
  }
}

// TODO 没法模拟 HEADERS_RECEIVED 和 LOADING 两个状态
$XMLHttpRequest.UNSEND = 0;
$XMLHttpRequest.OPENED = 1;
$XMLHttpRequest.HEADERS_RECEIVED = 2;
$XMLHttpRequest.LOADING = 3;
$XMLHttpRequest.DONE = 4;

function copyProperties(target, source) {
  for (let key of Object.getOwnPropertyNames(source)) {
    if (key !== 'constructor' && key !== 'prototype' && key !== 'name') {
      let desc = Object.getOwnPropertyDescriptor(source, key);
      Object.defineProperty(target, key, desc);
    }
  }
}

/**
 * Module dependencies.
 */

/**
 * Expose `parse`.
 */

/**
 * Parse the given string of `xml`.
 *
 * @param {String} xml
 * @return {Object}
 * @api public
 */

function parse(xml) {
  xml = xml.trim();

  // strip comments
  xml = xml.replace(/<!--[\s\S]*?-->/g, '');

  return document();

  /**
   * XML document.
   */

  function document() {
    return {
      declaration: declaration(),
      root: tag(),
    };
  }

  /**
   * Declaration.
   */

  function declaration() {
    const m = match(/^<\?xml\s*/);
    if (!m) return;

    // tag
    const node = {
      attributes: {},
    };

    // attributes
    while (!(eos() || is('?>'))) {
      const attr = attribute();
      if (!attr) return node;
      node.attributes[attr.name] = attr.value;
    }

    match(/\?>\s*/);

    // remove DOCTYPE
    // <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" 
    //      "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
    match(/<!DOCTYPE[^>]*>\s/);

    return node;
  }

  /**
   * Tag.
   */

  function tag() {
    const m = match(/^<([\w-:.]+)\s*/);
    if (!m) return;

    // name
    const node = {
      name: m[1],
      attributes: {},
      children: [],
    };

    // attributes
    while (!(eos() || is('>') || is('?>') || is('/>'))) {
      const attr = attribute();
      if (!attr) return node;
      node.attributes[attr.name] = attr.value;
    }

    // self closing tag
    if (match(/^\s*\/>\s*/)) {
      return node;
    }

    match(/\??>\s*/);

    // @ts-ignore content
    node.content = content();

    // children
    let child;
    while ((child = tag())) {
      node.children.push(child);
    }

    // closing
    match(/^<\/[\w-:.]+>\s*/);

    return node;
  }

  /**
   * Text content.
   */

  function content() {
    const m = match(/^([^<]*)/);
    if (m) return m[1];
    return '';
  }

  /**
   * Attribute.
   */

  function attribute() {
    const m = match(/([\w:-]+)\s*=\s*("[^"]*"|'[^']*'|\w+)\s*/);
    if (!m) return;
    return { name: m[1], value: strip(m[2]) };
  }

  /**
   * Strip quotes from `val`.
   */

  function strip(val) {
    return val.replace(/^['"]|['"]$/g, '');
  }

  /**
   * Match `re` and advance the string.
   */

  function match(re) {
    const m = xml.match(re);
    if (!m) return;
    xml = xml.slice(m[0].length);
    return m;
  }

  /**
   * End-of-source.
   */

  function eos() {
    return xml.length == 0;
  }

  /**
   * Check for `prefix`.
   */

  function is(prefix) {
    return xml.indexOf(prefix) == 0;
  }
}

function walkTree(node, processer) {
  processer(node);
  node.children.forEach(i => walkTree(i, processer));
}

class $DOMParser {
  parseFromString(str) {
    const xml = parse(str);

    const nodeBase = {
      hasAttribute(key) {
        return this.attributes[key] !== undefined;
      },
      getAttribute(key) {
        return this.attributes[key];
      },
      getElementsByTagName(tag) {
        // 看了dae的文件结构，xml的节点不算庞大，所以还能接受
        const result = [];
        this.childNodes.forEach(i =>
          walkTree(i, node => tag === node.name && result.push(node)),
        );
        return result;
      },
    };

    // patch xml
    walkTree(xml.root, node => {
      node.nodeType = 1;
      node.nodeName = node.name;
      node.style = new Proxy(
        (node.attributes.style || '').split(';').reduce((acc, curr) => {
          if (curr) {
            let [key, value] = curr.split(':');
            acc[key.trim()] = value.trim();
          }
          return acc;
        }, {}),
        {
          get(target, key) {
            return target[key] || '';
          },
        },
      );
      node.textContent = node.content;
      node.childNodes = node.children;
      node.__proto__ = nodeBase;
    });

    const out = {
      documentElement: xml.root,
      childNodes: [xml.root],
    };

    out.__proto__ = nodeBase;

    return out;
  }
}

class $TextDecoder {
  /**
   * 不支持 UTF-8 code points 大于 1 字节
   * @see https://stackoverflow.com/questions/17191945/conversion-between-utf-8-arraybuffer-and-string
   * @param {Uint8Array} uint8Array
   */
  decode(uint8Array) {
    // from LoaderUtils.js
    let s = '';

    // Implicitly assumes little-endian.
    for (let i = 0, il = uint8Array.length; i < il; i++)
      s += String.fromCharCode(uint8Array[i]);

    try {
      // merges multi-byte utf-8 characters.
      return decodeURIComponent(escape(s));
    } catch (e) {
      // see #16358
      return s;
    }
    // return String.fromCharCode.apply(null, uint8Array);
  }
}

function OffscreenCanvas() {
  return my.createOffscreenCanvas();
}

const radianToDegree = 180 / Math.PI;

class TaobaoPlatform {
  constructor(canvas, width, height) {
    const systemInfo = my.getSystemInfoSync();

    this.canvas = canvas;
    this.canvasW = width === undefined ? canvas.width : width;
    this.canvasH = height === undefined ? canvas.height : height;

    this.document = {
      createElementNS(_, type) {
        if (type === 'canvas') return canvas;
        if (type === 'img') {
          const img = canvas.createImage();
          img.addEventListener = (name, cb) => (img[`on${name}`] = cb.bind(img));
          img.removeEventListener = (name, cb) => (img[`on${name}`] = null);
          return img;
        }
      },
    };

    this.window = {
      innerWidth: systemInfo.windowWidth,
      innerHeight: systemInfo.windowHeight,
      devicePixelRatio: systemInfo.pixelRatio,

      DOMParser: $DOMParser,
      TextDecoder: $TextDecoder,
      URL: new $URL(),
      AudioContext: function () {},
      requestAnimationFrame: cb => this.canvas.requestAnimationFrame(cb),
      cancelAnimationFrame: cb => this.canvas.cancelAnimationFrame(cb),

      DeviceOrientationEvent: {
        requestPermission() {
          return Promise.resolve('granted');
        },
      },
    };

    [this.document, this.window, this.canvas].forEach(i => {
      const old = i.__proto__;
      i.__proto__ = {};
      i.__proto__.__proto__ = old;
      copyProperties(i.__proto__, EventTarget.prototype);
    });

    this.patchCanvas();

    this.onDeviceMotionChange = e => {
      this.window.dispatchEvent({
        type: 'deviceorientation',
        alpha: e.alpha * radianToDegree,
        beta: -e.beta * radianToDegree,
        gamma: e.gamma * radianToDegree,
      });
    };

    // this.canvas.ownerDocument = this.document;
  }

  patchCanvas() {
    Object.defineProperty(this.canvas, 'style', {
      get() {
        return {
          width: this.width + 'px',
          height: this.height + 'px',
        };
      },
    });

    Object.defineProperty(this.canvas, 'clientHeight', {
      get() {
        return this.canvasH || this.height;
      },
    });

    Object.defineProperty(this.canvas, 'clientWidth', {
      get() {
        return this.canvasW || this.width;
      },
    });
  }

  setWebGLExtensions() {
    return {
      EXT_blend_minmax: null,
    };
  }

  getGlobals() {
    return {
      atob: atob,
      Blob: Blob,
      window: this.window,
      document: this.document,
      HTMLCanvasElement: undefined,
      XMLHttpRequest: $XMLHttpRequest,
      OffscreenCanvas: OffscreenCanvas,
      createImageBitmap: undefined,
    };
  }

  enableDeviceOrientation() {
    my.onDeviceMotionChange(this.onDeviceMotionChange);
  }

  disableDeviceOrientation() {
    my.offDeviceMotionChange(this.onDeviceMotionChange);
  }

  dispatchTouchEvent(e = {}) {
    const target = Object.assign({}, this);

    const event = {
      changedTouches: e.changedTouches.map(touch => new Touch(touch)),
      touches: e.touches.map(touch => new Touch(touch)),
      targetTouches: Array.prototype.slice.call(e.touches.map(touch => new Touch(touch))),
      timeStamp: e.timeStamp,
      target: target,
      currentTarget: target,
      type: e.type.toLowerCase(),
      cancelBubble: false,
      cancelable: false,
    };

    this.canvas.dispatchEvent(event);
  }

  dispose() {
    this.disableDeviceOrientation();
    this.onDeviceMotionChange = null;
    this.document = null;
    this.window = null;
    this.canvas = null;
  }
}

// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one-finger move
//    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
//    Pan - right mouse, or left mouse + ctrl/meta/shiftKey, or arrow keys / touch: two-finger move

var OrbitControls = function ( object, domElement ) {

	if ( domElement === undefined ) console.warn( 'THREE.OrbitControls: The second parameter "domElement" is now mandatory.' );
	if ( domElement === $document ) console.error( 'THREE.OrbitControls: "document" should not be used as the target "domElement". Please use "renderer.domElement" instead.' );

	this.object = object;
	this.domElement = domElement;

	// Set to false to disable this control
	this.enabled = true;

	// "target" sets the location of focus, where the object orbits around
	this.target = new Vector3();

	// How far you can dolly in and out ( PerspectiveCamera only )
	this.minDistance = 0;
	this.maxDistance = Infinity;

	// How far you can zoom in and out ( OrthographicCamera only )
	this.minZoom = 0;
	this.maxZoom = Infinity;

	// How far you can orbit vertically, upper and lower limits.
	// Range is 0 to Math.PI radians.
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians

	// How far you can orbit horizontally, upper and lower limits.
	// If set, the interval [ min, max ] must be a sub-interval of [ - 2 PI, 2 PI ], with ( max - min < 2 PI )
	this.minAzimuthAngle = - Infinity; // radians
	this.maxAzimuthAngle = Infinity; // radians

	// Set to true to enable damping (inertia)
	// If damping is enabled, you must call controls.update() in your animation loop
	this.enableDamping = false;
	this.dampingFactor = 0.05;

	// This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
	// Set to false to disable zooming
	this.enableZoom = true;
	this.zoomSpeed = 1.0;

	// Set to false to disable rotating
	this.enableRotate = true;
	this.rotateSpeed = 1.0;

	// Set to false to disable panning
	this.enablePan = true;
	this.panSpeed = 1.0;
	this.screenSpacePanning = true; // if false, pan orthogonal to world-space direction camera.up
	this.keyPanSpeed = 7.0;	// pixels moved per arrow key push

	// Set to true to automatically rotate around the target
	// If auto-rotate is enabled, you must call controls.update() in your animation loop
	this.autoRotate = false;
	this.autoRotateSpeed = 2.0; // 30 seconds per orbit when fps is 60

	// The four arrow keys
	this.keys = { LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown' };

	// Mouse buttons
	this.mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN };

	// Touch fingers
	this.touches = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN };

	// for reset
	this.target0 = this.target.clone();
	this.position0 = this.object.position.clone();
	this.zoom0 = this.object.zoom;

	// the target DOM element for key events
	this._domElementKeyEvents = null;

	//
	// public methods
	//

	this.getPolarAngle = function () {

		return spherical.phi;

	};

	this.getAzimuthalAngle = function () {

		return spherical.theta;

	};

	this.listenToKeyEvents = function ( domElement ) {

		domElement.addEventListener( 'keydown', onKeyDown );
		this._domElementKeyEvents = domElement;

	};

	this.saveState = function () {

		scope.target0.copy( scope.target );
		scope.position0.copy( scope.object.position );
		scope.zoom0 = scope.object.zoom;

	};

	this.reset = function () {

		scope.target.copy( scope.target0 );
		scope.object.position.copy( scope.position0 );
		scope.object.zoom = scope.zoom0;

		scope.object.updateProjectionMatrix();
		scope.dispatchEvent( changeEvent );

		scope.update();

		state = STATE.NONE;

	};

	// this method is exposed, but perhaps it would be better if we can make it private...
	this.update = function () {

		var offset = new Vector3();

		// so camera.up is the orbit axis
		var quat = new Quaternion().setFromUnitVectors( object.up, new Vector3( 0, 1, 0 ) );
		var quatInverse = quat.clone().invert();

		var lastPosition = new Vector3();
		var lastQuaternion = new Quaternion();

		var twoPI = 2 * Math.PI;

		return function update() {

			var position = scope.object.position;

			offset.copy( position ).sub( scope.target );

			// rotate offset to "y-axis-is-up" space
			offset.applyQuaternion( quat );

			// angle from z-axis around y-axis
			spherical.setFromVector3( offset );

			if ( scope.autoRotate && state === STATE.NONE ) {

				rotateLeft( getAutoRotationAngle() );

			}

			if ( scope.enableDamping ) {

				spherical.theta += sphericalDelta.theta * scope.dampingFactor;
				spherical.phi += sphericalDelta.phi * scope.dampingFactor;

			} else {

				spherical.theta += sphericalDelta.theta;
				spherical.phi += sphericalDelta.phi;

			}

			// restrict theta to be between desired limits

			var min = scope.minAzimuthAngle;
			var max = scope.maxAzimuthAngle;

			if ( isFinite( min ) && isFinite( max ) ) {

				if ( min < - Math.PI ) min += twoPI; else if ( min > Math.PI ) min -= twoPI;

				if ( max < - Math.PI ) max += twoPI; else if ( max > Math.PI ) max -= twoPI;

				if ( min <= max ) {

					spherical.theta = Math.max( min, Math.min( max, spherical.theta ) );

				} else {

					spherical.theta = ( spherical.theta > ( min + max ) / 2 ) ?
						Math.max( min, spherical.theta ) :
						Math.min( max, spherical.theta );

				}

			}

			// restrict phi to be between desired limits
			spherical.phi = Math.max( scope.minPolarAngle, Math.min( scope.maxPolarAngle, spherical.phi ) );

			spherical.makeSafe();


			spherical.radius *= scale;

			// restrict radius to be between desired limits
			spherical.radius = Math.max( scope.minDistance, Math.min( scope.maxDistance, spherical.radius ) );

			// move target to panned location

			if ( scope.enableDamping === true ) {

				scope.target.addScaledVector( panOffset, scope.dampingFactor );

			} else {

				scope.target.add( panOffset );

			}

			offset.setFromSpherical( spherical );

			// rotate offset back to "camera-up-vector-is-up" space
			offset.applyQuaternion( quatInverse );

			position.copy( scope.target ).add( offset );

			scope.object.lookAt( scope.target );

			if ( scope.enableDamping === true ) {

				sphericalDelta.theta *= ( 1 - scope.dampingFactor );
				sphericalDelta.phi *= ( 1 - scope.dampingFactor );

				panOffset.multiplyScalar( 1 - scope.dampingFactor );

			} else {

				sphericalDelta.set( 0, 0, 0 );

				panOffset.set( 0, 0, 0 );

			}

			scale = 1;

			// update condition is:
			// min(camera displacement, camera rotation in radians)^2 > EPS
			// using small-angle approximation cos(x/2) = 1 - x^2 / 8

			if ( zoomChanged ||
				lastPosition.distanceToSquared( scope.object.position ) > EPS ||
				8 * ( 1 - lastQuaternion.dot( scope.object.quaternion ) ) > EPS ) {

				scope.dispatchEvent( changeEvent );

				lastPosition.copy( scope.object.position );
				lastQuaternion.copy( scope.object.quaternion );
				zoomChanged = false;

				return true;

			}

			return false;

		};

	}();

	this.dispose = function () {

		scope.domElement.removeEventListener( 'contextmenu', onContextMenu );

		scope.domElement.removeEventListener( 'pointerdown', onPointerDown );
		scope.domElement.removeEventListener( 'wheel', onMouseWheel );

		scope.domElement.removeEventListener( 'touchstart', onTouchStart );
		scope.domElement.removeEventListener( 'touchend', onTouchEnd );
		scope.domElement.removeEventListener( 'touchmove', onTouchMove );

		scope.domElement.ownerDocument.removeEventListener( 'pointermove', onPointerMove );
		scope.domElement.ownerDocument.removeEventListener( 'pointerup', onPointerUp );


		if ( scope._domElementKeyEvents !== null ) {

			scope._domElementKeyEvents.removeEventListener( 'keydown', onKeyDown );

		}

		//scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?

	};

	//
	// internals
	//

	var scope = this;

	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start' };
	var endEvent = { type: 'end' };

	var STATE = {
		NONE: - 1,
		ROTATE: 0,
		DOLLY: 1,
		PAN: 2,
		TOUCH_ROTATE: 3,
		TOUCH_PAN: 4,
		TOUCH_DOLLY_PAN: 5,
		TOUCH_DOLLY_ROTATE: 6
	};

	var state = STATE.NONE;

	var EPS = 0.000001;

	// current position in spherical coordinates
	var spherical = new Spherical();
	var sphericalDelta = new Spherical();

	var scale = 1;
	var panOffset = new Vector3();
	var zoomChanged = false;

	var rotateStart = new Vector2();
	var rotateEnd = new Vector2();
	var rotateDelta = new Vector2();

	var panStart = new Vector2();
	var panEnd = new Vector2();
	var panDelta = new Vector2();

	var dollyStart = new Vector2();
	var dollyEnd = new Vector2();
	var dollyDelta = new Vector2();

	function getAutoRotationAngle() {

		return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;

	}

	function getZoomScale() {

		return Math.pow( 0.95, scope.zoomSpeed );

	}

	function rotateLeft( angle ) {

		sphericalDelta.theta -= angle;

	}

	function rotateUp( angle ) {

		sphericalDelta.phi -= angle;

	}

	var panLeft = function () {

		var v = new Vector3();

		return function panLeft( distance, objectMatrix ) {

			v.setFromMatrixColumn( objectMatrix, 0 ); // get X column of objectMatrix
			v.multiplyScalar( - distance );

			panOffset.add( v );

		};

	}();

	var panUp = function () {

		var v = new Vector3();

		return function panUp( distance, objectMatrix ) {

			if ( scope.screenSpacePanning === true ) {

				v.setFromMatrixColumn( objectMatrix, 1 );

			} else {

				v.setFromMatrixColumn( objectMatrix, 0 );
				v.crossVectors( scope.object.up, v );

			}

			v.multiplyScalar( distance );

			panOffset.add( v );

		};

	}();

	// deltaX and deltaY are in pixels; right and down are positive
	var pan = function () {

		var offset = new Vector3();

		return function pan( deltaX, deltaY ) {

			var element = scope.domElement;

			if ( scope.object.isPerspectiveCamera ) {

				// perspective
				var position = scope.object.position;
				offset.copy( position ).sub( scope.target );
				var targetDistance = offset.length();

				// half of the fov is center to top of screen
				targetDistance *= Math.tan( ( scope.object.fov / 2 ) * Math.PI / 180.0 );

				// we use only clientHeight here so aspect ratio does not distort speed
				panLeft( 2 * deltaX * targetDistance / element.clientHeight, scope.object.matrix );
				panUp( 2 * deltaY * targetDistance / element.clientHeight, scope.object.matrix );

			} else if ( scope.object.isOrthographicCamera ) {

				// orthographic
				panLeft( deltaX * ( scope.object.right - scope.object.left ) / scope.object.zoom / element.clientWidth, scope.object.matrix );
				panUp( deltaY * ( scope.object.top - scope.object.bottom ) / scope.object.zoom / element.clientHeight, scope.object.matrix );

			} else {

				// camera neither orthographic nor perspective
				console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );
				scope.enablePan = false;

			}

		};

	}();

	function dollyOut( dollyScale ) {

		if ( scope.object.isPerspectiveCamera ) {

			scale /= dollyScale;

		} else if ( scope.object.isOrthographicCamera ) {

			scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom * dollyScale ) );
			scope.object.updateProjectionMatrix();
			zoomChanged = true;

		} else {

			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
			scope.enableZoom = false;

		}

	}

	function dollyIn( dollyScale ) {

		if ( scope.object.isPerspectiveCamera ) {

			scale *= dollyScale;

		} else if ( scope.object.isOrthographicCamera ) {

			scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom / dollyScale ) );
			scope.object.updateProjectionMatrix();
			zoomChanged = true;

		} else {

			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
			scope.enableZoom = false;

		}

	}

	//
	// event callbacks - update the object state
	//

	function handleMouseDownRotate( event ) {

		rotateStart.set( event.clientX, event.clientY );

	}

	function handleMouseDownDolly( event ) {

		dollyStart.set( event.clientX, event.clientY );

	}

	function handleMouseDownPan( event ) {

		panStart.set( event.clientX, event.clientY );

	}

	function handleMouseMoveRotate( event ) {

		rotateEnd.set( event.clientX, event.clientY );

		rotateDelta.subVectors( rotateEnd, rotateStart ).multiplyScalar( scope.rotateSpeed );

		var element = scope.domElement;

		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientHeight ); // yes, height

		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight );

		rotateStart.copy( rotateEnd );

		scope.update();

	}

	function handleMouseMoveDolly( event ) {

		dollyEnd.set( event.clientX, event.clientY );

		dollyDelta.subVectors( dollyEnd, dollyStart );

		if ( dollyDelta.y > 0 ) {

			dollyOut( getZoomScale() );

		} else if ( dollyDelta.y < 0 ) {

			dollyIn( getZoomScale() );

		}

		dollyStart.copy( dollyEnd );

		scope.update();

	}

	function handleMouseMovePan( event ) {

		panEnd.set( event.clientX, event.clientY );

		panDelta.subVectors( panEnd, panStart ).multiplyScalar( scope.panSpeed );

		pan( panDelta.x, panDelta.y );

		panStart.copy( panEnd );

		scope.update();

	}

	function handleMouseWheel( event ) {

		if ( event.deltaY < 0 ) {

			dollyIn( getZoomScale() );

		} else if ( event.deltaY > 0 ) {

			dollyOut( getZoomScale() );

		}

		scope.update();

	}

	function handleKeyDown( event ) {

		var needsUpdate = false;

		switch ( event.code ) {

			case scope.keys.UP:
				pan( 0, scope.keyPanSpeed );
				needsUpdate = true;
				break;

			case scope.keys.BOTTOM:
				pan( 0, - scope.keyPanSpeed );
				needsUpdate = true;
				break;

			case scope.keys.LEFT:
				pan( scope.keyPanSpeed, 0 );
				needsUpdate = true;
				break;

			case scope.keys.RIGHT:
				pan( - scope.keyPanSpeed, 0 );
				needsUpdate = true;
				break;

		}

		if ( needsUpdate ) {

			// prevent the browser from scrolling on cursor keys
			event.preventDefault();

			scope.update();

		}


	}

	function handleTouchStartRotate( event ) {

		if ( event.touches.length == 1 ) {

			rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

		} else {

			var x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
			var y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );

			rotateStart.set( x, y );

		}

	}

	function handleTouchStartPan( event ) {

		if ( event.touches.length == 1 ) {

			panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

		} else {

			var x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
			var y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );

			panStart.set( x, y );

		}

	}

	function handleTouchStartDolly( event ) {

		var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
		var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

		var distance = Math.sqrt( dx * dx + dy * dy );

		dollyStart.set( 0, distance );

	}

	function handleTouchStartDollyPan( event ) {

		if ( scope.enableZoom ) handleTouchStartDolly( event );

		if ( scope.enablePan ) handleTouchStartPan( event );

	}

	function handleTouchStartDollyRotate( event ) {

		if ( scope.enableZoom ) handleTouchStartDolly( event );

		if ( scope.enableRotate ) handleTouchStartRotate( event );

	}

	function handleTouchMoveRotate( event ) {

		if ( event.touches.length == 1 ) {

			rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

		} else {

			var x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
			var y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );

			rotateEnd.set( x, y );

		}

		rotateDelta.subVectors( rotateEnd, rotateStart ).multiplyScalar( scope.rotateSpeed );

		var element = scope.domElement;

		rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientHeight ); // yes, height

		rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight );

		rotateStart.copy( rotateEnd );

	}

	function handleTouchMovePan( event ) {

		if ( event.touches.length == 1 ) {

			panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

		} else {

			var x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
			var y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );

			panEnd.set( x, y );

		}

		panDelta.subVectors( panEnd, panStart ).multiplyScalar( scope.panSpeed );

		pan( panDelta.x, panDelta.y );

		panStart.copy( panEnd );

	}

	function handleTouchMoveDolly( event ) {

		var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
		var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

		var distance = Math.sqrt( dx * dx + dy * dy );

		dollyEnd.set( 0, distance );

		dollyDelta.set( 0, Math.pow( dollyEnd.y / dollyStart.y, scope.zoomSpeed ) );

		dollyOut( dollyDelta.y );

		dollyStart.copy( dollyEnd );

	}

	function handleTouchMoveDollyPan( event ) {

		if ( scope.enableZoom ) handleTouchMoveDolly( event );

		if ( scope.enablePan ) handleTouchMovePan( event );

	}

	function handleTouchMoveDollyRotate( event ) {

		if ( scope.enableZoom ) handleTouchMoveDolly( event );

		if ( scope.enableRotate ) handleTouchMoveRotate( event );

	}

	//
	// event handlers - FSM: listen for events and reset state
	//

	function onPointerDown( event ) {

		if ( scope.enabled === false ) return;

		switch ( event.pointerType ) {

			case 'mouse':
			case 'pen':
				onMouseDown( event );
				break;

			// TODO touch

		}

	}

	function onPointerMove( event ) {

		if ( scope.enabled === false ) return;

		switch ( event.pointerType ) {

			case 'mouse':
			case 'pen':
				onMouseMove( event );
				break;

			// TODO touch

		}

	}

	function onPointerUp( event ) {

		switch ( event.pointerType ) {

			case 'mouse':
			case 'pen':
				onMouseUp();
				break;

			// TODO touch

		}

	}

	function onMouseDown( event ) {

		// Prevent the browser from scrolling.
		event.preventDefault();

		// Manually set the focus since calling preventDefault above
		// prevents the browser from setting it automatically.

		scope.domElement.focus ? scope.domElement.focus() : $window.focus();

		var mouseAction;

		switch ( event.button ) {

			case 0:

				mouseAction = scope.mouseButtons.LEFT;
				break;

			case 1:

				mouseAction = scope.mouseButtons.MIDDLE;
				break;

			case 2:

				mouseAction = scope.mouseButtons.RIGHT;
				break;

			default:

				mouseAction = - 1;

		}

		switch ( mouseAction ) {

			case MOUSE.DOLLY:

				if ( scope.enableZoom === false ) return;

				handleMouseDownDolly( event );

				state = STATE.DOLLY;

				break;

			case MOUSE.ROTATE:

				if ( event.ctrlKey || event.metaKey || event.shiftKey ) {

					if ( scope.enablePan === false ) return;

					handleMouseDownPan( event );

					state = STATE.PAN;

				} else {

					if ( scope.enableRotate === false ) return;

					handleMouseDownRotate( event );

					state = STATE.ROTATE;

				}

				break;

			case MOUSE.PAN:

				if ( event.ctrlKey || event.metaKey || event.shiftKey ) {

					if ( scope.enableRotate === false ) return;

					handleMouseDownRotate( event );

					state = STATE.ROTATE;

				} else {

					if ( scope.enablePan === false ) return;

					handleMouseDownPan( event );

					state = STATE.PAN;

				}

				break;

			default:

				state = STATE.NONE;

		}

		if ( state !== STATE.NONE ) {

			scope.domElement.ownerDocument.addEventListener( 'pointermove', onPointerMove );
			scope.domElement.ownerDocument.addEventListener( 'pointerup', onPointerUp );

			scope.dispatchEvent( startEvent );

		}

	}

	function onMouseMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

		switch ( state ) {

			case STATE.ROTATE:

				if ( scope.enableRotate === false ) return;

				handleMouseMoveRotate( event );

				break;

			case STATE.DOLLY:

				if ( scope.enableZoom === false ) return;

				handleMouseMoveDolly( event );

				break;

			case STATE.PAN:

				if ( scope.enablePan === false ) return;

				handleMouseMovePan( event );

				break;

		}

	}

	function onMouseUp( event ) {

		scope.domElement.ownerDocument.removeEventListener( 'pointermove', onPointerMove );
		scope.domElement.ownerDocument.removeEventListener( 'pointerup', onPointerUp );

		if ( scope.enabled === false ) return;

		scope.dispatchEvent( endEvent );

		state = STATE.NONE;

	}

	function onMouseWheel( event ) {

		if ( scope.enabled === false || scope.enableZoom === false || ( state !== STATE.NONE && state !== STATE.ROTATE ) ) return;

		event.preventDefault();

		scope.dispatchEvent( startEvent );

		handleMouseWheel( event );

		scope.dispatchEvent( endEvent );

	}

	function onKeyDown( event ) {

		if ( scope.enabled === false || scope.enablePan === false ) return;

		handleKeyDown( event );

	}

	function onTouchStart( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault(); // prevent scrolling

		switch ( event.touches.length ) {

			case 1:

				switch ( scope.touches.ONE ) {

					case TOUCH.ROTATE:

						if ( scope.enableRotate === false ) return;

						handleTouchStartRotate( event );

						state = STATE.TOUCH_ROTATE;

						break;

					case TOUCH.PAN:

						if ( scope.enablePan === false ) return;

						handleTouchStartPan( event );

						state = STATE.TOUCH_PAN;

						break;

					default:

						state = STATE.NONE;

				}

				break;

			case 2:

				switch ( scope.touches.TWO ) {

					case TOUCH.DOLLY_PAN:

						if ( scope.enableZoom === false && scope.enablePan === false ) return;

						handleTouchStartDollyPan( event );

						state = STATE.TOUCH_DOLLY_PAN;

						break;

					case TOUCH.DOLLY_ROTATE:

						if ( scope.enableZoom === false && scope.enableRotate === false ) return;

						handleTouchStartDollyRotate( event );

						state = STATE.TOUCH_DOLLY_ROTATE;

						break;

					default:

						state = STATE.NONE;

				}

				break;

			default:

				state = STATE.NONE;

		}

		if ( state !== STATE.NONE ) {

			scope.dispatchEvent( startEvent );

		}

	}

	function onTouchMove( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault(); // prevent scrolling

		switch ( state ) {

			case STATE.TOUCH_ROTATE:

				if ( scope.enableRotate === false ) return;

				handleTouchMoveRotate( event );

				scope.update();

				break;

			case STATE.TOUCH_PAN:

				if ( scope.enablePan === false ) return;

				handleTouchMovePan( event );

				scope.update();

				break;

			case STATE.TOUCH_DOLLY_PAN:

				if ( scope.enableZoom === false && scope.enablePan === false ) return;

				handleTouchMoveDollyPan( event );

				scope.update();

				break;

			case STATE.TOUCH_DOLLY_ROTATE:

				if ( scope.enableZoom === false && scope.enableRotate === false ) return;

				handleTouchMoveDollyRotate( event );

				scope.update();

				break;

			default:

				state = STATE.NONE;

		}

	}

	function onTouchEnd( event ) {

		if ( scope.enabled === false ) return;

		scope.dispatchEvent( endEvent );

		state = STATE.NONE;

	}

	function onContextMenu( event ) {

		if ( scope.enabled === false ) return;

		event.preventDefault();

	}

	//

	scope.domElement.addEventListener( 'contextmenu', onContextMenu );

	scope.domElement.addEventListener( 'pointerdown', onPointerDown );
	scope.domElement.addEventListener( 'wheel', onMouseWheel );

	scope.domElement.addEventListener( 'touchstart', onTouchStart );
	scope.domElement.addEventListener( 'touchend', onTouchEnd );
	scope.domElement.addEventListener( 'touchmove', onTouchMove );

	// force an update at start

	this.update();

};

OrbitControls.prototype = Object.create( EventDispatcher.prototype );
OrbitControls.prototype.constructor = OrbitControls;


// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
// This is very similar to OrbitControls, another set of touch behavior
//
//    Orbit - right mouse, or left mouse + ctrl/meta/shiftKey / touch: two-finger rotate
//    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
//    Pan - left mouse, or arrow keys / touch: one-finger move

var MapControls = function ( object, domElement ) {

	OrbitControls.call( this, object, domElement );

	this.screenSpacePanning = false; // pan orthogonal to world-space direction camera.up

	this.mouseButtons.LEFT = MOUSE.PAN;
	this.mouseButtons.RIGHT = MOUSE.ROTATE;

	this.touches.ONE = TOUCH.PAN;
	this.touches.TWO = TOUCH.DOLLY_ROTATE;

};

MapControls.prototype = Object.create( EventDispatcher.prototype );
MapControls.prototype.constructor = MapControls;

function _optionalChain$2(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// export const baseUrl = 'https://threejs.org/examples';










class Demo {
  
   __init() {this._objects = [];}
  
   __init2() {this._cameraObjects = [];}

  constructor(deps) {Demo.prototype.__init.call(this);Demo.prototype.__init2.call(this);
    this.deps = deps;
  }

  add(obj) {
    this._objects.push(obj);
    this.deps.scene.add(obj);
  }

  addCamera(obj) {
    this._cameraObjects.push(obj);
    this.deps.camera.add(obj);
  }

  addControl() {
    const { camera, renderer } = this.deps;
    this.orbitControl = new OrbitControls(camera, renderer.domElement);
    this.orbitControl.enableDamping = true;
    this.orbitControl.dampingFactor = 0.05;
  }

  reset() {
    const { camera, scene, renderer } = this.deps;
    camera.position.set(0, 0, 0);
    camera.quaternion.set(0, 0, 0, 1);
    _optionalChain$2([(scene.background ), 'optionalAccess', _ => _.dispose, 'optionalCall', _2 => _2()]);
    scene.background = null;
    scene.fog = null;
    scene.position.z = -3;
    renderer.shadowMap.enabled = false;
    renderer.physicallyCorrectLights = false;
    renderer.outputEncoding = sRGBEncoding;

    this._objects.forEach(object => _optionalChain$2([object, 'access', _3 => _3.material, 'optionalAccess', _4 => _4.dispose, 'optionalCall', _5 => _5()]));
    this._cameraObjects.forEach(object => _optionalChain$2([object, 'access', _6 => _6.material, 'optionalAccess', _7 => _7.dispose, 'optionalCall', _8 => _8()]));
    scene.remove(...this._objects);
    camera.remove(...this._cameraObjects);
    this._objects.length = 0;
    this._cameraObjects.length = 0;

    _optionalChain$2([this, 'access', _9 => _9.orbitControl, 'optionalAccess', _10 => _10.dispose, 'call', _11 => _11()]);
    this.orbitControl = null;
    this.deps = null;
  }

  


}

function _optionalChain$1(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }
const utils = require('../../utils/utils');

class PanoramaLoader extends Demo {constructor(...args) { super(...args); PanoramaLoader.prototype.__init.call(this);PanoramaLoader.prototype.__init2.call(this);PanoramaLoader.prototype.__init3.call(this);PanoramaLoader.prototype.__init4.call(this);PanoramaLoader.prototype.__init5.call(this); }
  
  
  
  

  
  
  __init() {this.guideposts = [];}
  __init2() {this.time = 0;}

  __init3() {this.panoramas = ['https://topfullstackkimeng.oss-cn-hangzhou.aliyuncs.com/night1.jpg', 'https://isv.alibabausercontent.com/00000000/imgextra/i3/3981030266/O1CN0154rnpS1Dps2LsPLyM_!!3981030266-0-isvtu-00000000.jpg'];}
  __init4() {this.guidepostsOption = [
    [
      {
        x: 4340 / 7680 * 100,
        y: 2170 / 3840 * 100,
        next: 1
      },
    ]
  ];}
  async init() {
    // 场景
    this.scene = new Scene();
    this.add(this.scene);

    this.geometry = new SphereGeometry(50, 256, 256);

    // 全景调整摄像机放球体中心
    this.deps.camera.position.set(-0.1, 0, 0);
    this.addControl();

    // 注册点击事件
    this.deps.eventBus.on('click', (e) => { this.handleClick(e); });

    // 准备精灵贴图
    this.guidepostsMap = this.deps.textureLoader.load('https://isv.alibabausercontent.com/00000000/imgextra/i2/3981030266/O1CN01aXsnkp1Dps2HJfGil_!!3981030266-2-isvtu-00000000.png');
    this.guidepostsMaterial = new SpriteMaterial({
      map: this.guidepostsMap,
      color: 0xffffff,
      fog: true,
    });

    // 进入场景
    this.changePanoramas(0);
    setTimeout(() => {
      this.changePanoramas(1);
    }, 5000);
  }

  changePanoramas(index) {
    const textureLoader = this.deps.textureLoader;
    // 释放旧全景
    this.disposeMesh();
    this.disposeGuidepost();

    // 画球
    this.time++;
    const texture = textureLoader.load(this.panoramas[index]);
    // 内纹理是镜像 需要再镜像还原
    texture.center = new Vector2(0.5, 0.5);
    texture.rotation = Math.PI;
    texture.flipY = false;
    this.material = new MeshBasicMaterial({ map: texture });
    // 渲染球体的双面
    this.material.side = DoubleSide;
    this.mesh = new Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);

    // 画地标
    this.guidepostsOption[index] && this.guidepostsOption[index].forEach(({ x, y }) => {
      this.addGuidepost(y, x, 50);
    });
    
    this.update();
  }

  __init5() {this.handleClick = utils.debounce(
    (() => {
      const mouse = new Vector2();
      const raycaster = new Raycaster();
      new Spherical();

      return function (e) {
        const { canvas, camera, dpr } = this.deps;
        const { mesh } = this;
        if (!mesh) { return }
        const innerWidth = canvas.width;
        const innerHeight = canvas.height;
        const clientX = e.changedTouches[0].x * dpr;
        const clientY = e.changedTouches[0].y * dpr;

        // 将鼠标点击位置的屏幕坐标转成threejs中的标准坐标
        mouse.x = (clientX / innerWidth) * 2 - 1;
        mouse.y = -(clientY / innerHeight) * 2 + 1;

        //更新鼠标和射线位置
        raycaster.setFromCamera(mouse, camera);

        const intersects = raycaster.intersectObjects(this.guideposts);
        if (intersects.length > 0) {
          // 求射中了哪个路标
          const { object: { uuid } } = intersects[0];
          let index = 0;
          for (const i in this.guideposts) {
            if (this.guideposts[i].uuid === uuid) {
              index = Number(i);
              break
            }
          }
          this.changePanoramas(this.guideposts[index].next);
        }

        // 射线和球体求交，选中一系列直线
        // const intersects = raycaster.intersectObjects([mesh])
        // if (intersects.length > 0) {
        //   //取点击到的最近的那个物体的交点
        //   const pointClicked = intersects[0].point
        //   console.log(pointClicked)
        //   spherical.setFromVector3(pointClicked)

        //   // 尝试贴精灵
        //   // 球面坐标转化成空间坐标
        //   // const pointCl = new THREE.Vector3().setFromSphericalCoords(spherical.radius, spherical.phi, spherical.theta)
        //   // console.log(pointCl)
        //   // const { x, y, z } = pointCl
        //   // const material = this.guidepostsMaterial.clone();
        //   // const sprite = new THREE.Sprite(material);
        //   // sprite.position.set(x, y, z);
        //   // sprite.position.normalize();
        //   // sprite.position.multiplyScalar(3);
        //   // this.scene.add(sprite)
        // }
      }
    })()
    , 500
  );}

  percentTosSpherical(top, left, radius) {
    if (left > 50) {
      left -= 50;
    } else {
      left += 50;
    }
    const phi = top / 100 * Math.PI;
    const theta = Math.PI / 2 - (left / 50 * Math.PI);
    return new Vector3().setFromSphericalCoords(radius, phi, theta)
  }

  addGuidepost(top, left, radius) {
    const { x, y, z } = this.percentTosSpherical(top, left, radius);
    const material = this.guidepostsMaterial.clone();
    const sprite = new Sprite(material);
    sprite.position.set(x, y, z);
    sprite.position.normalize();
    sprite.position.multiplyScalar(5);
    this.guideposts.push(sprite);
    this.scene.add(sprite);
  }

  update() {
    _optionalChain$1([this, 'access', _ => _.orbitControl, 'optionalAccess', _2 => _2.update, 'call', _3 => _3()]);
  }

  disposeMesh() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.material.dispose();
    }
  }

  disposeGuidepost() {
    this.guideposts.forEach(item => {
      this.scene.remove(item);
    });
    this.guideposts = [];
  }

  dispose() {
    this.reset();
  }
}

function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// index.ts

const eventBus = require('../../utils/EventEmitter').eventBus;
const tbFont = require('../../utils/tbFont');
require('../../utils/utils');

// @ts-ignore
Page({
  data: {
  },
  onCanvasReady() {
    // @ts-ignore
    Promise.all([
      new Promise(resolve => my.createSelectorQuery().select('.canvas').boundingClientRect().exec(resolve)),
      new Promise((resolve, reject) => {
        my.createCanvas({
          id: 'gl',
          success: resolve,
          fail: reject
        });
      })
    ])
      .then(async ([res, canvas]) => {
        await this.initCanvas(canvas, res[0]);
        this.loadContent();
      })
      .catch(() => my.alert({ content: '初始canvas失败' }));
  },
  async initCanvas(canvas, canvasRect) {
    try {
      this.platform = new TaobaoPlatform(canvas);
      PLATFORM.set(this.platform);

      console.log($window.innerWidth, $window.innerHeight, $window.devicePixelRatio);
      console.log(canvas.width, canvas.height);

      const canW = Math.round(canvasRect.width * 1.01); // 确保填满屏幕
      const canH = Math.round(canvasRect.height * 1.01);
      const renderer = new WebGL1Renderer({ canvas, antialias: false, alpha: true });
      // const camera = new PerspectiveCamera(75, canW / canH, 0.1, 1000);
      const camera = new PerspectiveCamera(90, canW / canH, 0.1, 100);
      const scene = new Scene();
      // scene.add(new THREE.AxisHelper(1000))
      const clock = new Clock();
      // const gltfLoader = new GLTFLoader();
      const textureLoader = new TextureLoader();
      const dpr = tbFont.isDev() ? 1 : $window.devicePixelRatio;
      this.deps = { canvas, renderer, camera, scene, clock, textureLoader, eventBus, dpr }; // gltfLoader, ,

      // scene.position.z = -3;
      renderer.outputEncoding = sRGBEncoding;
      renderer.setPixelRatio(tbFont.isDev() ? 1 : dpr);
      renderer.setSize(canW, canH);

      // scene.background = new Color(0xffffff);
      // const geo = new PlaneBufferGeometry()
      // const mat = new MeshBasicMaterial({ color: 0x123456 })
      // scene.add(new Mesh(geo, mat))

      const render = () => {
        if (this.disposing) return
        canvas.requestAnimationFrame(render);
        _optionalChain([(this.currDemo ), 'optionalAccess', _ => _.update, 'call', _2 => _2()]);
        renderer.render(scene, camera);
      };

      render();
    } catch (error) {
      // @ts-ignore
      my.alert({ content: error + ':' + JSON.stringify(error) });
    }
  },
  async loadContent() {
    try {
      my.showLoading();
      const demo = new (PanoramaLoader)(this.deps) ;
      await demo.init();

      _optionalChain([(this.currDemo ), 'optionalAccess', _3 => _3.dispose, 'call', _4 => _4()]);
      this.currDemo = demo;
    } catch (error) {
      // @ts-ignore
      my.alert({ content: error + ':' + JSON.stringify(error) });
    } finally {
      my.hideLoading();
    }
  },
  // ide中webgl点击事件没反应
  onTX(e) {
    this.deps.eventBus.emit('click', e);
    this.platform.dispatchTouchEvent(e);
  },
  onUnload() {
    this.disposing = true;
    _optionalChain([this, 'access', _5 => _5.currDemo, 'optionalAccess', _6 => _6.dispose, 'call', _7 => _7()]);
    PLATFORM.dispose();
  },
});
