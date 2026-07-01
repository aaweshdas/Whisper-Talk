allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}
subprojects {
    val configureTask = {
        tasks.configureEach {
            if (name.contains("KotlinCompile")) {
                var success = false
                try {
                    val options = property("compilerOptions")!!
                    val optionsClass = options.javaClass
                    val kotlinVersionClass = Class.forName("org.jetbrains.kotlin.gradle.dsl.KotlinVersion")
                    val versionEnum = kotlinVersionClass.getField("KOTLIN_1_8").get(null)
                    
                    val getLanguageVersion = optionsClass.getMethod("getLanguageVersion")
                    val languageVersionProp = getLanguageVersion.invoke(options)!!
                    val setLangMethod = languageVersionProp.javaClass.getMethod("set", Any::class.java)
                    setLangMethod.invoke(languageVersionProp, versionEnum)
                    
                    val getApiVersion = optionsClass.getMethod("getApiVersion")
                    val apiVersionProp = getApiVersion.invoke(options)!!
                    val setApiMethod = apiVersionProp.javaClass.getMethod("set", Any::class.java)
                    setApiMethod.invoke(apiVersionProp, versionEnum)
                    
                    logger.quiet("WhisperBuild: Forced Kotlin language/API version to 1.8 via compilerOptions on ${project.name}:$name")
                    success = true
                } catch (e: Exception) {
                    // Try fallback
                }
                
                if (!success) {
                    try {
                        val kotlinOptions = property("kotlinOptions")
                        val clazz = kotlinOptions!!.javaClass
                        val setLanguageVersion = clazz.getMethod("setLanguageVersion", String::class.java)
                        val setApiVersion = clazz.getMethod("setApiVersion", String::class.java)
                        setLanguageVersion.invoke(kotlinOptions, "1.8")
                        setApiVersion.invoke(kotlinOptions, "1.8")
                        logger.quiet("WhisperBuild: Forced Kotlin language/API version to 1.8 via kotlinOptions on ${project.name}:$name")
                    } catch (e: Exception) {
                        logger.quiet("WhisperBuild: Failed to override Kotlin version on ${project.name}:$name: ${e.message}")
                    }
                }
            }
        }
    }

    if (state.executed) {
        configureTask()
    } else {
        afterEvaluate {
            configureTask()
        }
    }
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
