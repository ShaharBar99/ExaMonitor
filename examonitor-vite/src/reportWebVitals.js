/**
 * Reports web vitals metrics to a provided callback function.
 * Useful for performance monitoring (CLS, FID, FCP, LCP, TTFB).
 * @param {Function} onPerfEntry - Callback to handle performance entries.
 */
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
