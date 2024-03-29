"use strict";
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { DefinePlugin } = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const dotenv = require("dotenv");

const env = dotenv.config().parsed;

const envKeys = Object.keys(env).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(env[next]);
  return prev;
}, {});

const webviewConfig = {
  name: "webview",
  target: "web",
  mode: "development",

  entry: "./src/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
    publicPath: "/",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
    alias: {
      "@": path.resolve(__dirname, "src/"),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: [
                "@babel/preset-env",
                "@babel/preset-react",
                "@babel/preset-typescript",
              ],
            },
          },
          {
            loader: "ts-loader",
          },
        ],
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: [["@babel/preset-env", "@babel/preset-react"]],
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        use: [
          {
            loader: "style-loader",
          },
          {
            loader: "css-loader",
            options: {
              modules: {
                localIdentName: "[name]__[local]___[hash:base64:5]",
              },
            },
          },
        ],
        include: /views/,
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/, // 匹配文件类型
        use: [
          {
            loader: "url-loader", // 使用file-loader
            options: {
              name: "[name].[ext]", // 输出文件的名称和扩展名
              outputPath: "assets/", // 输出文件的路径
            },
          },
        ],
      },
    ],
  },
  devtool: "source-map",
  infrastructureLogging: {
    level: "log",
  },
  plugins: [
    new CleanWebpackPlugin(),
    // generate an HTML file that includes the extension's JavaScript file
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "src", "index.html"),
      filename: "index.html",
      chunks: ["index"],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "src", "welcome.html"),
      filename: "welcome.html",
      chunks: ["welcome"],
    }),
    new DefinePlugin({
      "process.env.platform": JSON.stringify("vscode"),
      ...envKeys,
    }),
    // new CopyWebpackPlugin({
    //   patterns: [{ from: "dist", to: "../dist" }],
    // }),
  ],
};

module.exports = webviewConfig;
