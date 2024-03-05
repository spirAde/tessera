import LoadablePlugin from '@loadable/webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import webpack, { Configuration, DefinePlugin } from 'webpack';
import { merge } from 'webpack-merge';
import nodeExternals from 'webpack-node-externals';

import { temporaryApplicationBuildFolderRootPath } from '../../config';
import { Page } from '../../models';

export async function compile(pages: Page[]): Promise<void> {
  const commonWebpackConfig = getCommonWebpackConfig(pages);
  const serverWebpackConfig = getServerWebpackConfig(commonWebpackConfig);
  const clientWebpackConfig = getClientWebpackConfig(commonWebpackConfig);

  await Promise.all(
    [serverWebpackConfig, clientWebpackConfig].map((config) => runCompiler(config)),
  );
}

function getCommonWebpackConfig(pages: Page[]) {
  return {
    bail: true,
    parallelism: 2,
    optimization: {
      emitOnErrors: true,
      moduleIds: 'deterministic',
      nodeEnv: false,
      splitChunks: {
        filename: '[name].[contenthash].js',
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
    entry: getWebpackConfigEntries(pages),
    output: {
      publicPath: '/static/',
      filename: '[name].[contenthash].js',
      chunkFilename: '[contenthash].chunk.js',
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

function getWebpackConfigEntries(pages: Page[]) {
  return pages.reduce(
    (entries, page) => ({ ...entries, [getEntryName(page.url)]: getEntryFile(page.url) }),
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

// TODO: test that reject really throws exception blocking pipeline and runs rollback
function runCompiler(config: Configuration) {
  const compiler = webpack(config);

  return new Promise<void>((resolve, reject) =>
    compiler.run((error, stats) => {
      /* istanbul ignore if */
      if (error) {
        reject(error);
      }

      /* istanbul ignore if */
      if (stats?.hasErrors()) {
        reject(stats.toJson().errors);
      }

      compiler.close(() => resolve());
    }),
  );
}
