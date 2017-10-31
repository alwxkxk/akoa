const Koa = require('koa')
const router = require('./router.js')
const handleError = require('koa-handle-error')
const app = new Koa()

const onError = err => {
  console.error(err)
}

app.use(handleError(onError))  // must register first!
app.use(router.middleware())
app.listen(3000, () => {
  console.log('listening ' + 'http://localhost:3000')
})
