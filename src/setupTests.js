const { TextEncoder, TextDecoder } = require('util');
const streamWeb = require('stream/web');

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// firebase/auth (via undici) expects web streams, which jsdom does not expose.
['ReadableStream', 'WritableStream', 'TransformStream'].forEach((name) => {
  if (typeof global[name] === 'undefined' && streamWeb[name]) {
    global[name] = streamWeb[name];
  }
});

// Mock optional SpectorJS debugging tool required conditionally inside Phaser WebGL
jest.mock('phaser3spectorjs', () => ({}), { virtual: true });

// Mock Canvas 2D context for jsdom environment (Phaser feature detection & canvas rendering)
if (typeof HTMLCanvasElement !== 'undefined') {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type) {
    if (type === '2d') {
      return {
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        fillRect: () => {},
        clearRect: () => {},
        getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
        putImageData: () => {},
        createImageData: () => ({ data: new Uint8ClampedArray(0) }),
        setTransform: () => {},
        drawImage: () => {},
        save: () => {},
        fillText: () => {},
        restore: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        stroke: () => {},
        translate: () => {},
        scale: () => {},
        rotate: () => {},
        arc: () => {},
        fill: () => {},
        measureText: () => ({ width: 0 }),
        transform: () => {},
        rect: () => {},
        clip: () => {}
      };
    }
    if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
      return {
        getExtension: () => null,
        getParameter: () => 0,
        createTexture: () => ({}),
        bindTexture: () => {},
        texParameteri: () => {},
        texImage2D: () => {}
      };
    }
    return originalGetContext ? originalGetContext.call(this, type) : null;
  };
}

