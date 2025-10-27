plugins {
    `java-library`
}

java {
    toolchain {
        languageVersion.set(org.gradle.jvm.toolchain.JavaLanguageVersion.of(17))
    }
}

dependencies {
    // add common scoped dependencies here
    compileOnly("com.inductiveautomation.ignitionsdk:ignition-common:${rootProject.extra["sdk_version"]}")
	compileOnly("com.inductiveautomation.ignitionsdk:gateway-api:${rootProject.extra["sdk_version"]}")
    compileOnly("org.eclipse.jetty.ee10.websocket:jetty-ee10-websocket-jetty-server:12.0.27")
    modlImplementation(projects.ignitionNodeREDWeb)
}