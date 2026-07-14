/* eslint-disable no-console */
// Dev-gated logger. In production builds (__DEV__ === false) debug/info logs
// are stripped; warnings and errors still surface so crash reporting tools
// can pick them up.

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};
