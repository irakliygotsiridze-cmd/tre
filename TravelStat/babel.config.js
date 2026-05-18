module.exports = function (api) {
  const isTest = process.env.NODE_ENV === 'test';
  api.cache(!isTest);
  return {
    presets: [
      [
        'babel-preset-expo',
        isTest ? { reanimated: false } : {},
      ],
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: { '@': './src' },
        },
      ],
      ...(isTest ? [] : ['react-native-worklets/plugin']),
    ],
  };
};
