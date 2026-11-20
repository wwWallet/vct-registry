import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MetadataEditorPage } from '../src/pages/MetadataEditorPage';
import { JsonMetadataEditor } from '../src/components/JsonMetadataEditor';

const { setFormat } = vi.hoisted(() => ({ setFormat: vi.fn() }));

vi.mock('react', async (importOriginal) => ({
	...(await importOriginal<typeof import('react')>()),
	useState: (initial: unknown) => [initial, setFormat],
	useRef: (initial: unknown) => ({ current: initial }),
	useEffect: () => {},
	useCallback: (callback: unknown) => callback,
}));
vi.mock('react-router-dom', () => ({
	Link: () => null,
	useNavigate: () => vi.fn(),
	useSearchParams: () => [new URLSearchParams()],
}));
vi.mock('../src/auth', () => ({ useAuth: () => ({ handleAuthError: vi.fn() }) }));
vi.mock('../src/components/JsonMetadataEditor', () => ({ JsonMetadataEditor: () => null }));

function findElement(node: ReactNode, type: ReactElement['type']): ReactElement | undefined {
	if (Array.isArray(node)) {
		for (const child of node) {
			const found = findElement(child, type);
			if (found) return found;
		}
	}
	if (!node || typeof node !== 'object' || !('type' in node)) return undefined;
	const element = node as ReactElement<{ children?: ReactNode }>;
	return element.type === type ? element : findElement(element.props.children, type);
}

describe('metadata format changes', () => {
	const confirm = vi.fn();
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal('window', { confirm });
	});
	afterEach(() => vi.unstubAllGlobals());

	it('switches untouched templates without confirmation and protects touched content', () => {
		const page = MetadataEditorPage({ mode: 'add', onSaved: async () => {} });
		const select = findElement(page, 'select') as ReactElement<{
			onChange: (event: { target: { value: string } }) => void;
		}>;
		const editor = findElement(page, JsonMetadataEditor) as ReactElement<{
			onTouched: () => void;
		}>;
		const change = () => select.props.onChange({ target: { value: 'mso_mdoc' } });

		change();
		expect(confirm).not.toHaveBeenCalled();
		expect(setFormat).toHaveBeenCalledWith('mso_mdoc');

		editor.props.onTouched();
		confirm.mockReturnValueOnce(false);
		change();
		expect(confirm).toHaveBeenCalledOnce();
		expect(setFormat).toHaveBeenCalledTimes(1);

		confirm.mockReturnValueOnce(true);
		change();
		expect(setFormat).toHaveBeenCalledTimes(2);
		change();
		expect(confirm).toHaveBeenCalledTimes(2);
	});

	it('confirms before leaving touched content and allows opening the link in a new tab', () => {
		const page = MetadataEditorPage({ mode: 'add', onSaved: async () => {} });
		const link = findElement(page, Link) as ReactElement<{
			onClick: (event: {
				button: number;
				ctrlKey?: boolean;
				preventDefault: () => void;
			}) => void;
		}>;
		const editor = findElement(page, JsonMetadataEditor) as ReactElement<{
			onTouched: () => void;
		}>;
		const preventDefault = vi.fn();
		link.props.onClick({ button: 0, preventDefault });
		expect(confirm).not.toHaveBeenCalled();
		editor.props.onTouched();
		link.props.onClick({ button: 0, ctrlKey: true, preventDefault });
		expect(confirm).not.toHaveBeenCalled();
		confirm.mockReturnValueOnce(false).mockReturnValueOnce(true);
		link.props.onClick({ button: 0, preventDefault });
		expect(preventDefault).toHaveBeenCalledOnce();
		link.props.onClick({ button: 0, preventDefault });
		expect(confirm).toHaveBeenCalledTimes(2);
		expect(preventDefault).toHaveBeenCalledOnce();
	});
});
