export function valueExists(value: any): boolean {
	return !(typeof value === 'undefined' || value === null);
}

export function arrayNotEmpty(array: any[]): boolean {
	return valueExists(array) && array.length > 0;
}

export function arrayEmpty(array: any[]): boolean {
	return !arrayNotEmpty(array);
}
