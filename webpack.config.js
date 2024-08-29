/* eslint-disable @typescript-eslint/no-require-imports */

const path = require("path");

module.exports = {
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "lib"),
    },
  },
  module: {
    rules: [
      {
        resourceQuery: /data-url/,
        type: "asset/inline",
      },
    ],
  },
};
