package example

import akka.actor.{Actor, Props}
import akka.event.Logging

class Routee extends Actor {

  val log = Logging(context.system, this)

  def receive = {
    case i : Int => {
      log.error(s"${self.path} routing a calculation of $i")
      context.actorOf(Props[FactorialCalculator]) ! i
    }
    case _ => log.error(s"${self.path.address} received unknown message")

  }
}
