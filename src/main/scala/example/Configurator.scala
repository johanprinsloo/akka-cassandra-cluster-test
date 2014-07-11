package example

import com.typesafe.scalalogging.slf4j.Logging
import com.typesafe.config.ConfigFactory


object Configurator extends Logging {

  val conf = ConfigFactory.load( "~/testcluster" )
    .withFallback(ConfigFactory.load("./testcluster"))
    .withFallback(ConfigFactory.load("testcluster"))

  conf.checkValid(ConfigFactory.load("testcluster"),"testcluster")
  logger.info( s"Server Mode ${conf.getString("cluster.api.runmode")} ")

}

