package in.wordlegal.app;

import android.os.Bundle;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WordExportPlugin.class);
        super.onCreate(savedInstanceState);
        // बड़ी विधिक फ़ाइलों के लिए स्क्रीन बंद होने पर भी प्रक्रिया बनी रहे
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
    }
}
