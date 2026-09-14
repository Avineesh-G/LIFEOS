package com.avineesh.lifeos;

import android.app.KeyguardManager;
import android.content.Context;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.concurrent.Executor;

@CapacitorPlugin(name = "DeviceLock")
public class DeviceLockPlugin extends Plugin {

    @PluginMethod
    public void isAvailable(PluginCall call) {
        try {
            Context context = getContext();
            KeyguardManager keyguardManager = (KeyguardManager) context.getSystemService(Context.KEYGUARD_SERVICE);
            boolean isDeviceSecure = keyguardManager != null && keyguardManager.isDeviceSecure();

            BiometricManager biometricManager = BiometricManager.from(context);
            int canAuthenticate = biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG);
            boolean hasBiometrics = (canAuthenticate == BiometricManager.BIOMETRIC_SUCCESS);

            JSObject ret = new JSObject();
            ret.put("available", isDeviceSecure || hasBiometrics);
            ret.put("isDeviceSecure", isDeviceSecure);
            ret.put("hasBiometrics", hasBiometrics);
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("available", false);
            ret.put("error", e.getMessage() != null ? e.getMessage() : "Error checking availability");
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        FragmentActivity activity = getActivity();
        if (activity == null) {
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("error", "Activity unavailable");
            call.resolve(ret);
            return;
        }

        KeyguardManager keyguardManager = (KeyguardManager) getContext().getSystemService(Context.KEYGUARD_SERVICE);
        if (keyguardManager == null || !keyguardManager.isDeviceSecure()) {
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("error", "No screen lock set up on this device. Please enable a PIN, pattern, or fingerprint in Android Settings.");
            call.resolve(ret);
            return;
        }

        String title = call.getString("title", "LifeOS Protected");
        String subtitle = call.getString("subtitle", "Unlock with your phone's fingerprint or screen lock");

        activity.runOnUiThread(() -> {
            try {
                Executor executor = ContextCompat.getMainExecutor(getContext());

                BiometricPrompt.AuthenticationCallback callback = new BiometricPrompt.AuthenticationCallback() {
                    @Override
                    public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                        super.onAuthenticationError(errorCode, errString);
                        JSObject ret = new JSObject();
                        ret.put("success", false);
                        ret.put("errorCode", errorCode);
                        ret.put("message", errString.toString());
                        ret.put("error", errString.toString());
                        call.resolve(ret);
                    }

                    @Override
                    public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                        super.onAuthenticationSucceeded(result);
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        call.resolve(ret);
                    }

                    @Override
                    public void onAuthenticationFailed() {
                        super.onAuthenticationFailed();
                    }
                };

                BiometricPrompt biometricPrompt = new BiometricPrompt(activity, executor, callback);

                BiometricPrompt.PromptInfo.Builder promptInfoBuilder = new BiometricPrompt.PromptInfo.Builder()
                        .setTitle(title)
                        .setSubtitle(subtitle);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    try {
                        promptInfoBuilder.setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.DEVICE_CREDENTIAL);
                    } catch (Exception ignored) {
                        promptInfoBuilder.setDeviceCredentialAllowed(true);
                    }
                } else {
                    promptInfoBuilder.setDeviceCredentialAllowed(true);
                }

                BiometricPrompt.PromptInfo promptInfo = promptInfoBuilder.build();
                biometricPrompt.authenticate(promptInfo);
            } catch (Exception e) {
                JSObject ret = new JSObject();
                ret.put("success", false);
                ret.put("error", e.getMessage() != null ? e.getMessage() : "Authentication prompt failed");
                call.resolve(ret);
            }
        });
    }
}
