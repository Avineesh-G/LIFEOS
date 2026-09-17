package com.avineesh.lifeos;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.IBinder;
import android.os.SystemClock;
import android.view.View;
import android.widget.RemoteViews;

import androidx.core.app.NotificationCompat;

public class TimerForegroundService extends Service {

    public static final String CHANNEL_ID = "lifeos_focus_timer_v3";
    public static final int NOTIFICATION_ID = 4201;

    public static final String ACTION_START = "com.lifeos.timer.ACTION_START";
    public static final String ACTION_PAUSE = "com.lifeos.timer.ACTION_PAUSE";
    public static final String ACTION_RESUME = "com.lifeos.timer.ACTION_RESUME";
    public static final String ACTION_STOP = "com.lifeos.timer.ACTION_STOP";

    public static boolean isRunning = false;
    public static long startElapsedRealtime = 0L;
    public static long pausedOffsetMs = 0L;
    public static String currentLabel = "Deep Work";

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;

        if (ACTION_STOP.equals(action)) {
            isRunning = false;
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        if (ACTION_PAUSE.equals(action)) {
            if (isRunning) {
                pausedOffsetMs = Math.max(0L, SystemClock.elapsedRealtime() - startElapsedRealtime);
                isRunning = false;
                updateNotification(currentLabel, true);
            }
            return START_STICKY;
        }

        if (ACTION_RESUME.equals(action)) {
            if (!isRunning) {
                startElapsedRealtime = SystemClock.elapsedRealtime() - pausedOffsetMs;
                isRunning = true;
                updateNotification(currentLabel, false);
            }
            return START_STICKY;
        }

        // Default or explicit start / pause configuration from Plugin
        if (intent != null && intent.getStringExtra("label") != null) {
            currentLabel = intent.getStringExtra("label");
        }
        boolean paused = intent != null && intent.getBooleanExtra("paused", false);
        long resumeBaseMs = intent != null ? intent.getLongExtra("elapsedBaseMs", 0L) : 0L;

        isRunning = !paused;
        pausedOffsetMs = resumeBaseMs;
        startElapsedRealtime = SystemClock.elapsedRealtime() - resumeBaseMs;

        startForeground(NOTIFICATION_ID, buildNotification(currentLabel, paused));
        return START_STICKY;
    }

    private void updateNotification(String label, boolean paused) {
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm != null) {
            nm.notify(NOTIFICATION_ID, buildNotification(label, paused));
        }
    }

    private Notification buildNotification(String label, boolean paused) {
        Intent openAppIntent = new Intent(this, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent contentPI = PendingIntent.getActivity(
                this, 0, openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent stopIntent = new Intent(this, TimerForegroundService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPI = PendingIntent.getService(
                this, 1, stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent pauseIntent = new Intent(this, TimerForegroundService.class);
        pauseIntent.setAction(ACTION_PAUSE);
        PendingIntent pausePI = PendingIntent.getService(
                this, 2, pauseIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent resumeIntent = new Intent(this, TimerForegroundService.class);
        resumeIntent.setAction(ACTION_RESUME);
        PendingIntent resumePI = PendingIntent.getService(
                this, 3, resumeIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Format formatted static string for paused state
        long totalSeconds = pausedOffsetMs / 1000;
        long h = totalSeconds / 3600;
        long m = (totalSeconds % 3600) / 60;
        long s = totalSeconds % 60;
        String formattedDuration = String.format("%02d:%02d:%02d", h, m, s);

        // RemoteViews for custom content
        RemoteViews customView = new RemoteViews(getPackageName(), R.layout.notification_timer);
        String sessionTitle = label.toUpperCase().startsWith("DEEP WORK") ? label : "Deep Work: " + label;
        customView.setTextViewText(R.id.notif_session_title, sessionTitle);

        if (paused) {
            customView.setViewVisibility(R.id.notif_chronometer, View.GONE);
            customView.setViewVisibility(R.id.notif_static_time, View.VISIBLE);
            customView.setTextViewText(R.id.notif_static_time, formattedDuration);
            customView.setViewVisibility(R.id.notif_status_badge, View.VISIBLE);
            customView.setTextViewText(R.id.notif_status_badge, "❚❚ Paused");
            customView.setTextColor(R.id.notif_status_badge, Color.parseColor("#F59E0B")); // Amber
        } else {
            customView.setViewVisibility(R.id.notif_static_time, View.GONE);
            customView.setViewVisibility(R.id.notif_chronometer, View.VISIBLE);
            customView.setChronometer(R.id.notif_chronometer, SystemClock.elapsedRealtime() - pausedOffsetMs, "%s", true);
            customView.setViewVisibility(R.id.notif_status_badge, View.VISIBLE);
            customView.setTextViewText(R.id.notif_status_badge, "● Active");
            customView.setTextColor(R.id.notif_status_badge, Color.parseColor("#10B981")); // Emerald
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setSubText("LifeOS Focus Timer")
                .setContentTitle(sessionTitle)
                .setContentText(paused ? "Paused · " + formattedDuration : "Focus session active")
                .setContentIntent(contentPI)
                .setCustomContentView(customView)
                .setCustomBigContentView(customView)
                .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setPriority(NotificationCompat.PRIORITY_HIGH);

        // Actions: Pause or Resume, and Stop
        if (paused) {
            builder.addAction(0, "Resume", resumePI);
        } else {
            builder.addAction(0, "Pause", pausePI);
        }
        builder.addAction(0, "Stop", stopPI);

        return builder.build();
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) {
                // Delete old channel if it existed with IMPORTANCE_LOW
                try {
                    nm.deleteNotificationChannel("lifeos_focus_timer");
                } catch (Exception ignored) {}

                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        "Live Focus Stopwatch",
                        NotificationManager.IMPORTANCE_DEFAULT
                );
                channel.setDescription("Shows real-time focus sessions in active notification bar");
                channel.setSound(null, null);
                channel.enableVibration(false);
                channel.setShowBadge(true);
                nm.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onDestroy() {
        isRunning = false;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
