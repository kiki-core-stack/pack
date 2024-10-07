import { mkdirp, writeFile } from '@kikiutils/fs-extra';

import { Piscina } from 'piscina';

import { acceptedImageMimeTypes } from '../constants/image';

// Create was magic worker file
if (!(await mkdirp('./.cache/workers'))) throw new Error('Cannot create `./.cache/workers` directory');
const writeFileResult = await writeFile('./.cache/workers/was-magic.mjs', `import{WASMagic as a}from'wasmagic';const b=await a.create();export default(c)=>b.detect(c);`);
if (!writeFileResult) throw new Error('Cannot create was magic worker file');

export const isAcceptedImageFile = async (file: Blob, acceptGif?: boolean) => {
	const fileMimeType = await getFileMimeType(file);
	if (acceptGif && fileMimeType === 'image/gif') return true;
	return acceptedImageMimeTypes.includes(fileMimeType);
};

export const getFileMimeType = async (file: Blob) => await wasMagicPiscina.run(new Uint8Array(await file.slice(0, 2048).arrayBuffer()));
const wasMagicPiscina = new Piscina<Uint8Array, string>({ filename: './.cache/workers/was-magic.mjs' });
