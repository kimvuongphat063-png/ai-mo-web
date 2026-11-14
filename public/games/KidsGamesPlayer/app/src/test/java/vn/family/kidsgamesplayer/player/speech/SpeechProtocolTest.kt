package vn.family.kidsgamesplayer.player.speech

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import vn.family.kidsgamesplayer.player.speech.SpeechProtocol.Command

/** Validation and clamping of page → app speech messages (handover 4.4, 4.6, 5.1). */
class SpeechProtocolTest {
    private fun speak(json: String) = SpeechProtocol.parse(json) as Command.Speak
    private fun invalid(json: String?) = SpeechProtocol.parse(json) is Command.Invalid

    @Test
    fun parsesTheThreeOperations() {
        assertEquals(Command.Hello(1), SpeechProtocol.parse("""{"op":"hello","v":1}"""))
        assertEquals(Command.Cancel, SpeechProtocol.parse("""{"op":"cancel"}"""))
        val s = speak("""{"op":"speak","id":7,"text":"Xin chào bé","lang":"vi-VN","voice":"vi-vn-x-gft-local","rate":0.9,"pitch":1.08,"volume":1}""")
        assertEquals(7, s.id)
        assertEquals("Xin chào bé", s.text)
        assertEquals("vi-VN", s.lang)
        assertEquals("vi-vn-x-gft-local", s.voiceURI)
        assertEquals(0.9f, s.rate, 1e-6f)
        assertEquals(1.08f, s.pitch, 1e-6f)
        assertEquals(1f, s.volume, 1e-6f)
        assertFalse(s.truncated)
    }

    @Test
    fun rejectsMalformedMessages() {
        assertTrue(invalid(null))
        assertTrue(invalid("not json"))
        assertTrue(invalid("[1,2]"))
        assertTrue(invalid("""{"op":"hello","v":2}"""))
        assertTrue(invalid("""{"op":"openUrl","url":"https://x"}"""))
        assertTrue(invalid("""{"op":42}"""))
        assertTrue(invalid("""{"text":"no op"}"""))
        assertTrue(invalid("""{"op":"speak","text":"no id"}"""))
        for (id in listOf("0", "-1", "1.5", "\"3\"", "1e12", "null")) assertTrue("id $id", invalid("""{"op":"speak","id":$id,"text":"x"}"""))
        assertTrue(invalid("""{"op":"speak","id":1,"text":{"a":1}}"""))
        // Size is checked before parsing.
        val big = """{"op":"speak","id":1,"text":"${"a".repeat(SpeechProtocol.MAX_MESSAGE_CHARS)}"}"""
        assertTrue((SpeechProtocol.parse(big) as Command.Invalid).reason.contains("too large"))
    }

    @Test
    fun clampsParametersAndCleansText() {
        val s = speak("""{"op":"speak","id":1,"text":"a\u0000b\nc\u0007d\u009f","rate":9,"pitch":0.01,"volume":-3,"lang":"vi_VN"}""")
        assertEquals("a b c d ", s.text)
        assertEquals(3f, s.rate, 0f)
        assertEquals(0.5f, s.pitch, 0f)
        assertEquals(0f, s.volume, 0f)
        assertEquals("vi_VN", s.lang)
        val d = speak("""{"op":"speak","id":2,"rate":"fast","pitch":null,"volume":7,"lang":"<script>","voice":"${"v".repeat(300)}"}""")
        assertEquals("", d.text)
        assertEquals(1f, d.rate, 0f)
        assertEquals(1f, d.pitch, 0f)
        assertEquals(1f, d.volume, 0f)
        assertEquals("", d.lang)
        assertEquals("", d.voiceURI)
        assertEquals(0.25f, speak("""{"op":"speak","id":3,"rate":0}""").rate, 0f)
    }

    @Test
    fun longTextIsCutWithoutSplittingASurrogatePair() {
        val (cut, truncated) = SpeechProtocol.cleanText("x".repeat(1500))
        assertTrue(truncated)
        assertEquals(SpeechProtocol.MAX_TEXT_CHARS, cut.length)
        val emoji = "a".repeat(999) + "😀" + "tail"
        val (cut2, t2) = SpeechProtocol.cleanText(emoji)
        assertTrue(t2)
        assertEquals(999, cut2.length)
        assertEquals("a".repeat(999), cut2)
        assertEquals("ok" to false, SpeechProtocol.cleanText("ok"))
    }

    @Test
    fun outgoingMessagesHaveTheDocumentedShape() {
        val v = JSONObject(SpeechProtocol.voices(listOf(VoiceInfo("vi-vn-x-a-local", "Tiếng Việt · a", "vi-VN", true))))
        assertEquals("voices", v.getString("t"))
        val o = v.getJSONArray("voices").getJSONObject(0)
        assertEquals(setOf("voiceURI", "name", "lang", "localService", "default"), o.keys().asSequence().toSet())
        assertTrue(o.getBoolean("localService"))
        assertTrue(o.getBoolean("default"))
        for ((json, t) in listOf(SpeechProtocol.start(4) to "start", SpeechProtocol.end(4) to "end")) {
            val o = JSONObject(json)
            assertEquals(setOf("t", "id"), o.keys().asSequence().toSet())
            assertEquals(t, o.getString("t"))
            assertEquals(4, o.getInt("id"))
        }
        assertEquals("interrupted", JSONObject(SpeechProtocol.error(4, "interrupted")).getString("error"))
        assertEquals("synthesis-failed", JSONObject(SpeechProtocol.error(4, "<b>weird</b>")).getString("error"))
        val b = JSONObject(SpeechProtocol.boundary(4, 6, 3))
        assertEquals(6, b.getInt("charIndex"))
        assertEquals(3, b.getInt("charLength"))
    }

    @Test
    fun messagesToThePageArePureAscii() {
        // WebView 69 mangles Latin-1-only strings on a WebMessagePort ("chó" -> "ch￳").
        val json = SpeechProtocol.voices(listOf(VoiceInfo("fr-x", "Pháp · chó 😀", "fr-FR", false)))
        assertTrue(json, json.all { it.code in 0x20..0x7E })
        assertEquals("Pháp · chó 😀", JSONObject(json).getJSONArray("voices").getJSONObject(0).getString("name"))
        assertEquals("{\"a\":\"\\u00e0\\u1ed9\"}", SpeechProtocol.ascii("{\"a\":\"àộ\"}"))
        assertEquals("""{"t":"end"}""", SpeechProtocol.ascii("""{"t":"end"}"""))
        // Escaped text from the shim decodes to the original characters.
        val s = speak("""{"op":"speak","id":1,"text":"Con chó và câu ộ 😀"}""")
        assertEquals("Con chó và câu ộ 😀", s.text)
    }
}
