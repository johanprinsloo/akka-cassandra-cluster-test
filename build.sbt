name := """akka-cassandra-cluster-test"""

version := "1.0.0"

organization := "io"

scalaVersion := "2.10.4"

resolvers ++= Seq(
  "snapshots"           at "http://oss.sonatype.org/content/repositories/snapshots",
  "releases"            at "http://oss.sonatype.org/content/repositories/releases",
  "Typesafe Repository" at "http://repo.typesafe.com/typesafe/releases/",
  "Kamon Repository"    at "http://repo.kamon.io",
  "spray repo"          at "http://repo.spray.io"
)

//seq(Revolver.settings: _*)

scalacOptions ++= Seq("-feature", "-unchecked", "-deprecation", "-encoding", "utf8")

javaOptions := Seq("-Xdebug", "-Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=8000", "-Djava.library.path=./sigar", "-Xms128m", "-Xmx1024m")

javaOptions  += s"-javaagent:/home/ubuntu/.ivy2/cache/org.aspectj/aspectjweaver/jars/aspectjweaver-1.8.1.jar"
//javaOptions  += s"-javaagent:/home/iuser/.ivy2/cache/org.aspectj/aspectjweaver/jars/aspectjweaver-1.8.1.jar"
//javaOptions +=  s"-javaagent:./lib/weaver/aspectjweaver-1.7.4.jar"

fork in run := true

//connectInput in run := true

parallelExecution in Test := false

libraryDependencies ++= {
  val sprayVersion = "1.3.1"
  val akkaVersion = "2.3.0"
  val cassDrVersion = "2.0.2"
  Seq(
    "com.datastax.cassandra"  %   "cassandra-driver-core" % cassDrVersion,
    "org.slf4j"               %   "slf4j-api"       % "1.7.6",
    "ch.qos.logback"          %   "logback-core"    % "1.1.1",
    "ch.qos.logback"          %   "logback-classic" % "1.1.1",
    "io.spray"                %   "spray-can"       % sprayVersion,
    "io.spray"                %   "spray-routing"   % sprayVersion,
    "io.spray"                %   "spray-testkit"   % sprayVersion,
    "io.spray"                %   "spray-caching"   % sprayVersion,
    "org.json4s"              %%  "json4s-native"   % "3.2.4",
    "joda-time"               %   "joda-time"       % "2.3",
    "org.joda"                %   "joda-convert"    % "1.4",
    "com.typesafe.akka"       %%  "akka-actor"      % akkaVersion,
    "com.typesafe.akka"       %%  "akka-slf4j"      % akkaVersion,
    "com.typesafe.akka"       %%  "akka-testkit"    % akkaVersion % "test",
    "com.typesafe.akka"       %%  "akka-cluster"    % akkaVersion,
    "com.typesafe"            %  "config"           % "1.2.0",
    "com.typesafe" 		        %% "scalalogging-slf4j"        % "1.0.1",
    "org.fusesource"          %   "sigar"           % "1.6.4",
    "org.scalatest"           %%  "scalatest"       % "2.1.6" % "test",
    "io.spray"                %   "spray-testkit"   % "1.3.1" % "test",
    "io.kamon"                %% "kamon-core" % "0.3.2",
    "io.kamon"                %% "kamon-statsd" % "0.3.2",
    "io.kamon"                %% "kamon-spray" % "0.3.2",
    "org.aspectj"             % "aspectjrt"             % "1.8.1",
    "org.aspectj"             % "aspectjweaver"         % "1.8.1"
  )
}