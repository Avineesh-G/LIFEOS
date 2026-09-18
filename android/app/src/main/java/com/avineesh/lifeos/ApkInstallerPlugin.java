package com.avineesh.lifeos;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import android.util.Log;

import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

@CapacitorPlugin(name = "ApkInstaller")
public class ApkInstallerPlugin extends Plugin {

    private static final String TAG = "ApkInstaller";
    private static final String APK_FILE_NAME = "LifeOS_update.apk";

    private DownloadManager downloadManager;
    private long activeDownloadId = -1;
    private BroadcastReceiver downloadReceiver;
    private ScheduledExecutorService progressScheduler;
    private ScheduledFuture<?> progressTask;
    private String expectedSha256;
    private PluginCall activeCall;

    @Override
    public void load() {
        super.load();
        downloadManager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
    }

    @PluginMethod
    public void canRequestPackageInstalls(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            boolean canInstall = getActivity().getPackageManager().canRequestPackageInstalls();
            ret.put("canInstall", canInstall);
        } else {
            ret.put("canInstall", true);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                call.resolve();
            } catch (Exception e) {
                Log.e(TAG, "Failed to open install permission settings", e);
                call.reject("Failed to open install permission settings: " + e.getMessage());
            }
        } else {
            call.resolve();
        }
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String apkUrl = call.getString("url");
        if (apkUrl == null || apkUrl.isEmpty()) {
            call.reject("URL parameter is required");
            return;
        }

        expectedSha256 = call.getString("sha256");
        activeCall = call;

        cleanupPreviousDownload();

        try {
            // Target file in app's external files downloads directory
            File downloadsDir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
            if (downloadsDir != null && !downloadsDir.exists()) {
                downloadsDir.mkdirs();
            }
            File targetApk = new File(downloadsDir, APK_FILE_NAME);
            if (targetApk.exists()) {
                targetApk.delete();
            }

            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(apkUrl));
            request.setTitle("LifeOS Update");
            request.setDescription("Downloading latest LifeOS APK...");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalFilesDir(getContext(), Environment.DIRECTORY_DOWNLOADS, APK_FILE_NAME);
            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(true);

            // Register completion BroadcastReceiver
            registerDownloadReceiver(targetApk);

            // Enqueue download via Android's DownloadManager
            activeDownloadId = downloadManager.enqueue(request);
            Log.d(TAG, "Download enqueued with ID: " + activeDownloadId);

            // Start 500ms progress polling
            startProgressPolling(activeDownloadId);

        } catch (Exception e) {
            Log.e(TAG, "Failed to enqueue download", e);
            cleanupPreviousDownload();
            call.reject("Failed to enqueue download: " + e.getMessage());
        }
    }

    @PluginMethod
    public void installDownloadedApk(PluginCall call) {
        File downloadsDir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        File targetApk = new File(downloadsDir, APK_FILE_NAME);

        if (!targetApk.exists()) {
            call.reject("No downloaded APK file found. Please download the update first.");
            return;
        }

        boolean canInstall = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            canInstall = getActivity().getPackageManager().canRequestPackageInstalls();
        }

        if (!canInstall) {
            JSObject res = new JSObject();
            res.put("status", "permission_needed");
            call.resolve(res);
            return;
        }

        try {
            triggerInstallIntent(targetApk);
            JSObject res = new JSObject();
            res.put("success", true);
            res.put("message", "Package installer launched successfully");
            call.resolve(res);
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch package installer", e);
            call.reject("Failed to launch package installer: " + e.getMessage());
        }
    }

    private void registerDownloadReceiver(File targetApk) {
        if (downloadReceiver != null) {
            try {
                getContext().unregisterReceiver(downloadReceiver);
            } catch (Exception ignored) {}
        }

        downloadReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                if (id != activeDownloadId) {
                    return;
                }

                Log.d(TAG, "DownloadManager broadcast received for ID: " + id);
                stopProgressPolling();

                DownloadManager.Query query = new DownloadManager.Query();
                query.setFilterById(activeDownloadId);

                try (Cursor cursor = downloadManager.query(query)) {
                    if (cursor != null && cursor.moveToFirst()) {
                        int statusIdx = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
                        int status = statusIdx != -1 ? cursor.getInt(statusIdx) : -1;

                        if (status == DownloadManager.STATUS_SUCCESSFUL) {
                            handleDownloadSuccess(targetApk);
                        } else if (status == DownloadManager.STATUS_FAILED) {
                            int reasonIdx = cursor.getColumnIndex(DownloadManager.COLUMN_REASON);
                            int reason = reasonIdx != -1 ? cursor.getInt(reasonIdx) : -1;
                            handleDownloadFailure("Download failed with DownloadManager reason code: " + reason);
                        }
                    } else {
                        handleDownloadFailure("Download record not found in DownloadManager");
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error handling download completion", e);
                    handleDownloadFailure("Failed inspecting download status: " + e.getMessage());
                } finally {
                    unregisterDownloadReceiver();
                }
            }
        };

        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        ContextCompat.registerReceiver(getContext(), downloadReceiver, filter, ContextCompat.RECEIVER_EXPORTED);
    }

    private void unregisterDownloadReceiver() {
        if (downloadReceiver != null) {
            try {
                getContext().unregisterReceiver(downloadReceiver);
            } catch (Exception ignored) {}
            downloadReceiver = null;
        }
    }

    private void handleDownloadSuccess(File targetApk) {
        if (!targetApk.exists() || targetApk.length() == 0) {
            handleDownloadFailure("Downloaded APK file is empty or missing");
            return;
        }

        // Notify 100% progress
        JSObject progressObj = new JSObject();
        progressObj.put("progress", 100);
        progressObj.put("bytesRead", targetApk.length());
        progressObj.put("totalBytes", targetApk.length());
        notifyListeners("downloadProgress", progressObj);

        // Checksum verification
        if (expectedSha256 != null && !expectedSha256.trim().isEmpty()) {
            String actualSha256 = computeFileSha256(targetApk);
            Log.d(TAG, "Expected SHA256: " + expectedSha256 + " | Actual: " + actualSha256);

            if (actualSha256 == null || !actualSha256.equalsIgnoreCase(expectedSha256.trim())) {
                targetApk.delete();
                JSObject err = new JSObject();
                err.put("error", "checksum_mismatch");
                err.put("message", "Downloaded APK failed integrity verification (SHA256 mismatch)");
                err.put("expected", expectedSha256);
                err.put("actual", actualSha256);
                notifyListeners("downloadError", err);

                if (activeCall != null) {
                    activeCall.reject("checksum_mismatch");
                    activeCall = null;
                }
                return;
            }
        }

        // Check install permissions before firing intent
        boolean canInstall = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            canInstall = getActivity().getPackageManager().canRequestPackageInstalls();
        }

        if (!canInstall) {
            JSObject res = new JSObject();
            res.put("status", "permission_needed");
            res.put("message", "Permission needed to install unknown packages");
            notifyListeners("permissionNeeded", res);

            if (activeCall != null) {
                activeCall.resolve(res);
                activeCall = null;
            }
            return;
        }

        try {
            triggerInstallIntent(targetApk);
            JSObject res = new JSObject();
            res.put("status", "installing");
            res.put("message", "Package installer launched");
            if (activeCall != null) {
                activeCall.resolve(res);
                activeCall = null;
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed launching installer after download", e);
            handleDownloadFailure("Installer launch failed: " + e.getMessage());
        }
    }

    private void handleDownloadFailure(String error) {
        Log.e(TAG, error);
        JSObject err = new JSObject();
        err.put("error", error);
        notifyListeners("downloadError", err);

        if (activeCall != null) {
            activeCall.reject(error);
            activeCall = null;
        }
    }

    private void triggerInstallIntent(File apkFile) {
        Context ctx = getContext();
        Uri apkUri = FileProvider.getUriForFile(
            ctx,
            ctx.getPackageName() + ".fileprovider",
            apkFile
        );

        Intent installIntent = new Intent(Intent.ACTION_VIEW);
        installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
        installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        ctx.startActivity(installIntent);
    }

    private void startProgressPolling(long downloadId) {
        stopProgressPolling();
        progressScheduler = Executors.newSingleThreadScheduledExecutor();

        progressTask = progressScheduler.scheduleAtFixedRate(() -> {
            if (activeDownloadId != downloadId) return;

            DownloadManager.Query query = new DownloadManager.Query();
            query.setFilterById(downloadId);

            try (Cursor cursor = downloadManager.query(query)) {
                if (cursor != null && cursor.moveToFirst()) {
                    int bytesDownloadedIdx = cursor.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR);
                    int totalBytesIdx = cursor.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES);

                    long bytesDownloaded = bytesDownloadedIdx != -1 ? cursor.getLong(bytesDownloadedIdx) : 0;
                    long totalBytes = totalBytesIdx != -1 ? cursor.getLong(totalBytesIdx) : -1;

                    int progress = totalBytes > 0 ? (int) ((bytesDownloaded * 100) / totalBytes) : -1;

                    JSObject progressObj = new JSObject();
                    progressObj.put("progress", progress);
                    progressObj.put("bytesRead", bytesDownloaded);
                    progressObj.put("totalBytes", totalBytes);
                    notifyListeners("downloadProgress", progressObj);
                }
            } catch (Exception e) {
                Log.w(TAG, "Error polling download progress", e);
            }
        }, 0, 500, TimeUnit.MILLISECONDS);
    }

    private void stopProgressPolling() {
        if (progressTask != null) {
            progressTask.cancel(true);
            progressTask = null;
        }
        if (progressScheduler != null) {
            progressScheduler.shutdownNow();
            progressScheduler = null;
        }
    }

    private void cleanupPreviousDownload() {
        stopProgressPolling();
        unregisterDownloadReceiver();
        activeDownloadId = -1;
    }

    private String computeFileSha256(File file) {
        try (InputStream is = new FileInputStream(file)) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[16384];
            int read;
            while ((read = is.read(buffer)) != -1) {
                digest.update(buffer, 0, read);
            }
            byte[] hash = digest.digest();
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            Log.e(TAG, "Failed computing SHA256", e);
            return null;
        }
    }

    @Override
    protected void handleOnDestroy() {
        cleanupPreviousDownload();
        super.handleOnDestroy();
    }
}
