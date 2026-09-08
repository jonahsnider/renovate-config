import type {Codemod, Edit, SgNode} from 'codemod:ast-grep';
import type TSX from 'codemod:ast-grep/langs/tsx';

const packageName = 'crypto-random-string';
const removedExport = 'cryptoRandomStringAsync';

const codemod: Codemod<TSX> = async root => {
	const rootNode = root.root();
	const edits: Array<Edit> = [];

	for (const importNode of rootNode.findAll({rule: {kind: 'import_statement'}})) {
		const parsedImport = parseImport(importNode.text());
		if (!parsedImport) {
			continue;
		}

		const asyncSpecifier = parsedImport.namedImports.find(({imported}) => imported === removedExport);
		if (!asyncSpecifier) {
			continue;
		}

		const syncLocalName = parsedImport.defaultImport ?? (asyncSpecifier.local === removedExport ? 'cryptoRandomString' : asyncSpecifier.local);
		const remainingNamedImports = parsedImport.namedImports.filter(({imported}) => imported !== removedExport);
		const replacement = formatImport(syncLocalName, remainingNamedImports, parsedImport.quote, parsedImport.semicolon);
		const awaitedCalls = findDirectlyAwaitedCalls(rootNode, asyncSpecifier.local);

		for (const awaitedCall of awaitedCalls) {
			const synchronousCall = awaitedCall
				.text()
				.replace(/^await\s+/u, '')
				.replace(new RegExp(`^${escapeRegExp(asyncSpecifier.local)}(?=\\s*\\()`, 'u'), syncLocalName);
			edits.push(awaitedCall.replace(synchronousCall));
		}

		if (syncLocalName !== asyncSpecifier.local) {
			edits.push(...renameReferences(importNode, asyncSpecifier.local, syncLocalName, awaitedCalls));
		}

		edits.push(importNode.replace(replacement));
	}

	return edits.length === 0 ? null : rootNode.commitEdits(edits);
};

interface NamedImport {
	imported: string;
	local: string;
}

interface ParsedImport {
	defaultImport?: string;
	namedImports: Array<NamedImport>;
	quote: '"' | "'";
	semicolon: boolean;
}

function parseImport(source: string): ParsedImport | undefined {
	const match = /^import\s+([\s\S]+?)\s+from\s+(["'])crypto-random-string\2\s*(;?)$/.exec(source.trim());
	if (!match?.[1] || (match[2] !== '"' && match[2] !== "'")) {
		return undefined;
	}

	const clause = match[1].trim();
	const namedStart = clause.indexOf('{');
	const namedEnd = clause.lastIndexOf('}');
	if (namedStart === -1 || namedEnd < namedStart) {
		return undefined;
	}

	const defaultImport = clause.slice(0, namedStart).trim().replace(/,$/, '').trim() || undefined;
	if (defaultImport?.startsWith('*')) {
		return undefined;
	}

	const namedImports = clause
		.slice(namedStart + 1, namedEnd)
		.split(',')
		.map(specifier => specifier.trim())
		.filter(Boolean)
		.map(specifier => {
			const [imported, local] = specifier.split(/\s+as\s+/u);
			return {imported: imported!, local: local ?? imported!};
		});

	return {
		defaultImport,
		namedImports,
		quote: match[2],
		semicolon: match[3] === ';',
	};
}

function formatImport(defaultImport: string, namedImports: Array<NamedImport>, quote: '"' | "'", semicolon: boolean): string {
	const namedClause = namedImports.map(({imported, local}) => (imported === local ? imported : `${imported} as ${local}`)).join(', ');
	const clause = namedClause ? `${defaultImport}, { ${namedClause} }` : defaultImport;
	return `import ${clause} from ${quote}${packageName}${quote}${semicolon ? ';' : ''}`;
}

function findDirectlyAwaitedCalls(rootNode: SgNode<TSX>, localName: string): Array<SgNode<TSX>> {
	const directCall = new RegExp(`^await\\s+${escapeRegExp(localName)}\\s*\\(`, 'u');
	return rootNode.findAll({rule: {kind: 'await_expression'}}).filter(node => directCall.test(node.text()));
}

function renameReferences(importNode: SgNode<TSX>, oldName: string, newName: string, excludedAncestors: Array<SgNode<TSX>>): Array<Edit> {
	const binding = importNode.findAll({rule: {kind: 'identifier'}}).find(identifier => identifier.text() === oldName);
	if (!binding) {
		return [];
	}

	return binding
		.references()
		.flatMap(({nodes}) => nodes)
		.filter(reference =>
			excludedAncestors.every(ancestor => {
				const ancestorRange = ancestor.range();
				const referenceRange = reference.range();
				return referenceRange.start.index < ancestorRange.start.index || referenceRange.end.index > ancestorRange.end.index;
			}),
		)
		.map(reference => reference.replace(newName));
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default codemod;
