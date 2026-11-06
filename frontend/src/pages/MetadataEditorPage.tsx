import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createMetadata, prepareMetadataIntegrity, updateMetadata } from '../api/client';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { JsonMetadataEditor } from '../components/JsonMetadataEditor';
import type { AuthState, TypeMetadata } from '../types';
import { buttonClass, cardClass, feedbackClass } from '../ui';

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
	metadata: TypeMetadata[];
	loading: boolean;
	auth: AuthState;
	onSaved: () => Promise<void>;
}

function previews(metadata?: TypeMetadata) {
	return metadata?.display?.flatMap((item) => item.rendering?.svg_templates ?? []) ?? [];
}

function previewCaption(properties?: {
	orientation?: string;
	color_scheme?: string;
	contrast?: string;
}) {
	return [
		properties?.orientation,
		properties?.color_scheme,
		properties?.contrast ? `${properties.contrast} contrast` : undefined,
	]
		.filter(Boolean)
		.join(' · ');
}

function persistedMetadata(metadata: TypeMetadata): TypeMetadata {
	const persisted = { ...metadata };
	delete persisted.previewDataUri;
	return persisted;
}

export function MetadataEditorPage({
	mode,
	metadata,
	loading,
	auth,
	onSaved,
}: MetadataEditorPageProps) {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const originalVct = mode === 'edit' ? (searchParams.get('vct') ?? '') : '';
	const selected = metadata.find((item) => item.vct === originalVct);
	const [document, setDocument] = useState<TypeMetadata | undefined>(emptyMetadata);
	const [editorInitialValue, setEditorInitialValue] = useState<TypeMetadata>(emptyMetadata);
	const [validationErrors, setValidationErrors] = useState<string[]>([]);
	const [editorRevision, setEditorRevision] = useState(0);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (mode === 'edit' && selected) {
			const persisted = persistedMetadata(selected);
			setDocument(persisted);
			setEditorInitialValue(persisted);
			setEditorRevision((revision) => revision + 1);
		}
	}, [mode, selected]);

	const handleEditorChange = useCallback((metadata?: TypeMetadata) => {
		setDocument(metadata);
	}, []);
	const handleValidationChange = useCallback((errors: string[]) => {
		setValidationErrors(errors);
	}, []);
	const title = mode === 'add' ? 'Create Metadata' : 'Edit Metadata';
	const previewList = previews(document);

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		setError('');

		if (!document || validationErrors.length) {
			setError('Fix the JSON validation errors before submitting.');
			return;
		}
		if (typeof document.vct !== 'string' || !document.vct.trim()) {
			setError('The metadata document must include a non-empty "vct" value.');
			return;
		}
		if (mode === 'edit' && document.vct !== originalVct) {
			setError('The VCT identifier cannot be changed while editing an existing entry.');
			return;
		}

		const action = mode === 'add' ? 'create' : 'update';
		const confirmation =
			mode === 'add'
				? 'Are you sure you want to create this VC Type Metadata entry? SHA-256 URI Integrity hashes will be added for all image links in the metadata, overwriting any existing integrity values.'
				: 'Are you sure you want to edit this VC Type Metadata entry? This action is irreversible. SHA-256 URI Integrity hashes will be added for all image links in the metadata, overwriting any existing integrity values.';
		if (!window.confirm(confirmation)) return;

		setSaving(true);
		try {
			const prepared = await prepareMetadataIntegrity(document);
			if (mode === 'add') await createMetadata(prepared);
			else await updateMetadata(originalVct, prepared);
			await onSaved();
			navigate(
				`/metadata?vct=${encodeURIComponent(prepared.vct)}&status=${mode === 'add' ? 'created' : 'updated'}`,
			);
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : `Failed to ${action} metadata.`);
		} finally {
			setSaving(false);
		}
	}

	if (!auth.loggedIn) {
		return (
			<>
				<Breadcrumbs current={title} parent={{ label: 'Metadata', to: '/metadata' }} />
				<section className={`${cardClass} mx-auto max-w-150 p-6 text-center`}>
					<h2 className="m-0 text-xl font-bold">Login required</h2>
					<p className="mt-2 mb-0 text-sm leading-[1.5] text-[var(--vct-text-muted)]">
						Use the Login button in the header to manage registry metadata.
					</p>
				</section>
			</>
		);
	}

	if (mode === 'edit' && loading) {
		return (
			<>
				<Breadcrumbs current={title} parent={{ label: 'Metadata', to: '/metadata' }} />
				<div className="text-center text-sm text-[var(--vct-text-muted)]">
					Loading metadata…
				</div>
			</>
		);
	}

	if (mode === 'edit' && !selected) {
		return (
			<>
				<Breadcrumbs current={title} parent={{ label: 'Metadata', to: '/metadata' }} />
				<section className={`${cardClass} mx-auto max-w-150 p-6 text-center`}>
					<h2 className="m-0 text-xl font-bold">Metadata entry not found</h2>
					<p className="mt-2 mb-4 text-sm text-[var(--vct-text-muted)]">
						Select an existing VCT before opening the editor.
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
							: `Edit VCT ${originalVct}`}
					</h2>
					<p className="mx-auto mt-2.5 max-w-[60ch] text-[.95rem] leading-[1.5] text-[var(--vct-text-muted)]">
						{mode === 'add'
							? 'Create a new registry entry by defining the VCT identity and supplying its full metadata document.'
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
									VCT
								</p>
								<code className="mt-1 block break-all text-[.8rem]">
									{document?.vct || 'Not defined'}
								</code>
							</div>
							<div className={editorStat}>
								<p className="m-0 text-[.74rem] font-bold tracking-[.05em] text-[var(--vct-text-muted)] uppercase">
									Name
								</p>
								<p className="mt-1 mb-0 text-sm font-semibold">
									{document?.name || 'Not defined'}
								</p>
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
														alt={`${document?.name || document?.vct || 'Metadata'} preview`}
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
									{document?.description || 'No description provided.'}
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
						<JsonMetadataEditor
							key={`${mode}-${originalVct}-${editorRevision}`}
							initialValue={editorInitialValue}
							originalVct={mode === 'edit' ? originalVct : undefined}
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
										<li key={`${message}-${index}`}>{message}</li>
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
									originalVct
										? `/metadata?vct=${encodeURIComponent(originalVct)}`
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
										? 'Create VCT'
										: 'Submit Changes'}
							</button>
						</div>
					</form>
				</div>
			</section>
		</>
	);
}
