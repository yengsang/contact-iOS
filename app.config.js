const { expo } = require('./app.json');

const appVariant = process.env.APP_VARIANT === 'production' ? 'production' : 'staging';
const isProduction = appVariant === 'production';

const appName = isProduction ? 'Contact-iOS' : 'Contact-iOS Staging';
const apiBaseUrl = isProduction ? 'https://api.findocly.com' : 'https://api.yengsang.com';
const iosBundleIdentifier = isProduction
  ? 'com.yengsang.contactios'
  : 'com.yengsang.contactios.staging';
const scheme = isProduction ? 'contactios' : 'contactios-staging';

module.exports = {
  expo: {
    ...expo,
    name: appName,
    scheme,
    ios: {
      ...expo.ios,
      bundleIdentifier: iosBundleIdentifier,
    },
    extra: {
      ...expo.extra,
      apiBaseUrl,
      appVariant,
    },
  },
};
