package example

import spray.routing._


trait MonitorService extends HttpService {

  val monRoute = {
        path("mon"){
          complete("up")// point to latest
        }
  }



}
