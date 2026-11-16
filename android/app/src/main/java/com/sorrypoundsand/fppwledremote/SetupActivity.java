package com.sorrypoundsand.fppwledremote;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.text.InputType;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.ViewGroup;
import android.webkit.WebViewDatabase;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

/** First-run and Settings screen: the Pi's address and FPP's web password. */
public class SetupActivity extends Activity {

    static final String EXTRA_ERROR = "error";

    private static final int BG = 0xFF0A0E18, CARD = 0xFF1A2236, LINE = 0xFF273150,
            TEXT = 0xFFE9EDF7, DIM = 0xFF8A94B2, ACCENT = 0xFFFFC04A, BAD = 0xFFFF8A9B;

    private EditText host, user, pass;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        SharedPreferences p = getSharedPreferences(MainActivity.PREFS, MODE_PRIVATE);

        LinearLayout col = new LinearLayout(this);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setPadding(dp(20), dp(28), dp(20), dp(28));

        col.addView(text("WLED Remote", 26, TEXT, true));
        col.addView(text("Connects to the WLED Remote plugin on your FPP player. "
                + "Your phone needs to be on the same Wi-Fi as the Pi.", 15, DIM, false), gap(6));

        String err = getIntent().getStringExtra(EXTRA_ERROR);
        if (err != null) col.addView(text(err, 15, BAD, true), gap(14));

        col.addView(label("Pi address"), gap(22));
        host = field(p.getString(MainActivity.KEY_HOST, ""), "192.168.1.50 or fpp.local", InputType.TYPE_TEXT_VARIATION_URI);
        col.addView(host);
        col.addView(text("The same address you type in your browser to open FPP.", 13, DIM, false), gap(4));

        col.addView(label("FPP username"), gap(18));
        user = field(p.getString(MainActivity.KEY_USER, "fpp"), "fpp", InputType.TYPE_TEXT_VARIATION_NORMAL);
        col.addView(user);

        col.addView(label("FPP web password"), gap(18));
        pass = field(p.getString(MainActivity.KEY_PASS, ""), "Leave empty if FPP has no password",
                InputType.TYPE_TEXT_VARIATION_PASSWORD);
        col.addView(pass);
        CheckBox show = new CheckBox(this);
        show.setText("Show password");
        show.setTextColor(DIM);
        show.setOnCheckedChangeListener((b, on) -> {
            int sel = pass.getSelectionEnd();
            pass.setInputType(InputType.TYPE_CLASS_TEXT | (on ? InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
                    : InputType.TYPE_TEXT_VARIATION_PASSWORD));
            pass.setSelection(Math.max(0, sel));
        });
        col.addView(show, gap(4));
        col.addView(text("Saved only on this device, in this app's private storage.", 13, DIM, false));

        Button save = new Button(this);
        save.setText("Save and connect");
        save.setAllCaps(false);
        save.setTextSize(TypedValue.COMPLEX_UNIT_SP, 17);
        save.setTextColor(0xFF1D0F00);
        save.setBackground(round(ACCENT, ACCENT));
        save.setOnClickListener(v -> save());
        col.addView(save, gap(24));

        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(BG);
        scroll.setFillViewport(true);
        scroll.addView(col);
        setContentView(scroll);
    }

    private void save() {
        String h = host.getText().toString().trim()
                .replaceFirst("(?i)^https?://", "")
                .replaceAll("/.*$", "");
        if (h.isEmpty()) {
            host.setError("Enter the Pi's address, like 192.168.1.50");
            host.requestFocus();
            return;
        }
        String u = user.getText().toString().trim();
        getSharedPreferences(MainActivity.PREFS, MODE_PRIVATE).edit()
                .putString(MainActivity.KEY_HOST, h)
                .putString(MainActivity.KEY_USER, u.isEmpty() ? "fpp" : u)
                .putString(MainActivity.KEY_PASS, pass.getText().toString())
                .apply();
        // Forget any password the WebView remembered, so the new one is the one used.
        WebViewDatabase.getInstance(this).clearHttpAuthUsernamePassword();
        Intent i = new Intent(this, MainActivity.class);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(i);
        finish();
    }

    private TextView text(String s, int sp, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        t.setTextColor(color);
        if (bold) t.setTypeface(t.getTypeface(), android.graphics.Typeface.BOLD);
        return t;
    }

    private TextView label(String s) {
        return text(s, 14, DIM, true);
    }

    private EditText field(String value, String hint, int variation) {
        EditText e = new EditText(this);
        e.setText(value);
        e.setHint(hint);
        e.setHintTextColor(0xFF5B6480);
        e.setTextColor(TEXT);
        e.setSingleLine(true);
        e.setInputType(InputType.TYPE_CLASS_TEXT | variation);
        e.setPadding(dp(14), dp(12), dp(14), dp(12));
        e.setBackground(round(CARD, LINE));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(6);
        e.setLayoutParams(lp);
        return e;
    }

    private GradientDrawable round(int fill, int stroke) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(fill);
        d.setCornerRadius(dp(12));
        d.setStroke(dp(1), stroke);
        return d;
    }

    private LinearLayout.LayoutParams gap(int top) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(top);
        lp.gravity = Gravity.START;
        return lp;
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }
}
