import type { SvgTemplate, TypeMetadata } from './types';

/**
 * Lists the SVG templates of every display entry. The metadata can come from the
 * editor while it is being typed, so values of the wrong type are skipped.
 */
export function previews(metadata?: TypeMetadata): SvgTemplate[] {
	if (!Array.isArray(metadata?.display)) return [];

	return metadata.display.flatMap((item) => {
		if (!item || typeof item !== 'object') return [];
		const templates = item.rendering?.svg_templates;
		if (!Array.isArray(templates)) return [];

		return templates.filter(
			(template) =>
				template && typeof template === 'object' && typeof template.uri === 'string',
		);
	});
}

export function previewCaption(properties?: SvgTemplate['properties']): string {
	return [
		properties?.orientation,
		properties?.color_scheme,
		properties?.contrast ? `${properties.contrast} contrast` : undefined,
	]
		.filter(Boolean)
		.join(' · ');
}
