module.exports = {
	allowedCommands: [
		'^codemod workflow run --workflow /usr/src/app/codemods/crypto-random-string-v6 --target \\. --allow-dirty --no-interactive --disable-analytics$',
	],
	customEnvVariables: {
		YARNSW_COREPACK_COMPAT: 'true',
	},
	forkProcessing: 'disabled',
	gitIgnoredAuthors: ['29139614+renovate[bot]@users.noreply.github.com'],
};
