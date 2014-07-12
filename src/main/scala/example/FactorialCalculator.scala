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
      reportProgress(in, 0.0, session)
      val t0 = System.nanoTime
      val res = factorial(in, session)
      val telap = (System.nanoTime -t0)/1000000.0
      reportResult(in, res, telap, session)
      db.cluster.close()
      log.info(s"completed calc at ${self.path.name} for key = $in in $telap milliseconds")
      self ! PoisonPill
    }
    case _ => log.error(s"${self.path.name} received unknown message")
  }

  def factorial(n: Int, session : Session): BigInt = {
    val key = n
    @tailrec def factorialAcc(acc: BigInt, n: Int, prog0 : Double): BigInt = {
      if (n <= 1) acc
      else {
        val prog1 = 100.0 - (n*1.0 / key) * 100.0
        if((prog1 - prog0) > 0.001) {
          reportProgress(key, prog1, session)
          factorialAcc(acc * n, n - 1, prog1)
        } else {
          factorialAcc(acc * n, n - 1, prog0)
        }
      }
    }
    factorialAcc(BigInt(1), n, 0.0)
  }

  def reportProgress( key : Int, progress : Double, session : Session ) {
    val prog = f"$progress%2.3f"
    session.execute(f"UPDATE results SET status = 'processing at $progress%2.3f %%' WHERE input=${key};")
  }

  def reportResult( key : Int, result : BigInt, elapsedMillis : Double, session : Session ) {
    session.execute(s"UPDATE results SET status = 'complete', result = '${result.toString()}', calctime = ${elapsedMillis} WHERE input=${key};")
  }

}
