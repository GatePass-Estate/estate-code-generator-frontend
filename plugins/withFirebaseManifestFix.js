const { withAndroidManifest } = require('expo/config-plugins');

const OVERRIDES = {
  'com.google.firebase.messaging.default_notification_channel_id': {
    attr: 'android:value',
    value: 'default',
  },
  'com.google.firebase.messaging.default_notification_color': {
    attr: 'android:resource',
    value: '@color/notification_icon_color',
  },
};

module.exports = function withFirebaseManifestFix(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    const app = manifest.application[0];
    app['meta-data'] = app['meta-data'] || [];

    for (const [name, { attr, value }] of Object.entries(OVERRIDES)) {
      let item = app['meta-data'].find((m) => m.$['android:name'] === name);
      if (!item) {
        item = { $: { 'android:name': name, [attr]: value } };
        app['meta-data'].push(item);
      }
      item.$['tools:replace'] = attr;
    }

    return config;
  });
};
