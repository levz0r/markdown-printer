// Pure ring-buffer helpers used by logger.js. Kept dependency-free so they
// can be unit-tested in Node without a browser or storage stub.
(function (root, factory) {
  const mod = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = mod;
  } else {
    root.mdpLogBuffer = mod;
  }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  function stringifyArg(arg) {
    if (arg instanceof Error) {
      return `${arg.name}: ${arg.message}${arg.stack ? `\n${arg.stack}` : ''}`;
    }
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg);
      } catch (_e) {
        return String(arg);
      }
    }
    return String(arg);
  }

  function formatArgs(args) {
    return args.map(stringifyArg).join(' ');
  }

  // Returns a new array with `entry` appended and the oldest entries trimmed
  // so the result is at most `max` long. Pure: does not mutate `log`.
  function appendBounded(log, entry, max) {
    const base = Array.isArray(log) ? log : [];
    const next = base.concat([entry]);
    if (next.length <= max) {
      return next;
    }
    return next.slice(next.length - max);
  }

  return { stringifyArg, formatArgs, appendBounded };
});
