export function valueExists(value: any): boolean {
	return !(typeof value === 'undefined' || value === null);
}

export function arrayNotEmpty(array: any[]): boolean {
	return valueExists(array) && array.length > 0;
}

export function arrayEmpty(array: any[]): boolean {
	return !arrayNotEmpty(array);
}

export function isEmptyString(str: string): boolean {
	return valueExists(str) && (str.trim() === '' || str.trim().length === 0);
}

export function arrayLength(array: any[], length: number): boolean {
	return arrayNotEmpty(array) && array.length === length;
}

export function areStringsEqual(str1: string, str2: string, ignoreCase: boolean = false): boolean {
	if (!valueExists(str1) || !valueExists(str2)) return false;
	else if (ignoreCase) return (str1.toLowerCase() === str2.toLowerCase());
	else return (str1 === str2);
}

// https://stackoverflow.com/a/23481096/3640307
export function arrayDeepCopy(array: any[]): any[] {
	return JSON.parse(
		JSON.stringify(array)
	);
}
