package in.wordlegal.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;

import androidx.activity.result.ActivityResult;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * WordLegal — फ़ाइल सहेजने एवं साझा करने का मूल (native) पुल।
 *  • save()  → Android की "इस रूप में सहेजें" (SAF) शीट खोलकर Downloads/Drive में लिखता है
 *  • share() → कैश में लिखकर Android शेयर शीट खोलता है (WhatsApp, ईमेल, Drive …)
 */
@CapacitorPlugin(name = "WordExport")
public class WordExportPlugin extends Plugin {

    private byte[] decode(String data) {
        int comma = data.indexOf(',');
        String b64 = comma > -1 ? data.substring(comma + 1) : data;
        return Base64.decode(b64, Base64.DEFAULT);
    }

    private String safeName(String name) {
        String n = name == null ? "wordlegal" : name;
        return n.replaceAll("[\\\\/:*?\"<>|]+", "-");
    }

    private File writeCache(byte[] bytes, String fileName) throws Exception {
        File dir = new File(getContext().getCacheDir(), "export");
        if (!dir.exists() && !dir.mkdirs()) throw new Exception("cache dir");
        File out = new File(dir, safeName(fileName));
        FileOutputStream fos = new FileOutputStream(out);
        fos.write(bytes);
        fos.flush();
        fos.close();
        return out;
    }

    @PluginMethod
    public void share(PluginCall call) {
        String data = call.getString("data");
        String fileName = call.getString("fileName", "wordlegal.pdf");
        String mime = call.getString("mimeType", "application/octet-stream");
        if (data == null) {
            call.reject("data आवश्यक है");
            return;
        }
        try {
            File file = writeCache(decode(data), fileName);
            Uri uri = FileProvider.getUriForFile(
                    getContext(), getContext().getPackageName() + ".fileprovider", file);
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType(mime);
            send.putExtra(Intent.EXTRA_STREAM, uri);
            send.putExtra(Intent.EXTRA_SUBJECT, fileName);
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent chooser = Intent.createChooser(send, "साझा करें");
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(chooser);
            JSObject ret = new JSObject();
            ret.put("uri", uri.toString());
            ret.put("fileName", fileName);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("साझा करने में त्रुटि: " + e.getMessage());
        }
    }

    @PluginMethod
    public void save(PluginCall call) {
        String data = call.getString("data");
        String fileName = call.getString("fileName", "wordlegal.pdf");
        String mime = call.getString("mimeType", "application/octet-stream");
        if (data == null) {
            call.reject("data आवश्यक है");
            return;
        }
        try {
            Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType(mime);
            intent.putExtra(Intent.EXTRA_TITLE, safeName(fileName));
            startActivityForResult(call, intent, "saveResult");
        } catch (Exception e) {
            call.reject("सहेजें विफल: " + e.getMessage());
        }
    }

    @ActivityCallback
    public void saveResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.reject("रद्द किया गया");
            return;
        }
        Uri target = result.getData().getData();
        try {
            String data = call.getString("data");
            byte[] bytes = decode(data);
            OutputStream os = getContext().getContentResolver().openOutputStream(target);
            if (os == null) throw new Exception("आउटपुट स्ट्रीम उपलब्ध नहीं");
            os.write(bytes);
            os.flush();
            os.close();
            JSObject ret = new JSObject();
            ret.put("uri", target.toString());
            ret.put("saved", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("सहेजें विफल: " + e.getMessage());
        }
    }
}
