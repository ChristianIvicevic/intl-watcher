import pc from 'picocolors'

/** @internal */
export const SUCCESS = pc.blue(pc.bold('✓'))
/** @internal */
export const WARN = pc.yellow(pc.bold('⚠'))
/** @internal */
export const ERROR = pc.red(pc.bold('⨯'))
/** @internal */
export const WAITING = pc.white(pc.bold('○'))
/** @internal */
export const TRACE = pc.magenta(pc.bold('»'))

/** @internal */
export const log = {
	info: (message = ''): void => console.log(message),
	success: (message: string): void => console.log(` ${SUCCESS} ${message}`),
	warn: (message: string): void => console.warn(` ${WARN} ${message}`),
	error: (message: string): void => console.error(` ${ERROR} ${message}`),
	waiting: (message: string): void => console.log(` ${WAITING} ${message}`),
	trace: (message: string): void => console.log(` ${TRACE} ${message}`),
}
