// @ts-check

export type Vec2 = readonly [x: number, y: number] & { __opaque: "StructVec2" }

export type Dir = "U" | "R" | "D" | "L"

export type Arrow = "^" | ">" | "v" | "<"

/**
 * @param {number} x
 * @param {number} y
 * @returns {Vec2}
 */
const cache = new Map()

/**
 * Allows compare vecs by reference, e.g. `vec(1, 2) === vec(1, 2)` will be true
 */
export function enableCachedVec() {
	vec = (x, y) => {
		if (!cache.has(`${x},${y}`)) {
			cache.set(`${x},${y}`, [x, y])
		}
		return cache.get(`${x},${y}`)
	}
}

/** @type {(x: number, y: number) => Vec2}  */
export let vec: (x: number, y: number) => Vec2 = (x, y): Vec2 =>
	[x, y] as unknown as Vec2

/** @type {Record<Dir, Vec2>} */
export const DIR_TO_VEC: Record<Dir, Vec2> = {
	U: vec(0, -1),
	D: vec(0, 1),
	L: vec(-1, 0),
	R: vec(1, 0),
}

/** @type {Record<Arrow, Vec2>} */
export const ARROW_TO_VEC: Record<Arrow, Vec2> = {
	"^": vec(0, -1),
	v: vec(0, 1),
	"<": vec(-1, 0),
	">": vec(1, 0),
}

export const DIRS_4 = [DIR_TO_VEC.U, DIR_TO_VEC.R, DIR_TO_VEC.D, DIR_TO_VEC.L]

export const DIRS_8 = [
	vec(-1, -1),
	vec(0, -1),
	vec(1, -1),
	vec(-1, 0),
	vec(1, 0),
	vec(-1, 1),
	vec(0, 1),
	vec(1, 1),
]

export const DIRS_4_DIAG = [vec(-1, -1), vec(1, -1), vec(-1, 1), vec(1, 1)]

export const around = (/** @type {Vec2} */ vec: Vec2, dirs = DIRS_8) =>
	dirs.map((d) => add(vec, d))

/**
 *
 * @param {string} dir
 * @returns {Dir}
 */
export const asDir = (dir: string): Dir => {
	if (dir in DIR_TO_VEC) {
		return dir as Dir
	}

	throw new Error(`Invalid direction: ${dir}`)
}

/**
 * @param {string} dir
 * @returns {Arrow}
 */
export const asArrow = (dir: string): Arrow => {
	if (dir in ARROW_TO_VEC) {
		return dir as Arrow
	}

	throw new Error(`Invalid direction: ${dir}`)
}

/**
 *
 * @param {Vec2} vec
 * @returns {Vec2}
 */
export const signed = ([x, y]: Vec2): Vec2 => vec(Math.sign(x), Math.sign(y))

/**
 *
 * @param {Vec2} vecA
 * @param {Vec2} vecB
 * @returns {Vec2}
 */
export const add = ([x1, y1]: Vec2, [x2, y2]: Vec2): Vec2 =>
	vec(x1 + x2, y1 + y2)

/**
 *
 * @param {Vec2} vecA
 * @param {Vec2} vecB
 * @returns {Vec2}
 */
export const sub = ([x1, y1]: Vec2, [x2, y2]: Vec2): Vec2 =>
	vec(x1 - x2, y1 - y2)

/**
 *
 * @param {Vec2} param0
 * @param {number} s
 * @returns {Vec2}
 */
export const scale = ([x, y]: Vec2, s: number): Vec2 => vec(x * s, y * s)

/**
 *
 * @param {Vec2} vecA
 * @param {Vec2} vecB
 * @returns {number}
 */
export const cross = ([x1, y1]: Vec2, [x2, y2]: Vec2): number =>
	x1 * y2 - y1 * x2

/**
 *
 * @param {Vec2} vecA
 * @param {Vec2} vecB
 * @returns {number}
 */
export const dot = ([x1, y1]: Vec2, [x2, y2]: Vec2): number => x1 * x2 + y1 * y2

/**
 * @param {Dir} dir
 * @returns {Vec2}
 */
export const fromDir = (dir: Dir): Vec2 => DIR_TO_VEC[dir]

/**
 * @param {Arrow} arrow
 * @returns {Vec2}
 */
export const fromArrow = (arrow: Arrow): Vec2 => ARROW_TO_VEC[arrow]

/**
 * @returns {Vec2}
 */
export const zero = (): Vec2 => vec(0, 0)

/**
 * @param {Vec2} vec
 */
export const x = (vec: Vec2) => vec[0]

/**
 * @param {Vec2} vec
 */
export const y = (vec: Vec2) => vec[1]

/**
 * @param {unknown} arg
 * @returns {arg is Vec2}
 */
export const isVec = (arg: unknown): arg is Vec2 =>
	Array.isArray(arg) &&
	arg.length === 2 &&
	typeof arg[0] === "number" &&
	typeof arg[1] === "number"

/**
 * @param {Vec2} vecA
 * @param {Vec2} vecB
 * @returns {boolean}
 */
export const eq = (vecA: Vec2, vecB: Vec2): boolean =>
	vecA[0] === vecB[0] && vecA[1] === vecB[1]

/**
 * @param {Vec2} vecA
 * @param {Vec2} vecB
 * @returns {Vec2}
 */
export const min = (vecA: Vec2, vecB: Vec2): Vec2 =>
	vec(Math.min(vecA[0], vecB[0]), Math.min(vecA[1], vecB[1]))

/**
 * @param {Vec2} vecA
 * @param {Vec2} vecB
 * @returns {Vec2}
 */
export const max = (vecA: Vec2, vecB: Vec2): Vec2 =>
	vec(Math.max(vecA[0], vecB[0]), Math.max(vecA[1], vecB[1]))

/**
 *
 * @param {Vec2} vecA
 * @returns {Vec2}
 */
export const neg = (vecA: Vec2): Vec2 => vec(-vecA[0], -vecA[1])

/**
 * @param {Vec2} start
 * @param {Vec2} end
 */
export function* segment(start: Vec2, end: Vec2) {
	const delta = sub(end, start)
	const dir = signed(delta)
	const steps = cLen(start, end)

	let pos = start
	yield pos
	for (let i = 0; i < steps; i++) {
		pos = add(pos, dir)
		yield pos
	}
}

/**
 * @type {Vec2}
 */
export const ZERO: Vec2 = zero()

/**
 * @param {Vec2} vec
 * @returns {number}
 */
export const len = (vec: Vec2): number => Math.sqrt(vec[0] ** 2 + vec[1] ** 2)

/**
 *
 * @param {Vec2} vecA
 * @param {Vec2} vecB
 * @returns {number}
 */
export const cLen = (vecA: Vec2, vecB: Vec2): number =>
	Math.max(Math.abs(vecA[0] - vecB[0]), Math.abs(vecA[1] - vecB[1]))

/**
 * @param {Vec2} vecA
 * @param {Vec2} vecB
 * @returns {number}
 */
export const mLen = (vecA: Vec2, vecB: Vec2): number =>
	Math.abs(vecA[0] - vecB[0]) + Math.abs(vecA[1] - vecB[1])

/**
 *
 * @param {Vec2} vec
 * @param {Vec2} min
 * @param {Vec2} max
 * @returns
 */
export const inRange = (vec: Vec2, min: Vec2, max: Vec2) =>
	vec[0] >= min[0] && vec[0] <= max[0] && vec[1] >= min[1] && vec[1] <= max[1]

/**
 * @param {Vec2} vec
 */
export const toString = ([x, y]: Vec2) => `${x},${y}`

/**
 * @param {string} str
 * @returns {Vec2}
 */
export const fromString = (str: string): Vec2 => {
	const [x, y] = str.split(",").map(Number)
	return vec(x, y)
}
