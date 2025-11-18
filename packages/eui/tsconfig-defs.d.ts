/// <reference types="jest" />
/// <reference types="chai" />

// Add the `css` prop to all JSX components
declare namespace React {
  interface Attributes {
    css?: any;
  }
}
