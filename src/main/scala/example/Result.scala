package example

case class Result( input : Int,
                   status : String,
                   result : Option[BigInt] = None,
                   calcTime : Option[String] = None)

case class Message( msg : String )