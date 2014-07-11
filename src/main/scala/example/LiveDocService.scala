package example

import spray.routing.authentication._
import spray.routing.HttpService
import spray.http.MediaTypes._
import spray.http.StatusCodes
import StatusCodes._
import spray.routing.directives.CachingDirectives._
import spray.routing._
import spray.httpx.encoding.Gzip
import scala.concurrent.duration.Duration
import scala.concurrent.ExecutionContext._
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future

trait LiveDocService extends HttpService with ClientAuthentication{

  val simpleCache = routeCache(maxCapacity = 1000, timeToIdle = Duration("30 min"))

  val docRoute = {
    authenticate( BasicAuth("Akka Cassandra Cluster Test") ) {
      client =>
        path("doc"){
          redirect("doc/v0", Found) // point to latest
        } ~
        path( "doc" / "v0" ~ Slash.?) {
          cache(simpleCache) {
            getFromFile("./src/main/webapp/apiv0/doc/apidoc.html")
          }
        } ~
        pathPrefix("style") {
          cache(simpleCache) {
            getFromDirectory("./src/main/webapp/style")
          }
        } ~
        pathPrefix("style/images") {
          cache(simpleCache) { getFromDirectory("./src/main/webapp/style/images") }
        } ~
        pathPrefix("classpath") {
          cache(simpleCache) { getFromDirectory("./src/main/webapp/classpath") }
        } ~
        pathPrefix("css") {
          getFromDirectory("./src/main/webapp/css")
        } ~
        pathPrefix("js") {
          cache(simpleCache) { getFromDirectory("./src/main/webapp/js") }
        } ~
        pathPrefix("img") {
          cache(simpleCache) { getFromDirectory("./src/main/webapp/img") }
        } ~
        path(Rest) {
          leftover => {
            encodeResponse(Gzip) {
              getFromDirectory("./src/main/webapp/")
            }
          }
        }
    }
  }



}
