import { State } from "./State"

export type AppLoop = {
	lastTime: number
	fps: number
	running: boolean
	run(): void
	stop(): void
	update(): void
}

export function createAppLoop(
	draw: (ctx: CanvasRenderingContext2D, state: State) => void,
	update: (dt: number, state: State) => void,
	renderFps: (ctx: CanvasRenderingContext2D, fps: number) => void,
	state: State,
	ctx: CanvasRenderingContext2D,
): AppLoop {
	const appLoop: AppLoop = {
		lastTime: 0,
		fps: 0,
		running: false,
		run() {
			appLoop.running = true
			appLoop.lastTime = performance.now()
			appLoop.update()
		},
		stop() {
			appLoop.running = false
		},
		update() {
			const now = performance.now()
			const dt = now - appLoop.lastTime

			if (dt > 1) {
				appLoop.fps = 1000 / dt
				appLoop.lastTime = now
				update(dt, state)
			}
			draw(ctx, state)
			renderFps(ctx, appLoop.fps)

			if (appLoop.running) {
				requestAnimationFrame(appLoop.update)
			}
		},
	}

	return appLoop
}
