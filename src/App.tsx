import { MouseEvent, useRef } from "react"
import "./App.css"
import * as V from "./modules/vec"

type Particle = {
	pos: V.Vec2
	vel: V.Vec2
	acc: V.Vec2
	color: string
}

type Grid = {
	width: number
	height: number
	particles: Map<string, Particle>
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
	ctx.imageSmoothingEnabled = false
}

function cloneParticle(particle: Particle) {
	return {
		pos: particle.pos,
		vel: particle.vel,
		acc: particle.acc,
		color: particle.color,
	}
}

type AppLoop = {
	lastTime: number
	fps: number
	running: boolean
	run(): void
	stop(): void
	update(): void
}

function applyForces(particle: Particle, state: State) {
	particle.acc = V.add(particle.acc, state.world.gravity)
}

function updateParticle(particle: Particle, dt: number) {
	particle.vel = V.add(particle.vel, V.scale(particle.acc, dt))
	particle.pos = V.add(particle.pos, V.scale(particle.vel, dt))
}

function getParticleAtPos(pos: V.Vec2, state: State) {
	return state.grid.particles.get(V.toString(pos))
}

function collisionCheck(particle: Particle, state: State) {
	const existingParticle = getParticleAtPos(particle.pos, state)
	if (existingParticle) {
		return true
	}

	if (V.y(particle.pos) > state.grid.height - 1) {
		return true
	}

	return false
}

function applySlope(particle: Particle, state: State) {
	const dirs = [V.vec(-1, 1), V.vec(1, 1)]
	const rnd = Math.random() > 0.5 ? 0 : 1

	const left = V.add(particle.pos, dirs[rnd])
	const right = V.add(particle.pos, dirs[1 - rnd])

	const gridTopLeft = V.vec(0, 0)
	const gridBottomRight = V.vec(state.grid.width - 1, state.grid.height - 1)

	const positions = [left, right]

	for (const pos of positions) {
		if (!V.inRange(pos, gridTopLeft, gridBottomRight)) {
			continue
		}
		if (getParticleAtPos(pos, state)) {
			continue
		}
		particle.pos = pos
		return true
	}

	return false
}

const sandColors = ["#f4a460", "#d2b48c", "#cd7f32"]

function randomItem<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)]
}

function handleMouse(state: State) {
	if (state.mouse.down) {
		if (getParticleAtPos(state.mouse.pos, state)) {
			return
		}

		const particle = {
			pos: state.mouse.pos,
			vel: V.vec(0, 1),
			acc: V.vec(0, 0),
			color: randomItem(sandColors),
		}
		state.grid.particles.set(V.toString(particle.pos), particle)
	}
}

function update(_dt: number, state: State) {
	handleMouse(state)

	const nextParticles: Map<string, Particle> = new Map()
	for (const particle of state.grid.particles.values()) {
		const newParticle = cloneParticle(particle)

		applyForces(newParticle, state)
		updateParticle(newParticle, 1)

		if (collisionCheck(newParticle, state)) {
			if (!applySlope(newParticle, state)) {
				newParticle.pos = particle.pos
			}
		}

		const topLeft = V.vec(0, 0)
		const bottomRight = V.vec(state.grid.width, state.grid.height)
		if (V.inRange(newParticle.pos, topLeft, bottomRight)) {
			nextParticles.set(V.toString(newParticle.pos), newParticle)
		}
	}

	state.grid.particles = nextParticles
}

function draw(ctx: CanvasRenderingContext2D, state: State) {
	ctx.fillStyle = "white"
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

	for (const particle of state.grid.particles.values()) {
		ctx.fillStyle = particle.color
		ctx.fillRect(
			V.x(particle.pos) * state.config.cellSize,
			V.y(particle.pos) * state.config.cellSize,
			state.config.cellSize,
			state.config.cellSize,
		)
	}
}

function renderFps(ctx: CanvasRenderingContext2D, fps: number) {
	ctx.fillStyle = "black"
	ctx.fillText(`FPS: ${fps.toFixed(2)}`, 10, 10)
}

function initCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
	const screenWidth = document.documentElement.clientWidth
  const screenHeight = document.documentElement.clientHeight
  const width = 128
  const height = 128
	const state: State = {
		grid: {
			width,
			height,
			particles: new Map(),
		},
		world: {
			gravity: V.vec(0, 0),
		},
		config: {
			cellSize: Math.min(screenWidth / width, screenHeight / height),
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

	appLoop.run()

	return {
		state,
		appLoop,
	}
}

function App() {
	const appRef = useRef<ReturnType<typeof initCanvas>>()

	function handlePointerDown() {
		if (appRef.current) {
			appRef.current.state.mouse.down = true
		}
	}

	function handlePointerMove(event: MouseEvent) {
		if (appRef.current) {
			const offsetX =
				event.clientX - event.currentTarget.getBoundingClientRect().left
			const offsetY =
				event.clientY - event.currentTarget.getBoundingClientRect().top
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
		<div>
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
