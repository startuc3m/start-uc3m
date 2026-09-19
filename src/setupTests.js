// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// jsdom en Jest 27 (react-scripts 5) no expone TextEncoder/TextDecoder, que
// react-router v7 necesita al cargarse. Los aportamos desde node:util.
import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// framer-motion usa IntersectionObserver para `whileInView`; jsdom no lo trae.
// Un stub inerte basta: en tests nada entra nunca en viewport.
if (typeof global.IntersectionObserver === 'undefined') {
  global.IntersectionObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
}
