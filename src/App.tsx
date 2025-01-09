/* eslint-disable @typescript-eslint/no-unused-vars */
import { PointerEvent, useRef } from "react"
import "./App.css"
import * as V from "./modules/vec"

interface Particle {
	vel: V.Vec2
	acc: V.Vec2
	readonly color: string
	readonly maxVel: V.Vec2
	readonly modified: boolean

	getUpdateCount(): number
	update(dt: number): void
	resetVelocity(): void
	applyAcc(acc: V.Vec2): void
}

interface Grid {
	readonly width: number
	readonly height: number
	readonly particles: (Particle | null)[]
	readonly modifiedParticles: Set<number>

	update(dt: number, world: World): void
	setParticle(pos: V.Vec2, particle: Particle): void
	getParticle(pos: V.Vec2): Particle | null
}

type Config = {
	cellSize: number
}

type World = {
	gravity: V.Vec2
}

type Mouse = {
	pos: V.Vec2
	down: boolean
}

type State = {
	grid: Grid
	world: World
	config: Config
	mouse: Mouse
}

class BaseParticle implements Particle {
	vel: V.Vec2
	acc: V.Vec2
	readonly color: string
	readonly maxVel: V.Vec2

	modified: boolean = false

	constructor(color: string) {
		this.vel = V.vec(0, 0)
		this.acc = V.vec(0, 0)
		this.color = color
		this.maxVel = V.vec(0, 8)
	}

	applyAcc(acc: V.Vec2): void {
		this.acc = V.add(this.acc, acc)
	}

	getUpdateCount(): number {
		return Math.max(
			this.getUpdateCountVal(this.vel[0]),
			this.getUpdateCountVal(this.vel[1]),
		)
	}

	private getUpdateCountVal(value: number): number {
		const abs = Math.abs(value)
		const floored = Math.floor(abs)
		const mod = abs - floored
		// Treat a remainder (e.g. 0.5) as a random chance to update
		return floored + (Math.random() < mod ? 1 : 0)
	}

	update(_dt: number): void {
		this.vel = V.add(this.vel, this.acc)
		const x =
			Math.abs(this.vel[0]) > this.maxVel[0]
				? this.maxVel[0] * Math.sign(this.vel[0])
				: this.vel[0]
		const y =
			Math.abs(this.vel[1]) > this.maxVel[1]
				? this.maxVel[1] * Math.sign(this.vel[1])
				: this.vel[1]
		this.vel = V.vec(x, y)
		this.acc = V.vec(0, 0)

		this.modified = !V.eq(this.vel, V.ZERO)
	}

	resetVelocity(): void {
		this.vel = V.vec(0, 0)
	}
}

class BaseGrid implements Grid {
	readonly width: number
	readonly height: number
	readonly particles: (Particle | null)[]
	modifiedParticles: Set<number> = new Set()

	private shouldClear = true

	constructor(width: number, height: number) {
		this.width = width
		this.height = height
		this.particles = Array(width * height).fill(null)
	}

	update(_dt: number, world: World): void {
		this.modifiedParticles = new Set()

		if (this.shouldClear) {
			this.clearAll()
		}

		for (let i = this.particles.length - 1; i >= 0; i--) {
			const particle = this.particles[i]
			if (particle) {
				this.applyForces(particle, world)

				particle.update(_dt)
				if (!particle.modified) {
					continue
				}

				for (let j = 0; j < particle.getUpdateCount(); j++) {
					const newIndex = this.updatePixel(i)

					// If we swapped the particle to a new location,
					// we need to update our index to be that new one.
					// As we are repeatedly updating the same particle.
					if (newIndex !== i) {
						i = newIndex
					} else {
						particle.resetVelocity()
						break
					}
				}
			}
		}
	}

	private applyForces(particle: Particle, world: World): void {
		particle.applyAcc(world.gravity)
	}

	setParticle(pos: V.Vec2, particle: Particle): void {
		const idx = this.toIndex(pos)
		this.particles[idx] = particle
		this.modifiedParticles.add(idx)
	}

	getParticle(pos: V.Vec2): Particle | null {
		const idx = this.toIndex(pos)
		return this.particles[idx]
	}

	private clearAll(): void {
		for (let i = 0; i < this.particles.length; i++) {
			this.particles[i] = null
			this.modifiedParticles.add(i)
		}
		this.shouldClear = false
	}

	private updatePixel(idx: number): number {
		if (this.isEmpty(idx)) {
			return idx
		}

		const below = idx + this.width
		const belowLeft = below - 1
		const belowRight = below + 1
		const column = idx % this.width

		const variants = [below]
		if (Math.random() < 0.5) {
			if (column > 0) {
				variants.push(belowLeft)
			}
			if (column < this.width - 1) {
				variants.push(belowRight)
			}
		} else {
			if (column < this.width - 1) {
				variants.push(belowRight)
			}
			if (column > 0) {
				variants.push(belowLeft)
			}
		}

		for (const variant of variants) {
			if (this.isEmpty(variant)) {
				this.swapParticles(idx, variant)
				return variant
			}
		}

		return idx
	}

	private toIndex(pos: V.Vec2): number {
		return V.y(pos) * this.width + V.x(pos)
	}

	private isEmpty(idx: number): boolean {
		return this.particles[idx] === null
	}

	private swapParticles(idxA: number, idxB: number): void {
		const tmp = this.particles[idxA]
		this.particles[idxA] = this.particles[idxB]
		this.particles[idxB] = tmp
		this.modifiedParticles.add(idxA).add(idxB)
	}
}

function resizeCanvas(
	canvas: HTMLCanvasElement,
	ctx: CanvasRenderingContext2D,
	state: State,
) {
	const pixelRatio = devicePixelRatio
	const canvasWidth = state.grid.width * state.config.cellSize
	const canvasHeight = state.grid.height * state.config.cellSize

	canvas.width = canvasWidth * pixelRatio
	canvas.height = canvasHeight * pixelRatio

	canvas.style.width = `${canvasWidth}px`
	canvas.style.height = `${canvasHeight}px`

	ctx.scale(pixelRatio, pixelRatio)
}

type AppLoop = {
	lastTime: number
	fps: number
	running: boolean
	run(): void
	stop(): void
	update(): void
}

const sandColors = ["#f4a460", "#d2b48c", "#deb887", "#cd853f"]

function randomItem<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)]
}

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
	if (state.grid.modifiedParticles.size === 0) {
		return
	}

	state.grid.modifiedParticles.forEach((idx) => {
		const x = idx % state.grid.width
		const y = Math.floor(idx / state.grid.width)
		const particle = state.grid.particles[idx]
		const color = particle?.color ?? "white"

		ctx.fillStyle = color
		ctx.fillRect(
			x * state.config.cellSize,
			y * state.config.cellSize,
			state.config.cellSize,
			state.config.cellSize,
		)
	})
}

function renderFps(ctx: CanvasRenderingContext2D, fps: number) {
	ctx.fillStyle = "white"
	ctx.fillRect(0, 0, 100, 14)
	ctx.strokeStyle = "black"
	ctx.strokeRect(0, 0, 100, 14)
	ctx.fillStyle = "black"
	ctx.fillText(`FPS: ${fps.toFixed(2)}`, 10, 10)
}

function initCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
	const screenWidth = window.innerWidth
	const screenHeight = window.innerHeight
	const width = 256
	const height = 256
	const state: State = {
		grid: new BaseGrid(width, height),
		world: {
			gravity: V.vec(0, 0.1),
		},
		config: {
			cellSize: Math.max(
				Math.floor(
					Math.min(screenWidth / width, screenHeight / height),
				),
				1,
			),
		},
		mouse: {
			pos: V.vec(0, 0),
			down: false,
		},
	}

	resizeCanvas(canvas, ctx, state)

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

			if (dt > 10) {
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

	appLoop.run()

	return {
		state,
		appLoop,
	}
}

function App() {
	const appRef = useRef<ReturnType<typeof initCanvas>>()

	function handlePointerDown(event: PointerEvent) {
		if (appRef.current) {
			appRef.current.state.mouse.down = true
			handlePointerMove(event)
		}
	}

	function handlePointerMove(event: PointerEvent) {
		if (appRef.current) {
			const { offsetX, offsetY } = event.nativeEvent
			const x = Math.floor(offsetX / appRef.current.state.config.cellSize)
			const y = Math.floor(offsetY / appRef.current.state.config.cellSize)
			appRef.current.state.mouse.pos = V.vec(x, y)
		}
	}

	function handlePointerUp() {
		if (appRef.current) {
			appRef.current.state.mouse.down = false
		}
	}

	function handleCanvasRef(canvas: HTMLCanvasElement) {
		appRef.current?.appLoop.stop()
		if (!canvas) {
			return
		}
		const ctx = canvas.getContext("2d")
		if (ctx) {
			appRef.current = initCanvas(canvas, ctx)
		}
	}

	return (
		<div className="App">
			<canvas
				style={{ cursor: "crosshair" }}
				ref={handleCanvasRef}
				width={320}
				height={240}
				onPointerDown={handlePointerDown}
				onPointerUp={handlePointerUp}
				onPointerMove={handlePointerMove}
			/>
		</div>
	)
}

export default App
