package example

import com.typesafe.config.ConfigFactory
import spray.routing.authentication._
import spray.routing.directives.LogEntry
import akka.event.Logging._
import scala.concurrent.ExecutionContext.Implicits.global

case class User(userName: String, token: String) {}


trait ClientAuthentication {

  val conf = ConfigFactory.load()

  def extractUser(userPass: UserPass): String = {
    LogEntry("Authenticating: " + userPass, InfoLevel)
    userPass.user
  }

  def apiAuth = BasicAuth(realm = "Akka Cassandra Cluster Test", config = conf, createUser = extractUser _)

}
