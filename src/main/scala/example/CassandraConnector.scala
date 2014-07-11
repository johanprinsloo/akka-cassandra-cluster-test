package example

import com.datastax.driver.core.Cluster
import com.typesafe.scalalogging.slf4j.Logging
import scala.collection.JavaConversions._

class CassandraConnector(client : String, logit : Boolean) extends Logging {

  val cluster = Cluster.builder()
                        .addContactPoint( Configurator.conf.getString("cluster.cassandra.node") )
                        .build()

  if( logit ) {
    val metadata = cluster.getMetadata
    logger.info(s"Connected to cluster: ${metadata.getClusterName}")
    metadata.getAllHosts.map(h => logger.info(s" Datacenter: ${h.getDatacenter}; Host: ${h.getAddress}; Rack: ${h.getRack}"))
  }

  def close() = {
    cluster.close()
  }
}
