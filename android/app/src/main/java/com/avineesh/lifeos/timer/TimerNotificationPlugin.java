package com.avineesh.lifeos.timer;

import android.content.Intent;
import android.os.Build;
import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TimerNotification")
public class TimerNotificationPlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {
        String label = call.getString("label");
        if (label == null) label = "Focus Session";
        
        Long elapsedObj = call.getLong("elapsedBaseMs");
        long elapsedBaseMs = elapsedObj != null ? elapsedObj : 0L;

        Intent intent = new Intent(getContext(), TimerForegroundService.class);
        intent.putExtra("label", label);
        intent.putExtra("paused", false);
        intent.putExtra("elapsedBaseMs", elapsedBaseMs);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void pause(PluginCall call) {
        String label = call.getString("label");
        if (label == null) label = "Focus Session";
        
        Long elapsedObj = call.getLong("elapsedBaseMs");
        long elapsedBaseMs = elapsedObj != null ? elapsedObj : 0L;

        Intent intent = new Intent(getContext(), TimerForegroundService.class);
        intent.putExtra("label", label);
        intent.putExtra("paused", true);
        intent.putExtra("elapsedBaseMs", elapsedBaseMs);
        
        getContext().startService(intent);
        call.resolve();
    }

    @PluginMethod
    public void resume(PluginCall call) {
        start(call);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Intent intent = new Intent(getContext(), TimerForegroundService.class);
        intent.setAction(TimerForegroundService.ACTION_STOP);
        getContext().startService(intent);
        call.resolve();
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33) {
            ActivityCompat.requestPermissions(
                getActivity(), new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, 9911
            );
        }
        JSObject result = new JSObject();
        result.put("granted", true);
        call.resolve(result);
    }
}
