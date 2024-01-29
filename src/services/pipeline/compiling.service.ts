import webpack, { Configuration, DefinePlugin } from 'webpack';
import { merge } from 'webpack-merge';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import nodeExternals from 'webpack-node-externals';
import LoadablePlugin from '@loadable/webpack-plugin';

import { temporaryApplicationBuildFolderRootPath, isTest } from '../../config';

export async function compile(projectPageUrls: string[]) {
  const commonWebpackConfig = getCommonWebpackConfig(projectPageUrls);
  const serverWebpackConfig = getServerWebpackConfig(commonWebpackConfig);
  const clientWebpackConfig = getClientWebpackConfig(commonWebpackConfig);

  const [serverEmittedAssets, clientEmittedAssets] = await Promise.all(
    [serverWebpackConfig, clientWebpackConfig].map((config) => runCompiler(config)),
  );

  return {
    serverEmittedAssets: Array.from(serverEmittedAssets),
    clientEmittedAssets: Array.from(clientEmittedAssets),
  };
}

function getCommonWebpackConfig(projectPageUrls: string[]) {
  return {
    parallelism: 2,
    optimization: {
      emitOnErrors: true,
      moduleIds: 'deterministic',
      nodeEnv: false,
      splitChunks: {
        filename: isTest ? '[name].js' : /* istanbul ignore next */ '[name].[contenthash].js',
        chunks: 'all',
        minSize: 1000,
      },
      runtimeChunk: undefined,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
      ],
    },
    context: temporaryApplicationBuildFolderRootPath,
    entry: getWebpackConfigEntries(projectPageUrls),
    output: {
      publicPath: '/static/',
      filename: isTest ? '[name].js' : /* istanbul ignore next */ '[name].[contenthash].js',
      chunkFilename: isTest ? '[id].chunk.js' : /* istanbul ignore next */ '[name].[id].chunk.js',
      strictModuleExceptionHandling: true,
      clean: false,
    },
    performance: false,
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      extensionAlias: undefined,
      modules: ['node_modules', './src'],
      mainFields: ['main', 'module'],
      alias: {
        '@/components': `${temporaryApplicationBuildFolderRootPath}/components`,
        '@/contexts': `${temporaryApplicationBuildFolderRootPath}/contexts`,
      },
    },
    resolveLoader: {
      modules: ['node_modules', './src'],
    },
    module: {
      rules: [
        {
          test: /\.(jsx)$/,
          exclude: /node_modules/,
          use: [
            'thread-loader',
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true,
              },
            },
          ],
        },
      ],
    },
    plugins: [
      new LoadablePlugin(),
      new DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      // new CleanWebpackPlugin({
      //   cleanStaleWebpackAssets: true,
      //   protectWebpackAssets: true,
      //   cleanAfterEveryBuildPatterns: ['*.LICENSE.txt'],
      // }),
    ],
    experiments: { layers: true, cacheUnaffected: true },
    snapshot: { managedPaths: [/^(.+?[\\/]node_modules[\\/])/] },
    mode: 'production',
    devtool: false,
  } as Configuration;
}

function getServerWebpackConfig(config: Configuration) {
  return merge(config, {
    externalsPresets: { node: true },
    entry: {
      'application-server': `${temporaryApplicationBuildFolderRootPath}/application/server.jsx`,
    },
    output: {
      path: `${temporaryApplicationBuildFolderRootPath}/build/server/`,
      libraryTarget: 'commonjs',
    },
    cache: {
      type: 'filesystem',
      maxMemoryGenerations: Infinity,
      cacheDirectory: `${temporaryApplicationBuildFolderRootPath}/cache`,
      compression: false,
      name: 'server-cache',
    },
    externals: ['@loadable/component', 'react-helmet', nodeExternals()],
    name: 'server',
    target: 'node',
  });
}

function getClientWebpackConfig(config: Configuration) {
  return merge(config, {
    entry: {
      'application-client': `${temporaryApplicationBuildFolderRootPath}/application/client.jsx`,
    },
    output: {
      path: `${temporaryApplicationBuildFolderRootPath}/build/client/`,
      libraryTarget: 'umd',
    },
    cache: {
      type: 'filesystem',
      maxMemoryGenerations: Infinity,
      cacheDirectory: `${temporaryApplicationBuildFolderRootPath}/cache`,
      compression: false,
      name: 'client-cache',
    },
    name: 'client',
    target: 'web',
  });
}

function getWebpackConfigEntries(projectPageUrls: string[]) {
  return projectPageUrls.reduce(
    (entries, pageUrl) => ({ ...entries, [getEntryName(pageUrl)]: getEntryFile(pageUrl) }),
    {},
  );
}

function getEntryName(pageUrl: string) {
  return pageUrl === '/' ? `pages/index` : `pages/${unslashPageUrl(pageUrl)}`;
}

function getEntryFile(pageUrl: string) {
  return pageUrl === '/' ? `./pages/index.jsx` : `./pages/${unslashPageUrl(pageUrl)}/index.jsx`;
}

function unslashPageUrl(str: string) {
  return str.replace(/^\/|\/$/g, '');
}

function runCompiler(config: Configuration) {
  const compiler = webpack(config);

  return new Promise<Set<string>>((resolve, reject) => {
    compiler.run((error, stats) => {
      if (error) {
        console.log('error', error);
        reject(error);
      }

      if (stats?.hasErrors()) {
        console.log('stats error', stats.toJson().errors);
        reject(stats.toJson().errors);
      }

      compiler.close(() => {
        resolve(stats?.compilation?.emittedAssets ?? new Set());
      });
    });
  });
}
