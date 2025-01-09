import { PointerEvent, useRef } from "react"
import "./App.css"
import * as V from "./modules/vec"
import { initCanvas } from "./Canvas"

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
