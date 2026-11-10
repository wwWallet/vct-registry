import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createMetadata, getMetadataEntry, updateMetadata } from '../api/client';
import { useAuth } from '../auth';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { JsonMetadataEditor } from '../components/JsonMetadataEditor';
import { previewCaption, previews } from '../metadataPreview';
import { metadataId, metadataSelector, type MetadataFormat, type TypeMetadata } from '../types';
import { buttonClass, cardClass, feedbackClass } from '../ui';
import { addMetadataUriIntegrity } from '../uriIntegrity';

const emptyMetadata: TypeMetadata = {
	vct: '',
	name: '',
	display: [{}],
	claims: [{ path: ['vct'], mandatory: true, sd: 'never' }],
};

const editorStat =
	'flex flex-col gap-1 border-b border-[var(--vct-border)] pb-2.5 last:border-0 last:pb-0';

interface MetadataEditorPageProps {
	mode: 'add' | 'edit';
	onSaved: () => Promise<void>;
}

function text(value: unknown, fallback: string) {
	return typeof value === 'string' && value ? value : fallback;
}

export function MetadataEditorPage({ mode, onSaved }: MetadataEditorPageProps) {
	const { handleAuthError } = useAuth();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const originalIdentifier = mode === 'edit' ? metadataSelector(searchParams) : '';
	const [format, setFormat] = useState<MetadataFormat>('dc+sd-jwt');
	const [initialText, setInitialText] = useState<string | undefined>();
	const drafts = useRef<Partial<Record<MetadataFormat, string>>>({});
	const [document, setDocument] = useState<TypeMetadata | undefined>(
		mode === 'add' ? emptyMetadata : undefined,
	);
	const [editorInitialValue, setEditorInitialValue] = useState<TypeMetadata>(emptyMetadata);
	const [validationErrors, setValidationErrors] = useState<string[]>([]);
	const [editorRevision, setEditorRevision] = useState(0);
	const [loadingEntry, setLoadingEntry] = useState(mode === 'edit');
	const [entryLoaded, setEntryLoaded] = useState(false);
	const [loadError, setLoadError] = useState('');
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (mode !== 'edit') return;
		if (!originalIdentifier) {
			setLoadingEntry(false);
			return;
		}

		const controller = new AbortController();
		setDocument(undefined);
		setEntryLoaded(false);
		setLoadingEntry(true);
		setLoadError('');

		void getMetadataEntry(originalIdentifier, controller.signal)
			.then((entry) => {
				if (controller.signal.aborted) return;
				setFormat(entry.format);
				setDocument(entry.metadata);
				setEditorInitialValue(entry.metadata);
				setEditorRevision((revision) => revision + 1);
				setEntryLoaded(true);
			})
			.catch((reason: unknown) => {
				if (!controller.signal.aborted) {
					setLoadError(
						reason instanceof Error ? reason.message : 'Failed to load metadata.',
					);
				}
			})
			.finally(() => {
				if (!controller.signal.aborted) setLoadingEntry(false);
			});

		return () => controller.abort();
	}, [mode, originalIdentifier]);

	const handleEditorChange = useCallback((metadata?: TypeMetadata) => {
		setDocument(metadata);
	}, []);
	const handleValidationChange = useCallback((errors: string[]) => {
		setValidationErrors(errors);
	}, []);
	const handleTextChange = useCallback(
		(value: string) => {
			drafts.current[format] = value;
		},
		[format],
	);
	function changeFormat(next: MetadataFormat) {
		setFormat(next);
		setInitialText(drafts.current[next]);
		const initial: TypeMetadata =
			next === 'mso_mdoc'
				? { doctype: '', name: '', display: [{}], claims: [] }
				: emptyMetadata;
		setEditorInitialValue(initial);
		try {
			setDocument(
				JSON.parse(drafts.current[next] ?? JSON.stringify(initial)) as TypeMetadata,
			);
		} catch {
			setDocument(undefined);
		}
		setValidationErrors(['Validating metadata…']);
	}
	const title = mode === 'add' ? 'Create Metadata' : 'Edit Metadata';
	const previewList = previews(document);
	const documentVct = text(document && metadataId(document), 'Not defined');
	const documentName = text(document?.name, 'Not defined');
	const documentDescription = text(document?.description, 'No description provided.');
	const previewAlt = text(document?.name, text(document && metadataId(document), 'Metadata'));

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		setError('');

		if (!document || validationErrors.length) {
			setError('Fix the JSON validation errors before submitting.');
			return;
		}
		if (typeof metadataId(document) !== 'string' || !metadataId(document).trim()) {
			setError('The metadata document must include a non-empty identifier value.');
			return;
		}
		if (mode === 'edit' && metadataId(document) !== originalIdentifier) {
			setError(
				'The type metadata identifier cannot be changed while editing an existing entry.',
			);
			return;
		}

		const action = mode === 'add' ? 'create' : 'update';
		const confirmation =
			mode === 'add'
				? 'Are you sure you want to create this Type Metadata entry? SHA-256 URI Integrity hashes will be added for all image links in the metadata, overwriting any existing integrity values.'
				: 'Are you sure you want to edit this Type Metadata entry? This action is irreversible. SHA-256 URI Integrity hashes will be added for all image links in the metadata, overwriting any existing integrity values.';
		if (!window.confirm(confirmation)) return;

		setSaving(true);
		try {
			const prepared = await addMetadataUriIntegrity(document);
			if (mode === 'add') await createMetadata(prepared);
			else await updateMetadata(originalIdentifier, prepared);
			await onSaved();
			navigate(
				`/metadata?identifier=${encodeURIComponent(metadataId(prepared))}&status=${mode === 'add' ? 'created' : 'updated'}`,
			);
		} catch (reason) {
			if (!handleAuthError(reason)) {
				setError(
					reason instanceof Error ? reason.message : `Failed to ${action} metadata.`,
				);
			}
		} finally {
			setSaving(false);
		}
	}

	if (mode === 'edit' && loadingEntry) {
		return (
			<>
				<Breadcrumbs current={title} parent={{ label: 'Metadata', to: '/metadata' }} />
				<div className="text-center text-sm text-[var(--vct-text-muted)]">
					Loading metadata…
				</div>
			</>
		);
	}

	if (mode === 'edit' && (loadError || !entryLoaded)) {
		return (
			<>
				<Breadcrumbs current={title} parent={{ label: 'Metadata', to: '/metadata' }} />
				<section className={`${cardClass} mx-auto max-w-150 p-6 text-center`}>
					<h2 className="m-0 text-xl font-bold">
						{loadError ? 'Unable to load metadata' : 'Metadata entry not found'}
					</h2>
					<p className="mt-2 mb-4 text-sm text-[var(--vct-text-muted)]">
						{loadError ||
							'Select an existing type metadata entry before opening the editor.'}
					</p>
					<Link className={buttonClass('secondary')} to="/metadata">
						Return to metadata
					</Link>
				</section>
			</>
		);
	}

	return (
		<>
			<Breadcrumbs current={title} parent={{ label: 'Metadata', to: '/metadata' }} />
			<section className="page-shell flex flex-col gap-4.5">
				<div className="page-header text-center">
					<h2 className="m-0 text-[1.6rem] leading-[1.1] font-bold">
						{mode === 'add'
							? 'Create Verifiable Credential Type Metadata'
							: `Edit ${originalIdentifier} Type Metadata`}
					</h2>
					<p className="mx-auto mt-2.5 max-w-[60ch] text-[.95rem] leading-[1.5] text-[var(--vct-text-muted)]">
						{mode === 'add'
							? 'Create a new registry entry by defining the type identifier and supplying its full metadata document.'
							: 'Review and update the selected registry entry, then save the latest metadata to the registry.'}
					</p>
				</div>

				<div className="grid grid-cols-[minmax(280px,360px)_minmax(0,1fr)] items-start gap-4 max-[860px]:grid-cols-1">
					<aside className={`${cardClass} p-4.5`}>
						<div className="mb-3.5">
							<h3 className="m-0 mb-1.5 text-base leading-[normal] font-bold">
								Details
							</h3>
							<p className="m-0 text-[.88rem] text-[var(--vct-text-muted)]">
								{mode === 'add'
									? 'Define the credential identity and preview how the metadata card will render.'
									: 'Review the selected credential metadata and its current preview while editing.'}
							</p>
						</div>
						<div className="grid gap-2.5">
							<div className={editorStat}>
								<p className="m-0 text-[.74rem] font-bold tracking-[.05em] text-[var(--vct-text-muted)] uppercase">
									Identifier
								</p>
								<code className="mt-1 block break-all text-[.8rem]">
									{documentVct}
								</code>
							</div>
							<div className={editorStat}>
								<p className="m-0 text-[.74rem] font-bold tracking-[.05em] text-[var(--vct-text-muted)] uppercase">
									Name
								</p>
								<p className="mt-1 mb-0 text-sm font-semibold">{documentName}</p>
							</div>
							<div className={editorStat}>
								<p className="m-0 text-[.74rem] font-bold tracking-[.05em] text-[var(--vct-text-muted)] uppercase">
									Preview
								</p>
								{previewList.length ? (
									<div className="mt-2 grid gap-3">
										{previewList.map((preview) => {
											const caption = previewCaption(preview.properties);
											return (
												<figure
													className="m-0"
													key={`${preview.uri}-${caption}`}
												>
													<img
														className="block h-auto w-full max-w-60 rounded-[10px] border border-[var(--vct-border)] bg-[#f3f8fa]"
														src={preview.uri}
														alt={`${previewAlt} preview`}
													/>
													{caption && (
														<figcaption className="mt-1.5 text-[.78rem] text-gray-500 capitalize">
															{caption}
														</figcaption>
													)}
												</figure>
											);
										})}
									</div>
								) : (
									<p className="mt-1 mb-0 text-sm text-[var(--vct-text-muted)]">
										No preview available.
									</p>
								)}
							</div>
							<div className={editorStat}>
								<p className="m-0 text-[.74rem] font-bold tracking-[.05em] text-[var(--vct-text-muted)] uppercase">
									Description
								</p>
								<p className="mt-1 mb-0 text-sm leading-[1.45] text-[var(--vct-text-muted)]">
									{documentDescription}
								</p>
							</div>
						</div>
					</aside>

					<form
						className={`${cardClass} min-w-0 p-4.5`}
						onSubmit={(event) => void handleSubmit(event)}
					>
						<div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
							<div>
								<h3 className="m-0 text-base leading-[normal] font-bold">
									Metadata JSON
								</h3>
								<p className="mt-1.5 mb-0 text-[.88rem] text-[var(--vct-text-muted)]">
									{mode === 'add'
										? 'Edit the full type metadata document directly.'
										: 'Update the full type metadata document directly.'}
								</p>
							</div>
						</div>
						<div className={feedbackClass.info}>
							URI integrity values are calculated on submission using SHA-256.
							Existing integrity algorithms are preserved and their values are
							refreshed.
						</div>
						<label className="my-3 block">
							Metadata format
							{mode === 'add' ? (
								<select
									aria-label="Metadata format"
									value={format}
									onChange={(event) =>
										changeFormat(event.target.value as MetadataFormat)
									}
								>
									<option value="dc+sd-jwt">dc+sd-jwt</option>
									<option value="mso_mdoc">mso_mdoc</option>
								</select>
							) : (
								<code className="ml-2">{format}</code>
							)}
						</label>
						<JsonMetadataEditor
							key={`${mode}-${originalIdentifier}-${editorRevision}-${format}`}
							format={format}
							initialText={initialText}
							onTextChange={handleTextChange}
							initialValue={editorInitialValue}
							originalIdentifier={mode === 'edit' ? originalIdentifier : undefined}
							onChange={handleEditorChange}
							onValidationChange={handleValidationChange}
						/>
						{validationErrors.length > 0 && (
							<div className={`${feedbackClass.error} mt-2`} role="status">
								<p className="m-0 text-[.85rem] font-semibold">
									Fix {validationErrors.length} validation{' '}
									{validationErrors.length === 1 ? 'error' : 'errors'} before
									submitting:
								</p>
								<ul className="mt-1.5 mb-0 list-disc space-y-1 pl-5 text-[.82rem]">
									{validationErrors.map((message, index) => (
										<li
											key={`${message}-${index}`}
											className="whitespace-pre-line"
										>
											{message}
										</li>
									))}
								</ul>
							</div>
						)}

						{error && (
							<p className={feedbackClass.error} role="alert">
								{error}
							</p>
						)}

						<div className="mt-3 flex items-stretch gap-2 max-[520px]:flex-col">
							<Link
								className={buttonClass('secondary', 'flex-1')}
								to={
									originalIdentifier
										? `/metadata?identifier=${encodeURIComponent(originalIdentifier)}`
										: '/metadata'
								}
							>
								Cancel
							</Link>
							<button
								type="submit"
								className={buttonClass('primary', 'flex-3')}
								disabled={saving || !document || validationErrors.length > 0}
							>
								{saving
									? 'Saving…'
									: mode === 'add'
										? 'Create Metadata'
										: 'Submit Changes'}
							</button>
						</div>
					</form>
				</div>
			</section>
		</>
	);
}
