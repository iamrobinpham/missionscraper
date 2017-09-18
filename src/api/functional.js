import { makeInvoker } from 'awilix-koa'

import DataLord from '../lib/dataLord.js'

/**
 * Makes an object with the API endpoints.
 *
 * @param  {object} options.someService
 * The service.
 *
 * @return {object}
 * The API to be registered.
 */
const makeFunctionalApi = ({ someService }) => {
  // Dependencies are passed in with an object as the first parameter.
  //
  const dataLord = new DataLord();

  // An API method.
  const getStuff = async (ctx) => {
    const data = await dataLord.getParsedData();

    return ctx.ok(data)
  }

  return {
    getStuff,
  }
}

// The default export is the registration function.
// It gets passed the router and uses makeInvoker
// to create route handler middleware.
// For more info, visit the Awilix docs: https://github.com/jeffijoe/awilix
export default function (router) {
  // What's this?
  // This trick lets us construct an API for each request.
  // That means that it may store request-local state.
  const api = makeInvoker(makeFunctionalApi)
  // router is a KoaRouter.
  router
    .get('/api/missionTrouble', api('getStuff'))
}
