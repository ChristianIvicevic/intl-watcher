import pc from 'picocolors'

export const SUCCESS = pc.blue(pc.bold('✓'))
export const WARN = pc.yellow(pc.bold('⚠'))
export const ERROR = pc.red(pc.bold('⨯'))
export const WAITING = pc.white(pc.bold('○'))
export const TRACE = pc.magenta(pc.bold('»'))

export const log = {
	info: (message = ''): void => console.log(message),
	success: (message: string): void => console.log(` ${SUCCESS} ${message}`),
	warn: (message: string): void => console.log(` ${WARN} ${message}`),
	error: (message: string): void => console.log(` ${ERROR} ${message}`),
	waiting: (message: string): void => console.log(` ${WAITING} ${message}`),
	trace: (message: string): void => console.log(` ${TRACE} ${message}`),
}
