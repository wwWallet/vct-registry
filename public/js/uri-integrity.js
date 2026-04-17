const algoMap = {
		sha256: 'SHA-256',
		sha384: 'SHA-384',
		sha512: 'SHA-512',
	};

async function calculateUriIntegrity(
	input,
	algorithm
) {
	let buffer;
	
	const response = await fetch(input);
	if (!response.ok) {
		throw new Error(`Failed to fetch URL: ${response.statusText}`);
	}
	buffer = await response.arrayBuffer();

	const hashBuffer = await crypto.subtle.digest(algoMap[algorithm], buffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));
	return `${algorithm}-${hashBase64}`;
}

function getUriPaths(obj, path = []) {
  let results = [];

  if (Array.isArray(obj)) {
	obj.forEach((item, index) => {
	  results = results.concat(
		getUriPaths(item, [...path, index])
	  );
	});
  } else if (obj && typeof obj === "object") {
	if ("uri" in obj) {
	  results.push([...path]);
	}

	Object.keys(obj).forEach((key) => {
	  results = results.concat(
		getUriPaths(obj[key], [...path, key])
	  );
	});
  }

  return results;
}

function getValueAtPath(obj, path) {
  return path.reduce((current, key) => {
	if (current && typeof current === "object") {
	  return current[key];
	}
	return undefined;
  }, obj);
}

function setValueAtPath(obj, path, value) {
  const lastKey = path[path.length - 1];
  const parent = path.slice(0, -1).reduce((current, key) => {
	if (current && typeof current === "object") {
	  return current[key];
	}
	return undefined;
  }, obj);

  if (!parent || typeof parent !== "object") {
	return;
  }

  if (lastKey === "uri#integrity" && "uri" in parent) {
	if (lastKey in parent) {
	  parent[lastKey] = value;
	  return;
	}

	const ordered = {};
	for (const [key, existingValue] of Object.entries(parent)) {
	  ordered[key] = existingValue;
	  if (key === "uri") {
		ordered[lastKey] = value;
	  }
	}

	Object.keys(parent).forEach((key) => delete parent[key]);
	Object.assign(parent, ordered);
	return;
  }

  parent[lastKey] = value;
}

export async function addUriIntegrityToEditor(editor) {
  const editorData = editor.get();
  const uriPaths = getUriPaths(editorData);

  for (const uriPath of uriPaths) {
	const uriValue = getValueAtPath(editorData, [...uriPath, "uri"]);
	if (!uriValue) continue;

	const integrityValue = await calculateUriIntegrity(uriValue, "sha256");
	setValueAtPath(editorData, [...uriPath, "uri#integrity"], integrityValue);
  }

  editor.set(editorData);
}

export function getUriIntegrityPaths(obj, path = []) {
  let results = [];

  if (Array.isArray(obj)) {
	obj.forEach((item, index) => {
	  results = results.concat(
		getUriIntegrityPaths(item, [...path, index])
	  );
	});
  } else if (obj && typeof obj === "object") {
	if ("uri#integrity" in obj) {
	  results.push([...path, "uri#integrity"]);
	}

	Object.keys(obj).forEach((key) => {
	  results = results.concat(
		getUriIntegrityPaths(obj[key], [...path, key])
	  );
	});
  }

  return results;
}