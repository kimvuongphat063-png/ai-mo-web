package vn.family.kidsgamesplayer.player.speech

import java.util.Locale

/**
 * Turns the platform voice list into what games see: offline voices only (no voice that
 * needs the network or whose data is not installed), Vietnamese first, best quality first,
 * at most [MAX_VOICES]. The best Vietnamese voice (else the engine default) is `default`.
 *
 * Per-language alias voices ("vi-VN-language" in Google's engine) are listed for every
 * language, installed or not, and say nothing about where they synthesize (Google reports
 * `isLanguageAvailable` = available for a language that only has a network voice). An alias
 * is dropped when a concrete voice of the same locale exists, offline or network; it is kept
 * only when it is the engine's sole voice for that locale and the language is installed.
 */
object VoiceCatalog {
    const val MAX_VOICES = 64
    private const val ALIAS_SUFFIX = "-language"
    private val VI: Locale = Locale.forLanguageTag("vi")

    fun normalize(tag: String): String = tag.trim().replace('_', '-').lowercase(Locale.ROOT)

    fun primary(tag: String): String = normalize(tag).substringBefore('-')

    fun isAlias(name: String): Boolean = name.endsWith(ALIAS_SUFFIX)

    fun build(raw: List<RawVoice>, engineDefault: String? = null): List<VoiceInfo> {
        val offline = raw
            .filter { !it.networkRequired && !it.notInstalled && it.name.isNotBlank() && primary(it.languageTag).let { p -> p.isNotEmpty() && p != "und" } }
            .distinctBy { it.name }
        val concreteTags = raw.filter { !isAlias(it.name) }.map { normalize(it.languageTag) }.toSet()
        val usable = offline
            .filter { !isAlias(it.name) || (normalize(it.languageTag) !in concreteTags && it.languageInstalled == true) }
            .sortedWith(
                compareBy<RawVoice>({ if (primary(it.languageTag) == "vi") 0 else 1 }, { normalize(it.languageTag) })
                    .thenByDescending { it.quality }
                    .thenBy { it.latency }
                    .thenBy { it.name },
            )
            .take(MAX_VOICES)
        val defaultName = usable.firstOrNull { primary(it.languageTag) == "vi" }?.name
            ?: engineDefault?.takeIf { d -> usable.any { it.name == d } }
            ?: usable.firstOrNull()?.name
        return usable.map { VoiceInfo(it.name, displayName(it), it.languageTag.trim().replace('_', '-'), it.name == defaultName) }
    }

    /** Voice for one utterance: the requested voiceURI, else the best voice for [lang]. */
    fun resolve(voices: List<VoiceInfo>, voiceURI: String, lang: String): VoiceInfo? {
        if (voiceURI.isNotEmpty()) voices.firstOrNull { it.voiceURI == voiceURI }?.let { return it }
        if (lang.isBlank()) return voices.firstOrNull { it.isDefault } ?: voices.firstOrNull()
        val n = normalize(lang)
        voices.firstOrNull { normalize(it.lang) == n }?.let { return it }
        val p = primary(lang)
        return voices.firstOrNull { primary(it.lang) == p }
    }

    private fun displayName(v: RawVoice): String {
        val locale = Locale.forLanguageTag(v.languageTag.replace('_', '-'))
        val label = locale.getDisplayName(VI).takeIf { it.isNotBlank() } ?: v.languageTag
        return "${label.replaceFirstChar { it.titlecase(VI) }} · ${v.name}"
    }
}
