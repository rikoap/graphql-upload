import { processRequest } from './processRequest'

/**
 * Creates [Express](https://expressjs.com) middleware that processes GraphQL
 * multipart requests using [`processRequest`]{@link processRequest}, ignoring
 * non-multipart requests. It sets the request body to be [similar to a
 * conventional GraphQL POST request]{@link GraphQLOperation} for following
 * GraphQL middleware to consume.
 * @kind function
 * @name graphqlUploadExpress
 * @param {UploadOptions} options GraphQL upload options.
 * @returns {function} Express middleware.
 * @example <caption>Basic [`express-graphql`](https://npm.im/express-graphql) setup.</caption>
 * ```js
 * import express from 'express'
 * import graphqlHTTP from 'express-graphql'
 * import { graphqlUploadExpress } from 'graphql-upload'
 * import schema from './schema'
 *
 * express()
 *   .use(
 *     '/graphql',
 *     graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }),
 *     graphqlHTTP({ schema })
 *   )
 *   .listen(3000)
 * ```
 */
export const graphqlUploadExpress = options => (request, response, next) => {
  if (!request.is('multipart/form-data')) return next()

  const finished = new Promise(resolve => request.on('end', resolve))

  const { send } = response
  response.send = (...args) => {
    finished.then(() => {
      response.send = send
      response.send(...args)
    })
  }

  processRequest(request, response, options)
    .then(body => {
      request.body = body
      next()
    })
    .catch(error => {
      if (error.status && error.expose) response.status(error.status)
      next(error)
    })
}
