import { useEffect, useRef, useState } from 'react';
import JSONEditor, { type ValidationError } from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.css';
import { getMetadataSchema } from '../api/client';
import type { TypeMetadata } from '../types';

interface JsonMetadataEditorProps {
	initialValue: TypeMetadata;
	originalVct?: string;
	onChange: (metadata?: TypeMetadata) => void;
	onValidationChange: (errors: string[]) => void;
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
	originalVct,
	onChange,
	onValidationChange,
}: JsonMetadataEditorProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [setupError, setSetupError] = useState('');

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		let disposed = false;
		let editor: JSONEditor | undefined;

		void getMetadataSchema()
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
							if (originalVct && value?.vct !== originalVct) {
								errors.push({
									path: ['vct'],
									message: 'The VCT identifier cannot be changed.',
								});
							}
							return errors;
						},
						onValidationError: (errors) => {
							onValidationChange(errors.map(validationMessage));
						},
						onChange: () => {
							try {
								onChange(editor?.get() as TypeMetadata);
							} catch {
								onChange(undefined);
							}
						},
					},
					initialValue,
				);
				void editor.validate();
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
			editor?.destroy();
		};
	}, [initialValue, onChange, onValidationChange, originalVct]);

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
