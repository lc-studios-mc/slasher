interface Console {
	log(...data: any[]): void;
	warn(...data: any[]): void;
	error(...data: any[]): void;
}

declare const console: Console;
