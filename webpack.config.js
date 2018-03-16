/**
 * Webpack config file.
 */
const path = require( 'path' );
const webpack = require( 'webpack' );
const isProd  = ( process.env.NODE_ENV === 'production' );
const devServer = { host: 'localhost', port: 8000 };

module.exports = {
  devtool: '#eval-source-map',
  entry: {
    app: './src/app.js',
  },
  output: {
    path: path.join( __dirname, '/' ),
    publicPath: '/',
    filename: 'public/bundles/[name].min.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      }
    ]
  },
  plugins: [],
  devServer: {
    host: devServer.host,
    port: devServer.port,
    contentBase: path.join( __dirname, '/' ),
    clientLogLevel: 'info',
    hot: true,
    inline: true,
    quiet: false,
    noInfo: false,
    compress: false,
  },
  performance: {
    hints: false,
  },
  stats: {
    colors: true,
  },
}

if ( isProd ) {
  module.exports.devtool = '#source-map';
  module.exports.plugins = (module.exports.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': { NODE_ENV: '"production"' }
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: { warnings: false }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ])
}
