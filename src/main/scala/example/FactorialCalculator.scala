package example

import akka.actor.{PoisonPill, Actor}
import akka.event.Logging
import com.datastax.driver.core.Session
import scala.annotation.tailrec

class FactorialCalculator extends Actor {

  val log = Logging(context.system, this)

  def receive = {
    case in : Int => {
      log.info(s"received calc command at ${self.path}")
      val db = new CassandraConnector(self.path.name, true)
      val session = db.cluster.connect("factorial")
      val t0 = System.nanoTime
      val res = factorial(in, session)
      val t1 = System.nanoTime
      reportResult(in, res, (t1-t0)/1000000.0, session)
      db.cluster.close()
      log.info(s"completed calc at ${self.path} for key = $in")
      self ! PoisonPill
    }
    case _ => log.error(s"${self.path.name} received unknown message")
  }

  def factorial(n: Int, session : Session): BigInt = {
    val key = n
    @tailrec def factorialAcc(acc: BigInt, n: Int): BigInt = {
      if (n <= 1) acc
      else {
        if( key % n == 0 ) reportProgress(key, 100.0 - (n*1.0 / key) * 100.0, session)
        factorialAcc(acc * n, n - 1)
      }
    }
    factorialAcc(BigInt(1), n)
  }

  def reportProgress( key : Int, progress : Double, session : Session ) {
    session.execute(s"UPDATE results SET status = 'processing at ${progress} %' WHERE input=${key};")
  }

  def reportResult( key : Int, result : BigInt, elapsedMillis : Double, session : Session ) {
    session.execute(s"UPDATE results SET status = 'complete', result = '${result.toString()}', calctime = ${elapsedMillis} WHERE input=${key};")
  }

}
