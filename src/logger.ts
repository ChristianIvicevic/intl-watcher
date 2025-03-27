import pc from 'picocolors'

export const log = {
	info: (message = ''): void => console.log(message),
	success: (message: string): void => console.log(` ${pc.blue(pc.bold('✓'))} ${message}`),
	warn: (message: string): void => console.log(` ${pc.yellow(pc.bold('⚠'))} ${message}`),
	error: (message: string): void => console.log(` ${pc.red(pc.bold('⨯'))} ${message}`),
	waiting: (message: string): void => console.log(` ${pc.white(pc.bold('○'))} ${message}`),
}
