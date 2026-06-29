# 🌊 Dolphin Native Master Debugging Guide

यो डकुमेन्ट Dolphin Native Runtime मा आइपर्ने जटिल UI र Binary समस्याहरू समाधान गर्नका लागि तयार गरिएको हो।

## १. Binary Integrity Check
`BinaryParser.kt` (Android) र `DolphinBinaryProtocol.js` (Compiler) मा बाइटको **Offset** र **16-byte Alignment** एकदमै मिलेको हुनुपर्छ। यदि डाटा संरचनाको क्रम (Order) मा मेल खाएन भने रङ वा अन्य स्टाइलहरू परिवर्तन नहुन सक्छ।

## २. Module Verification
`DolphinCompiler.js` वा `DolphinFramework.js` मा रहेका `require` कमान्डहरू सधैँ चेक गर्नुहोस्। कुनै मोड्युल **try-catch** भित्र 'Silent Fallback' (जस्तै: `catch (e) { module = {} }`) भएर डिसेबल भएको हुन सक्छ, जसले बाइनरी जेनेरेसनलाई अपूर्ण बनाउँछ।

## ३. Binary Hex-Dump
बाइनरी प्याकेटको सत्यता फोनमै जाँच्नको लागि एन्ड्रोइड रनटाइममा **Hex-Dump** प्रिन्ट गर्ने व्यवस्था राख्नुहोस्। यसले डाटा करप्सन (Data Corruption) ट्रान्समिसनमा भएको हो कि कम्पाइलरमा भन्ने कुरा तुरुन्तै पुष्टि गर्दछ।
- **Tip:** `bin.joinToString(",") { (it.toInt() and 0xFF).toString() }` प्रयोग गर्नुहोस्।

## ४. Zero-Point Mapping
`UniversalUIImporter.js` भित्रको `MAPPING_TABLE` निरन्तर जाँच गर्नुहोस्। **UNIVERSAL** प्लेटफर्मको लागि प्रयोग हुने कोड `0xFF` ले `backgroundColor` को बाइट अफसेट (Byte 3) सँग सहि म्यापिङ्ग गरेको हुनुपर्छ। Offset को सानो विचलनले पनि पुरै UI लाई रङविहीन बनाउन सक्छ।

---
**Note:** 'Pixel-Perfect' नतिजाका लागि सधैँ बाइनरी अलाइनमेन्ट र म्यापिङ्ग टेबलमा विशेष ध्यान दिनुहोला।
