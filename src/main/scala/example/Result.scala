package example

case class Result( input : Int,
                   status : String,
                   calcTime : Option[String] = None,
                   result : Option[String] = None)

case class Message( msg : String )