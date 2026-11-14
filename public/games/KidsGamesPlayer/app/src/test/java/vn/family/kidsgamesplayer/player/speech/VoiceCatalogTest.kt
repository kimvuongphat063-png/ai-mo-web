package vn.family.kidsgamesplayer.player.speech

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** Offline-only voice list, Vietnamese first (handover 4.6, 5.1). */
class VoiceCatalogTest {
    private fun raw(
        name: String,
        tag: String,
        quality: Int = 300,
        latency: Int = 300,
        network: Boolean = false,
        notInstalled: Boolean = false,
        languageInstalled: Boolean? = null,
    ) = RawVoice(name, tag, quality, latency, network, notInstalled, languageInstalled)

    @Test
    fun dropsNetworkAndUninstalledVoicesAndPutsVietnameseFirst() {
        val list = VoiceCatalog.build(
            listOf(
                raw("en-us-x-sfg-local", "en-US", quality = 400),
                raw("vi-vn-x-gft-network", "vi-VN", quality = 500, network = true),
                raw("vi-vn-x-vic-local", "vi-VN", quality = 300),
                raw("vi-vn-x-gft-local", "vi-VN", quality = 400),
                raw("vi-vn-x-vif-local", "vi-VN", quality = 500, notInstalled = true),
                raw("fr-fr-x-frc-local", "fr-FR"),
                raw("und-voice", "und"),
            ),
            engineDefault = "en-us-x-sfg-local",
        )
        assertEquals(listOf("vi-vn-x-gft-local", "vi-vn-x-vic-local", "en-us-x-sfg-local", "fr-fr-x-frc-local"), list.map { it.voiceURI })
        assertEquals(listOf(true, false, false, false), list.map { it.isDefault })
        assertTrue(list[0].isVietnamese)
        assertEquals("vi-VN", list[0].lang)
        assertTrue(list[0].name, list[0].name.startsWith("Tiếng Việt") && list[0].name.endsWith("vi-vn-x-gft-local"))
    }

    @Test
    fun languageAliasVoicesOnlyWhenTheyAreTheInstalledVoiceOfTheirLocale() {
        // As listed by Google TTS 3.12.9 on the API 26 emulator (evidence/tts/).
        val list = VoiceCatalog.build(
            listOf(
                raw("vi-VN-language", "vi-VN"),
                raw("vi-vn-x-gft-local", "vi-VN"),
                raw("vi-vn-x-gft-network", "vi-VN", network = true),
                raw("en-US-language", "en-US"),
                raw("en-us-x-sfg-local", "en-US"),
                // Google says "available" for de-DE although only a network voice exists.
                raw("de-DE-language", "de-DE", languageInstalled = true),
                raw("de-de-x-nfh-network", "de-DE", network = true),
                raw("it-IT-language", "it-IT", languageInstalled = false),
                raw("fr-FR-language", "fr-FR", languageInstalled = true),
                raw("ja-JP-language", "ja-JP"),
            ),
        )
        assertEquals(listOf("vi-vn-x-gft-local", "en-us-x-sfg-local", "fr-FR-language"), list.map { it.voiceURI })
        assertEquals("vi-vn-x-gft-local", list.single { it.isDefault }.voiceURI)
    }

    @Test
    fun defaultFallsBackToEngineDefaultWithoutVietnamese() {
        val list = VoiceCatalog.build(listOf(raw("a", "en-US"), raw("b", "de-DE")), engineDefault = "b")
        assertEquals("b", list.single { it.isDefault }.voiceURI)
        // Unknown engine default: the first voice in list order (de-DE sorts before en-US).
        assertEquals("b", VoiceCatalog.build(listOf(raw("a", "en-US"), raw("b", "de-DE")), engineDefault = "zz").single { it.isDefault }.voiceURI)
        assertTrue(VoiceCatalog.build(emptyList()).isEmpty())
    }

    @Test
    fun atMost64Voices() {
        val many = (1..100).map { raw("v$it", "en-US") }
        assertEquals(VoiceCatalog.MAX_VOICES, VoiceCatalog.build(many).size)
    }

    @Test
    fun resolvesByVoiceUriThenLanguage() {
        val list = VoiceCatalog.build(listOf(raw("vi-a", "vi-VN", quality = 400), raw("vi-b", "vi-VN"), raw("en-a", "en-US"), raw("en-gb", "en-GB")))
        assertEquals("vi-b", VoiceCatalog.resolve(list, "vi-b", "vi-VN")?.voiceURI)
        assertEquals("vi-a", VoiceCatalog.resolve(list, "missing", "vi-VN")?.voiceURI)
        assertEquals("vi-a", VoiceCatalog.resolve(list, "", "vi")?.voiceURI)
        assertEquals("vi-a", VoiceCatalog.resolve(list, "", "VI_vn")?.voiceURI)
        assertEquals("en-gb", VoiceCatalog.resolve(list, "", "en-GB")?.voiceURI)
        // No exact region: the first voice of the language in list order (tags sorted: en-GB < en-US).
        assertEquals("en-gb", VoiceCatalog.resolve(list, "", "en-AU")?.voiceURI)
        assertEquals("en-a", VoiceCatalog.resolve(list, "", "en-us")?.voiceURI)
        assertEquals("vi-a", VoiceCatalog.resolve(list, "", "")?.voiceURI)
        assertNull(VoiceCatalog.resolve(list, "", "ja-JP"))
        assertNull(VoiceCatalog.resolve(emptyList(), "", ""))
    }
}
