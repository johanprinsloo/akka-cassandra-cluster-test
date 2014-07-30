package example

import akka.actor.{ActorSystem, Props}
import akka.io.IO
import spray.can.Http
import akka.pattern.ask
import akka.util.Timeout
import scala.concurrent.duration._
import com.typesafe.config.ConfigFactory

object Boot extends App {

  // we need an ActorSystem to host our application in
  
   val config = ConfigFactory.parseString("akka.cluster.roles = [router]").
        withFallback(ConfigFactory.load("application"))

   implicit val system = ActorSystem("ClusterSystem", config)
 

  // create and start our service actor
  val service = system.actorOf(Props[ServiceActor], "api-service")
  val tm = system.actorOf(Props[Routee], name = "factorialBackend")
  //system.actorOf(Props[Routee], name = "justtotest")

  implicit val timeout = Timeout(5.seconds)
  // start a new HTTP server on port 8080 with our service actor as the handler
  IO(Http) ? Http.Bind(service, interface = "::0", port = 8080)
}
