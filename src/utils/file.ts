import { WASMagic } from 'wasmagic';

import { acceptedImageMimeTypes } from '@/constants/image';

const wasMagic = await WASMagic.create();
export const getFileMimeType = async (file: Blob) => wasMagic.detect(new Uint8Array(await file.slice(0, 2048).arrayBuffer()));

export async function getAcceptedImageFileMimeType(file: Blob, acceptGif?: boolean) {
	const fileMimeType = await getFileMimeType(file);
	if (fileMimeType === 'image/gif') {
		if (!acceptGif) return;
	} else if (!acceptedImageMimeTypes.includes(fileMimeType)) return;
	return fileMimeType;
}
