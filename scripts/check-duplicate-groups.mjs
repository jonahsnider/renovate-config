import {resolveConfigPresets} from 'renovate/dist/config/presets/index.js';
import {init} from 'renovate/dist/logger/index.js';
import localConfig from '../default.json' with {type: 'json'};

const selectorKeys = ['matchPackageNames', 'matchSourceUrls'];

const selectorSignature = rule => {
	const selectors = selectorKeys.filter(key => rule[key]?.length).map(key => [key, [...rule[key]].sort()]);

	return selectors.length > 0 ? JSON.stringify(Object.fromEntries(selectors)) : undefined;
};

process.env.LOG_LEVEL ??= 'fatal';
await init();

const {config: upstreamConfig} = await resolveConfigPresets({extends: ['config:recommended']});
const upstreamGroups = new Map(
	upstreamConfig.packageRules.filter(rule => rule.groupName && selectorSignature(rule)).map(rule => [selectorSignature(rule), rule.groupName]),
);

for (const [index, rule] of localConfig.packageRules.entries()) {
	const upstreamGroup = rule.groupName && upstreamGroups.get(selectorSignature(rule));
	if (upstreamGroup) {
		console.error(`packageRules[${index}] "${rule.groupName}" duplicates upstream "${upstreamGroup}"`);
		process.exitCode = 1;
	}
}

if (!process.exitCode) {
	console.log('No duplicate local package groups found.');
}
