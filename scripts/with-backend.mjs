// Runs a command with the Python backend alongside it, then stops the backend when it ends.
//   node scripts/with-backend.mjs nuxt build
// `nuxt build` needs this because prerendering fetches the catalogue from the API.
import { spawn } from 'node:child_process'

const PORT = 8000
const READY_URL = `http://127.0.0.1:${PORT}/api/categories`
const [command, ...args] = process.argv.slice(2)

const backend = spawn(
  'uv',
  ['run', '--no-dev', '--directory', 'backend', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', String(PORT)],
  { stdio: 'inherit', detached: true },
)
const stopBackend = () => {
  try {
    process.kill(-backend.pid) // The process group, so uvicorn stops along with `uv run`.
  } catch {
    // Already stopped.
  }
}

let finishing = false
backend.on('error', (error) => {
  console.error(`Could not start the backend (is uv installed?): ${error.message}`)
  process.exit(1)
})
backend.on('exit', (code) => {
  if (finishing) return
  console.error(`The backend exited unexpectedly with code ${code}. Is port ${PORT} already in use?`)
  process.exit(1)
})

let ready = false
for (let attempt = 0; attempt < 240 && !ready; attempt++) {
  ready = await fetch(READY_URL).then(
    (res) => res.ok,
    () => false,
  )
  if (!ready) await new Promise((resolve) => setTimeout(resolve, 250))
}
if (!ready) {
  console.error('The backend did not become ready within 60 seconds')
  stopBackend()
  process.exit(1)
}

const child = spawn(command, args, { stdio: 'inherit' })
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal))
child.on('exit', (code, signal) => {
  finishing = true
  stopBackend()
  process.exit(code ?? (signal ? 1 : 0))
})
