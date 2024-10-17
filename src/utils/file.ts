import { WASMagic } from 'wasmagic';

import { acceptedImageMimeTypes } from '@/constants/image';

export const isAcceptedImageFile = async (file: Blob, acceptGif?: boolean) => {
	const fileMimeType = await getFileMimeType(file);
	if (acceptGif && fileMimeType === 'image/gif') return true;
	return acceptedImageMimeTypes.includes(fileMimeType);
};

export const getFileMimeType = async (file: Blob) => wasMagic.detect(new Uint8Array(await file.slice(0, 2048).arrayBuffer()));
const wasMagic = await WASMagic.create();
