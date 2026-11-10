import { Breadcrumbs } from '../components/Breadcrumbs';
import { CopyButton } from '../components/CopyButton';

export function UsagePage() {
	const registryUrl = window.location.origin;
	const examples = [
		{
			title: '1. Fetch All Metadata',
			endpoint: `GET ${registryUrl}/type-metadata/all`,
			code: `curl -s "${registryUrl}/type-metadata/all"`,
		},
		{
			title: '2. Fetch One Metadata Entry By Identifier',
			endpoint: `GET ${registryUrl}/type-metadata?identifier=<identifier>`,
			code: `curl -s "${registryUrl}/type-metadata?identifier=urn:eudi:pid:1"`,
		},
		{
			title: 'Fetch mdoc Metadata',
			endpoint: `GET ${registryUrl}/type-metadata?doctype=org.iso.18013.5.1.mDL`,
			code: `curl -s "${registryUrl}/type-metadata/all?format=mso_mdoc"`,
		},
		{
			title: '3. Browser Fetch Example',
			code: `const vct = encodeURIComponent("urn:eudi:pid:1");\nconst res = await fetch(\`${registryUrl}/type-metadata?identifier=\${vct}\`);\nconst metadata = await res.json();\nconsole.log(metadata);`,
		},
		{
			title: '4. List Available Types (Identifier, Format, and Name)',
			endpoint: `GET ${registryUrl}/type-metadata/list`,
			code: `curl -s "${registryUrl}/type-metadata/list"`,
		},
	];

	return (
		<>
			<Breadcrumbs current="Usage" />
			<section className="page-shell flex flex-col gap-4.5">
				<div className="page-header text-center">
					<h2 className="m-0 text-[1.6rem] leading-[1.1] font-bold text-[var(--vct-text)]">
						How To Fetch Metadata
					</h2>
					<p className="mx-auto mt-2.5 max-w-[60ch] text-[.95rem] leading-[1.5] text-[var(--vct-text-muted)]">
						Use these endpoints from backend services, scripts, or browser clients to
						integrate with the registry cleanly.
					</p>
				</div>
				<section className="card rounded-[14px] border border-[var(--vct-border)] bg-white/92 p-5.5 shadow-vct backdrop-blur-[6px]">
					<p className="mb-2 text-[.92rem] text-gray-600">
						Registry base URL:{' '}
						<code className="rounded bg-[color-mix(in_srgb,var(--vct-accent)_8%,white)] px-1 py-0.5 text-[.85em]">
							{registryUrl}
						</code>
					</p>
					{examples.map((example) => (
						<div
							key={example.title}
							id={example.title.startsWith('4.') ? 'type-metadata-list' : undefined}
						>
							<h3 className="mt-5 mb-2 text-[1.05rem] font-bold">{example.title}</h3>
							{example.endpoint && (
								<p className="mb-2 text-[.92rem] text-gray-600">
									Endpoint:{' '}
									<code className="rounded bg-[color-mix(in_srgb,var(--vct-accent)_8%,white)] px-1 py-0.5 text-[.85em]">
										{example.endpoint}
									</code>
								</p>
							)}
							<div className="relative mb-1">
								<CopyButton
									className="absolute top-1.75 right-1.75 size-8 bg-white"
									value={example.code}
									label="Copy example"
								/>
								<pre className="code-surface m-0 w-full overflow-x-auto rounded-[10px] border border-gray-200 bg-slate-50 py-3 pr-12 pl-3">
									<code className="block bg-transparent p-0 font-mono text-[.85rem] leading-[1.45] whitespace-pre">
										{example.code}
									</code>
								</pre>
							</div>
						</div>
					))}
				</section>
			</section>
		</>
	);
}
