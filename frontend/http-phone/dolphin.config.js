'use strict';

module.exports = {
    app:      'http-phone',
    version:  '1.0.0',
    platform: 'ANDROID',   // ANDROID | IOS | UNIVERSAL
    package:  'com.httpphone.app',
    entry:    'Home',       // First screen to show
    dev: {
        host:     '0.0.0.0',
        port:     7788,
        httpPort: 7787,
    },
};
