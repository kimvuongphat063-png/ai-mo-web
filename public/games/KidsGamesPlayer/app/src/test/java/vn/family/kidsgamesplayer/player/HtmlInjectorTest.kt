package vn.family.kidsgamesplayer.player

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/** Byte-level insertion of the speech shim tag into game HTML (handover 4.2, 5.1). */
class HtmlInjectorTest {
    private val tag = HtmlInjector.SHIM_TAG

    private fun inject(s: String): String = String(HtmlInjector.inject(s.toByteArray(Charsets.UTF_8)), Charsets.UTF_8)

    @Test
    fun goesRightAfterTheHeadStartTag() {
        val html = "<!DOCTYPE html>\n<html lang=\"vi\" data-game=\"x\">\n<head>\n<meta charset=\"utf-8\">\n<title>Ai Sống Ở Đâu</title>"
        assertEquals("<!DOCTYPE html>\n<html lang=\"vi\" data-game=\"x\">\n<head>$tag\n<meta charset=\"utf-8\">\n<title>Ai Sống Ở Đâu</title>", inject(html))
    }

    @Test
    fun caseInsensitiveAndQuotedGreaterThan() {
        val html = "<!DOCTYPE HTML>\r\n<HTML LANG=vi><HEAD data-x=\"a>b\" data-y='c>d'><TITLE>t</TITLE>"
        assertEquals("<!DOCTYPE HTML>\r\n<HTML LANG=vi><HEAD data-x=\"a>b\" data-y='c>d'>$tag<TITLE>t</TITLE>", inject(html))
    }

    @Test
    fun withoutHeadAfterHtmlWithoutHtmlAfterDoctype() {
        assertEquals("<!doctype html><html>$tag<body>x</body></html>", inject("<!doctype html><html><body>x</body></html>"))
        assertEquals("<!doctype html>$tag<title>x</title><p>y", inject("<!doctype html><title>x</title><p>y"))
        // <header> is not <head>; neither is <html5>.
        assertEquals("<!doctype html>$tag<header>x</header>", inject("<!doctype html><header>x</header>"))
        // A <head> after body content is not the document head: the tag stays after the doctype.
        assertEquals("<!doctype html>$tag\n<p>\n<head>", inject("<!doctype html>\n<p>\n<head>"))
    }

    @Test
    fun headWithoutHtmlAndCommentsInTheProlog() {
        assertEquals("<!doctype html>\n<!-- <head> -->\n<head>$tag<title>t</title>", inject("<!doctype html>\n<!-- <head> -->\n<head><title>t</title>"))
        assertEquals("<!-- a --><!doctype html><html><!-- b --><head>$tag", inject("<!-- a --><!doctype html><html><!-- b --><head>"))
        assertEquals("<!doctype html><html>$tag<!-- b --><body>", inject("<!doctype html><html><!-- b --><body>"))
    }

    @Test
    fun noDoctypeNoTags() {
        assertEquals(tag, inject(""))
        assertEquals("${tag}hello", inject("hello"))
        assertEquals("<html>$tag<p>", inject("<html><p>"))
        assertEquals("<head>$tag", inject("<head>"))
        assertEquals("<?xml version=\"1.0\"?>$tag<p>", inject("<?xml version=\"1.0\"?><p>"))
    }

    @Test
    fun neverBeforeTheDoctype() {
        val xhtml = "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Strict//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\">\n<body>"
        assertTrue(inject(xhtml).startsWith(xhtml.substringBefore('\n') + tag))
        // Unterminated prolog constructs run to the end of the file: the tag goes last.
        assertEquals("<!doctype html$tag", inject("<!doctype html"))
        assertEquals("<!-- never closed <head>$tag", inject("<!-- never closed <head>"))
    }

    @Test
    fun utf8BomStaysFirstAndUtf16IsLeftAlone() {
        val bom = byteArrayOf(0xEF.toByte(), 0xBB.toByte(), 0xBF.toByte())
        val out = HtmlInjector.inject(bom + "<!doctype html><head>".toByteArray())
        assertArrayEquals(bom + "<!doctype html><head>$tag".toByteArray(), out)
        assertArrayEquals(bom + tag.toByteArray() + "x".toByteArray(), HtmlInjector.inject(bom + "x".toByteArray()))
        val utf16 = byteArrayOf(0xFF.toByte(), 0xFE.toByte(), '<'.code.toByte(), 0)
        assertArrayEquals(utf16, HtmlInjector.inject(utf16))
    }

    @Test
    fun otherBytesAreUntouched() {
        // Non-UTF-8 bytes (e.g. a Windows-1258 page) survive unchanged around the tag.
        val head = "<!doctype html><head>".toByteArray()
        val rest = byteArrayOf(0xD2.toByte(), 0xFF.toByte(), 0x00, 0x80.toByte())
        val out = HtmlInjector.inject(head + rest)
        assertArrayEquals(head + tag.toByteArray() + rest, out)
        assertEquals("<script src=\"/__kgp__/speech-v1.js\"></script>", tag)
    }
}
