/* eslint-disable @typescript-eslint/no-var-requires */
//@ts-check

"use strict"

// eslint-disable-next-line no-undef
const { readFileSync } = require("fs")
// eslint-disable-next-line no-undef
const path = require("path")
// eslint-disable-next-line no-undef
const { DefinePlugin } = require("webpack")

/** @type {string} */
const packageJsonContent = readFileSync("./package.json", "utf-8")
/** @type {import("./package.json")} */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const packageJson = JSON.parse(packageJsonContent)

/**@type {import("webpack").Configuration}*/
const config = {
  target: "node",
  mode: "none",

  entry: "./src/extension.ts",
  output: {
    // eslint-disable-next-line no-undef
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2"
  },
  devtool: "nosources-source-map",
  externals: {
    vscode: "commonjs vscode"
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader"
          }
        ]
      }
    ]
  },
  plugins: [
    new DefinePlugin({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      "RCS_CURRENT_VERSION": JSON.stringify(packageJson.version),
    })
  ],
}
// eslint-disable-next-line no-undef
module.exports = config
