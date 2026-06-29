# DolphinJS Native v4.0.0-pilot.4

Binary UI framework — JavaScript लेख्नुस्, Android Native Views पाउनुस्।

> [!IMPORTANT]
> 📖 **[Master Tutorial (0 to Complete Guide)](dolphin-native/MASTER_TUTORIAL.md)** — Start building your first app now! This step-by-step tutorial covers Routing & Navigation, Side Drawer, AppBar/TabBar, Fetch/HTTP, CRUD, and Realtime communication in detail.

---

## Dev Server चलाउन

```bash
node dev-server.js
# वा
npm run dev
```

Dashboard: `http://localhost:8000`
TCP (mobile connect): port `9091`

---

## IP Dialog Feature (नयाँ)

**समस्या**: Mobile app install गर्दा server IP hardcode हुन्छ। PC को IP change भयो भने app server सँग connect हुन सक्दैन।

**समाधान**: App install गरेपछि पहिलो पटक खोल्दा server IP enter गर्ने dialog देखाउँछ। IP save हुन्छ — अर्को पटक directly connect हुन्छ।

### Android मा use गर्ने तरिका

**Option 1: DolphinActivity extend गर्नुस् (सजिलो)**

```kotlin
class MainActivity : DolphinActivity() {
    // सब कुरा automatic — IP dialog, connect, hot-patch सबै
    // पहिलो install मा IP माग्छ, save भएपछि directly connect
    
    override fun onDolphinAction(action: String, value: Any?) {
        // button click आदि handle गर्नुस्
    }
}
```

**Option 2: Manual use**

```kotlin
class MainActivity : AppCompatActivity() {
    private lateinit var runtime: DolphinRuntime

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        runtime = DolphinRuntime(this)

        // पहिलो install मा IP dialog देखाउँछ
        // IP save छ भने directly connect
        runtime.connectDevServerWithDialog(this) { patchType, screen ->
            runOnUiThread { refreshUI() }
        }
    }
}
```

**IP change गर्न** (IP change भयो भने):

```kotlin
// Settings button वा menu बाट
DolphinServerConfig.changeServerIP(this) { newIP ->
    runtime.disconnectDevServer()
    runtime.connectDevServerWithDialog(this) { _, _ -> refreshUI() }
}
```

**Server dashboard बाट पनि IP set गर्न सकिन्छ:**
`http://localhost:8000` → "Set Server IP" section

---

## Files

| File | Description |
|------|-------------|
| `runtime/android/DolphinServerConfig.kt` | IP dialog + SharedPreferences helper |
| `runtime/android/DolphinActivity.kt` | Ready-to-use Activity with IP dialog built-in |
| `runtime/android/DolphinRuntime.kt` | Core runtime (now has `connectDevServerWithDialog`) |
| `runtime/android/HotPatchClient.kt` | TCP connection engine with auto-reconnect |
| `dev-server.js` | Dev server entry (PORT env var support) |

---

## APK Install → Connect flow

```
1. dolphin build --android   → APK build
2. APK phone मा install
3. App open           → IP dialog देखिन्छ (पहिलो पटक मात्र)
4. PC को IP हाल्नुस् (जस्तै: 192.168.1.100)
5. "Connect" थिच्नुस्  → Save हुन्छ, connect हुन्छ
6. IP change भयो भने → Menu > "Server IP Change" वा server dashboard बाट
```

---

## Build

```bash
dolphin build --android    # APK build
dolphin build --ios        # iOS build (macOS only)
```
