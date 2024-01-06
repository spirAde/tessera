import webpack, { Configuration, DefinePlugin, Compiler, Compilation } from 'webpack';
import LoadablePlugin from '@loadable/webpack-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import nodeExternals from 'webpack-node-externals';

export async function runCompilation({
  projectBuildFolderPath,
  projectPageUrls,
}: {
  projectBuildFolderPath: string;
  projectPageUrls: string[];
}) {
  const serverEmittedAssets: string[] = [];
  const clientEmittedAssets: string[] = [];

  const serverWebpackConfig = getServerWebpackConfig({
    projectBuildFolderPath,
    projectPageUrls,
    emittedAssets: serverEmittedAssets,
  });

  const clientWebpackConfig = getClientWebpackConfig({
    projectBuildFolderPath,
    projectPageUrls,
    emittedAssets: clientEmittedAssets,
  });

  await Promise.all(
    [serverWebpackConfig, clientWebpackConfig].map((config) => runCompiler(config)),
  );

  return { serverEmittedAssets, clientEmittedAssets };
}

function getServerWebpackConfig({
  projectBuildFolderPath,
  projectPageUrls,
  emittedAssets,
}: {
  projectBuildFolderPath: string;
  projectPageUrls: string[];
  emittedAssets: string[];
}) {
  return {
    parallelism: undefined,
    externalsPresets: { node: true },
    optimization: {
      emitOnErrors: true,
      nodeEnv: false,
      splitChunks: { filename: '[name].js', chunks: 'all', minSize: 1000 },
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
    context: projectBuildFolderPath,
    entry: {
      'application-server': `${projectBuildFolderPath}/application/server.jsx`,
      ...getWebpackConfigEntries(projectPageUrls),
    },
    output: {
      publicPath: '/static/',
      path: `${projectBuildFolderPath}/build/server/`,
      filename: '[name].js',
      library: undefined,
      libraryTarget: 'commonjs2',
      chunkFilename: '[name].js',
      strictModuleExceptionHandling: true,
      hashFunction: 'xxhash64',
      hashDigestLength: 16,
    },
    performance: false,
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      extensionAlias: undefined,
      modules: ['node_modules', './src'],
      mainFields: ['main', 'module'],
      alias: {
        '@/components': `${projectBuildFolderPath}/components`,
        '@/contexts': `${projectBuildFolderPath}/contexts`,
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
          use: ['thread-loader', 'babel-loader'],
        },
      ],
      parser: {
        javascript: {
          url: 'relative',
        },
      },
      generator: {
        asset: {
          filename: 'static/media/[name].[hash:8][ext]',
        },
      },
    },
    plugins: [
      new LoadablePlugin(),
      new CleanWebpackPlugin({
        cleanStaleWebpackAssets: false,
        protectWebpackAssets: false,
        cleanAfterEveryBuildPatterns: ['*.LICENSE.txt'],
      }),
      new DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      new (class {
        apply(compiler: Compiler) {
          compiler.hooks.afterEmit.tap('OutputMonitor', (compilation) => {
            emittedAssets.push(...compilation.emittedAssets);
          });
        }
      })(),
    ],
    experiments: { layers: true, cacheUnaffected: true, buildHttp: undefined },
    snapshot: { managedPaths: [/^(.+?[\\/]node_modules[\\/])/] },
    cache: {
      type: 'filesystem',
      maxMemoryGenerations: Infinity,
      cacheDirectory: `${projectBuildFolderPath}/cache`,
      compression: false,
      name: 'server-production',
    },
    mode: 'production',
    name: 'server',
    target: 'node16.14',
    devtool: false,
    externals: ['@loadable/component', nodeExternals()],
  } as Configuration;
}

export function getClientWebpackConfig({
  projectBuildFolderPath,
  projectPageUrls,
  emittedAssets,
}: {
  projectBuildFolderPath: string;
  projectPageUrls: string[];
  emittedAssets: string[];
}) {
  return {
    parallelism: undefined,
    externalsPresets: { node: true },
    optimization: {
      emitOnErrors: true,
      nodeEnv: false,
      splitChunks: { filename: '[name].js', chunks: 'all', minSize: 1000 },
      runtimeChunk: undefined,
      minimize: true,
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
    context: projectBuildFolderPath,
    entry: {
      'application-client': `${projectBuildFolderPath}/application/client.jsx`,
      ...getWebpackConfigEntries(projectPageUrls),
    },
    output: {
      publicPath: '/static/',
      path: `${projectBuildFolderPath}/build/client/`,
      filename: '[name].js',
      library: undefined,
      chunkFilename: '[name].js',
      strictModuleExceptionHandling: true,
      hashFunction: 'xxhash64',
      hashDigestLength: 16,
    },
    performance: false,
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      extensionAlias: undefined,
      modules: ['node_modules', './src'],
      mainFields: ['main', 'module'],
      alias: {
        '@/components': `${projectBuildFolderPath}/components`,
        '@/contexts': `${projectBuildFolderPath}/contexts`,
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
          use: ['thread-loader', 'babel-loader'],
        },
      ],
      parser: {
        javascript: {
          url: 'relative',
        },
      },
      generator: {
        asset: {
          filename: 'static/media/[name].[hash:8][ext]',
        },
      },
    },
    plugins: [
      new LoadablePlugin(),
      new CleanWebpackPlugin({
        cleanStaleWebpackAssets: false,
        protectWebpackAssets: false,
        cleanAfterEveryBuildPatterns: ['*.LICENSE.txt'],
      }),
      new DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      new (class {
        apply(compiler: Compiler) {
          compiler.hooks.afterEmit.tap('OutputMonitor', (compilation) => {
            emittedAssets.push(...compilation.emittedAssets);
          });
        }
      })(),
    ],
    experiments: { layers: true, cacheUnaffected: true, buildHttp: undefined },
    snapshot: { managedPaths: [/^(.+?[\\/]node_modules[\\/])/] },
    cache: {
      type: 'filesystem',
      maxMemoryGenerations: Infinity,
      cacheDirectory: `${projectBuildFolderPath}/cache`,
      compression: false,
      name: 'client-production',
    },
    mode: 'production',
    name: 'client',
    target: 'web',
    devtool: false,
  } as Configuration;
}

// TODO: redo
function getWebpackConfigEntries(projectPageUrls: string[]) {
  return projectPageUrls.reduce((entries, pageUrl) => {
    const key = pageUrl === '/' ? `pages/index` : `pages/${unslashPageUrl(pageUrl)}`;
    const value =
      pageUrl === '/' ? `./pages/index.jsx` : `./pages/${unslashPageUrl(pageUrl)}/index.jsx`;

    return { ...entries, [key]: value };
  }, {});
}

function unslashPageUrl(str: string) {
  return str.replace(/^\/|\/$/g, '');
}

function runCompiler(config: Configuration) {
  return new Promise((resolve) => webpack(config).run(resolve));
}
