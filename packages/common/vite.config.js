/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { glob } from 'glob'
import { fileURLToPath } from 'node:url'
import generateComments from '@opentiny/tiny-engine-vite-plugin-meta-comments'

const jsEntries = glob.sync('./js/**/*.js').map((file) => {
  return [file.slice(0, file.length - path.extname(file).length), fileURLToPath(new URL(file, import.meta.url))]
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [generateComments(), vue(), vueJsx()],
  publicDir: false,
  resolve: {},
  base: './',
  define: {
    'import.meta': 'import.meta',
    'import.meta.env.MODE': 'import.meta.env.MODE',
    'import.meta.env.PROD': 'import.meta.env.PROD',
    'import.meta.env.BASE_URL': 'import.meta.env.BASE_URL',
    'import.meta.env.VITE_ORIGIN': 'import.meta.env.VITE_ORIGIN',
    'import.meta.env.VITE_CDN_DOMAIN': 'import.meta.env.VITE_CDN_DOMAIN',
    'import.meta.env.VITE_API_MOCK': 'import.meta.env.VITE_API_MOCK'
  },
  build: {
    cssCodeSplit: false,
    lib: {
      entry: {
        index: path.resolve(__dirname, './index.js'),
        ...Object.fromEntries(jsEntries)
      },
      name: 'common',
      fileName: (format, entryName) => `${entryName}.js`,
      formats: ['es']
    },
    rollupOptions: {
      output: {
        banner: (chunk) => {
          if (chunk.name === 'index') {
            return 'import "./style.css"'
          }

          return ''
        }
      },
      external: [
        'vue',
        'vue-i18n',
        'monaco-editor',
        /@opentiny\/tiny-engine.*/,
        /@opentiny\/vue.*/,
        /^prettier.*/,
        /^@babel.*/
      ]
    }
  }
})
