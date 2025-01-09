export function randomItem<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)]
}

export function resizeCanvas(
	canvas: HTMLCanvasElement,
	ctx: CanvasRenderingContext2D,
	canvasWidth: number,
	canvasHeight: number,
) {
	const pixelRatio = devicePixelRatio

	canvas.width = canvasWidth * pixelRatio
	canvas.height = canvasHeight * pixelRatio

	canvas.style.width = `${canvasWidth}px`
	canvas.style.height = `${canvasHeight}px`

	ctx.scale(pixelRatio, pixelRatio)
}
