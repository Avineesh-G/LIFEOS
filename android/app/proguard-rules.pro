# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Preserve Capacitor and Cordova bridge interfaces
-keep class com.getcapacitor.** { *; }
-keep class com.avineesh.lifeos.** { *; }
-keepclassmembers class * implements com.getcapacitor.Plugin {
    public *;
}

# Preserve AndroidX WorkManager Worker classes
-keep class * extends androidx.work.Worker { *; }
-keep class * extends androidx.work.CoroutineWorker { *; }
-keep class * extends androidx.work.ListenableWorker { *; }
-keepclassmembers class androidx.work.** { *; }

# Line number preservation for production stack traces
-keepattributes SourceFile,LineNumberTable

