import * as V from "./modules/vec"
import type { Particle } from "./Particle"
import type { State, World } from "./State"

export interface Grid {
	readonly width: number
	readonly height: number
	readonly particles: (Particle | null)[]
	readonly modifiedParticles: Set<number>

	update(dt: number, world: World): void
	draw(ctx: CanvasRenderingContext2D, state: State): void
	setParticle(pos: V.Vec2, particle: Particle): void
	getParticle(pos: V.Vec2): Particle | null
}

export class BaseGrid implements Grid {
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

	draw(ctx: CanvasRenderingContext2D, state: State): void {
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
}
