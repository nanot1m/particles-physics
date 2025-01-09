import { createAppLoop } from "./AppLoop"
import { BaseGrid } from "./Grid"
import { randomItem, resizeCanvas } from "./lib"
import * as V from "./modules/vec"
import { BaseParticle } from "./Particle"
import { State } from "./State"

const sandColors = ["#f4a460", "#d2b48c", "#deb887", "#cd853f"]

const deltas = [
	[V.vec(0, -2)],
	[V.vec(-1, -1), V.vec(0, -1), V.vec(1, -1)],
	[V.vec(-2, 0), V.vec(-1, 0), V.vec(0, 0), V.vec(1, 0), V.vec(2, 0)],
	[V.vec(-1, 1), V.vec(0, 1), V.vec(1, 1)],
	[V.vec(0, 2)],
].flat()

function handleMouse(state: State) {
	if (state.mouse.down) {
		deltas.forEach((delta) => {
			const pos = V.add(state.mouse.pos, delta)
			if (state.grid.getParticle(pos)) {
				return
			}
			state.grid.setParticle(
				pos,
				new BaseParticle(randomItem(sandColors)),
			)
		})
	}
}

function update(dt: number, state: State) {
	handleMouse(state)
	state.grid.update(dt, state.world)
}

function draw(ctx: CanvasRenderingContext2D, state: State) {
	state.grid.draw(ctx, state)
}

function renderFps(ctx: CanvasRenderingContext2D, fps: number) {
	ctx.fillStyle = "white"
	ctx.fillRect(0, 0, 100, 14)
	ctx.strokeStyle = "black"
	ctx.strokeRect(0, 0, 100, 14)
	ctx.fillStyle = "black"
	ctx.fillText(`FPS: ${fps.toFixed(2)}`, 10, 10)
}

export function initCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
	const screenWidth = window.innerWidth
	const screenHeight = window.innerHeight
	const width = 256
	const height = 256
	const cellSize = Math.max(
		Math.floor(Math.min(screenWidth / width, screenHeight / height)),
		1,
	)
	const state: State = {
		grid: new BaseGrid(width, height),
		world: {
			gravity: V.vec(0, 0.1),
		},
		config: {
			cellSize: cellSize,
		},
		mouse: {
			pos: V.vec(0, 0),
			down: false,
		},
	}

	resizeCanvas(canvas, ctx, width * cellSize, height * cellSize)

	const appLoop = createAppLoop(draw, update, renderFps, state, ctx)

	appLoop.run()

	return {
		state,
		appLoop,
	}
}
