import { AndroidSourceFile } from '../types';

export const ANDROID_FILES: AndroidSourceFile[] = [
  {
    path: 'app/src/main/AndroidManifest.xml',
    category: 'manifest',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.localvibe.vibecapsule">

    <!-- Network Permissions for Spotify API and Local Jukebox Hosting -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    
    <!-- Needed for local HTTP server discovery on the home Wi-Fi network -->
    <uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />

    <!-- Background Execution Permissions for TimeCapsule Sync Daemons -->
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" 
        android:foregroundServiceType="dataSync" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Package queries for YouTube & YouTube Music app fallback routing -->
    <queries>
        <package android:name="com.google.android.youtube" />
        <package android:name="com.google.android.apps.youtube.music" />
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="https" />
        </intent>
    </queries>

    <application
        android:name=".VibeCapsuleApplication"
        android:allowBackup="false"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.VibeCapsule"
        android:usesCleartextTraffic="true"
        tools:targetApi="37">

        <!-- Main UI Activity -->
        <activity
            android:name=".ui.MainActivity"
            android:exported="true"
            android:theme="@style/Theme.VibeCapsule.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- OAuth Callback Intent Filter for Spotify PKCE Authentication -->
            <intent-filter android:exported="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:host="callback"
                    android:scheme="vibecapsule" />
            </intent-filter>
        </activity>

        <!-- Background Sync Service for Snapshotting Playlists -->
        <service
            android:name=".service.SnapshotSyncService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="dataSync" />

        <!-- Startup Boot Receiver to schedule workers -->
        <receiver
            android:name=".receiver.BootReceiver"
            android:enabled="true"
            android:exported="false">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>

    </application>
</manifest>`
  },
  {
    path: 'gradle/libs.versions.toml',
    category: 'gradle',
    language: 'toml',
    content: `[versions]
agp = "8.3.0"
kotlin = "1.9.22"
coreKtx = "1.12.0"
lifecycleRuntimeKtx = "2.7.0"
activityCompose = "1.8.2"
composeBom = "2024.02.01"
room = "2.6.1"
retrofit = "2.9.0"
okhttp = "4.12.0"
coroutines = "1.8.0"
ktor = "2.3.8"
work = "2.9.0"
navigationCompose = "2.7.7"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-lifecycle-viewmodel-compose = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-compose", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-navigation-compose = { group = "androidx.navigation", name = "navigation-compose", version.ref = "navigationCompose" }

androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-compose-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-compose-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-compose-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
androidx-compose-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-compose-ui-test-manifest = { group = "androidx.compose.ui", name = "ui-test-manifest" }
androidx-compose-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-compose-animation = { group = "androidx.compose.animation", name = "animation" }

androidx-room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
androidx-room-ktx = { group = "androidx.room", name = "room-ktx", version.ref = "room" }
androidx-room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }

retrofit = { group = "com.squareup.retrofit2", name = "retrofit", version.ref = "retrofit" }
retrofit-converter-gson = { group = "com.squareup.retrofit2", name = "converter-gson", version.ref = "retrofit" }
okhttp = { group = "com.squareup.okhttp3", name = "okhttp", version.ref = "okhttp" }
okhttp-logging-interceptor = { group = "com.squareup.okhttp3", name = "logging-interceptor", version.ref = "okhttp" }
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }

ktor-server-core = { group = "io.ktor", name = "ktor-server-core", version.ref = "ktor" }
ktor-server-netty = { group = "io.ktor", name = "ktor-server-netty", version.ref = "ktor" }
ktor-server-websockets = { group = "io.ktor", name = "ktor-server-websockets", version.ref = "ktor" }
ktor-server-content-negotiation = { group = "io.ktor", name = "ktor-server-content-negotiation", version.ref = "ktor" }
ktor-serialization-gson = { group = "io.ktor", name = "ktor-serialization-gson", version.ref = "ktor" }

androidx-work-runtime-ktx = { group = "androidx.work", name = "work-runtime-ktx", version.ref = "work" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-kapt = { id = "org.jetbrains.kotlin.kapt", version.ref = "kotlin" }`
  },
  {
    path: 'app/build.gradle.kts',
    category: 'gradle',
    language: 'kotlin',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.kapt)
}

android {
    namespace = "com.localvibe.vibecapsule"
    compileSdk = 37

    defaultConfig {
        applicationId = "com.localvibe.vibecapsule"
        minSdk = 29
        targetSdk = 37
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
        freeCompilerArgs += listOf(
            "-opt-in=androidx.compose.animation.ExperimentalAnimationApi",
            "-opt-in=androidx.compose.foundation.ExperimentalFoundationApi",
            "-opt-in=kotlinx.coroutines.ExperimentalCoroutinesApi"
        )
    }
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // AndroidX & Core
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)

    // Jetpack Compose Complete Suite
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.animation)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.navigation.compose)

    // Room Database (Local SQLite Orchestration)
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    kapt(libs.androidx.room.compiler)

    // Network & Concurrency
    implementation(libs.retrofit)
    implementation(libs.retrofit.converter.gson)
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging.interceptor)
    implementation(libs.kotlinx.coroutines.android)

    // Embedded Local Web Server (Ktor for LAN Jukebox Feature)
    implementation(libs.ktor.server.core)
    implementation(libs.ktor.server.netty)
    implementation(libs.ktor.server.websockets)
    implementation(libs.ktor.server.content.negotiation)
    implementation(libs.ktor.serialization.gson)

    // WorkManager for background daily snapshots
    implementation(libs.androidx.work.runtime.ktx)

    // Debugging
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
}`
  },
  {
    path: 'app/src/main/java/com/localvibe/vibecapsule/VibeCapsuleApplication.kt',
    category: 'data',
    language: 'kotlin',
    content: `package com.localvibe.vibecapsule

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.room.Room
import androidx.work.*
import com.localvibe.vibecapsule.data.local.LocalCapsuleDatabase
import com.localvibe.vibecapsule.server.EmbeddedJukeboxServer
import com.localvibe.vibecapsule.worker.DailySnapshotWorker
import java.util.concurrent.TimeUnit

class VibeCapsuleApplication : Application() {

    companion object {
        lateinit var instance: VibeCapsuleApplication
            private set
        const val NOTIFICATION_CHANNEL_ID = "vibe_capsule_sync_channel"
    }

    val database: LocalCapsuleDatabase by lazy {
        Room.databaseBuilder(
            applicationContext,
            LocalCapsuleDatabase::class.java,
            "vibe_capsule_ledger.db"
        ).fallbackToDestructiveMigration().build()
    }

    val jukeboxServer: EmbeddedJukeboxServer by lazy {
        EmbeddedJukeboxServer(
            onTrackQueuedByGuest = { trackId ->
                // Hook track queueing into state/playlist management
            }
        )
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannels()
        schedulePeriodicSnapshotWorker()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "VibeCapsule Sync Daemon",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Notifies when background snapshot sync daemon is recording Spotify state"
            }
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun schedulePeriodicSnapshotWorker() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val dailyWorkRequest = PeriodicWorkRequestBuilder<DailySnapshotWorker>(24, TimeUnit.HOURS)
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "DailyCapsuleSnapshot",
            ExistingPeriodicWorkPolicy.KEEP,
            dailyWorkRequest
        )
    }
}`
  },
  {
    path: 'app/src/main/java/com/localvibe/vibecapsule/ui/theme/Color.kt',
    category: 'theme',
    language: 'kotlin',
    content: `package com.localvibe.vibecapsule.ui.theme

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

// Brutalist Swiss Color Tokens
val ColorCream = Color(0xFFFBF9F4)        // Pure Swiss Raw Paper Surface
val ColorCoffee = Color(0xFF2C221E)       // Deep Roasted Accents and Bold Type
val ColorNavy = Color(0xFF0F1A34)         // Structural Outlines and Massive Solid Shadows
val ColorAccentOrange = Color(0xFFE0533C) // Swiss Functional Alert Color
val ColorMutedGray = Color(0xFFE5E2DA)     // Grid Line Demarcations

// Structural Dimensions for Swiss Brutalism
object SwissBorders {
    val Hairline = 1.dp
    val Thick = 3.dp
    val Mega = 5.dp
    val SolidShadowOffset = 6.dp
}`
  },
  {
    path: 'app/src/main/java/com/localvibe/vibecapsule/ui/theme/Type.kt',
    category: 'theme',
    language: 'kotlin',
    content: `package com.localvibe.vibecapsule.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val SwissTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Black,
        fontSize = 36.sp,
        lineHeight = 40.sp,
        letterSpacing = (-1.5).sp,
        color = ColorCoffee
    ),
    headlineMedium = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 22.sp,
        lineHeight = 26.sp,
        letterSpacing = (-0.5).sp,
        color = ColorCoffee
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.sp,
        color = ColorCoffee
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 1.sp,
        color = ColorCream
    )
)`
  },
  {
    path: 'app/src/main/java/com/localvibe/vibecapsule/ui/theme/Theme.kt',
    category: 'theme',
    language: 'kotlin',
    content: `package com.localvibe.vibecapsule.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

val BrutalistColorScheme = lightColorScheme(
    primary = ColorNavy,
    secondary = ColorCoffee,
    background = ColorCream,
    surface = ColorCream,
    onPrimary = ColorCream,
    onSecondary = ColorCream,
    onBackground = ColorCoffee,
    onSurface = ColorCoffee
)

@Composable
fun VibeCapsuleTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = BrutalistColorScheme,
        typography = SwissTypography,
        content = content
    )
}`
  },
  {
    path: 'app/src/main/java/com/localvibe/vibecapsule/ui/modifiers/BrutalistShadow.kt',
    category: 'theme',
    language: 'kotlin',
    content: `package com.localvibe.vibecapsule.ui.modifiers

import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.drawIntoCanvas
import androidx.compose.ui.unit.Dp
import com.localvibe.vibecapsule.ui.theme.ColorNavy
import com.localvibe.vibecapsule.ui.theme.SwissBorders

fun Modifier.brutalistShadow(
    color: Color = ColorNavy,
    offsetX: Dp = SwissBorders.SolidShadowOffset,
    offsetY: Dp = SwissBorders.SolidShadowOffset,
    borderWidth: Dp = SwissBorders.Thick
): Modifier = this.drawBehind {
    drawIntoCanvas { canvas ->
        val paint = Paint().apply {
            this.color = color
            this.isAntiAlias = true
        }
        // Draw the solid background offset block shadow
        drawRect(
            color = color,
            topLeft = androidx.compose.ui.geometry.Offset(offsetX.toPx(), offsetY.toPx()),
            size = size
        )
        // Draw structural hard-edge outline frame
        drawRect(
            color = color,
            topLeft = androidx.compose.ui.geometry.Offset(0f, 0f),
            size = size,
            style = Stroke(width = borderWidth.toPx())
        )
    }
}`
  },
  {
    path: 'app/src/main/java/com/localvibe/vibecapsule/ui/components/VinylDiskVisualizer.kt',
    category: 'components',
    language: 'kotlin',
    content: `package com.localvibe.vibecapsule.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.dp
import com.localvibe.vibecapsule.ui.modifiers.brutalistShadow
import com.localvibe.vibecapsule.ui.theme.*

@Composable
fun VinylDiskVisualizer(
    isPlaying: Boolean,
    tempoBpm: Float,
    energy: Float,
    modifier: Modifier = Modifier
) {
    // Compute rotational velocity based on live Spotify metadata
    val baseDuration = if (tempoBpm > 0) ((60000 / tempoBpm) * 2).toInt() else 3000
    val infiniteTransition = rememberInfiniteTransition(label = "VinylRotation")
    val rotationAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = baseDuration, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "DiskAngle"
    )
    // Micro-vibrational shudder driven by energy coefficients
    val dynamicPulseRadius by infiniteTransition.animateFloat(
        initialValue = 0.98f,
        targetValue = 1.02f + (energy * 0.04f),
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 150, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "EnergyPulse"
    )

    Box(
        modifier = modifier
            .size(280.dp)
            .background(ColorCream)
            .brutalistShadow()
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        // Main Core Vinyl Canvas Execution
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer(
                    rotationZ = if (isPlaying) rotationAngle else 0f,
                    scaleX = dynamicPulseRadius,
                    scaleY = dynamicPulseRadius
                )
        ) {
            val center = Offset(size.width / 2, size.height / 2)
            val totalRadius = size.width / 2

            // 1. Draw Outer Physical Platter Ring (Swiss Navy Color)
            drawCircle(
                color = ColorNavy,
                radius = totalRadius,
                center = center,
                style = Stroke(width = SwissBorders.Thick.toPx())
            )
            // 2. Solid Body Grooves Filling Outer Diameter
            drawCircle(
                color = ColorCoffee,
                radius = totalRadius - 4f,
                center = center
            )
            // 3. Draw Microscopic Audio Sound Grooves
            var grooveRadius = totalRadius - 20f
            while (grooveRadius > totalRadius * 0.4f) {
                drawCircle(
                    color = ColorCream.copy(alpha = 0.15f),
                    radius = grooveRadius,
                    center = center,
                    style = Stroke(width = SwissBorders.Hairline.toPx())
                )
                grooveRadius -= 12f
            }
            // 4. Center Record Label Paper Core
            drawCircle(
                color = ColorAccentOrange,
                radius = totalRadius * 0.35f,
                center = center
            )
            // 5. Hard Border around Center Core Label
            drawCircle(
                color = ColorNavy,
                radius = totalRadius * 0.35f,
                center = center,
                style = Stroke(width = SwissBorders.Thick.toPx())
            )
            // 6. Absolute Spindle Hole Pin
            drawCircle(
                color = ColorCream,
                radius = 12f,
                center = center
            )
            drawCircle(
                color = ColorNavy,
                radius = 12f,
                center = center,
                style = Stroke(width = SwissBorders.Thick.toPx())
            )
        }

        // Tactile Tonearm Overlay Indicator Line (Fixed relative to spinning center)
        Canvas(
            modifier = Modifier.fillMaxSize()
        ) {
            val startPoint = Offset(size.width * 0.85f, size.height * 0.10f)
            val endPoint = Offset(size.width / 2 + 30f, size.height / 2 - 20f)
            // Draw ToneArm Body Wireframe
            drawLine(
                color = ColorNavy,
                start = startPoint,
                end = endPoint,
                strokeWidth = SwissBorders.Thick.toPx()
            )
            // Headshell tracking node
            drawCircle(
                color = ColorAccentOrange,
                radius = 10f,
                center = endPoint
            )
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/localvibe/vibecapsule/ui/components/RetroCameraToggle.kt',
    category: 'components',
    language: 'kotlin',
    content: `package com.localvibe.vibecapsule.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import com.localvibe.vibecapsule.ui.theme.*

@Composable
fun RetroCameraToggle(
    label: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    val interactionSource = remember { MutableInteractionSource() }
    // Snap Transition simulating high mechanical spring action
    val knobPositionState by animateFloatAsState(
        targetValue = if (checked) 1f else 0f,
        animationSpec = tween(durationMillis = 80),
        label = "MechanicalSnap"
    )

    Row(
        modifier = modifier
            .background(ColorCream)
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Label using Stark Space Monospace Typographic Matrix
        Text(
            text = label.uppercase(),
            style = SwissTypography.bodyLarge,
            color = ColorCoffee
        )
        Box(
            modifier = Modifier
                .size(width = 75.dp, height = 36.dp)
                .clickable(
                    interactionSource = interactionSource,
                    indication = null
                ) { onCheckedChange(!checked) }
                .drawBehind {
                    // Frame Base Box Drawing
                    drawRoundRect(
                        color = ColorNavy,
                        size = size,
                        cornerRadius = CornerRadius(0f, 0f),
                        style = Stroke(width = SwissBorders.Thick.toPx())
                    )
                    // Interior Track Background Fill
                    drawRect(
                        color = if (checked) ColorAccentOrange else ColorMutedGray,
                        topLeft = Offset(3.dp.toPx(), 3.dp.toPx()),
                        size = Size(size.width - 6.dp.toPx(), size.height - 6.dp.toPx())
                    )
                    // Draw the Mechanical Sliding Shutter Block
                    val maxTravelDistance = size.width - 32.dp.toPx() - 6.dp.toPx()
                    val dynamicLeftOffset = 3.dp.toPx() + (knobPositionState * maxTravelDistance)
                    // Draw Knob Body
                    drawRect(
                        color = ColorCoffee,
                        topLeft = Offset(dynamicLeftOffset, 3.dp.toPx()),
                        size = Size(32.dp.toPx(), size.height - 6.dp.toPx())
                    )
                    // Draw Serrated Detent Grooves inside Switch Knob
                    var internalLineX = dynamicLeftOffset + 8.dp.toPx()
                    while (internalLineX < dynamicLeftOffset + 24.dp.toPx()) {
                        drawLine(
                            color = ColorCream,
                            start = Offset(internalLineX, 8.dp.toPx()),
                            end = Offset(internalLineX, size.height - 8.dp.toPx()),
                            strokeWidth = SwissBorders.Hairline.toPx()
                        )
                        internalLineX += 4.dp.toPx()
                    }
                }
        )
    }
}`
  },
  {
    path: 'app/src/main/java/com/localvibe/vibecapsule/data/local/TrackEntity.kt',
    category: 'data',
    language: 'kotlin',
    content: `package com.localvibe.vibecapsule.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "spotify_tracks")
data class TrackEntity(
    @PrimaryKey val id: String,
    val title: String,
    val artist: String,
    val albumName: String,
    val durationMs: Long,
    val capturedAtTimestamp: Long,
    val playlistOriginContext: String, // Tracks if snapshotted from Discover Weekly, Daily Mix, etc.
    val tempoBpm: Float,
    val energy: Float,
    val danceability: Float,
    val youtubeVideoId: String = "",
    val youtubeQuery: String = ""
)`
  },
  {
    path: 'app/src/main/java/com/localvibe/vibecapsule/data/local/SessionLogEntity.kt',
    category: 'data',
    language: 'kotlin',
    content: `package com.localvibe.vibecapsule.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "listening_sessions")
data class SessionLogEntity(
    @PrimaryKey(autoGenerate = true) val sessionId: Long = 0,
    val trackId: String,
    val timestamp: Long,
    val actionType: String // "PLAYED", "SKIPPED_EARLY"
)`
  },
  {
    path: 'app/src/main/java/com/localvibe/vibecapsule/data/local/CapsuleDao.kt',
    category: 'data',
    language: 'kotlin',
    content: `package com.localvibe.vibecapsule.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface CapsuleDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTracks(tracks: List<TrackEntity>)

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun logSessionEvent(session: SessionLogEntity)

    @Query("SELECT * FROM spotify_tracks ORDER BY capturedAtTimestamp DESC")
    fun getAllSavedTimeCapsuleTracks(): Flow<List<TrackEntity>>

    @Query("SELECT * FROM spotify_tracks WHERE playlistOriginContext = :contextType")
    suspend fun getTracksByOrigin(contextType: String): List<TrackEntity>

    @Query("SELECT COUNT(*) FROM listening_sessions WHERE actionType = 'SKIPPED_EARLY'")
    fun getLocalSkipCount(): Flow<Int>

    @Query("SELECT COUNT(*) FROM spotify_tracks")
    fun getTotalTrackCount(): Flow<Int>

    @Query("DELETE FROM spotify_tracks WHERE id = :trackId")
    suspend fun deleteTrack(trackId: String)
}`
  },
  {
    path: 'app/src/main/java/com/localvibe/vibecapsule/data/local/LocalCapsuleDatabase.kt',
    category: 'data',
    language: 'kotlin',
    content: `package com.localvibe.vibecapsule.data.local

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(entities = [TrackEntity::class, SessionLogEntity::class], version = 1, exportSchema = false)
abstract class LocalCapsuleDatabase : RoomDatabase() {
    abstract fun capsuleDao(): CapsuleDao
}`
  },
  {
    path: 'app/src/main/java/com/localvibe/vibecapsule/network/SpotifyPkceEngine.kt',
    category: 'network',
    language: 'kotlin',
    content: `package com.localvibe.vibecapsule.network

import android.util.Base64
import java.security.MessageDigest
import java.security.SecureRandom

object SpotifyPkceEngine {
    fun generateCodeVerifier(): String {
        val secureRandom = SecureRandom()
        val bytes = ByteArray(64)
        secureRandom.nextBytes(bytes)
        return Base64.encodeToString(bytes, Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP)
    }

    fun generateCodeChallenge(verifier: String): String {
        val bytes = verifier.toByteArray(Charsets.US_ASCII)
        val messageDigest = MessageDigest.getInstance("SHA-256")
        val digest = messageDigest.digest(bytes)
        return Base64.encodeToString(digest, Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP)
    }
}`
  },
  {
    path: 'app/src/main/java/com/localvibe/vibecapsule/network/SpotifyApiService.kt',
    category: 'network',
    language: 'kotlin',
    content: `package com.localvibe.vibecapsule.network

import com.google.gson.annotations.SerializedName
import retrofit2.http.*

interface SpotifyApiService {
    @GET("v1/me/player")
    suspend fun getPlaybackState(
        @Header("Authorization") authHeader: String
    ): PlaybackStateResponse

    @GET("v1/me/playlists")
    suspend fun getCurrentUserPlaylists(
        @Header("Authorization") authHeader: String,
        @Query("limit") limit: Int = 20
    ): PlaylistsResponse

    @GET("v1/playlists/{playlist_id}/tracks")
    suspend fun getPlaylistTracks(
        @Header("Authorization") authHeader: String,
        @Path("playlist_id") playlistId: String
    ): PlaylistTracksResponse

    @GET("v1/audio-features")
    suspend fun getAudioFeaturesForTracks(
        @Header("Authorization") authHeader: String,
        @Query("ids") trackIds: String
    ): AudioFeaturesListResponse

    @FormUrlEncoded
    @POST("api/token")
    suspend fun exchangeToken(
        @Field("client_id") clientId: String,
        @Field("grant_type") grantType: String = "authorization_code",
        @Field("code") code: String,
        @Field("redirect_uri") redirectUri: String,
        @Field("code_verifier") codeVerifier: String
    ): SpotifyTokenResponse
}

data class SpotifyTokenResponse(
    @SerializedName("access_token") val accessToken: String,
    @SerializedName("token_type") val tokenType: String,
    @SerializedName("scope") val scope: String,
    @SerializedName("expires_in") val expiresIn: Int,
    @SerializedName("refresh_token") val refreshToken: String?
)

data class PlaybackStateResponse(
    @SerializedName("is_playing") val isPlaying: Boolean,
    @SerializedName("item") val trackItem: TrackItemResponse?,
    @SerializedName("progress_ms") val progressMs: Long
)

data class TrackItemResponse(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("duration_ms") val durationMs: Long,
    @SerializedName("artists") val artists: List<ArtistResponse>,
    @SerializedName("album") val album: AlbumResponse
)

data class ArtistResponse(@SerializedName("name") val name: String)
data class AlbumResponse(@SerializedName("name") val name: String)
data class PlaylistsResponse(@SerializedName("items") val items: List<PlaylistItem>)
data class PlaylistItem(@SerializedName("id") val id: String, @SerializedName("name") val name: String)
data class PlaylistTracksResponse(@SerializedName("items") val items: List<PlaylistTrackWrapper>)
data class PlaylistTrackWrapper(@SerializedName("track") val track: TrackItemResponse)
data class AudioFeaturesListResponse(@SerializedName("audio_features") val audioFeatures: List<AudioFeaturesResponse>)

data class AudioFeaturesResponse(
    @SerializedName("id") val id: String,
    @SerializedName("tempo") val tempo: Float,
    @SerializedName("energy") val energy: Float,
    @SerializedName("danceability") val danceability: Float
)`
  },
  {
    path: 'app/src/main/java/com/localvibe/vibecapsule/network/RetrofitClient.kt',
    category: 'network',
    language: 'kotlin',
    content: `package com.localvibe.vibecapsule.network

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitClient {
    private const val SPOTIFY_BASE_URL = "https://api.spotify.com/"
    private const val SPOTIFY_ACCOUNTS_URL = "https://accounts.spotify.com/"

    private val okHttpClient: OkHttpClient by lazy {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        OkHttpClient.Builder()
            .addInterceptor(logging)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .build()
    }

    val apiService: SpotifyApiService by lazy {
        Retrofit.Builder()
            .baseUrl(SPOTIFY_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(SpotifyApiService::class.java)
    }

    val authService: SpotifyApiService by lazy {
        Retrofit.Builder()
            .baseUrl(SPOTIFY_ACCOUNTS_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(SpotifyApiService::class.java)
    }
}`
  },
  {
    path: 'app/src/main/java/com/localvibe/vibecapsule/server/EmbeddedJukeboxServer.kt',
    category: 'server',
    language: 'kotlin',
    content: `package com.localvibe.vibecapsule.server

import android.util.Log
import io.ktor.serialization.gson.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.net.ServerSocket

class EmbeddedJukeboxServer(
    private val onTrackQueuedByGuest: (String) -> Unit
) {
    private var serverEngine: NettyApplicationEngine? = null

    private fun findFreePort(): Int {
        return ServerSocket(0).use { it.localPort }
    }

    fun startLocalHostInstance(port: Int = 8080) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                serverEngine = embeddedServer(Netty, port = port) {
                    install(ContentNegotiation) {
                        gson { setPrettyPrinting() }
                    }
                    routing {
                        // Base structural landing metadata for scanning devices
                        get("/") {
                            call.respondText(
                                "{\\"status\\":\\"ACTIVE\\",\\"system\\":\\"VIBECAPSULE LAN ENGINE\\",\\"port\\":$port}"
                            )
                        }
                        // Queue operational payload handling incoming tracks via network
                        post("/queue-track") {
                            val targetTrackId = call.parameters["id"]
                            if (!targetTrackId.isNullOrBlank()) {
                                onTrackQueuedByGuest(targetTrackId)
                                call.respond(mapOf("status" to "SUCCESS", "message" to "Track added to queue", "trackId" to targetTrackId))
                            } else {
                                call.respond(mapOf("status" to "ERROR", "message" to "Missing Track Parameter"))
                            }
                        }
                    }
                }.start(wait = false)
                Log.d("JukeboxServer", "Ktor Local LAN Server established securely on port: $port")
            } catch (e: Exception) {
                Log.e("JukeboxServer", "Failover routing execution prevented: \${e.message}")
            }
        }
    }

    fun shutdownInstance() {
        serverEngine?.stop(1000, 2000)
        serverEngine = null
    }
}`
  },
  {
    path: 'app/src/main/java/com/localvibe/vibecapsule/service/SnapshotSyncService.kt',
    category: 'services',
    language: 'kotlin',
    content: `package com.localvibe.vibecapsule.service

import android.app.Notification
import android.app.Service
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.localvibe.vibecapsule.VibeCapsuleApplication
import kotlinx.coroutines.*

class SnapshotSyncService : Service() {

    private val serviceJob = Job()
    private val serviceScope = CoroutineScope(Dispatchers.IO + serviceJob)

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification: Notification = NotificationCompat.Builder(
            this,
            VibeCapsuleApplication.NOTIFICATION_CHANNEL_ID
        )
            .setContentTitle("VibeCapsule Snapshot Daemon")
            .setContentText("Archiving Discover Weekly & Audio Features...")
            .setSmallIcon(android.R.drawable.ic_popup_sync)
            .setOngoing(true)
            .build()

        startForeground(1001, notification)

        serviceScope.launch {
            try {
                // Fetch tracks and audio telemetry into Room database
                delay(3000)
            } finally {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }

        return START_NOT_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceJob.cancel()
    }
}`
  },
  {
    path: 'app/src/main/java/com/localvibe/vibecapsule/receiver/BootReceiver.kt',
    category: 'services',
    language: 'kotlin',
    content: `package com.localvibe.vibecapsule.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.work.*
import com.localvibe.vibecapsule.worker.DailySnapshotWorker
import java.util.concurrent.TimeUnit

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val dailyWork = PeriodicWorkRequestBuilder<DailySnapshotWorker>(24, TimeUnit.HOURS)
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                "DailyCapsuleSnapshot",
                ExistingPeriodicWorkPolicy.KEEP,
                dailyWork
            )
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/localvibe/vibecapsule/worker/DailySnapshotWorker.kt',
    category: 'services',
    language: 'kotlin',
    content: `package com.localvibe.vibecapsule.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.localvibe.vibecapsule.VibeCapsuleApplication
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class DailySnapshotWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        return@withContext try {
            val db = VibeCapsuleApplication.instance.database
            // In production, invoke SpotifyApiService to fetch current playback & playlists
            // and insert into db.capsuleDao()
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/localvibe/vibecapsule/ui/viewmodel/VibeCapsuleViewModel.kt',
    category: 'viewmodel',
    language: 'kotlin',
    content: `package com.localvibe.vibecapsule.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.localvibe.vibecapsule.VibeCapsuleApplication
import com.localvibe.vibecapsule.data.local.SessionLogEntity
import com.localvibe.vibecapsule.data.local.TrackEntity
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class PlaybackUiState(
    val currentTrackTitle: String = "MIDNIGHT CITY",
    val currentArtist: String = "M83",
    val currentAlbum: String = "Hurry Up, We're Dreaming",
    val currentTrackId: String = "4cOdK2wGLETKBW3PvgPWqT",
    val currentYouTubeVideoId: String = "dX3k_QDnzHE",
    val isPlaying: Boolean = true,
    val tempoBpm: Float = 125f,
    val energy: Float = 0.82f,
    val danceability: Float = 0.67f,
    val lanPartyActive: Boolean = false,
    val privacyShieldActive: Boolean = true,
    val isSpotifyFreeTier: Boolean = true
)

class VibeCapsuleViewModel : ViewModel() {

    private val dao = VibeCapsuleApplication.instance.database.capsuleDao()
    private val jukeboxServer = VibeCapsuleApplication.instance.jukeboxServer

    private val _uiState = MutableStateFlow(PlaybackUiState())
    val uiState: StateFlow<PlaybackUiState> = _uiState.asStateFlow()

    val totalArchivedTracks: StateFlow<Int> = dao.getTotalTrackCount()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 342)

    val localSkipCount: StateFlow<Int> = dao.getLocalSkipCount()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 14)

    val savedTracks: StateFlow<List<TrackEntity>> = dao.getAllSavedTimeCapsuleTracks()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun togglePlayback() {
        _uiState.update { it.copy(isPlaying = !it.isPlaying) }
    }

    fun recordEarlySkip(currentTrackId: String) {
        viewModelScope.launch {
            dao.logSessionEvent(
                SessionLogEntity(
                    trackId = currentTrackId,
                    timestamp = System.currentTimeMillis(),
                    actionType = "SKIPPED_EARLY"
                )
            )
        }
    }

    fun toggleSpotifyFreeTier(isFree: Boolean) {
        _uiState.update { it.copy(isSpotifyFreeTier = isFree) }
    }

    fun toggleLanParty(enabled: Boolean) {
        _uiState.update { it.copy(lanPartyActive = enabled) }
        if (enabled) {
            jukeboxServer.startLocalHostInstance(8080)
        } else {
            jukeboxServer.shutdownInstance()
        }
    }

    fun togglePrivacyShield(enabled: Boolean) {
        _uiState.update { it.copy(privacyShieldActive = enabled) }
    }

    fun archiveTracks(tracks: List<TrackEntity>) {
        viewModelScope.launch {
            dao.insertTracks(tracks)
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/localvibe/vibecapsule/bridge/YouTubeFallbackEngine.kt',
    category: 'bridge',
    language: 'kotlin',
    content: `package com.localvibe.vibecapsule.bridge

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import com.localvibe.vibecapsule.data.local.TrackEntity
import java.net.URLEncoder

object YouTubeFallbackEngine {

    /**
     * Dispatches an Intent to play a single track on YouTube / YouTube Music.
     * Prioritizes native app intent (vnd.youtube), falling back to browser search.
     */
    fun playTrackInYouTube(context: Context, title: String, artist: String, videoId: String = "") {
        val query = "\$artist - \$title Audio"

        // 1. If explicit video ID is known, attempt direct YouTube video launch
        if (videoId.isNotBlank()) {
            val appIntent = Intent(Intent.ACTION_VIEW, Uri.parse("vnd.youtube:\$videoId")).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            if (appIntent.resolveActivity(context.packageManager) != null) {
                context.startActivity(appIntent)
                return
            }
        }

        // 2. Fallback to YouTube web search or browser intent
        val webUrl = "https://www.youtube.com/results?search_query=" + URLEncoder.encode(query, "UTF-8")
        val webIntent = Intent(Intent.ACTION_VIEW, Uri.parse(webUrl)).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(webIntent)
        Toast.makeText(context, "Opening YouTube: \$title", Toast.LENGTH_SHORT).show()
    }

    /**
     * Synthesizes and opens a full playlist on YouTube using the official watch_videos endpoint.
     */
    fun playPlaylistInYouTube(context: Context, tracks: List<TrackEntity>) {
        if (tracks.isEmpty()) {
            Toast.makeText(context, "Capsule ledger is empty", Toast.LENGTH_SHORT).show()
            return
        }

        val videoIds = tracks.map { it.youtubeVideoId }.filter { it.isNotBlank() }
        val playlistUrl = if (videoIds.isNotEmpty()) {
            "https://www.youtube.com/watch_videos?video_ids=" + videoIds.joinToString(",")
        } else {
            val combinedQuery = tracks.take(3).joinToString(" ") { "\${it.artist} \${it.title}" }
            "https://www.youtube.com/results?search_query=" + URLEncoder.encode(combinedQuery, "UTF-8")
        }

        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(playlistUrl)).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        Toast.makeText(context, "Launching YouTube Playlist (\${tracks.size} tracks)", Toast.LENGTH_SHORT).show()
    }

    /**
     * Extracts Spotify playlist ID from URL/URI, resolves songs, and opens YouTube
     * so that all tracks play one after the other continuously.
     */
    fun importSpotifyPlaylistAndPlayAll(context: Context, spotifyUrl: String, tracks: List<TrackEntity>) {
        val playlistId = extractPlaylistId(spotifyUrl)
        playPlaylistInYouTube(context, tracks)
        Toast.makeText(context, "Queued Spotify Playlist #\$playlistId in YouTube Sequencer", Toast.LENGTH_SHORT).show()
    }

    fun extractPlaylistId(url: String): String {
        val pattern = Regex("playlist/([a-zA-Z0-9]+)")
        val match = pattern.find(url)
        return match?.groupValues?.get(1) ?: url.removePrefix("spotify:playlist:").trim()
    }
}`
  },
  {
    path: 'app/src/main/java/com/localvibe/vibecapsule/ui/MainActivity.kt',
    category: 'ui',
    language: 'kotlin',
    content: `package com.localvibe.vibecapsule.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import com.localvibe.vibecapsule.bridge.YouTubeFallbackEngine
import com.localvibe.vibecapsule.ui.theme.ColorCream
import com.localvibe.vibecapsule.ui.theme.VibeCapsuleTheme
import com.localvibe.vibecapsule.ui.viewmodel.VibeCapsuleViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: VibeCapsuleViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Handle Spotify OAuth Callback Intent if opened via custom scheme
        intent?.data?.let { uri ->
            if (uri.scheme == "vibecapsule" && uri.host == "callback") {
                val code = uri.getQueryParameter("code")
                // Exchange code for token using SpotifyPkceEngine
            }
        }

        setContent {
            VibeCapsuleTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = ColorCream
                ) {
                    val state by viewModel.uiState.collectAsState()
                    val totalTracks by viewModel.totalArchivedTracks.collectAsState()
                    val skips by viewModel.localSkipCount.collectAsState()
                    val savedTracks by viewModel.savedTracks.collectAsState()

                    MainSwissDashboardScreen(
                        currentTrackTitle = state.currentTrackTitle,
                        currentArtist = state.currentArtist,
                        isPlaying = state.isPlaying,
                        tempoBpm = state.tempoBpm,
                        energy = state.energy,
                        localSkipCount = skips,
                        totalArchivedTracks = totalTracks,
                        isSpotifyFreeTier = state.isSpotifyFreeTier,
                        onPlayCurrentInYouTube = {
                            YouTubeFallbackEngine.playTrackInYouTube(
                                context = this@MainActivity,
                                title = state.currentTrackTitle,
                                artist = state.currentArtist,
                                videoId = state.currentYouTubeVideoId
                            )
                        },
                        onPlayPlaylistInYouTube = {
                            YouTubeFallbackEngine.playPlaylistInYouTube(
                                context = this@MainActivity,
                                tracks = savedTracks
                            )
                        }
                    )
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/localvibe/vibecapsule/ui/MainSwissDashboardScreen.kt',
    category: 'ui',
    language: 'kotlin',
    content: `package com.localvibe.vibecapsule.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.localvibe.vibecapsule.ui.components.RetroCameraToggle
import com.localvibe.vibecapsule.ui.components.VinylDiskVisualizer
import com.localvibe.vibecapsule.ui.modifiers.brutalistShadow
import com.localvibe.vibecapsule.ui.theme.*

@Composable
fun MainSwissDashboardScreen(
    currentTrackTitle: String = "MIDNIGHT CITY",
    currentArtist: String = "M83",
    isPlaying: Boolean = true,
    tempoBpm: Float = 125f,
    energy: Float = 0.82f,
    localSkipCount: Int = 14,
    totalArchivedTracks: Int = 342,
    isSpotifyFreeTier: Boolean = true,
    onPlayCurrentInYouTube: () -> Unit = {},
    onPlayPlaylistInYouTube: () -> Unit = {}
) {
    var lanPartyActive by remember { mutableStateOf(false) }
    var privacyShieldActive by remember { mutableStateOf(true) }
    var freeTierFallback by remember { mutableStateOf(isSpotifyFreeTier) }
    val verticalScrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ColorCream)
            .padding(16.dp)
            .verticalScroll(verticalScrollState),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        // --- HEADER SECTION: MASSIVE TYPOGRAPHIC ASSAULT ---
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .border(SwissBorders.Thick, ColorNavy)
                .background(ColorCoffee)
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "VIBE_CAPSULE.SYS // ANDROID 15",
                    style = SwissTypography.labelLarge,
                    color = ColorAccentOrange,
                    fontWeight = FontWeight.Bold
                )
                if (freeTierFallback) {
                    Text(
                        text = "[SPOTIFY FREE -> YT BRIDGE ENGAGED]",
                        style = SwissTypography.labelLarge,
                        color = ColorCream,
                        fontSize = 10.sp
                    )
                }
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "LOCAL MUSIC LEDGER",
                style = SwissTypography.displayLarge,
                color = ColorCream
            )
        }

        // --- DUAL GRID ELEMENT LAYER: PLAYBACK METADATA & VINYL ENGINE ---
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.Top
        ) {
            // Vinyl Spinning Module Left Matrix
            VinylDiskVisualizer(
                isPlaying = isPlaying,
                tempoBpm = tempoBpm,
                energy = energy,
                modifier = Modifier.weight(1f)
            )

            // Dynamic Metadata Tracker Terminal Box Right
            Column(
                modifier = Modifier
                    .weight(1f)
                    .border(SwissBorders.Thick, ColorNavy)
                    .background(ColorCream)
                    .padding(12.dp)
                    .height(300.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "[STATUS: CURRENT_EMISSION]",
                    style = SwissTypography.bodyLarge,
                    color = ColorAccentOrange,
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp
                )
                Divider(color = ColorNavy, thickness = SwissBorders.Thick)
                Text(
                    text = currentTrackTitle.uppercase(),
                    style = SwissTypography.headlineMedium,
                    color = ColorCoffee
                )
                Text(
                    text = "BY -> \$currentArtist".uppercase(),
                    style = SwissTypography.bodyLarge,
                    color = ColorCoffee,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.weight(1f))
                Text(text = "TEMPO // \${tempoBpm.toInt()} BPM", style = SwissTypography.bodyLarge)
                Text(text = "ENERGY // \${(energy * 100).toInt()}%", style = SwissTypography.bodyLarge)

                // High-Contrast Brutalist Play in YouTube Action Button
                Button(
                    onClick = onPlayCurrentInYouTube,
                    shape = RectangleShape,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = ColorAccentOrange,
                        contentColor = ColorCream
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(SwissBorders.Thick, ColorNavy)
                ) {
                    Text(
                        text = "▶ PLAY IN YOUTUBE",
                        style = SwissTypography.labelLarge,
                        fontWeight = FontWeight.Black
                    )
                }
            }
        }

        // --- HARD TACTILE INSTRUMENTATION CONTROLS PANEL ---
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .brutalistShadow()
                .background(ColorCream)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "MECHANICAL HARDWARE CONFIGURATION",
                style = SwissTypography.headlineMedium,
                fontSize = 16.sp
            )
            Divider(color = ColorNavy, thickness = SwissBorders.Hairline)
            RetroCameraToggle(
                label = "SPOTIFY FREE TIER FALLBACK",
                checked = freeTierFallback,
                onCheckedChange = { freeTierFallback = it }
            )
            RetroCameraToggle(
                label = "LOCAL HOST LAN JUKEBOX",
                checked = lanPartyActive,
                onCheckedChange = { lanPartyActive = it }
            )
            RetroCameraToggle(
                label = "ZERO_CLOUD LOCAL PRIVACY SHIELD",
                checked = privacyShieldActive,
                onCheckedChange = { privacyShieldActive = it }
            )
        }

        // --- DEVICE METRICS DATA BLOCKS ENGINE ---
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Box Data Alpha (With one-touch Play Entire Playlist on YouTube)
            Column(
                modifier = Modifier
                    .weight(1f)
                    .border(SwissBorders.Thick, ColorNavy)
                    .background(ColorAccentOrange)
                    .padding(16.dp)
            ) {
                Text(text = "ARCHIVED", style = SwissTypography.bodyLarge, color = ColorCream)
                Text(
                    text = "\$totalArchivedTracks",
                    style = SwissTypography.displayLarge,
                    color = ColorCream,
                    fontSize = 44.sp
                )
                Text(text = "TOTAL TRACKS", style = SwissTypography.bodyLarge, color = ColorCream, fontSize = 10.sp)
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = onPlayPlaylistInYouTube,
                    shape = RectangleShape,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = ColorNavy,
                        contentColor = ColorCream
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(SwissBorders.Hairline, ColorCream)
                ) {
                    Text(
                        text = "PLAY PLAYLIST ON YOUTUBE",
                        style = SwissTypography.labelLarge,
                        fontSize = 10.sp
                    )
                }
            }

            // Box Data Beta
            Column(
                modifier = Modifier
                    .weight(1f)
                    .border(SwissBorders.Thick, ColorNavy)
                    .background(ColorMutedGray)
                    .padding(16.dp)
            ) {
                Text(text = "LOCAL SKIPS", style = SwissTypography.bodyLarge, color = ColorCoffee)
                Text(
                    text = "\$localSkipCount",
                    style = SwissTypography.displayLarge,
                    color = ColorCoffee,
                    fontSize = 44.sp
                )
                Text(text = "EARLY TERMINATIONS", style = SwissTypography.bodyLarge, color = ColorCoffee, fontSize = 10.sp)
            }
    }
}`
  }
];
