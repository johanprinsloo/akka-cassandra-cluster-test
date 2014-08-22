package example

import akka.actor.{Props, Actor}
import spray.routing._
import spray.http._
import MediaTypes._
import spray.routing.authentication.BasicAuth
import spray.http.StatusCodes._
import scala.util.Random
import org.json4s._
import org.json4s.native.JsonMethods._
import org.json4s.JsonDSL.WithBigDecimal._
import org.json4s.native.Serialization
import org.json4s.native.Serialization.{read, write}
import spray.http.HttpHeaders.{`Content-Type`, Location}
import akka.actor.{Props, Actor}
import akka.routing.FromConfig

// we don't implement our route structure directly in the service actor because
// we want to be able to test it independently, without having to spin up an actor
class ServiceActor extends Actor with ApiService with LiveDocService with MonitorService {

  // the HttpService trait defines only one abstract member, which
  // connects the services environment to the enclosing actor or test
  def actorRefFactory = context

  // this actor only runs our route, but you could add
  // other things here, like request stream processing
  // or timeout handling
  def receive = runRoute(monRoute ~ apiRoute ~ docRoute)

  //context.actorOf(Props[Routee], name = "justtotest")
}


// this trait defines our service behavior independently from the service actor
trait ApiService extends HttpService with ClientAuthentication {

  import scala.concurrent.ExecutionContext.Implicits.global
  implicit val formats = Serialization.formats(NoTypeHints)
  //val router = actorRefFactory.actorOf(Props[Routee],"dynrouter")
  val router = actorRefFactory.actorOf(FromConfig.props(Props[Routee]), name = "dynrouter")

  val apiRoute =
  //authenticate( BasicAuth(realm = "Akka Cassandra Cluster Test") ) {
  //client =>
    path("" ~ Slash.?) {
      redirect("/doc/v0/", Found)
    } ~
      path("api" ~ Slash.?) {
        redirect("/api/v0", Found)
      } ~
      pathPrefix("api" / "v0") {
        path("" ~ Slash.?) {
          complete {
            hyperdocL0V0
          }
        } ~
          path("doc") {
            redirect("/doc/v0/", Found)
          } ~
          pathPrefix("factorial" / IntNumber) { in =>
            pathEndOrSingleSlash {
              get {
                getResult( in ) { result =>
                  respondWithMediaType(`application/json`) {
                    complete(write(result))
                  }
                }
              } ~
                put {
                  putQuery( in ) { result =>
                    respondWithMediaType(`application/json`) {
                      complete(write(result))
                    }
                  }
                } ~
                delete {
                  deleteQuery( in ) { result =>
                    respondWithMediaType(`application/json`){
                      complete(write(result))
                    }
                  }
                }
            }
          }
        //}
      }

  def getResult( input : Int ) : ( Result  => Route ) => Route = {
    route => ctx => {
      QueryDriver.getResult(input) match {
        case Some(r) if r.result.isDefined =>  route(r)(ctx)
        case Some(r) if r.result.isEmpty =>
          ctx.complete( HttpResponse( StatusCodes.PartialContent, HttpEntity(`application/json`, write(r))))
        case None =>
          ctx.complete( HttpResponse( StatusCodes.NotFound,
            HttpEntity(`application/json`, write(Message(msg = s"Key ${input} not found ")))))
      }
    }
  }

  def putQuery( input : Int) : (Result => Route) => Route = {
    route => ctx => {
      QueryDriver.getResult(input) match {
        case None => {
          val inResult = QueryDriver.createEntry(input) match {
            case Some(r) => {
              router ! input
              route(r)(ctx)
            }
            case None => {
              ctx.complete(HttpResponse(StatusCodes.NotAcceptable,
                HttpEntity(`application/json`, write(Message(msg = s"Key ${input} request could not be accepted ")))))
            }
          }
        }
        case Some(r) => {
          ctx.complete(HttpResponse(StatusCodes.AlreadyReported,
            HttpEntity(`application/json`, write(r))))
        }
      }
    }
  }


  def deleteQuery( input : Int ) : (Result => Route) => Route = {
    route => ctx => {
      QueryDriver.getResult(input) match {
        case None => {
          ctx.complete(HttpResponse(StatusCodes.NotFound,
            HttpEntity(`application/json`, write(Message(msg = s"Key ${input} does not exist ")))))
        }
        case Some(r) if r.result.isDefined => {
          QueryDriver.delete(input)
          route(r)(ctx)
        }
        case Some(r) if  r.result.isEmpty => {
          ctx.complete(HttpResponse(StatusCodes.EnhanceYourCalm,
            HttpEntity(`application/json`, write(Message(msg = s"Key ${input} cannot be deleted during ongoing calculation")))))
        }
      }
    }
  }

}