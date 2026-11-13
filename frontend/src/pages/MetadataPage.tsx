import { metadataId, metadataFormat, metadataSelector } from '../types';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { deleteMetadata } from '../api/client';
import { useAuth } from '../auth';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { CopyButton } from '../components/CopyButton';
import { previewCaption, previews } from '../metadataPreview';
import type { TypeMetadata } from '../types';
import { buttonClass, cardClass, feedbackClass } from '../ui';

const stat =
	'flex flex-col gap-1 border-b border-[var(--vct-border)] pb-2.5 last:border-0 last:pb-0';
const label = 'm-0 text-[.74rem] font-bold tracking-[.05em] text-[var(--vct-text-muted)] uppercase';
const value = 'm-0 text-[.95rem] font-semibold text-[var(--vct-text)]';

export function MetadataPage({ metadata, loading, error, onMetadataChanged }: PageProps) {
	const { auth, handleAuthError } = useAuth();
	const [searchParams, setSearchParams] = useSearchParams();
	const [mutationError, setMutationError] = useState('');
	const [deleting, setDeleting] = useState(false);
	const requestedVct = metadataSelector(searchParams);
	const status = searchParams.get('status');
	const selected = useMemo(
		() => metadata.find((item) => metadataId(item) === requestedVct),
		[metadata, requestedVct],
	);
	const selectedVct = selected ? metadataId(selected) : '__all__';
	const payload = selectedVct === '__all__' ? metadata : selected;
	const metadataJson = JSON.stringify(payload ?? null, null, 2);
	const registryUrl = window.location.origin;
	const sourceUrl = selected
		? `${registryUrl}/type-metadata?identifier=${encodeURIComponent(metadataId(selected))}`
		: `${registryUrl}/type-metadata/all`;

	useEffect(() => {
		if (!status) return;
		const timeout = window.setTimeout(() => {
			setSearchParams(
				(previous) => {
					const next = new URLSearchParams(previous);
					next.delete('status');
					return next;
				},
				{ replace: true },
			);
		}, 5000);
		return () => window.clearTimeout(timeout);
	}, [setSearchParams, status]);

	async function handleDelete() {
		if (!selected) return;
		if (
			!window.confirm(
				'Are you sure you want to delete this Type Metadata entry? This action is irreversible.',
			)
		) {
			return;
		}

		setMutationError('');
		setDeleting(true);
		try {
			await deleteMetadata(metadataId(selected));
			await onMetadataChanged();
			setSearchParams({ status: 'deleted' });
		} catch (reason) {
			if (!handleAuthError(reason)) {
				setMutationError(
					reason instanceof Error ? reason.message : 'Failed to delete metadata.',
				);
			}
		} finally {
			setDeleting(false);
		}
	}

	return (
		<>
			<Breadcrumbs current="Metadata" />
			<section className="page-shell metadata-shell flex flex-col gap-4.5">
				<div className="page-header m-0 text-center">
					<h2 className="m-0 text-[1.6rem] leading-[1.1] font-bold text-[var(--vct-text)]">
						Verifiable Credential Type Metadata
					</h2>
					<p className="mx-auto mt-2.5 max-w-[60ch] text-[.95rem] leading-[1.5] text-[var(--vct-text-muted)]">
						Explore one credential definition at a time or inspect the full registry
						payload. This page is optimized for both quick browsing and raw JSON review.
					</p>
				</div>
				{auth.loggedIn && (
					<div className="mt-[-6px] flex justify-center">
						<Link
							className={buttonClass('outline', 'px-4.5 py-2.5 tracking-[.01em]')}
							to="/add"
						>
							Add new credential
						</Link>
					</div>
				)}
				{status && ['created', 'updated', 'deleted'].includes(status) && (
					<div className={feedbackClass.success} role="status">
						{status === 'deleted'
							? 'Successfully deleted Type Metadata.'
							: 'Successfully saved Type Metadata.'}
					</div>
				)}
				{mutationError && (
					<div className={feedbackClass.error} role="alert">
						{mutationError}
					</div>
				)}
				{error ? (
					<div className={feedbackClass.error}>{error}</div>
				) : loading ? (
					<div className="text-center text-sm text-gray-500">Loading metadata…</div>
				) : metadata.length ? (
					<>
						<section className={`${cardClass} metadata-selection-panel p-4.5`}>
							<div className="mb-2.5 text-center">
								<h3 className="mb-1.5 text-base leading-[normal] font-bold">
									Selection
								</h3>
								<p className="m-0 text-[.88rem] leading-[normal] text-[var(--vct-text-muted)]">
									Choose a type to inspect a single record, or switch to the
									complete registry response.
								</p>
							</div>
							<div className="flex items-center justify-center gap-3 max-[860px]:flex-col max-[860px]:items-stretch">
								<div className="max-w-140 flex-[1_1_auto]">
									<select
										className="vct-select h-9 w-full rounded-lg border border-[var(--vct-border)] bg-white px-2.5 py-2 font-[Arial] text-[.9rem] leading-[normal] text-[var(--vct-text)] outline-none focus:border-vct-accent focus:ring-3 focus:ring-[var(--vct-accent-ring)]"
										value={selectedVct}
										onChange={(event) =>
											setSearchParams(
												event.target.value === '__all__'
													? {}
													: { identifier: event.target.value },
											)
										}
									>
										<option value="__all__">(All metadata)</option>
										{metadata.map((item) => (
											<option key={metadataId(item)} value={metadataId(item)}>
												{item.name} ({metadataId(item)})
											</option>
										))}
									</select>
								</div>
								{auth.loggedIn && selected && (
									<Link
										className={buttonClass(
											'outline',
											'px-4.5 py-2.5 tracking-[.01em]',
										)}
										to={`/edit?identifier=${encodeURIComponent(metadataId(selected))}`}
									>
										Edit metadata
									</Link>
								)}
							</div>
						</section>
						<div className="metadata-layout grid grid-cols-[minmax(280px,360px)_minmax(0,1fr)] items-start gap-4 max-[860px]:grid-cols-1">
							<section className={`${cardClass} metadata-sidebar p-4.5`}>
								<div className="mb-3.5">
									<h3 className="text-base leading-[normal] font-bold">
										Details
									</h3>
								</div>
								<dl className="grid gap-2.5">
									{selected ? (
										<>
											<div className={stat}>
												<dt className={label}>Format</dt>
												<dd className={value}>
													{metadataFormat(selected)}
												</dd>
											</div>
											<div className={stat}>
												<dt className={label}>Identifier</dt>
												<dd
													className={`${value} flex items-center justify-between gap-2.5`}
												>
													<code className="break-all rounded bg-[color-mix(in_srgb,var(--vct-accent)_8%,white)] px-1 py-0.5 text-[.85em]">
														{metadataId(selected)}
													</code>
													<CopyButton
														value={metadataId(selected)}
														label="Copy identifier"
													/>
												</dd>
											</div>
											<div className={stat}>
												<dt className={label}>Name</dt>
												<dd className={value}>{selected.name}</dd>
											</div>
											{previews(selected).length > 0 && (
												<div className={stat}>
													<dt className={label}>Preview</dt>
													<dd className={value}>
														<div className="grid gap-3">
															{previews(selected).map((preview) => (
																<figure
																	className="m-0"
																	key={preview.uri}
																>
																	<img
																		className="block h-auto w-full max-w-60 rounded-[10px] border border-[var(--vct-border)] bg-[#f3f8fa]"
																		src={preview.uri}
																		alt={`${selected.name || metadataId(selected)} preview`}
																	/>
																	{previewCaption(
																		preview.properties,
																	) && (
																		<figcaption className="mt-1.5 text-[.78rem] font-normal text-gray-500 capitalize">
																			{previewCaption(
																				preview.properties,
																			)}
																		</figcaption>
																	)}
																</figure>
															))}
														</div>
													</dd>
												</div>
											)}
											{selected.description && (
												<div className={stat}>
													<dt className={label}>Description</dt>
													<dd
														className={`${value} leading-[1.45] font-medium`}
													>
														{selected.description}
													</dd>
												</div>
											)}
										</>
									) : (
										<>
											<div className={stat}>
												<dt className={label}>Showing</dt>
												<dd className={value}>All metadata entries</dd>
											</div>
											<div className={stat}>
												<dt className={label}>Total entries</dt>
												<dd className={value}>{metadata.length}</dd>
											</div>
										</>
									)}
									<div className={stat}>
										<dt className={label}>Source</dt>
										<dd
											className={`${value} flex items-center justify-between gap-2.5`}
										>
											<code className="break-all rounded bg-[color-mix(in_srgb,var(--vct-accent)_8%,white)] px-1 py-0.5 text-[.85em]">
												{sourceUrl}
											</code>
											<CopyButton value={sourceUrl} label="Copy source" />
										</dd>
									</div>
								</dl>
								{auth.loggedIn && selected && (
									<div className="mt-1">
										<button
											type="button"
											className={buttonClass('danger', 'w-full')}
											disabled={deleting}
											onClick={() => void handleDelete()}
										>
											{deleting ? 'Deleting…' : 'Delete credential'}
										</button>
									</div>
								)}
							</section>
							<section className={`${cardClass} metadata-json-panel min-w-0 p-4.5`}>
								<div className="mb-3.5 flex items-center justify-between gap-3">
									<h3 className="text-base leading-[normal] font-bold">
										Raw Metadata JSON
									</h3>
									<CopyButton
										value={metadataJson}
										label="Copy raw metadata JSON"
									/>
								</div>
								<pre className="code-surface m-0 max-h-160 w-full overflow-auto rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] p-3.5 font-mono text-[.85rem] leading-[1.4] text-[#1f2937]">
									{metadataJson}
								</pre>
							</section>
						</div>
					</>
				) : (
					<div className={feedbackClass.error}>No type metadata entries found.</div>
				)}
			</section>
		</>
	);
}

interface PageProps {
	metadata: TypeMetadata[];
	loading: boolean;
	error: string;
	onMetadataChanged: () => Promise<void>;
}
