package com.avineesh.lifeos.timer;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.SystemClock;

import androidx.core.app.NotificationCompat;

import com.avineesh.lifeos.MainActivity;
import com.avineesh.lifeos.R;

public class TimerForegroundService extends Service {

    public static final String CHANNEL_ID = "lifeos_focus_timer";
    public static final int NOTIFICATION_ID = 4201;
    public static final String ACTION_STOP = "com.lifeos.timer.ACTION_STOP";

    public static boolean isRunning = false;
    public static long startElapsedRealtime = 0L;
    public static long pausedOffsetMs = 0L;

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_STOP.equals(action)) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String label = intent != null && intent.getStringExtra("label") != null 
            ? intent.getStringExtra("label") : "Focus Session";
        boolean paused = intent != null && intent.getBooleanExtra("paused", false);
        long resumeBaseMs = intent != null ? intent.getLongExtra("elapsedBaseMs", 0L) : 0L;

        isRunning = !paused;
        pausedOffsetMs = resumeBaseMs;
        startElapsedRealtime = SystemClock.elapsedRealtime() - resumeBaseMs;

        startForeground(NOTIFICATION_ID, buildNotification(label, paused));
        return START_STICKY;
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

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(label)
                .setContentIntent(contentPI)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
                .addAction(0, "Stop", stopPI);

        if (paused) {
            long totalSeconds = pausedOffsetMs / 1000;
            long h = totalSeconds / 3600;
            long m = (totalSeconds % 3600) / 60;
            long s = totalSeconds % 60;
            builder.setContentText(String.format("Paused · %02d:%02d:%02d", h, m, s));
            builder.setUsesChronometer(false);
        } else {
            builder.setContentText("Focus session active");
            builder.setUsesChronometer(true);
            builder.setChronometerCountDown(false);
            builder.setWhen(System.currentTimeMillis() - pausedOffsetMs);
            builder.setShowWhen(true);
        }

        return builder.build();
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Focus Timer",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows your live study/focus timer");
            channel.setShowBadge(false);
            
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) {
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
