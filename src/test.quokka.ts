import path = require("path")

const x = process.cwd() // ?

path.resolve(x, "../".repeat(1)) // ?
