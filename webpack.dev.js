const path = require("path");
const { merge } = require("webpack-merge");

const common = require("./webpack.common.js");

module.exports = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    static: path.resolve(__dirname, "./dist"),
    compress: true,
    port: 5055,
    open: false, // Set to `true` to automatically open new browser tab
  },
});
