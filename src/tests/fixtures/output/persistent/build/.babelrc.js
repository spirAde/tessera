module.exports = (api) => {
  api.cache(true);

  const presets = [
    ['@babel/preset-env', { useBuiltIns: 'usage', corejs: 3 }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ];

  const plugins = [
    ['@loadable/babel-plugin'],
    ['babel-plugin-styled-components', { displayName: true, ssr: true }],
  ];

  return {
    presets,
    plugins,
  };
};
