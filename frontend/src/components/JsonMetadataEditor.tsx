import { useEffect, useRef, useState } from 'react';
import JSONEditor, { type ValidationError } from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.css';
import { getMetadataSchema } from '../api/client';
import { hasMetadataChanges } from '../metadataChanges';
import { metadataId, type MetadataFormat, type TypeMetadata } from '../types';

interface JsonMetadataEditorProps {
	initialValue: TypeMetadata;
	format: MetadataFormat;
	originalIdentifier?: string;
	onChange: (metadata?: TypeMetadata) => void;
	onValidationChange: (errors: string[]) => void;
	onDirtyChange: (dirty: boolean) => void;
}

function validationMessage(entry: unknown): string {
	if (!entry || typeof entry !== 'object') return 'Metadata validation failed.';
	const candidate = entry as {
		message?: unknown;
		dataPath?: unknown;
		line?: unknown;
		error?: {
			message?: unknown;
			dataPath?: unknown;
			instancePath?: unknown;
		};
	};
	const rawMessage =
		typeof candidate.message === 'string' && candidate.message
			? candidate.message
			: typeof candidate.error?.message === 'string' && candidate.error.message
				? candidate.error.message
				: 'Metadata validation failed.';
	// jsoneditor replaces the newlines in parse errors with <br> tags.
	const message = rawMessage.replace(/<br\s*\/?>/gi, '\n');
	const rawPath =
		candidate.error?.instancePath ?? candidate.error?.dataPath ?? candidate.dataPath;
	if (typeof rawPath === 'string' && rawPath) {
		const path = rawPath.replace(/^[./]+/, '').replaceAll('/', '.');
		return `${path}: ${message}`;
	}
	if (typeof candidate.line === 'number') return `Line ${candidate.line}: ${message}`;
	return message;
}

export function JsonMetadataEditor({
	initialValue,
	format,
	originalIdentifier,
	onChange,
	onValidationChange,
	onDirtyChange,
}: JsonMetadataEditorProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [setupError, setSetupError] = useState('');
	const editedText = useRef<string | undefined>(undefined);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		let disposed = false;
		let editor: JSONEditor | undefined;
		let validationRevision = 0;
		setSetupError('');
		onChange(undefined);
		onValidationChange(['Validating metadata…']);

		// Programmatic restoration does not emit JSONEditor onChange events.
		// Publish the parsed value and validation result through the same path as typing.
		function reportContent() {
			if (disposed || !editor) return;
			onDirtyChange(hasMetadataChanges(editor.getText(), initialValue));
			const revision = ++validationRevision;
			onValidationChange(['Validating metadata…']);
			try {
				onChange(editor.get() as TypeMetadata);
			} catch {
				onChange(undefined);
			}
			void editor
				.validate()
				.then((errors) => {
					if (!disposed && revision === validationRevision) {
						onValidationChange(errors.map(validationMessage));
					}
				})
				.catch(() => {
					if (!disposed && revision === validationRevision) {
						onValidationChange(['The metadata could not be validated.']);
					}
				});
		}

		void getMetadataSchema(format)
			.then((schema) => {
				if (disposed) return;
				editor = new JSONEditor(
					container,
					{
						mode: 'code',
						mainMenuBar: false,
						statusBar: false,
						schema,
						onValidate: (value: TypeMetadata) => {
							const errors: ValidationError[] = [];
							if (
								originalIdentifier &&
								(!value || metadataId(value) !== originalIdentifier)
							) {
								errors.push({
									path: [format === 'mso_mdoc' ? 'doctype' : 'vct'],
									message: 'The type metadata identifier cannot be changed.',
								});
							}
							return errors;
						},
						onChange: reportContent,
					},
					initialValue,
				);
				if (!originalIdentifier && editedText.current !== undefined) {
					editor.setText(editedText.current);
				}
				reportContent();
			})
			.catch((reason: unknown) => {
				if (!disposed) {
					setSetupError(
						reason instanceof Error
							? reason.message
							: 'Failed to initialize the JSON editor.',
					);
					onValidationChange(['The JSON editor could not be initialized.']);
				}
			});

		return () => {
			disposed = true;
			if (editor && !originalIdentifier) {
				// Keep edited text across schema changes; pristine content uses the next template.
				const text = editor.getText();
				editedText.current = hasMetadataChanges(text, initialValue) ? text : undefined;
			}
			editor?.destroy();
		};
	}, [initialValue, format, onChange, onValidationChange, onDirtyChange, originalIdentifier]);

	return (
		<>
			<div
				ref={containerRef}
				className="react-jsoneditor"
				aria-label="Metadata JSON editor"
			/>
			{setupError && (
				<p className="mt-2 mb-0 text-sm text-vct-danger" role="alert">
					{setupError}
				</p>
			)}
		</>
	);
}
