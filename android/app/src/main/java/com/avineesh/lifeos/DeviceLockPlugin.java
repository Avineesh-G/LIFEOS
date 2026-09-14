package com.avineesh.lifeos;

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
            BiometricManager biometricManager = BiometricManager.from(getContext());
            int authenticators = BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.DEVICE_CREDENTIAL;
            int canAuthenticate = biometricManager.canAuthenticate(authenticators);

            JSObject ret = new JSObject();
            boolean available = (canAuthenticate == BiometricManager.BIOMETRIC_SUCCESS);
            ret.put("available", available);
            ret.put("status", canAuthenticate);
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("available", false);
            ret.put("error", e.getMessage());
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        FragmentActivity activity = getActivity();
        if (activity == null) {
            call.reject("Activity unavailable");
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
                        .setSubtitle(subtitle)
                        .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.DEVICE_CREDENTIAL);

                BiometricPrompt.PromptInfo promptInfo = promptInfoBuilder.build();
                biometricPrompt.authenticate(promptInfo);
            } catch (Exception e) {
                JSObject ret = new JSObject();
                ret.put("success", false);
                ret.put("error", e.getMessage());
                call.resolve(ret);
            }
        });
    }
}
