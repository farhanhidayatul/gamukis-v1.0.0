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
