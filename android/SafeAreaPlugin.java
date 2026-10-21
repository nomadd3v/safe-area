package com.nomadd3v.safearea;

import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * @nomadd3v/screensafe native bridge. Copy this file into your app's android/app/src/main/java/<your package>/
 * (change the package line) and register it BEFORE super.onCreate in MainActivity:
 *
 *   public void onCreate(Bundle b) { registerPlugin(SafeAreaPlugin.class); super.onCreate(b); }
 *
 * No npm dependency: the JS side calls Capacitor.nativePromise("SafeArea", "getInsets").
 * Returns system bars + display cutout in CSS px, measured against the WebView itself, so a WebView that already sits
 * below the status bar reports 0 for it (no double padding).
 */
@CapacitorPlugin(name = "SafeArea")
public class SafeAreaPlugin extends Plugin {
    @PluginMethod
    public void getInsets(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            View wv = getBridge().getWebView();
            WindowInsetsCompat root = ViewCompat.getRootWindowInsets(wv);
            JSObject out = new JSObject();
            if (root == null) { out.put("top", 0); out.put("right", 0); out.put("bottom", 0); out.put("left", 0); call.resolve(out); return; }
            Insets i = root.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            float d = getActivity().getResources().getDisplayMetrics().density;
            int[] loc = new int[2];
            wv.getLocationOnScreen(loc);
            View decor = getActivity().getWindow().getDecorView();
            int offTop = loc[1], offLeft = loc[0];
            int offBottom = Math.max(0, decor.getHeight() - (loc[1] + wv.getHeight()));
            int offRight = Math.max(0, decor.getWidth() - (loc[0] + wv.getWidth()));
            out.put("top", Math.round(Math.max(0, i.top - offTop) / d));
            out.put("left", Math.round(Math.max(0, i.left - offLeft) / d));
            out.put("bottom", Math.round(Math.max(0, i.bottom - offBottom) / d));
            out.put("right", Math.round(Math.max(0, i.right - offRight) / d));
            call.resolve(out);
        });
    }
}
