// Copied and adapted from https://github.com/clerk
import { getInfo, getInfoFromPullRequest } from '@changesets/get-github-info'

const REPOSITORY = 'ChristianIvicevic/intl-watcher'

/**
 * @type {import("@changesets/types").GetDependencyReleaseLine}
 */
const getDependencyReleaseLine = async (changesets, dependenciesUpdated) => {
	if (dependenciesUpdated.length === 0) {
		return ''
	}

	const changesetLink = `- Updated dependencies [${(
		await Promise.all(
			changesets.map(async (changeset) => {
				if (!changeset.commit) {
					return
				}
				const { links } = await getInfo({ repo: REPOSITORY, commit: changeset.commit })
				return links.commit
			}),
		)
	)
		.filter(Boolean)
		.join(', ')}]:`

	const updatedDependenciesList = dependenciesUpdated.map(
		(dependency) => `  - ${dependency.name}@${dependency.newVersion}`,
	)

	return [changesetLink, ...updatedDependenciesList].join('\n')
}

const PR_REGEX = /^\s*(?:pr|pull|pull\s+request):\s*#?(\d+)/im
const COMMIT_REGEX = /^\s*commit:\s*([^\s]+)/im
const AUTHOR_REGEX = /^\s*(?:author|user):\s*@?([^\s]+)/gim
const RENOVATE_REGEX = /fix\(deps\): update dependency ([^\s]+) to ([^\s]+)/im

/**
 * @type {import("@changesets/types").GetReleaseLine}
 */
const getReleaseLine = async (changeset) => {
	let prFromSummary
	let commitFromSummary
	const usersFromSummary = []

	const replacedChangelog = changeset.summary
		.replace(RENOVATE_REGEX, 'Update dependency $1 to $2')
		.replace(PR_REGEX, (_, pr) => {
			const num = Number(pr)
			if (!Number.isNaN(num)) {
				prFromSummary = num
			}
			return ''
		})
		.replace(COMMIT_REGEX, (_, commit) => {
			commitFromSummary = commit
			return ''
		})
		.replace(AUTHOR_REGEX, (_, user) => {
			usersFromSummary.push(user)
			return ''
		})
		.trim()

	const [firstLine, ...futureLines] = replacedChangelog.split('\n').map((l) => l.trimEnd())

	const links = await (async () => {
		if (prFromSummary !== undefined) {
			let { links } = await getInfoFromPullRequest({ repo: REPOSITORY, pull: prFromSummary })
			if (commitFromSummary) {
				links = {
					...links,
					commit: `[\`${commitFromSummary}\`](https://github.com/${REPOSITORY}/commit/${commitFromSummary})`,
				}
			}
			return links
		}
		const commitToFetchFrom = commitFromSummary ?? changeset.commit
		if (commitToFetchFrom) {
			const { links } = await getInfo({ repo: REPOSITORY, commit: commitToFetchFrom })
			return links
		}
		return { commit: null, pull: null, user: null }
	})()

	const users =
		usersFromSummary.length > 0
			? usersFromSummary
					.map((userFromSummary) => `[@${userFromSummary}](https://github.com/${userFromSummary})`)
					.join(', ')
			: links.user

	const prefix = [links.pull === null ? '' : ` (${links.pull})`, users === null ? '' : ` by ${users}`].join(
		'',
	)

	return `\n\n- ${firstLine}${prefix ? `${prefix} \n` : ''}\n${futureLines.map((l) => `  ${l}`).join('\n')}`
}

/**
 * @type {import('@changesets/types').ChangelogFunctions}
 */
const _ = { getReleaseLine, getDependencyReleaseLine }

export { getReleaseLine, getDependencyReleaseLine }
