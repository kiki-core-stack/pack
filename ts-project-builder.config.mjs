import del from 'rollup-plugin-delete';
import { defineConfig } from 'ts-project-builder';

export default defineConfig({
	additionalInputPlugins: { afterBuiltIns: [del({ hook: 'writeBundle', targets: './dist/types/**/*.mjs' })] },
	builtInInputPluginOptions: {
		nodeExternal: {
			include: [
				'@hono/zod-openapi',
				'@kikiutils/fs-extra',
				'ajv',
				'ajv-formats',
				'ajv-keywords',
				'axios',
				'date-fns',
				'defu',
				'glob',
				'hono',
				'mongoose',
				'nodemailer',
				'otp-io',
				'otp-io/crypto',
				'sharp',
				'wasmagic'
			]
		}
	}
});
