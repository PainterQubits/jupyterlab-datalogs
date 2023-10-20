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
        resourceQuery: /url/,
        type: "asset/inline",
      },
      {
        resourceQuery: /file/,
        type: "asset/resource",
      },
    ],
  },
};
