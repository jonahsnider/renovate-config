module.exports = {
	allowedCommands: [
		'^codemod workflow run --workflow /usr/src/app/codemods/crypto-random-string-v6 --target \\. --allow-dirty --no-interactive --disable-analytics$',
	],
	customEnvVariables: {
		YARNSW_COREPACK_COMPAT: 'true',
	},
	forkProcessing: 'disabled',
	gitIgnoredAuthors: [
		'114827586+autofix-ci[bot]@users.noreply.github.com',
		'29139614+renovate[bot]@users.noreply.github.com',
		'287348350+jonahsnider[bot]@users.noreply.github.com',
	],
};
