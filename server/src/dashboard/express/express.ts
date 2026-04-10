import express from 'express'
import cors from 'cors'
import dashboardRouter from './dashboard.routes'

const app = express()
const port = 9038

app.use(cors())
app.use('/dashboard', dashboardRouter)

app.listen(port, () => {
  console.log(`Arbiter listening on port ${port}`)
})
