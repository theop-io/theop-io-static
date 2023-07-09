const path = require("path");
const HtmlBundlerPlugin = require("html-bundler-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
  mode: "development",
  target: ["web", "es5"],
  devServer: {
    static: path.resolve(__dirname, "./dist"),
    compress: true,
    port: 5055,
    open: false, // Set to `true` to automatically open new browser tab
  },
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(css|sass|scss)$/,
        use: ["css-loader", "sass-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  plugins: [
    new HtmlBundlerPlugin({
      entry: "./src/",
      js: {
        // output filename of JS extracted from source script specified in `<script>`
        filename: "assets/js/[name].js",
      },
      css: {
        // output filename of CSS extracted from source file specified in `<link>`
        filename: "assets/css/[name].css",
      },
    }),
    new CleanWebpackPlugin(), // auto-clean output directory
  ],
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
};
