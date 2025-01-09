import * as V from "./modules/vec"

export interface Particle {
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

export class BaseParticle implements Particle {
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

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
