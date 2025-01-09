import * as V from "./modules/vec"
import type { Grid } from "./Grid"

export type Config = {
	cellSize: number
}

export type World = {
	gravity: V.Vec2
}

export type Mouse = {
	pos: V.Vec2
	down: boolean
}

export type State = {
	grid: Grid
	world: World
	config: Config
	mouse: Mouse
}
