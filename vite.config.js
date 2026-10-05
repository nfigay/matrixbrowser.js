import { defineConfig } from 'vite';

const REPOSITORY_NAME =
  'matrixbrowser.js';

export default defineConfig(
  ({
    mode
  }) => {

    if (
      mode ===
      'pages'
    ) {

      return {
        base:
          `/${REPOSITORY_NAME}/`
      };
    }

    return {
      base:
        './'
    };
  }
);
